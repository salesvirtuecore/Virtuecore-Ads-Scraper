import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { fireZapierEvent } from "@/lib/zapier";

export const dynamic = "force-dynamic";

function getStripeClient(): Stripe {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
        throw new Error("STRIPE_SECRET_KEY is not configured.");
    }
    return new Stripe(key, { apiVersion: "2026-02-25.clover" });
}

function errorMessage(error: unknown): string {
    if (error instanceof Error) return error.message;
    return "Unknown webhook error.";
}

function resolveTierFromSubscription(sub: Stripe.Subscription): "pro" | "free" {
    const status = sub.status;
    if (status === "active" || status === "trialing" || status === "past_due") {
        return "pro";
    }
    return "free";
}

async function updateProfileByCustomerId(args: {
    customerId: string;
    patch: Record<string, unknown>;
}) {
    const admin = getSupabaseAdminClient();
    if (!admin) return;

    await admin
        .from("profiles")
        .update(args.patch)
        .eq("stripe_customer_id", args.customerId);
}

export async function POST(req: NextRequest) {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
        return NextResponse.json({ error: "STRIPE_WEBHOOK_SECRET is not configured." }, { status: 500 });
    }

    let rawBody = "";
    try {
        rawBody = await req.text();
    } catch {
        return NextResponse.json({ error: "Unable to read request body." }, { status: 400 });
    }

    const signature = req.headers.get("stripe-signature");
    if (!signature) {
        return NextResponse.json({ error: "Missing stripe-signature header." }, { status: 400 });
    }

    let event: Stripe.Event;
    try {
        const stripe = getStripeClient();
        event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } catch (error: unknown) {
        return NextResponse.json({ error: `Webhook signature verification failed: ${errorMessage(error)}` }, { status: 400 });
    }

    try {
        if (event.type === "checkout.session.completed") {
            const session = event.data.object as Stripe.Checkout.Session;
            const customerId = typeof session.customer === "string" ? session.customer : "";
            const subscriptionId = typeof session.subscription === "string" ? session.subscription : "";

            if (customerId) {
                await updateProfileByCustomerId({
                    customerId,
                    patch: {
                        tier: "pro",
                        stripe_customer_id: customerId,
                        stripe_subscription_id: subscriptionId || null,
                    },
                });

                fireZapierEvent({
                    event: "upgrade_to_pro",
                    meta: {
                        customerId,
                        subscriptionId,
                        source: "checkout.session.completed",
                    },
                });
            }
        }

        if (event.type === "customer.subscription.updated") {
            const sub = event.data.object as Stripe.Subscription;
            const customerId = typeof sub.customer === "string" ? sub.customer : "";

            if (customerId) {
                await updateProfileByCustomerId({
                    customerId,
                    patch: {
                        tier: resolveTierFromSubscription(sub),
                        stripe_subscription_id: sub.id,
                    },
                });
            }
        }

        if (event.type === "customer.subscription.deleted") {
            const sub = event.data.object as Stripe.Subscription;
            const customerId = typeof sub.customer === "string" ? sub.customer : "";

            if (customerId) {
                await updateProfileByCustomerId({
                    customerId,
                    patch: {
                        tier: "free",
                        stripe_subscription_id: null,
                    },
                });

                fireZapierEvent({
                    event: "subscription_cancelled",
                    meta: {
                        customerId,
                        subscriptionId: sub.id,
                        source: "customer.subscription.deleted",
                    },
                });
            }
        }

        if (event.type === "invoice.payment_failed") {
            const invoice = event.data.object as Stripe.Invoice;
            const customerId = typeof invoice.customer === "string" ? invoice.customer : "";
            const email = invoice.customer_email || undefined;

            fireZapierEvent({
                event: "payment_failed",
                email,
                meta: {
                    customerId,
                    invoiceId: invoice.id,
                    amountDue: invoice.amount_due,
                    currency: invoice.currency,
                    hostedInvoiceUrl: invoice.hosted_invoice_url,
                },
            });
        }

        return NextResponse.json({ received: true });
    } catch (error: unknown) {
        return NextResponse.json({ error: errorMessage(error) }, { status: 500 });
    }
}
