"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import ui from "@/app/app-ui.module.css";
import { REPORT_TYPE_OPTIONS, TIER_LABELS, WEEKLY_SEARCH_LIMITS } from "@/lib/account";
import type { AdRecord, ReportHistoryRow, ReportType, ScanMeta } from "@/lib/types";

import { useDashboard } from "../dashboard-context";

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
    const [previewAd, setPreviewAd] = useState<AdRecord | null>(null);
    const [globalMsg, setGlobalMsg] = useState("");

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
            setPreviewAd(null);

            const next: Record<string, boolean> = {};
            for (const ad of data.ads || []) next[ad.id] = true;
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
            setLastReportId(data.report_id || "");
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
        const nextValue = !allFilteredSelected;
        setSelected((current) => {
            const next = { ...current };
            for (const ad of filteredAds) next[ad.id] = nextValue;
            return next;
        });
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
                        <p className={ui.subtle}>Winning = {thresholdDays}+ days running · {industry} · {TIER_LABELS[profile.tier]} tier</p>
                    </div>
                    <p className={ui.subtle}>{weeklyLimit - (profile.searches_used_this_week || 0)} searches remaining · resets {formatReset(profile.week_reset_at)}</p>
                </div>

                {renderProvenance()}

                <div className={ui.scannerBar}>
                    <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Enter niche or keyword — e.g. Wedding Videography, Travel Packages, Solar..." />
                    <select value={country} onChange={(e) => setCountry(e.target.value)}>
                        {COUNTRY_OPTIONS.map(([value, label]) => (
                            <option key={value} value={value}>{label}</option>
                        ))}
                    </select>
                    <button type="button" onClick={runScan} disabled={scanLoading}>{scanLoading ? "Scanning..." : "Scan Ads"}</button>
                </div>
                <p className={ui.subtle}>Searches are counted server-side and stored against your weekly allowance.</p>
            </section>

            <section className={ui.grid2}>
                <article className={ui.card}>
                    <div className={ui.formCol}>
                        <input value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder="Industry" />
                        <input
                            type="number"
                            min={1}
                            value={thresholdDays}
                            onChange={(e) => setThresholdDays(Number(e.target.value) || 90)}
                            placeholder="Winning threshold days"
                        />
                    </div>
                </article>
                <article className={ui.card}>
                    <div className={ui.formCol}>
                        <label>
                            <span className={ui.subtle}>Report type</span>
                            <select value={reportType} onChange={(e) => setReportType(e.target.value as ReportType)}>
                                {reportOptions.map((option) => (
                                    <option key={option.value} value={option.value}>{option.label}</option>
                                ))}
                            </select>
                        </label>
                        <p className={ui.subtle}>
                            Free users can generate basic reports only. Full Analysis and Strategy unlock on Pro and Client tiers.
                        </p>
                    </div>
                </article>
            </section>

            <section className={ui.card}>
                <div className={ui.tableHeader}>
                    <div>
                        <h2>Ad Results</h2>
                        <p className={ui.subtle}>{filteredAds.length} results · {winningCount} winning</p>
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
                        <select value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)} className={ui.sortSelect}>
                            <option value="days-desc">Longest running</option>
                            <option value="days-asc">Newest first</option>
                            <option value="page-asc">Advertiser A-Z</option>
                            <option value="source">Source</option>
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
                                                onClick={() => setSelected((s) => ({ ...s, [ad.id]: !s[ad.id] }))}
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
                                                <button type="button" className={ui.previewButton} onClick={() => setPreviewAd(ad)}>
                                                    Watch/Verify
                                                </button>
                                            ) : "—"}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
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

            {selectedCount > 0 && (
                <section className={ui.dockBar}>
                    <div className={ui.dockMeta}>
                        <strong>{selectedCount}</strong> ads selected · {reportOptions.find((option) => option.value === reportType)?.label || reportType}
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

            {previewAd && (
                <div className={ui.modalOverlay}>
                    <div className={ui.previewShell}>
                        <div className={ui.previewHead}>
                            <div>
                                <div className={ui.previewTitle}>Live Ad Preview · {previewAd.page}</div>
                                <div className={ui.previewSub}>Pulled from Facebook Ads Library snapshot URL</div>
                            </div>
                            <div className={ui.previewActions}>
                                <button type="button" className={ui.inlineActionGold} onClick={() => window.open(previewAd.snapshotUrl, "_blank", "noopener,noreferrer")}>
                                    Open Video Window
                                </button>
                                <a href={previewAd.snapshotUrl} target="_blank" rel="noreferrer" className={ui.inlineActionGold}>
                                    Open In Meta Library
                                </a>
                                <button type="button" className={ui.inlineActionGhost} onClick={() => setPreviewAd(null)}>
                                    Close
                                </button>
                            </div>
                        </div>

                        <iframe
                            className={ui.previewFrame}
                            src={previewAd.snapshotUrl}
                            allow="autoplay; encrypted-media; picture-in-picture; clipboard-write"
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                            title={`Preview of ${previewAd.page}`}
                        />

                        <div className={ui.verifyCard}>
                            <div className={ui.rowMeta}>Source Verification</div>
                            <div>Source: <strong>{previewAd.source === "META_LIBRARY" ? "Meta Ads Library" : "Demo Data"}</strong></div>
                            <div>Ad ID: <strong>{previewAd.id}</strong></div>
                            <div>Fetched: <strong>{new Date(previewAd.fetchedAt).toLocaleString("en-GB")}</strong></div>
                        </div>

                        <p className={ui.previewSub}>
                            Facebook sometimes blocks in-app iframe playback. Use <strong>Open Video Window</strong> for the most reliable playback, then keep this app open beside it for analysis.
                        </p>
                    </div>
                </div>
            )}
        </>
    );
}
