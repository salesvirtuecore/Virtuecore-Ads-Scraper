import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { fetchMetaAds } from "@/lib/meta";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { fireZapierEvent } from "@/lib/zapier";
import type { AccountTier } from "@/lib/types";

const scanSchema = z.object({
    query: z.string().min(2),
    country: z.string().default("GB"),
    metaToken: z.string().optional(),
});

const WEEKLY_SEARCH_LIMITS: Record<AccountTier, number> = {
    free: 5,
    pro: 25,
    client: 200,
};

const SEARCH_RESULT_CAPS: Record<AccountTier, number> = {
    free: 60,
    pro: 120,
    client: 200,
};

export async function POST(req: NextRequest) {
    const body = await req.json().catch(() => null);
    const parsed = scanSchema.safeParse(body);
    if (!parsed.success) {
        return NextResponse.json({ error: "Invalid scan payload." }, { status: 400 });
    }

    const { query, country, metaToken } = parsed.data;

    const supabase = await getSupabaseServerClient();
    if (!supabase) {
        return NextResponse.json({ error: "Supabase server client not configured." }, { status: 500 });
    }

    let orgId = "";
    let userId = "";
    let email = "";
    let tier: AccountTier = "free";
    let searchesUsedThisWeek = 0;
    let totalSearches = 0;
    let resetsAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const auth = await supabase.auth.getUser();
    if (!auth.data.user?.id) {
        return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }
    userId = auth.data.user.id;
    email = auth.data.user.email || "";

    const profile = await supabase
        .from("profiles")
        .select("org_id, tier, searches_used_this_week, total_searches, week_reset_at")
        .eq("id", userId)
        .single();

    if (profile.error || !profile.data) {
        return NextResponse.json({ error: "Profile not found." }, { status: 404 });
    }

    orgId = profile.data.org_id;
    tier = (profile.data.tier || "free") as AccountTier;
    searchesUsedThisWeek = profile.data.searches_used_this_week || 0;
    totalSearches = profile.data.total_searches || 0;
    resetsAt = profile.data.week_reset_at || resetsAt;

    if (new Date(resetsAt).getTime() <= Date.now()) {
        const nextReset = new Date();
        nextReset.setUTCHours(0, 0, 0, 0);
        const day = nextReset.getUTCDay();
        const daysUntilNextMonday = ((8 - day) % 7) || 7;
        nextReset.setUTCDate(nextReset.getUTCDate() + daysUntilNextMonday);
        resetsAt = nextReset.toISOString();
        searchesUsedThisWeek = 0;

        const resetUpdate = await supabase
            .from("profiles")
            .update({
                searches_used_this_week: 0,
                week_reset_at: resetsAt,
            })
            .eq("id", userId);

        if (resetUpdate.error) {
            return NextResponse.json({ error: resetUpdate.error.message }, { status: 500 });
        }
    }

    const weeklyLimit = WEEKLY_SEARCH_LIMITS[tier];
    if (searchesUsedThisWeek >= weeklyLimit) {
        return NextResponse.json(
            {
                error: "weekly_limit_reached",
                limit: weeklyLimit,
                resets_at: resetsAt,
            },
            { status: 429 }
        );
    }

    const cap = SEARCH_RESULT_CAPS[tier];
    const { ads, meta } = await fetchMetaAds({ query, country, metaToken, cap });

    let searchId = "";

    const nextSearchesUsedThisWeek = searchesUsedThisWeek + 1;
    const nextTotalSearches = totalSearches + 1;

    const profileUpdate = await supabase
        .from("profiles")
        .update({
            searches_used_this_week: nextSearchesUsedThisWeek,
            total_searches: nextTotalSearches,
        })
        .eq("id", userId);

    if (profileUpdate.error) {
        return NextResponse.json({ error: profileUpdate.error.message }, { status: 500 });
    }

    await supabase.from("usage_events").insert({
        org_id: orgId,
        user_id: userId,
        event_type: "scan",
    });

    const searchInsert = await supabase
        .from("searches")
        .insert({
            user_id: userId,
            query,
            country,
            results_count: ads.length,
            provenance: meta.source,
            ads_data: ads,
        })
        .select("id")
        .single();

    if (!searchInsert.error && searchInsert.data) {
        searchId = searchInsert.data.id;
    }

    if (nextTotalSearches === 3) {
        fireZapierEvent({
            event: "third_search",
            userId,
            orgId,
            email,
            meta: {
                tier,
                query,
                weeklyLimit,
            },
        });
    }

    return NextResponse.json({ ads, scanMeta: meta, tier, cap, searchId, limit: weeklyLimit, resets_at: resetsAt });
}
