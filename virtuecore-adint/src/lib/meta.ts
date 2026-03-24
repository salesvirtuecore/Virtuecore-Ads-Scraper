import type { AdRecord, ScanMeta } from "@/lib/types";

type ScanArgs = {
    query: string;
    country: string;
    metaToken?: string;
    cap: number;
};

export async function fetchMetaAds({ query, country, metaToken, cap }: ScanArgs): Promise<{ ads: AdRecord[]; meta: ScanMeta }> {
    const fetchedAt = new Date().toISOString();
    const token = metaToken || process.env.APP_DEFAULT_META_TOKEN || "";

    if (!token) {
        return {
            ads: [],
            meta: {
                source: "demo-mock",
                liveCount: 0,
                mockCount: 0,
                query,
                country,
                fetchedAt,
                error: "No Meta token configured.",
            },
        };
    }

    try {
        const fields = [
            "id",
            "ad_snapshot_url",
            "ad_creative_bodies",
            "page_name",
            "ad_delivery_start_time",
            "publisher_platforms",
            "spend",
            "ad_creative_link_titles",
        ].join(",");

        const pageSize = Math.min(50, cap);
        let nextUrl = `https://graph.facebook.com/v19.0/ads_archive?search_terms=${encodeURIComponent(query)}&ad_reached_countries=[\"${country}\"]&fields=${encodeURIComponent(fields)}&access_token=${encodeURIComponent(token)}&limit=${pageSize}&ad_active_status=ALL`;
        const ads: AdRecord[] = [];
        const seen = new Set<string>();

        while (nextUrl && ads.length < cap) {
            const res = await fetch(nextUrl, { cache: "no-store" });
            const data = await res.json();
            if (!res.ok || data.error) {
                return {
                    ads: [],
                    meta: {
                        source: "meta-error",
                        liveCount: 0,
                        mockCount: 0,
                        query,
                        country,
                        fetchedAt,
                        error: data?.error?.message || "Meta API request failed.",
                    },
                };
            }

            const rows = (data.data || []).map((a: any, i: number) => {
                const id = String(a.id || `${Date.now()}-${i}`);
                return {
                    id,
                    page: a.page_name || "Unknown",
                    body: (a.ad_creative_bodies || ["No copy"])[0],
                    days: a.ad_delivery_start_time ? Math.floor((Date.now() - new Date(a.ad_delivery_start_time).getTime()) / 86400000) : 0,
                    spend: a.spend ? `£${a.spend.lower_bound}–${a.spend.upper_bound}` : "—",
                    format: "Live",
                    cta: (a.ad_creative_link_titles || ["—"])[0],
                    hook: "Live",
                    headline: "Live Ad",
                    targeting: "Live",
                    platforms: (a.publisher_platforms || []).map((p: string) => p.toUpperCase()),
                    snapshotUrl: a.ad_snapshot_url || "",
                    source: "META_LIBRARY" as const,
                    fetchedAt,
                };
            });

            for (const row of rows) {
                if (!seen.has(row.id)) {
                    seen.add(row.id);
                    ads.push(row);
                    if (ads.length >= cap) break;
                }
            }

            nextUrl = data?.paging?.next || "";
        }

        return {
            ads,
            meta: {
                source: ads.length ? "meta-live" : "meta-live-empty",
                liveCount: ads.length,
                mockCount: 0,
                query,
                country,
                fetchedAt,
                error: "",
            },
        };
    } catch (error: any) {
        return {
            ads: [],
            meta: {
                source: "meta-error",
                liveCount: 0,
                mockCount: 0,
                query,
                country,
                fetchedAt,
                error: error?.message || "Unexpected Meta API error.",
            },
        };
    }
}
