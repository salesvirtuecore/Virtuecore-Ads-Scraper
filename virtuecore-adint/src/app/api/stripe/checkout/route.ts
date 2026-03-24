import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { z } from "zod";

import { getSupabaseServerClient } from "@/lib/supabase/server";

const payloadSchema = z.object({
    billing_cycle: z.enum(["monthly", "annual"]),
});

function getStripeClient(): Stripe {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
        throw new Error("STRIPE_SECRET_KEY is not configured.");
    }
    return new Stripe(key, { apiVersion: "2026-02-25.clover" });
}

function errorMessage(error: unknown): string {
    if (error instanceof Error) return error.message;
    return "Stripe checkout creation failed.";
}

function getPriceId(cycle: "monthly" | "annual"): string {
    if (cycle === "monthly") {
        return process.env.STRIPE_PRICE_PRO_MONTHLY || process.env.STRIPE_PRICE_GROWTH || "";
    }
    return process.env.STRIPE_PRICE_PRO_ANNUAL || process.env.STRIPE_PRICE_SCALE || "";
}

export async function POST(req: NextRequest) {
    const body = await req.json().catch(() => null);
    const parsed = payloadSchema.safeParse(body);
    if (!parsed.success) {
        return NextResponse.json({ error: "Invalid checkout payload." }, { status: 400 });
    }

    const supabase = await getSupabaseServerClient();
    if (!supabase) {
        return NextResponse.json({ error: "Supabase server client not configured." }, { status: 500 });
    }

    const auth = await supabase.auth.getUser();
    const user = auth.data.user;
    if (!user?.id) {
        return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const profileRes = await supabase
        .from("profiles")
        .select("id, email, full_name, business_name, stripe_customer_id")
        .eq("id", user.id)
        .single();

    if (profileRes.error || !profileRes.data) {
        return NextResponse.json({ error: "Profile not found." }, { status: 404 });
    }

    const priceId = getPriceId(parsed.data.billing_cycle);
    if (!priceId) {
        return NextResponse.json({ error: "Stripe price ID not configured for this billing cycle." }, { status: 500 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (!appUrl) {
        return NextResponse.json({ error: "NEXT_PUBLIC_APP_URL is not configured." }, { status: 500 });
    }

    try {
        const stripe = getStripeClient();

        let customerId = profileRes.data.stripe_customer_id || "";
        if (!customerId) {
            const customer = await stripe.customers.create({
                email: profileRes.data.email || user.email || undefined,
                name: profileRes.data.business_name || profileRes.data.full_name || undefined,
                metadata: {
                    user_id: user.id,
                },
            });
            customerId = customer.id;

            await supabase
                .from("profiles")
                .update({ stripe_customer_id: customerId })
                .eq("id", user.id);
        }

        const session = await stripe.checkout.sessions.create({
            mode: "subscription",
            customer: customerId,
            line_items: [{ price: priceId, quantity: 1 }],
            success_url: `${appUrl}/?billing=success`,
            cancel_url: `${appUrl}/?billing=cancelled`,
            allow_promotion_codes: true,
            metadata: {
                user_id: user.id,
                billing_cycle: parsed.data.billing_cycle,
            },
        });

        return NextResponse.json({ url: session.url });
    } catch (error: unknown) {
        return NextResponse.json({ error: errorMessage(error) }, { status: 500 });
    }
}
