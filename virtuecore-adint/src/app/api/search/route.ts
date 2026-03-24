import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import type { AccountTier, AdRecord } from "@/lib/types";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { fireZapierEvent } from "@/lib/zapier";

type Provenance = "meta-live" | "meta-live-empty" | "meta-error";

type CacheEntry = {
    ads: AdRecord[];
    provenance: Provenance;
    totalCount: number;
    cachedAt: number;
};

type MetaAdRaw = {
    id?: string;
    page_id?: string;
    page_name?: string;
    ad_snapshot_url?: string;
    ad_creative_link_urls?: string[];
    link_url?: string;
    ad_creative_bodies?: string[];
    ad_creative_link_titles?: string[];
    ad_delivery_start_time?: string;
    ad_delivery_stop_time?: string;
    ad_delivery_status?: string;
    publisher_platforms?: string[];
    spend?: {
        lower_bound?: number;
        upper_bound?: number;
    };
};

const searchSchema = z.object({
    query: z.string().min(2),
    country: z.string().length(2).default("GB"),
    limit: z.number().int().positive().max(120).optional(),
});

const CACHE_TTL_MS = 60 * 60 * 1000;
const WEEKLY_LIMITS: Record<AccountTier, number> = {
    free: 5,
    pro: 25,
    client: 200,
};

const searchCache = new Map<string, CacheEntry>();

function weekResetIsoFromNow(): string {
    const d = new Date();
    const day = d.getUTCDay();
    const daysUntilNextMonday = ((8 - day) % 7) || 7;
    d.setUTCHours(0, 0, 0, 0);
    d.setUTCDate(d.getUTCDate() + daysUntilNextMonday);
    return d.toISOString();
}

function normalizeAds(rows: MetaAdRaw[], fetchedAt: string): AdRecord[] {
    return rows.map((a: MetaAdRaw, i: number) => {
        const id = String(a.id || `${Date.now()}-${i}`);
        const startTime = a.ad_delivery_start_time || "";
        const deliveryStatus =
            a.ad_delivery_status || (a.ad_delivery_stop_time ? "INACTIVE" : "ACTIVE");

        return {
            id,
            page: a.page_name || "Unknown",
            pageId: a.page_id ? String(a.page_id) : "",
            body: (a.ad_creative_bodies || ["No copy"])[0],
            days: startTime
                ? Math.max(0, Math.floor((Date.now() - new Date(startTime).getTime()) / 86400000))
                : 0,
            spend: a.spend ? `£${a.spend.lower_bound}–${a.spend.upper_bound}` : "—",
            format: "Live",
            cta: (a.ad_creative_link_titles || ["—"])[0],
            hook: "Live",
            headline: (a.ad_creative_link_titles || ["Live Ad"])[0],
            targeting: "Live",
            platforms: (a.publisher_platforms || []).map((p: string) => String(p).toUpperCase()),
            snapshotUrl: a.ad_snapshot_url || "",
            creativeLinkUrl: a.ad_creative_link_urls?.[0] || a.link_url || a.ad_snapshot_url || "",
            startTime,
            deliveryStatus,
            source: "META_LIBRARY",
            fetchedAt,
        };
    });
}

async function fetchFromMeta(args: {
    query: string;
    country: string;
    limit: number;
    token: string;
}): Promise<{ ads: AdRecord[]; provenance: Provenance; error?: string }> {
    const { query, country, limit, token } = args;
    const fetchedAt = new Date().toISOString();

    const fields = [
        "id",
        "page_id",
        "page_name",
        "ad_snapshot_url",
        "ad_creative_link_urls",
        "ad_creative_bodies",
        "ad_creative_link_titles",
        "ad_delivery_start_time",
        "ad_delivery_stop_time",
        "ad_delivery_status",
        "publisher_platforms",
        "spend",
    ].join(",");

    const pageSize = Math.min(50, limit);
    let nextUrl = `https://graph.facebook.com/v19.0/ads_archive?search_terms=${encodeURIComponent(
        query
    )}&ad_reached_countries=["${country}"]&ad_type=ALL&ad_active_status=ALL&fields=${encodeURIComponent(
        fields
    )}&access_token=${encodeURIComponent(token)}&limit=${pageSize}`;

    const seen = new Set<string>();
    const ads: AdRecord[] = [];

    while (nextUrl && ads.length < limit) {
        const res = await fetch(nextUrl, { cache: "no-store" });
        const data = await res.json().catch(() => ({}));

        if (!res.ok || data?.error) {
            return {
                ads: [],
                provenance: "meta-error",
                error: data?.error?.message || "Meta API request failed.",
            };
        }

        const rows = normalizeAds(data.data || [], fetchedAt);
        for (const row of rows) {
            if (!seen.has(row.id)) {
                seen.add(row.id);
                ads.push(row);
                if (ads.length >= limit) break;
            }
        }

        nextUrl = data?.paging?.next || "";
    }

    return {
        ads,
        provenance: ads.length > 0 ? "meta-live" : "meta-live-empty",
    };
}

export async function POST(req: NextRequest) {
    const parsed = searchSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
        return NextResponse.json({ error: "Invalid search payload." }, { status: 400 });
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

    const { query, country } = parsed.data;
    const requestedLimit = parsed.data.limit ?? 120;
    const limit = Math.min(Math.max(requestedLimit, 1), 120);

    const profileRes = await supabase
        .from("profiles")
        .select("id, org_id, tier, searches_used_this_week, total_searches, week_reset_at")
        .eq("id", user.id)
        .single();

    if (profileRes.error || !profileRes.data) {
        return NextResponse.json({ error: "Profile not found." }, { status: 404 });
    }

    const profile = profileRes.data;
    const tier = (profile.tier || "free") as AccountTier;
    const weeklyLimit = WEEKLY_LIMITS[tier];

    let searchesUsed = profile.searches_used_this_week || 0;
    const totalSearches = profile.total_searches || 0;
    let resetAt = profile.week_reset_at || weekResetIsoFromNow();

    if (new Date(resetAt).getTime() <= Date.now()) {
        resetAt = weekResetIsoFromNow();
        searchesUsed = 0;

        const resetUpdate = await supabase
            .from("profiles")
            .update({ searches_used_this_week: 0, week_reset_at: resetAt })
            .eq("id", user.id);

        if (resetUpdate.error) {
            return NextResponse.json({ error: resetUpdate.error.message }, { status: 500 });
        }
    }

    if (searchesUsed >= weeklyLimit) {
        fireZapierEvent({
            event: "limit_reached",
            userId: user.id,
            orgId: profile.org_id,
            email: user.email,
            meta: { tier, weeklyLimit, resetAt },
        });

        return NextResponse.json(
            { error: "weekly_limit_reached", limit: weeklyLimit, resets_at: resetAt },
            { status: 429 }
        );
    }

    const cacheKey = `${query.trim().toLowerCase()}:${country.toUpperCase()}`;
    const cached = searchCache.get(cacheKey);
    const hasFreshCache = !!cached && Date.now() - cached.cachedAt < CACHE_TTL_MS;

    let ads: AdRecord[] = [];
    let provenance: Provenance = "meta-error";
    let metaError: string | undefined;

    if (hasFreshCache && cached) {
        ads = cached.ads;
        provenance = cached.provenance;
    } else {
        const token = process.env.META_ACCESS_TOKEN;
        if (!token) {
            provenance = "meta-error";
            metaError = "META_ACCESS_TOKEN not configured on server.";
        } else {
            const live = await fetchFromMeta({ query, country, limit, token });
            ads = live.ads;
            provenance = live.provenance;
            metaError = live.error;

            if (live.provenance !== "meta-error") {
                searchCache.set(cacheKey, {
                    ads,
                    provenance,
                    totalCount: ads.length,
                    cachedAt: Date.now(),
                });
            }
        }
    }

    const nextSearchesUsed = searchesUsed + 1;
    const nextTotalSearches = totalSearches + 1;

    const updateCounters = await supabase
        .from("profiles")
        .update({
            searches_used_this_week: nextSearchesUsed,
            total_searches: nextTotalSearches,
        })
        .eq("id", user.id);

    if (updateCounters.error) {
        return NextResponse.json({ error: updateCounters.error.message }, { status: 500 });
    }

    const searchInsert = await supabase
        .from("searches")
        .insert({
            user_id: user.id,
            query,
            country,
            results_count: ads.length,
            provenance,
            ads_data: ads,
        })
        .select("id")
        .single();

    const searchId = searchInsert.error ? "" : searchInsert.data?.id || "";

    fireZapierEvent({
        event: "search_completed",
        userId: user.id,
        orgId: profile.org_id,
        email: user.email,
        meta: {
            tier,
            query,
            country,
            provenance,
            totalCount: ads.length,
            searchId,
        },
    });

    if (nextTotalSearches === 3) {
        fireZapierEvent({
            event: "third_search",
            userId: user.id,
            orgId: profile.org_id,
            email: user.email,
            meta: { tier, totalSearches: nextTotalSearches },
        });
    }

    if (nextSearchesUsed === weeklyLimit) {
        fireZapierEvent({
            event: "limit_reached",
            userId: user.id,
            orgId: profile.org_id,
            email: user.email,
            meta: { tier, weeklyLimit, resetAt, reachedAfterSearch: true },
        });
    }

    const searchesRemaining = Math.max(weeklyLimit - nextSearchesUsed, 0);

    return NextResponse.json({
        ads,
        provenance,
        total_count: ads.length,
        searches_remaining: searchesRemaining,
        week_resets_at: resetAt,
        search_id: searchId,
        meta_error: metaError || null,
    });
}
