"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import ui from "@/app/app-ui.module.css";
import { REPORT_TYPE_OPTIONS, TIER_LABELS, WEEKLY_SEARCH_LIMITS } from "@/lib/account";
import type { AdRecord, ReportHistoryRow, ReportType, ScanMeta } from "@/lib/types";

import { useDashboard } from "../dashboard-context";

/* ---------- Report modal types ---------- */
type ReportContent = {
    landscape?: string;
    opportunityGap?: string;
    winningAds?: Array<{ page?: string; days?: number; hook?: string; headline?: string; angle?: string; offer?: string; whyWorking?: string }>;
    hookPatterns?: Array<{ type?: string; frequency?: string; description?: string }>;
    offerPatterns?: string;
    copyInsights?: string;
    targetingInsights?: string;
    creativeFormats?: string;
    recommendations?: string[];
    repurposedAds?: Array<{ hookType?: string; headline?: string; hook?: string; body?: string; cta?: string }>;
    raw?: string;
};

type ReportModalData = {
    id: string;
    report_type: string;
    content: ReportContent;
    raw_content: string | null;
    industry: string | null;
    threshold_days: number | null;
    ads_analyzed: number;
    client_business: string | null;
    scan_query: string | null;
    created_at: string;
};

function ReportModal({ report, onClose }: { report: ReportModalData; onClose: () => void }) {
    const contentRef = useRef<HTMLDivElement>(null);
    const c = report.content as ReportContent;
    const isStructured = c && typeof c === "object" && !("raw" in c && Object.keys(c).length === 1);

    function handlePrint() {
        const html = contentRef.current?.innerHTML || "";
        const win = window.open("", "_blank");
        if (!win) return;
        win.document.write(`<!DOCTYPE html><html><head><title>VirtueCore Report</title><style>
            body { font-family: Georgia, serif; background: #fff; color: #111; padding: 2rem; max-width: 820px; margin: 0 auto; }
            h1 { font-size: 1.6rem; margin-bottom: 0.25rem; }
            h2 { font-size: 1.1rem; font-weight: 700; margin: 1.5rem 0 0.4rem; color: #111; border-bottom: 1px solid #ddd; padding-bottom: 0.3rem; }
            p { line-height: 1.65; margin: 0 0 0.5rem; }
            ol { padding-left: 1.25rem; }
            li { margin-bottom: 0.35rem; line-height: 1.55; }
            .badge { display: inline-block; background: #f3f3f3; border-radius: 4px; padding: 0.1rem 0.4rem; font-size: 0.8rem; margin-right: 0.3rem; }
            .ad-card { border: 1px solid #ddd; border-radius: 6px; padding: 0.65rem 0.85rem; margin-bottom: 0.6rem; }
            .gold { background: #fffbeb; border-color: #d4a017; border-radius: 6px; padding: 0.65rem 0.85rem; margin-bottom: 0.5rem; }
            .meta { color: #555; font-size: 0.85rem; }
            @media print { body { padding: 0; } }
        </style></head><body>
        <h1>${report.client_business || report.industry || "Intelligence Report"}</h1>
        <p class="meta">${report.report_type.toUpperCase()} · ${report.ads_analyzed} ads · ${report.industry || ""} · ${report.scan_query ? `"${report.scan_query}"` : ""} · ${new Date(report.created_at).toLocaleDateString("en-GB")}</p>
        <hr style="margin: 1rem 0; border-color: #ddd;" />
        ${isStructured ? renderReportHtml(c) : `<pre style="white-space:pre-wrap">${report.raw_content || JSON.stringify(c, null, 2)}</pre>`}
        </body></html>`);
        win.document.close();
        win.focus();
        win.print();
    }

    function renderReportHtml(r: ReportContent): string {
        let out = "";
        if (r.landscape) out += `<h2>Market Landscape</h2><p>${r.landscape}</p>`;
        if (r.opportunityGap) out += `<h2>Opportunity Gap</h2><div class="gold"><p>${r.opportunityGap}</p></div>`;
        if (r.winningAds?.length) {
            out += `<h2>Winning Ads (${r.winningAds.length})</h2>`;
            r.winningAds.forEach((ad) => {
                out += `<div class="ad-card"><strong>${ad.page || ""} · ${ad.days || 0}d · ${ad.hook || ""}</strong>`;
                if (ad.headline) out += `<p><em>"${ad.headline}"</em></p>`;
                if (ad.angle) out += `<p class="meta">Angle: ${ad.angle}</p>`;
                if (ad.offer) out += `<p class="meta">Offer: ${ad.offer}</p>`;
                if (ad.whyWorking) out += `<p class="meta">Why it works: ${ad.whyWorking}</p>`;
                out += `</div>`;
            });
        }
        if (r.hookPatterns?.length) {
            out += `<h2>Hook Patterns</h2>`;
            r.hookPatterns.forEach((h) => { out += `<p><span class="badge">${h.type}</span> ${h.frequency} · ${h.description}</p>`; });
        }
        if (r.offerPatterns) out += `<h2>Offer Patterns</h2><p>${r.offerPatterns}</p>`;
        if (r.copyInsights) out += `<h2>Copy Insights</h2><p>${r.copyInsights}</p>`;
        if (r.targetingInsights) out += `<h2>Targeting Insights</h2><p>${r.targetingInsights}</p>`;
        if (r.creativeFormats) out += `<h2>Creative Formats</h2><p>${r.creativeFormats}</p>`;
        if (r.recommendations?.length) {
            out += `<h2>Recommendations</h2><ol>`;
            r.recommendations.forEach((rec) => { out += `<li>${rec}</li>`; });
            out += `</ol>`;
        }
        if (r.repurposedAds?.length) {
            out += `<h2>Ready-to-Use Ad Drafts (${r.repurposedAds.length})</h2>`;
            r.repurposedAds.forEach((ad) => {
                out += `<div class="gold"><strong>${ad.hookType} · ${ad.headline}</strong>`;
                if (ad.hook) out += `<p><em>${ad.hook}</em></p>`;
                if (ad.body) out += `<p class="meta">${ad.body}</p>`;
                if (ad.cta) out += `<p><span class="badge">CTA: ${ad.cta}</span></p>`;
                out += `</div>`;
            });
        }
        return out;
    }

    return (
        <div style={{
            position: "fixed", inset: 0, zIndex: 999,
            background: "rgba(0,0,0,0.85)",
            backdropFilter: "blur(6px)",
            display: "flex", alignItems: "flex-start", justifyContent: "center",
            padding: "2rem 1rem",
            overflowY: "auto",
        }}
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div style={{
                background: "#111",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 20,
                width: "min(860px, 100%)",
                padding: "2rem",
                display: "grid",
                gap: "1.5rem",
                position: "relative",
            }}>
                {/* Header */}
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem" }}>
                    <div>
                        <p style={{ margin: "0 0 0.2rem", color: "rgba(229,191,68,0.8)", fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase" }}>
                            {report.report_type.toUpperCase()} Report · Ready
                        </p>
                        <h2 style={{ margin: 0, fontSize: "1.4rem", fontWeight: 700 }}>
                            {report.client_business || report.industry || "Competitive Intelligence"}
                        </h2>
                        <p style={{ margin: "0.2rem 0 0", color: "rgba(255,255,255,0.45)", fontSize: "0.85rem" }}>
                            {report.ads_analyzed} ads analysed · {report.industry}
                            {report.scan_query ? ` · "${report.scan_query}"` : ""}
                        </p>
                    </div>
                    <div style={{ display: "flex", gap: "0.5rem", flexShrink: 0 }}>
                        <button
                            type="button"
                            onClick={handlePrint}
                            style={{
                                background: "linear-gradient(120deg, #f0cb54, #cc9519)",
                                color: "#1e1703",
                                border: "none",
                                borderRadius: 10,
                                padding: "0.6rem 1.1rem",
                                fontWeight: 700,
                                fontSize: "0.88rem",
                                cursor: "pointer",
                                whiteSpace: "nowrap",
                            }}
                        >
                            Download PDF
                        </button>
                        <Link
                            href={`/dashboard/reports/${report.id}`}
                            style={{
                                display: "inline-block",
                                background: "rgba(255,255,255,0.07)",
                                border: "1px solid rgba(255,255,255,0.15)",
                                color: "#fff",
                                borderRadius: 10,
                                padding: "0.6rem 1rem",
                                fontWeight: 600,
                                fontSize: "0.88rem",
                                textDecoration: "none",
                                whiteSpace: "nowrap",
                            }}
                        >
                            Full page →
                        </Link>
                        <button
                            type="button"
                            onClick={onClose}
                            style={{
                                background: "rgba(255,255,255,0.06)",
                                border: "1px solid rgba(255,255,255,0.12)",
                                color: "rgba(255,255,255,0.6)",
                                borderRadius: 10,
                                padding: "0.6rem 0.85rem",
                                cursor: "pointer",
                                fontSize: "1rem",
                                lineHeight: 1,
                            }}
                        >
                            ✕
                        </button>
                    </div>
                </div>

                <div style={{ width: "100%", height: 1, background: "rgba(255,255,255,0.07)" }} />

                {/* Content */}
                <div ref={contentRef} style={{ display: "grid", gap: "1.25rem" }}>
                    {isStructured ? (
                        <>
                            {c.landscape && (
                                <div>
                                    <p style={{ margin: "0 0 0.4rem", color: "rgba(229,191,68,0.7)", fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase" }}>Market Landscape</p>
                                    <p style={{ color: "rgba(255,255,255,0.88)", lineHeight: 1.65, margin: 0 }}>{c.landscape}</p>
                                </div>
                            )}
                            {c.opportunityGap && (
                                <div style={{ background: "rgba(229,191,68,0.08)", border: "1px solid rgba(229,191,68,0.22)", borderRadius: 10, padding: "0.75rem 1rem" }}>
                                    <p style={{ margin: "0 0 0.35rem", color: "rgba(229,191,68,0.7)", fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase" }}>Opportunity Gap</p>
                                    <p style={{ color: "rgba(255,255,255,0.88)", lineHeight: 1.65, margin: 0 }}>{c.opportunityGap}</p>
                                </div>
                            )}
                            {Array.isArray(c.winningAds) && c.winningAds.length > 0 && (
                                <div>
                                    <p style={{ margin: "0 0 0.5rem", color: "rgba(229,191,68,0.7)", fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase" }}>Winning Ads ({c.winningAds.length})</p>
                                    <div style={{ display: "grid", gap: "0.6rem" }}>
                                        {c.winningAds.map((ad, i) => (
                                            <div key={i} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: "0.7rem 0.9rem", display: "grid", gap: "0.2rem" }}>
                                                <strong style={{ color: "rgba(255,255,255,0.95)", fontSize: "0.9rem" }}>{ad.page} · {ad.days}d · {ad.hook}</strong>
                                                {ad.headline && <p style={{ color: "rgba(229,191,68,0.9)", margin: 0, fontStyle: "italic", fontSize: "0.9rem" }}>&ldquo;{ad.headline}&rdquo;</p>}
                                                {ad.angle && <p style={{ color: "rgba(255,255,255,0.5)", margin: 0, fontSize: "0.85rem" }}>Angle: {ad.angle}</p>}
                                                {ad.offer && <p style={{ color: "rgba(255,255,255,0.5)", margin: 0, fontSize: "0.85rem" }}>Offer: {ad.offer}</p>}
                                                {ad.whyWorking && <p style={{ color: "rgba(255,255,255,0.5)", margin: 0, fontSize: "0.85rem" }}>Why it works: {ad.whyWorking}</p>}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {Array.isArray(c.hookPatterns) && c.hookPatterns.length > 0 && (
                                <div>
                                    <p style={{ margin: "0 0 0.5rem", color: "rgba(229,191,68,0.7)", fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase" }}>Hook Patterns</p>
                                    <div style={{ display: "grid", gap: "0.4rem" }}>
                                        {c.hookPatterns.map((h, i) => (
                                            <div key={i} style={{ display: "flex", gap: "0.6rem", alignItems: "flex-start" }}>
                                                <span className={ui.badge}>{h.type}</span>
                                                <span style={{ color: "rgba(255,255,255,0.55)", fontSize: "0.88rem" }}>{h.frequency} · {h.description}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {c.offerPatterns && <div><p style={{ margin: "0 0 0.4rem", color: "rgba(229,191,68,0.7)", fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase" }}>Offer Patterns</p><p style={{ color: "rgba(255,255,255,0.88)", lineHeight: 1.65, margin: 0 }}>{c.offerPatterns}</p></div>}
                            {c.copyInsights && <div><p style={{ margin: "0 0 0.4rem", color: "rgba(229,191,68,0.7)", fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase" }}>Copy Insights</p><p style={{ color: "rgba(255,255,255,0.88)", lineHeight: 1.65, margin: 0 }}>{c.copyInsights}</p></div>}
                            {c.targetingInsights && <div><p style={{ margin: "0 0 0.4rem", color: "rgba(229,191,68,0.7)", fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase" }}>Targeting Insights</p><p style={{ color: "rgba(255,255,255,0.88)", lineHeight: 1.65, margin: 0 }}>{c.targetingInsights}</p></div>}
                            {c.creativeFormats && <div><p style={{ margin: "0 0 0.4rem", color: "rgba(229,191,68,0.7)", fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase" }}>Creative Formats</p><p style={{ color: "rgba(255,255,255,0.88)", lineHeight: 1.65, margin: 0 }}>{c.creativeFormats}</p></div>}
                            {Array.isArray(c.recommendations) && c.recommendations.length > 0 && (
                                <div>
                                    <p style={{ margin: "0 0 0.5rem", color: "rgba(229,191,68,0.7)", fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase" }}>Recommendations</p>
                                    <ol style={{ paddingLeft: "1.25rem", display: "grid", gap: "0.4rem", margin: 0 }}>
                                        {c.recommendations.map((rec, i) => (
                                            <li key={i} style={{ color: "rgba(255,255,255,0.85)", lineHeight: 1.55 }}>{rec}</li>
                                        ))}
                                    </ol>
                                </div>
                            )}
                            {Array.isArray(c.repurposedAds) && c.repurposedAds.length > 0 && (
                                <div>
                                    <p style={{ margin: "0 0 0.5rem", color: "rgba(229,191,68,0.7)", fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase" }}>Ready-to-Use Ad Drafts ({c.repurposedAds.length})</p>
                                    <div style={{ display: "grid", gap: "0.6rem" }}>
                                        {c.repurposedAds.map((ad, i) => (
                                            <div key={i} style={{ background: "rgba(229,191,68,0.06)", border: "1px solid rgba(229,191,68,0.18)", borderRadius: 8, padding: "0.7rem 0.9rem", display: "grid", gap: "0.2rem" }}>
                                                <strong style={{ color: "rgba(229,191,68,0.9)", fontSize: "0.9rem" }}>{ad.hookType} · {ad.headline}</strong>
                                                {ad.hook && <p style={{ color: "rgba(255,255,255,0.9)", margin: 0, fontStyle: "italic", fontSize: "0.9rem" }}>{ad.hook}</p>}
                                                {ad.body && <p style={{ color: "rgba(255,255,255,0.55)", margin: 0, fontSize: "0.85rem" }}>{ad.body}</p>}
                                                {ad.cta && <span className={ui.badge}>CTA: {ad.cta}</span>}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <pre className={ui.pre}>{report.raw_content || JSON.stringify(c, null, 2)}</pre>
                    )}
                </div>

                {/* Footer */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "0.5rem", borderTop: "1px solid rgba(255,255,255,0.07)" }}>
                    <p style={{ margin: 0, color: "rgba(255,255,255,0.3)", fontSize: "0.8rem" }}>
                        Saved to your Report Library
                    </p>
                    <Link href="/dashboard/reports" style={{ color: "rgba(229,191,68,0.8)", fontSize: "0.85rem", fontWeight: 600, textDecoration: "none" }}>
                        View all reports →
                    </Link>
                </div>
            </div>
        </div>
    );
}

const COUNTRY_OPTIONS = [
    ["GB", "United Kingdom"],
    ["US", "United States"],
    ["AU", "Australia"],
    ["CA", "Canada"],
    ["IE", "Ireland"],
] as const;

const PLATFORM_FILTERS = ["All", "FB", "IG", "AN"] as const;

function isWinning(ad: AdRecord, thresholdDays: number) {
    return ad.days >= thresholdDays;
}

function matchesPlatform(ad: AdRecord, platform: (typeof PLATFORM_FILTERS)[number]) {
    if (platform === "All") return true;

    const platforms = ad.platforms.map((entry) => entry.toUpperCase());
    if (platform === "FB") return platforms.some((entry) => entry.includes("FACEBOOK") || entry === "FB");
    if (platform === "IG") return platforms.some((entry) => entry.includes("INSTAGRAM") || entry === "IG");
    return platforms.some((entry) => entry.includes("AUDIENCE_NETWORK") || entry === "AN");
}

function formatReset(value?: string) {
    if (!value) return "Unknown";
    return new Date(value).toLocaleString("en-GB", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
    });
}

export default function ScannerPage() {
    const { profile, setProfile } = useDashboard();

    const [query, setQuery] = useState("ecommerce");
    const [country, setCountry] = useState("GB");
    const [industry, setIndustry] = useState(profile.industry || "Coaching");
    const [thresholdDays, setThresholdDays] = useState(90);
    const [clientBusiness, setClientBusiness] = useState(profile.business_name || "");
    const [reportType, setReportType] = useState<ReportType>(profile.tier === "free" ? "basic" : "full");
    const [filterFormat, setFilterFormat] = useState("All");
    const [filterPlatform, setFilterPlatform] = useState<(typeof PLATFORM_FILTERS)[number]>("All");
    const [sortBy, setSortBy] = useState<"days-desc" | "days-asc" | "page-asc" | "source">("days-desc");
    const [scanLoading, setScanLoading] = useState(false);
    const [analyzeLoading, setAnalyzeLoading] = useState(false);

    const [scanMeta, setScanMeta] = useState<ScanMeta | null>(null);
    const [ads, setAds] = useState<AdRecord[]>([]);
    const [selected, setSelected] = useState<Record<string, boolean>>({});
    const [analysis, setAnalysis] = useState<unknown>(null);
    const [reports, setReports] = useState<ReportHistoryRow[]>([]);
    const [lastSearchId, setLastSearchId] = useState("");
    const [lastReportId, setLastReportId] = useState("");
    const [globalMsg, setGlobalMsg] = useState("");
    const [reportModal, setReportModal] = useState<unknown>(null);

    const MAX_SELECTION = 5;

    const weeklyLimit = WEEKLY_SEARCH_LIMITS[profile.tier];
    const reportOptions = REPORT_TYPE_OPTIONS[profile.tier];

    useEffect(() => {
        if (!reportOptions.some((option) => option.value === reportType)) {
            setReportType(reportOptions[reportOptions.length - 1].value);
        }
    }, [reportOptions, reportType]);

    useEffect(() => {
        setClientBusiness(profile.business_name || "");
    }, [profile.business_name]);

    useEffect(() => {
        async function loadReports() {
            const res = await fetch("/api/reports", { cache: "no-store" });
            const data = await res.json().catch(() => null);
            if (!res.ok || !data) return;
            setReports((data.reports || []) as ReportHistoryRow[]);
        }

        void loadReports();
    }, [analysis]);

    async function runScan() {
        if (!query.trim()) {
            setGlobalMsg("Enter a niche or keyword before scanning.");
            return;
        }

        setScanLoading(true);
        setGlobalMsg("");
        try {
            const res = await fetch("/api/search", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ query, country, limit: 120 }),
            });
            const data = await res.json();
            if (!res.ok) {
                if (data.error === "weekly_limit_reached") {
                    throw new Error(`Weekly search limit reached. Resets ${formatReset(data.resets_at)}.`);
                }
                throw new Error(data.error || "Scan failed.");
            }

            setAds(data.ads || []);
            setScanMeta({
                source: data.provenance || "meta-error",
                liveCount: data.total_count || 0,
                mockCount: data.provenance === "demo-mock" ? (data.total_count || 0) : 0,
                query: query.trim(),
                country: country.toUpperCase(),
                fetchedAt: new Date().toISOString(),
                error: data.meta_error || "",
            });
            setLastSearchId(data.search_id || "");
            setLastReportId("");
            setAnalysis(null);

            // Auto-select top 5 winning ads only (sorted longest-running first)
            const allAds: AdRecord[] = data.ads || [];
            const sorted = [...allAds].sort((a, b) => b.days - a.days);
            const next: Record<string, boolean> = {};
            sorted.slice(0, MAX_SELECTION).forEach((ad) => { next[ad.id] = true; });
            setSelected(next);

            if (typeof data.searches_remaining === "number") {
                setProfile((current) => current
                    ? {
                        ...current,
                        searches_used_this_week: Math.max(weeklyLimit - data.searches_remaining, 0),
                        week_reset_at: data.week_resets_at || current.week_reset_at,
                    }
                    : current);
            }
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : "Scan failed.";
            setGlobalMsg(msg);
        } finally {
            setScanLoading(false);
        }
    }

    async function runAnalysis() {
        const chosen = ads.filter((ad) => selected[ad.id]);
        if (!chosen.length) {
            setGlobalMsg("Select at least one ad before analysis.");
            return;
        }

        setAnalyzeLoading(true);
        setGlobalMsg("");
        try {
            const res = await fetch("/api/report", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...(lastSearchId ? { search_id: lastSearchId } : {}),
                    selected_ads: chosen,
                    client_business: clientBusiness,
                    report_type: reportType,
                    industry,
                    threshold_days: thresholdDays,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Analysis failed.");
            setAnalysis(data.parsed || { raw: data.raw });
            const rid = data.report_id || "";
            setLastReportId(rid);

            // Fetch full report and show modal
            if (rid) {
                const fullRes = await fetch(`/api/reports/${rid}`, { cache: "no-store" });
                const fullData = await fullRes.json().catch(() => null);
                if (fullRes.ok && fullData?.report) setReportModal(fullData.report);
            }
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : "Analysis failed.";
            setGlobalMsg(msg);
        } finally {
            setAnalyzeLoading(false);
        }
    }

    const formats = ["All", ...new Set(ads.map((ad) => ad.format || "Unknown"))];
    const filteredAds = ads
        .filter((ad) => filterFormat === "All" || ad.format === filterFormat)
        .filter((ad) => matchesPlatform(ad, filterPlatform))
        .sort((left, right) => {
            if (sortBy === "days-desc") return right.days - left.days;
            if (sortBy === "days-asc") return left.days - right.days;
            if (sortBy === "page-asc") return left.page.localeCompare(right.page);
            return left.source.localeCompare(right.source);
        });

    const selectedCount = ads.filter((ad) => selected[ad.id]).length;
    const winningCount = filteredAds.filter((ad) => isWinning(ad, thresholdDays)).length;
    const allFilteredSelected = filteredAds.length > 0 && filteredAds.every((ad) => selected[ad.id]);

    function toggleFilteredSelection() {
        if (allFilteredSelected) {
            // Clear all filtered
            setSelected((current) => {
                const next = { ...current };
                for (const ad of filteredAds) next[ad.id] = false;
                return next;
            });
        } else {
            // Select up to MAX_SELECTION across all ads
            setSelected((current) => {
                const next = { ...current };
                const alreadySelected = Object.values(next).filter(Boolean).length;
                let slots = MAX_SELECTION - alreadySelected;
                for (const ad of filteredAds) {
                    if (slots <= 0) break;
                    if (!next[ad.id]) { next[ad.id] = true; slots--; }
                }
                return next;
            });
        }
    }

    function renderReportPreview(data: unknown) {
        if (!data) return <p className={ui.subtle}>No report yet. Select ads and click Generate Report.</p>;
        const r = data as Record<string, unknown>;
        if (r.raw && !r.landscape) return <pre className={ui.pre}>{String(r.raw)}</pre>;

        return (
            <div style={{ display: "grid", gap: "0.85rem" }}>
                {!!r.landscape && (
                    <div>
                        <p className={ui.sidebarEyebrow} style={{ marginBottom: "0.35rem" }}>Market Landscape</p>
                        <p style={{ color: "rgba(255,255,255,0.88)", lineHeight: 1.6, margin: 0 }}>{String(r.landscape)}</p>
                    </div>
                )}
                {!!r.opportunityGap && (
                    <div style={{ background: "rgba(229,191,68,0.08)", border: "1px solid rgba(229,191,68,0.22)", borderRadius: 10, padding: "0.7rem 0.85rem" }}>
                        <p className={ui.sidebarEyebrow} style={{ marginBottom: "0.3rem" }}>Opportunity Gap</p>
                        <p style={{ color: "rgba(255,255,255,0.88)", lineHeight: 1.6, margin: 0 }}>{String(r.opportunityGap)}</p>
                    </div>
                )}
                {Array.isArray(r.recommendations) && r.recommendations.length > 0 && (
                    <div>
                        <p className={ui.sidebarEyebrow} style={{ marginBottom: "0.4rem" }}>Top Recommendations</p>
                        <ol style={{ paddingLeft: "1.2rem", display: "grid", gap: "0.4rem", margin: 0 }}>
                            {(r.recommendations as string[]).slice(0, 3).map((rec, i) => (
                                <li key={i} style={{ color: "rgba(255,255,255,0.82)", lineHeight: 1.5 }}>{rec}</li>
                            ))}
                            {r.recommendations.length > 3 && (
                                <li style={{ color: "rgba(229,191,68,0.85)", listStyle: "none" }}>
                                    +{r.recommendations.length - 3} more in full report
                                </li>
                            )}
                        </ol>
                    </div>
                )}
                {Array.isArray(r.repurposedAds) && r.repurposedAds.length > 0 && (
                    <p className={ui.subtle} style={{ margin: 0 }}>
                        {r.repurposedAds.length} ready-to-use ad drafts included in full report
                    </p>
                )}
            </div>
        );
    }

    function renderProvenance() {
        if (!scanMeta) return null;

        if (scanMeta.source === "meta-live") {
            return (
                <div className={`${ui.notice} ${ui.noticeVerified}`}>
                    <span className={ui.noticeIcon}>✓</span>
                    <div>
                        <strong>Verified Meta Library Data</strong> · {scanMeta.liveCount} ads fetched · Query &quot;{scanMeta.query}&quot; · {scanMeta.country} · {new Date(scanMeta.fetchedAt).toLocaleString("en-GB")}
                    </div>
                </div>
            );
        }

        if (scanMeta.source === "meta-live-empty") {
            return (
                <div className={`${ui.notice} ${ui.noticeEmpty}`}>
                    <span className={ui.noticeIcon}>i</span>
                    <div>
                        <strong>No live results</strong> came back from Meta for this query/country. Try broader keywords or another country. No mock fallback was used.
                    </div>
                </div>
            );
        }

        if (scanMeta.source === "demo-mock") {
            return (
                <div className={`${ui.notice} ${ui.noticeDemo}`}>
                    <span className={ui.noticeIcon}>!</span>
                    <div>
                        <strong>Demo data</strong> only ({scanMeta.mockCount} ads). Add a Meta token in Settings for live verified ads.
                    </div>
                </div>
            );
        }

        return (
            <div className={`${ui.notice} ${ui.noticeError}`}>
                <span className={ui.noticeIcon}>!</span>
                <div>
                    <strong>Meta fetch error</strong>: {scanMeta.error || "Unable to fetch"}. No mock fallback was used.
                </div>
            </div>
        );
    }

    return (
        <>
            {globalMsg && <p className={ui.error}>{globalMsg}</p>}

            <section className={ui.card}>
                <div className={ui.pageIntro}>
                    <div>
                        <p className={ui.sidebarEyebrow}>Competitive Intelligence</p>
                        <h2>Ad Scanner</h2>
                        <p className={ui.subtle}>Ads sorted longest to shortest running · {industry} · {TIER_LABELS[profile.tier]} tier</p>
                    </div>
                    <p className={ui.subtle}>{weeklyLimit - (profile.searches_used_this_week || 0)} searches remaining · resets {formatReset(profile.week_reset_at)}</p>
                </div>

                {renderProvenance()}

                <div className={ui.scannerBar}>
                    <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Enter niche or keyword — e.g. Wedding Videography, Travel Packages, Solar..." />
                    <select
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                        style={{
                            background: "rgba(255,255,255,0.06)",
                            border: "1px solid rgba(229,191,68,0.45)",
                            borderRadius: 10,
                            color: "#fff",
                            fontSize: "0.92rem",
                            padding: "0.55rem 0.85rem",
                            outline: "none",
                            cursor: "pointer",
                            fontFamily: "var(--font-sans)",
                            appearance: "none",
                            WebkitAppearance: "none",
                            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23e5bf44' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
                            backgroundRepeat: "no-repeat",
                            backgroundPosition: "right 0.7rem center",
                            paddingRight: "2rem",
                        }}
                    >
                        {COUNTRY_OPTIONS.map(([value, label]) => (
                            <option key={value} value={value} style={{ background: "#1a1a1a", color: "#fff" }}>{label}</option>
                        ))}
                    </select>
                    <button type="button" onClick={runScan} disabled={scanLoading}>{scanLoading ? "Scanning..." : "Scan Ads"}</button>
                </div>
                <p className={ui.subtle}>Searches are counted server-side and stored against your weekly allowance.</p>
            </section>


            <section className={ui.card}>
                <div className={ui.tableHeader}>
                    <div>
                        <h2>Ad Results</h2>
                        <p className={ui.subtle}>{filteredAds.length} ads · sorted by longest running</p>
                    </div>
                    <div className={ui.filterBar}>
                        <div className={ui.filterGroup}>
                            {formats.map((format) => (
                                <button
                                    key={format}
                                    type="button"
                                    className={`${ui.filterPill} ${filterFormat === format ? ui.filterPillActive : ""}`.trim()}
                                    onClick={() => setFilterFormat(format)}
                                >
                                    {format}
                                </button>
                            ))}
                        </div>
                        <div className={ui.filterGroup}>
                            {PLATFORM_FILTERS.map((platform) => (
                                <button
                                    key={platform}
                                    type="button"
                                    className={`${ui.filterPill} ${filterPlatform === platform ? ui.filterPillActive : ""}`.trim()}
                                    onClick={() => setFilterPlatform(platform)}
                                >
                                    {platform}
                                </button>
                            ))}
                        </div>
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                            style={{
                                background: "rgba(255,255,255,0.06)",
                                border: "1px solid rgba(229,191,68,0.4)",
                                borderRadius: 8,
                                color: "#fff",
                                fontSize: "0.82rem",
                                padding: "0.4rem 1.8rem 0.4rem 0.7rem",
                                outline: "none",
                                cursor: "pointer",
                                fontFamily: "var(--font-sans)",
                                appearance: "none",
                                WebkitAppearance: "none",
                                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%23e5bf44' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
                                backgroundRepeat: "no-repeat",
                                backgroundPosition: "right 0.55rem center",
                            }}
                        >
                            <option value="days-desc" style={{ background: "#1a1a1a" }}>Longest running</option>
                            <option value="days-asc" style={{ background: "#1a1a1a" }}>Newest first</option>
                            <option value="page-asc" style={{ background: "#1a1a1a" }}>Advertiser A-Z</option>
                            <option value="source" style={{ background: "#1a1a1a" }}>Source</option>
                        </select>
                    </div>
                </div>

                {!filteredAds.length && !scanLoading && (
                    <div className={ui.emptyState}>
                        <div className={ui.emptyGlyph}>⌕</div>
                        <div>
                            <strong>Enter a niche to begin scanning</strong>
                            <p className={ui.subtle}>Try &quot;wedding videography&quot;, &quot;solar panels&quot;, or &quot;travel packages&quot;.</p>
                        </div>
                    </div>
                )}

                {filteredAds.length > 0 && (
                <div className={ui.tableWrap}>
                    <table className={ui.adTable}>
                        <thead>
                            <tr>
                                <th>
                                    <button type="button" className={ui.inlineActionGhost} onClick={toggleFilteredSelection}>
                                        {allFilteredSelected ? "Clear" : "Select"}
                                    </button>
                                </th>
                                <th>Advertiser</th>
                                <th>Headline</th>
                                <th>Copy Preview</th>
                                <th>Hook</th>
                                <th>Format</th>
                                <th>Days</th>
                                <th>Source</th>
                                <th>Preview</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredAds.map((ad) => {
                                const winning = isWinning(ad, thresholdDays);
                                const rowClassName = [
                                    ui.adRow,
                                    selected[ad.id] ? ui.adRowSelected : "",
                                    winning ? ui.adRowWinning : "",
                                ].filter(Boolean).join(" ");

                                return (
                                    <tr key={ad.id} className={rowClassName}>
                                        <td>
                                            <button
                                                type="button"
                                                className={`${ui.checkboxBox} ${selected[ad.id] ? ui.checkboxBoxChecked : ""}`.trim()}
                                                onClick={() => {
                                                    if (!selected[ad.id] && selectedCount >= MAX_SELECTION) {
                                                        setGlobalMsg(`Max ${MAX_SELECTION} ads per report. Deselect one first.`);
                                                        return;
                                                    }
                                                    setGlobalMsg("");
                                                    setSelected((s) => ({ ...s, [ad.id]: !s[ad.id] }));
                                                }}
                                                aria-pressed={!!selected[ad.id]}
                                            >
                                                {selected[ad.id] ? "✓" : ""}
                                            </button>
                                        </td>
                                        <td>
                                            <div className={ui.rowTitle}>{ad.page}</div>
                                            <div className={ui.rowMeta}>{ad.id.slice(0, 20)}</div>
                                            {winning && <span className={ui.winningPill}>{thresholdDays}+ days</span>}
                                        </td>
                                        <td>{ad.headline}</td>
                                        <td>
                                            <div className={ui.copyPreview}>{ad.body}</div>
                                        </td>
                                        <td><span className={ui.badge}>{ad.hook}</span></td>
                                        <td><span className={ui.badge}>{ad.format}</span></td>
                                        <td>
                                            <span className={`${ui.dayPill} ${winning ? ui.dayStrong : ad.days >= Math.floor(thresholdDays * 0.6) ? ui.dayMid : ui.dayLow}`.trim()}>
                                                {ad.days}d
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`${ui.sourcePill} ${ad.source === "META_LIBRARY" ? ui.sourceMeta : ui.sourceDemo}`.trim()}>
                                                {ad.source === "META_LIBRARY" ? "Meta" : "Demo"}
                                            </span>
                                        </td>
                                        <td>
                                            {ad.snapshotUrl ? (
                                                <a href={ad.snapshotUrl} target="_blank" rel="noreferrer" className={ui.previewButton}>
                                                    View →
                                                </a>
                                            ) : "—"}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                )}
            </section>

            <section className={ui.grid2}>
                <article className={ui.card}>
                    <h2>Latest Report Preview</h2>
                    {renderReportPreview(analysis)}
                    {lastReportId && (
                        <Link href={`/dashboard/reports/${lastReportId}`} className={ui.inlineActionGold} style={{ marginTop: "0.75rem" }}>
                            Open Full Report →
                        </Link>
                    )}
                </article>
                <article className={ui.card}>
                    <h2>Recent Reports</h2>
                    <div className={ui.reportList}>
                        {reports.slice(0, 5).map((r) => (
                            <div key={r.id} className={ui.reportItem}>
                                <Link href={`/dashboard/reports/${r.id}`} className={ui.inlineLink}>
                                    {r.report_type.toUpperCase()} report
                                </Link>
                                <span className={ui.subtle}>{new Date(r.created_at).toLocaleString()}</span>
                            </div>
                        ))}
                        {!reports.length && <p className={ui.subtle}>No reports yet.</p>}
                    </div>
                </article>
            </section>

            {/* Report PDF Modal */}
            {reportModal && (
                <ReportModal report={reportModal as ReportModalData} onClose={() => setReportModal(null)} />
            )}

            {selectedCount > 0 && (
                <section className={ui.dockBar}>
                    <div className={ui.dockMeta}>
                        <strong>{selectedCount}</strong>/{MAX_SELECTION} ads selected · {reportOptions.find((option) => option.value === reportType)?.label || reportType}
                    </div>
                    <input
                        className={ui.dockInput}
                        value={clientBusiness}
                        onChange={(e) => setClientBusiness(e.target.value)}
                        placeholder="Client business name"
                    />
                    <select value={reportType} onChange={(e) => setReportType(e.target.value as ReportType)} className={ui.dockSelect}>
                        {reportOptions.map((option) => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                    </select>
                    <button type="button" onClick={runAnalysis} disabled={analyzeLoading}>
                        {analyzeLoading ? "Generating..." : "Generate Report"}
                    </button>
                </section>
            )}

        </>
    );
}
