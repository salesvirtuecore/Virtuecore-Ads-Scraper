import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import type { AccountTier, AdRecord } from "@/lib/types";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { fireZapierEvent } from "@/lib/zapier";
import { getEffectiveTier } from "@/lib/trial";

type Provenance = "meta-live" | "meta-live-empty" | "meta-error";

type CacheEntry = {
    ads: AdRecord[];
    provenance: Provenance;
    totalCount: number;
    cachedAt: number;
};

type ApifyAdRaw = {
    adArchiveID?: string;
    pageID?: string;
    pageName?: string;
    adSnapshotUrl?: string;
    adLibraryURL?: string;
    adCreativeBodies?: string[];
    ctaHeadline?: string;
    ctaDomain?: string;
    publisherPlatforms?: string[];
    adStatus?: string;
    startDate?: string;
    endDate?: string;
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
    ultimate: 50,
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

const APIFY_ACTOR_ID = "ZQyDz7154hrOfrDMK";

function normalizeApifyAds(rows: ApifyAdRaw[], fetchedAt: string): AdRecord[] {
    return rows.map((a, i) => {
        const id = String(a.adArchiveID || `${Date.now()}-${i}`);
        const startTime = a.startDate || "";
        const days = startTime
            ? Math.max(0, Math.floor((Date.now() - new Date(startTime).getTime()) / 86400000))
            : 0;
        return {
            id,
            page: a.pageName || "Unknown",
            pageId: a.pageID ? String(a.pageID) : "",
            body: (a.adCreativeBodies || ["No copy available"])[0],
            days,
            spend: "—",
            format: "Live",
            cta: a.ctaHeadline || "—",
            hook: "Live",
            headline: a.ctaHeadline || "Live Ad",
            targeting: a.ctaDomain || "Live",
            platforms: (a.publisherPlatforms || []).map((p) => String(p).toUpperCase()),
            snapshotUrl: a.adSnapshotUrl || "",
            creativeLinkUrl: a.adLibraryURL || a.adSnapshotUrl || "",
            startTime,
            deliveryStatus: a.adStatus || "ACTIVE",
            source: "META_LIBRARY",
            fetchedAt,
        };
    });
}

async function fetchFromApify(args: {
    query: string;
    country: string;
    limit: number;
    apiKey: string;
}): Promise<{ ads: AdRecord[]; provenance: Provenance; error?: string }> {
    const { query, country, limit, apiKey } = args;
    const fetchedAt = new Date().toISOString();

    // Fetch ALL ads (active + ended) so we can surface high-performing past ads
    const libraryUrl = `https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country=${country}&q=${encodeURIComponent(query)}&search_type=keyword_unordered&media_type=all`;

    // Start run and wait up to 90s
    const runRes = await fetch(
        `https://api.apify.com/v2/acts/${APIFY_ACTOR_ID}/runs?waitForFinish=90`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({ startUrls: [{ url: libraryUrl }], maxResults: limit }),
            cache: "no-store",
        }
    );

    const runData = await runRes.json().catch(() => ({}));
    if (!runRes.ok || runData?.error) {
        return { ads: [], provenance: "meta-error", error: runData?.error?.message || "Apify run failed." };
    }

    const datasetId = runData?.data?.defaultDatasetId;
    if (!datasetId) {
        return { ads: [], provenance: "meta-error", error: "No dataset returned from Apify." };
    }

    const itemsRes = await fetch(
        `https://api.apify.com/v2/datasets/${datasetId}/items?limit=${limit}`,
        { headers: { Authorization: `Bearer ${apiKey}` }, cache: "no-store" }
    );

    const items = await itemsRes.json().catch(() => []);
    if (!Array.isArray(items)) {
        return { ads: [], provenance: "meta-live-empty" };
    }

    const allAds = normalizeApifyAds(items as ApifyAdRaw[], fetchedAt);
    const oneYearAgo = Date.now() - 365 * 24 * 60 * 60 * 1000;

    // Keep: ran 90+ days AND started within the last year
    const ads = allAds.filter((ad) => {
        if (ad.days < 90) return false;
        if (ad.startTime && new Date(ad.startTime).getTime() < oneYearAgo) return false;
        return true;
    });

    return { ads, provenance: ads.length > 0 ? "meta-live" : "meta-live-empty" };
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
    const storedTier = (profile.tier || "free") as AccountTier;
    const tier = getEffectiveTier(storedTier, user.created_at) as AccountTier;
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
        const apiKey = process.env.APIFY_API_KEY;
        if (!apiKey) {
            provenance = "meta-error";
            metaError = "APIFY_API_KEY not configured on server.";
        } else {
            const live = await fetchFromApify({ query, country, limit, apiKey });
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
