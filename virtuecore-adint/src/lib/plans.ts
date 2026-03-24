export type PlanTier = "starter" | "growth" | "scale";

export type PlanConfig = {
    label: string;
    monthlyPriceUsd: number;
    searchResultCap: number;
    maxScansPerDay: number;
    maxAnalysesPerDay: number;
};

export const PLAN_CONFIG: Record<PlanTier, PlanConfig> = {
    starter: {
        label: "Starter",
        monthlyPriceUsd: 99,
        searchResultCap: 60,
        maxScansPerDay: 30,
        maxAnalysesPerDay: 10,
    },
    growth: {
        label: "Growth",
        monthlyPriceUsd: 299,
        searchResultCap: 120,
        maxScansPerDay: 120,
        maxAnalysesPerDay: 50,
    },
    scale: {
        label: "Scale",
        monthlyPriceUsd: 799,
        searchResultCap: 200,
        maxScansPerDay: 500,
        maxAnalysesPerDay: 250,
    },
};

export function coercePlan(plan?: string | null): PlanTier {
    if (plan === "starter" || plan === "growth" || plan === "scale") return plan;
    return "growth";
}
