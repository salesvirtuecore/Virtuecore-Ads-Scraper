import type { PlanTier } from "@/lib/plans";

export type AdRecord = {
    id: string;
    page: string;
    pageId?: string;
    body: string;
    days: number;
    spend: string;
    format: string;
    cta: string;
    hook: string;
    headline: string;
    targeting: string;
    platforms: string[];
    snapshotUrl: string;
    creativeLinkUrl?: string;
    startTime?: string;
    deliveryStatus?: string;
    source: "META_LIBRARY" | "DEMO_MOCK";
    fetchedAt: string;
};

export type ScanMeta = {
    source: "meta-live" | "meta-live-empty" | "meta-error" | "demo-mock";
    liveCount: number;
    mockCount: number;
    query: string;
    country: string;
    fetchedAt: string;
    error: string;
};

export type OrgProfile = {
    id: string;
    org_id: string;
    full_name: string;
    role: "admin" | "client";
    plan_tier: PlanTier;
};

export type AccountTier = "free" | "pro" | "client";

export type ReportType = "basic" | "full" | "strategy";

export type ReportHistoryRow = {
    id: string;
    report_type: ReportType;
    content: unknown;
    raw_content: string | null;
    industry: string | null;
    threshold_days: number | null;
    ads_analyzed: number;
    created_at: string;
};
