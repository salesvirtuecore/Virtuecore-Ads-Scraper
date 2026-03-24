"use client";

import { FormEvent, useEffect, useState } from "react";

import ui from "@/app/app-ui.module.css";
import { TIER_LABELS, WEEKLY_SEARCH_LIMITS } from "@/lib/account";

import { useDashboard } from "../dashboard-context";

const INDUSTRIES = ["Coaching", "Ecommerce", "Real Estate", "SaaS", "Agency", "Health", "Finance", "Other"];

export default function SettingsPage() {
    const { profile, setProfile } = useDashboard();

    const [fullName, setFullName] = useState(profile.full_name || "");
    const [businessName, setBusinessName] = useState(profile.business_name || "");
    const [industry, setIndustry] = useState(profile.industry || "Other");
    const [metaToken, setMetaToken] = useState("");
    const [metaTokenSaved, setMetaTokenSaved] = useState(false);
    const [saveMsg, setSaveMsg] = useState("");
    const [saveError, setSaveError] = useState("");
    const [saveLoading, setSaveLoading] = useState(false);

    const [portalLoading, setPortalLoading] = useState(false);
    const [portalError, setPortalError] = useState("");

    const [billingLoading, setBillingLoading] = useState<"monthly" | "annual" | "">("");
    const [billingError, setBillingError] = useState("");

    useEffect(() => {
        setFullName(profile.full_name || "");
        setBusinessName(profile.business_name || "");
        setIndustry(profile.industry || "Other");
    }, [profile]);

    async function saveMetaToken(e: FormEvent) {
        e.preventDefault();
        if (!metaToken.trim()) return;
        const res = await fetch("/api/profile", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ meta_access_token: metaToken.trim() }),
        });
        if (res.ok) {
            setMetaTokenSaved(true);
            setMetaToken("");
            setTimeout(() => setMetaTokenSaved(false), 3000);
        }
    }

    async function saveProfile(e: FormEvent) {
        e.preventDefault();
        setSaveMsg("");
        setSaveError("");
        setSaveLoading(true);

        const res = await fetch("/api/profile", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ full_name: fullName, business_name: businessName, industry }),
        });
        const data = await res.json().catch(() => null);
        setSaveLoading(false);

        if (!res.ok) {
            setSaveError(data?.error || "Save failed.");
            return;
        }

        setProfile((current) => current ? { ...current, full_name: fullName, business_name: businessName, industry } : current);
        setSaveMsg("Profile saved.");
    }

    async function openPortal() {
        setPortalError("");
        setPortalLoading(true);

        const res = await fetch("/api/stripe/portal", { method: "POST" });
        const data = await res.json().catch(() => null);
        setPortalLoading(false);

        if (!res.ok || !data?.url) {
            setPortalError(data?.error || "Unable to open billing portal.");
            return;
        }

        window.location.href = data.url;
    }

    async function startCheckout(billing_cycle: "monthly" | "annual") {
        setBillingError("");
        setBillingLoading(billing_cycle);

        const res = await fetch("/api/stripe/checkout", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ billing_cycle }),
        });
        const data = await res.json().catch(() => null);
        setBillingLoading("");

        if (!res.ok || !data?.url) {
            setBillingError(data?.error || "Unable to start checkout.");
            return;
        }

        window.location.href = data.url;
    }

    const weeklyLimit = WEEKLY_SEARCH_LIMITS[profile.tier];
    const searchesUsed = profile.searches_used_this_week || 0;

    return (
        <div style={{ display: "grid", gap: "1.25rem" }}>
            <section className={ui.card}>
                <h2>Profile</h2>
                <form className={ui.formCol} onSubmit={saveProfile}>
                    <label>
                        <span className={ui.subtle}>Full name</span>
                        <input
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            placeholder="Full name"
                        />
                    </label>
                    <label>
                        <span className={ui.subtle}>Business name</span>
                        <input
                            value={businessName}
                            onChange={(e) => setBusinessName(e.target.value)}
                            placeholder="Business name"
                        />
                    </label>
                    <label>
                        <span className={ui.subtle}>Industry</span>
                        <select value={industry} onChange={(e) => setIndustry(e.target.value)}>
                            {INDUSTRIES.map((item) => (
                                <option key={item} value={item}>{item}</option>
                            ))}
                        </select>
                    </label>
                    <button type="submit" disabled={saveLoading}>
                        {saveLoading ? "Saving..." : "Save Profile"}
                    </button>
                    {saveMsg && <p className={ui.success}>{saveMsg}</p>}
                    {saveError && <p className={ui.error}>{saveError}</p>}
                </form>
            </section>

            <section className={ui.card}>
                <h2>Meta Access Token</h2>
                <p className={ui.subtle} style={{ marginBottom: "0.75rem" }}>
                    Required for live ad data from the Meta Ads Library. Get yours from the Graph API Explorer with <code>ads_read</code> permission. Stored securely per-account.
                </p>
                <form className={ui.formCol} onSubmit={saveMetaToken}>
                    <input
                        type="password"
                        value={metaToken}
                        onChange={(e) => setMetaToken(e.target.value)}
                        placeholder="Paste new token here (EAA... or AppID|secret)"
                        autoComplete="off"
                    />
                    <button type="submit" disabled={!metaToken.trim()}>
                        Save Token
                    </button>
                    {metaTokenSaved && <p className={ui.success}>Token saved.</p>}
                </form>
            </section>

            <section className={ui.grid2}>
                <article className={ui.card}>
                    <h2>Account</h2>
                    <p className={ui.subtle}>Email: {profile.email}</p>
                    <p className={ui.subtle}>Role: {profile.role}</p>
                    <p className={ui.subtle}>
                        Tier: <strong>{TIER_LABELS[profile.tier]}</strong>
                    </p>
                    <p className={ui.subtle}>
                        Searches this week: {searchesUsed} / {weeklyLimit}
                    </p>
                </article>

                <article className={ui.card}>
                    <h2>Subscription</h2>
                    {profile.tier !== "free" ? (
                        <>
                            <p className={ui.subtle}>You are on the <strong>{TIER_LABELS[profile.tier]}</strong> plan.</p>
                            <button
                                type="button"
                                onClick={openPortal}
                                disabled={portalLoading}
                                style={{ marginTop: "0.75rem" }}
                            >
                                {portalLoading ? "Opening..." : "Manage / Cancel Subscription"}
                            </button>
                            {portalError && <p className={ui.error}>{portalError}</p>}
                        </>
                    ) : (
                        <>
                            <p className={ui.subtle}>Upgrade to unlock full reports and higher scan limits.</p>
                            <div className={ui.formCol} style={{ marginTop: "0.75rem" }}>
                                <button
                                    type="button"
                                    onClick={() => startCheckout("monthly")}
                                    disabled={billingLoading !== ""}
                                >
                                    {billingLoading === "monthly" ? "Redirecting..." : "Upgrade Monthly — £67/mo"}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => startCheckout("annual")}
                                    disabled={billingLoading !== ""}
                                >
                                    {billingLoading === "annual" ? "Redirecting..." : "Upgrade Annual — Best value"}
                                </button>
                            </div>
                            {billingError && <p className={ui.error}>{billingError}</p>}
                        </>
                    )}
                </article>
            </section>
        </div>
    );
}
