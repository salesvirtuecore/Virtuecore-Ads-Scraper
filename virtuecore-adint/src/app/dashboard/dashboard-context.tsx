"use client";

import { createContext, useContext } from "react";

import type { AccountTier } from "@/lib/types";

type DashboardProfile = {
    id: string;
    full_name: string;
    role: "admin" | "client";
    org_id: string;
    plan_tier: "starter" | "growth" | "scale";
    tier: AccountTier;
    searches_used_this_week?: number;
    week_reset_at?: string;
    email?: string;
    business_name?: string;
    industry?: string;
};

type DashboardContextValue = {
    profile: DashboardProfile;
    setProfile: React.Dispatch<React.SetStateAction<DashboardProfile | null>>;
};

const DashboardContext = createContext<DashboardContextValue | null>(null);

export function DashboardProvider(props: {
    value: DashboardContextValue;
    children: React.ReactNode;
}) {
    return <DashboardContext.Provider value={props.value}>{props.children}</DashboardContext.Provider>;
}

export function useDashboard() {
    const value = useContext(DashboardContext);
    if (!value) {
        throw new Error("useDashboard must be used inside DashboardProvider");
    }
    return value;
}

export type { DashboardProfile };
