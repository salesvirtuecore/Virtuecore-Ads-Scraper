import { NextResponse } from "next/server";
import Stripe from "stripe";

import { getSupabaseServerClient } from "@/lib/supabase/server";

function getStripeClient(): Stripe {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("STRIPE_SECRET_KEY is not configured.");
    return new Stripe(key, { apiVersion: "2026-02-25.clover" });
}

export async function POST() {
    const supabase = await getSupabaseServerClient();
    if (!supabase) {
        return NextResponse.json({ error: "Supabase not configured." }, { status: 500 });
    }

    const auth = await supabase.auth.getUser();
    const userId = auth.data.user?.id;
    if (!userId) {
        return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const profileRes = await supabase
        .from("profiles")
        .select("stripe_customer_id")
        .eq("id", userId)
        .single();

    if (profileRes.error || !profileRes.data?.stripe_customer_id) {
        return NextResponse.json(
            { error: "No billing account found. Please subscribe first." },
            { status: 404 },
        );
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (!appUrl) {
        return NextResponse.json({ error: "NEXT_PUBLIC_APP_URL not configured." }, { status: 500 });
    }

    try {
        const stripe = getStripeClient();
        const session = await stripe.billingPortal.sessions.create({
            customer: profileRes.data.stripe_customer_id,
            return_url: `${appUrl}/dashboard/settings`,
        });
        return NextResponse.json({ url: session.url });
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : "Portal session creation failed.";
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
