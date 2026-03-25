"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import ui from "@/app/app-ui.module.css";
import { TIER_LABELS, WEEKLY_SEARCH_LIMITS } from "@/lib/account";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { getEffectiveTier, getTrialStatus } from "@/lib/trial";

import { DashboardProvider, type DashboardProfile } from "./dashboard-context";

const NAV_ITEMS = [
    { href: "/dashboard/scanner", label: "Ad Scanner" },
    { href: "/dashboard/funnel", label: "Funnel Analyser" },
    { href: "/dashboard/reports", label: "Report Library" },
    { href: "/dashboard/settings", label: "Settings" },
    { href: "/dashboard/upgrade", label: "Upgrade" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const supabase = useMemo(() => getSupabaseBrowserClient(), []);

    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState<DashboardProfile | null>(null);
    const [rawTier, setRawTier] = useState<DashboardProfile["tier"]>("free");
    const [signupDate, setSignupDate] = useState<string | null>(null);

    useEffect(() => {
        if (!supabase) {
            setLoading(false);
            return;
        }

        async function loadProfile(userId: string, created?: string) {
            const p = await supabase!
                .from("profiles")
                .select("id, full_name, role, org_id, plan_tier, tier, searches_used_this_week, week_reset_at, email, business_name, industry")
                .eq("id", userId)
                .single();

            if (!p.error && p.data) {
                const stored = (p.data.tier || "free") as DashboardProfile["tier"];
                const effective = created ? getEffectiveTier(stored, created) : stored;
                setRawTier(stored);
                if (created) setSignupDate(created);
                setProfile({ ...(p.data as DashboardProfile), tier: effective });
            } else {
                setProfile(null);
            }
            setLoading(false);
        }

        // Immediately check for an existing session (reads from cookie, no network call)
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session?.user?.id) {
                loadProfile(session.user.id, session.user.created_at);
            } else {
                setProfile(null);
                setLoading(false);
            }
        });

        // Also listen for future auth changes (sign-out, token refresh)
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (_event, session) => {
                if (session?.user?.id) {
                    loadProfile(session.user.id, session.user.created_at);
                } else {
                    setProfile(null);
                    setLoading(false);
                }
            }
        );

        return () => subscription.unsubscribe();
    }, [supabase]);

    async function signOut() {
        if (supabase) {
            await supabase.auth.signOut();
        }
        window.location.href = "/auth/login";
    }

    if (loading) {
        return (
            <main className={ui.shell}>
                <section className={ui.card}>
                    <p className={ui.subtle}>Loading dashboard...</p>
                </section>
            </main>
        );
    }

    if (!profile) {
        return (
            <main className={ui.shell}>
                <section className={ui.card}>
                    <p className={ui.subtle} style={{ marginBottom: "1rem" }}>Session expired. Please sign in again.</p>
                    <a href="/auth/login" style={{ color: "#e5bf44" }}>Sign in →</a>
                </section>
            </main>
        );
    }

    const navItems = profile.role === "admin"
        ? [...NAV_ITEMS, { href: "/dashboard/admin", label: "Admin" }]
        : NAV_ITEMS;
    const weeklyLimit = WEEKLY_SEARCH_LIMITS[profile.tier];
    const searchesUsed = Math.min(profile.searches_used_this_week || 0, weeklyLimit);
    const usagePct = Math.min((searchesUsed / weeklyLimit) * 100, 100);
    const resetLabel = profile.week_reset_at
        ? new Date(profile.week_reset_at).toLocaleString("en-GB", {
            day: "numeric",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
        })
        : "Unknown";
    const tierClass =
        profile.tier === "free"
            ? ui.tierFree
            : profile.tier === "pro"
                ? ui.tierPro
                : ui.tierClient;

    const trial = signupDate ? getTrialStatus(rawTier, signupDate) : null;

    return (
        <DashboardProvider value={{ profile, setProfile }}>
            <main className={ui.dashboardShell}>
                <aside className={ui.sidebar}>
                    <div className={ui.sidebarBrand}>
                        <p className={ui.sidebarEyebrow}>VirtueCore</p>
                        <h1 className={ui.sidebarTitle}>Ad Intelligence</h1>
                        <p className={ui.subtle}>{profile.full_name} · {profile.role}</p>
                    </div>

                    <section className={ui.sidebarSection}>
                        <div className={ui.sidebarRow}>
                            <span className={`${ui.tierBadge} ${tierClass}`}>{TIER_LABELS[profile.tier]}</span>
                            <span className={ui.subtle}>{profile.business_name || profile.email || "Workspace"}</span>
                        </div>
                        <div className={ui.searchMeter} title={`Resets ${resetLabel}`}>
                            <div className={ui.sidebarRow}>
                                <strong>{searchesUsed}/{weeklyLimit} searches this week</strong>
                                <span className={ui.subtle}>Hover for reset</span>
                            </div>
                            <div className={ui.progressTrack} aria-hidden="true">
                                <div className={ui.progressFill} style={{ width: `${usagePct}%` }} />
                            </div>
                        </div>
                        {trial?.onTrial && (
                            <div style={{
                                background: "rgba(229,191,68,0.08)",
                                border: "1px solid rgba(229,191,68,0.25)",
                                borderRadius: 10,
                                padding: "0.55rem 0.75rem",
                                display: "grid",
                                gap: "0.2rem",
                            }}>
                                <p style={{ margin: 0, color: "#e5bf44", fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                                    Free trial
                                </p>
                                <p style={{ margin: 0, color: "rgba(255,255,255,0.75)", fontSize: "0.82rem", lineHeight: 1.4 }}>
                                    {trial.daysLeft} day{trial.daysLeft !== 1 ? "s" : ""} of <strong>{TIER_LABELS[trial.trialTier!]}</strong> left
                                    {trial.nextTier && trial.nextTier !== "free" && ` · then ${TIER_LABELS[trial.nextTier]} for 3 days`}
                                    {trial.nextTier === "free" && " · then free plan"}
                                </p>
                            </div>
                        )}
                        {!trial?.onTrial && profile.tier === "free" && (
                            <Link href="/dashboard/upgrade" className={ui.upgradeCta}>
                                Upgrade to Pro
                            </Link>
                        )}
                    </section>

                    <nav className={ui.sidebarNav}>
                        {navItems.map((item) => {
                            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`${ui.navPill} ${isActive ? ui.navPillActive : ""}`.trim()}
                                    aria-current={isActive ? "page" : undefined}
                                >
                                    {item.label}
                                </Link>
                            );
                        })}
                    </nav>

                    <button type="button" onClick={signOut} className={ui.inlineActionGhost}>Sign Out</button>
                </aside>

                <section className={ui.dashboardMain}>
                    {children}
                </section>
            </main>
        </DashboardProvider>
    );
}
