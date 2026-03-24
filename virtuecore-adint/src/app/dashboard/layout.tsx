"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import ui from "@/app/app-ui.module.css";
import { TIER_LABELS, WEEKLY_SEARCH_LIMITS } from "@/lib/account";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

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

    useEffect(() => {
        if (!supabase) {
            setLoading(false);
            return;
        }

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (_event, session) => {
                if (!session?.user?.id) {
                    setProfile(null);
                    setLoading(false);
                    return;
                }

                const p = await supabase
                    .from("profiles")
                    .select("id, full_name, role, org_id, plan_tier, tier, searches_used_this_week, week_reset_at, email, business_name, industry")
                    .eq("id", session.user.id)
                    .single();

                if (!p.error && p.data) {
                    setProfile({
                        ...(p.data as DashboardProfile),
                        tier: (p.data.tier || "free") as DashboardProfile["tier"],
                    });
                }
                setLoading(false);
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
                        {profile.tier === "free" && (
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
