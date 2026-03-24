import type { AccountTier, ReportType } from "@/lib/types";

export const WEEKLY_SEARCH_LIMITS: Record<AccountTier, number> = {
    free: 5,
    pro: 25,
    client: 200,
};

export const TIER_LABELS: Record<AccountTier, string> = {
    free: "Free",
    pro: "Pro",
    client: "Client",
};

export const REPORT_TYPE_OPTIONS: Record<
    AccountTier,
    Array<{ value: ReportType; label: string }>
> = {
    free: [{ value: "basic", label: "Basic Report" }],
    pro: [
        { value: "basic", label: "Basic Report" },
        { value: "full", label: "Full Analysis" },
        { value: "strategy", label: "Strategy Report" },
    ],
    client: [
        { value: "basic", label: "Basic Report" },
        { value: "full", label: "Full Analysis" },
        { value: "strategy", label: "Strategy Report" },
    ],
};
