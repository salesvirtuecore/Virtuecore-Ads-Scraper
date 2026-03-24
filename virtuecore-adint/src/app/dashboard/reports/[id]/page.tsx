"use client";

import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import ui from "@/app/app-ui.module.css";

type WinningAd = {
    page?: string;
    days?: number;
    hook?: string;
    headline?: string;
    angle?: string;
    offer?: string;
    copyLength?: string;
    targeting?: string;
    whyWorking?: string;
};

type HookPattern = {
    type?: string;
    frequency?: string;
    description?: string;
};

type RepurposedAd = {
    hookType?: string;
    headline?: string;
    hook?: string;
    body?: string;
    cta?: string;
};

type ReportContent = {
    landscape?: string;
    winningAds?: WinningAd[];
    hookPatterns?: HookPattern[];
    offerPatterns?: string;
    copyInsights?: string;
    targetingInsights?: string;
    creativeFormats?: string;
    repurposedAds?: RepurposedAd[];
    recommendations?: string[];
    opportunityGap?: string;
    raw?: string;
};

type ReportItem = {
    id: string;
    report_type: "basic" | "full" | "strategy";
    content: unknown;
    raw_content: string | null;
    industry: string | null;
    threshold_days: number | null;
    ads_analyzed: number;
    client_business: string | null;
    scan_query: string | null;
    created_at: string;
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div style={{ marginBottom: "1.5rem" }}>
            <p className={ui.sidebarEyebrow} style={{ marginBottom: "0.4rem" }}>{title}</p>
            {children}
        </div>
    );
}

function prose(text: string) {
    return <p style={{ color: "rgba(255,255,255,0.88)", lineHeight: 1.65, margin: 0 }}>{text}</p>;
}

function renderFormatted(c: ReportContent) {
    return (
        <div style={{ display: "grid", gap: "1.5rem" }}>
            {c.landscape && (
                <Section title="Market Landscape">{prose(c.landscape)}</Section>
            )}

            {c.opportunityGap && (
                <Section title="Opportunity Gap">
                    <div style={{ background: "rgba(229,191,68,0.08)", border: "1px solid rgba(229,191,68,0.22)", borderRadius: 10, padding: "0.75rem 1rem" }}>
                        {prose(c.opportunityGap)}
                    </div>
                </Section>
            )}

            {Array.isArray(c.winningAds) && c.winningAds.length > 0 && (
                <Section title={`Winning Ads (${c.winningAds.length})`}>
                    <div style={{ display: "grid", gap: "0.75rem" }}>
                        {c.winningAds.map((ad, i) => (
                            <div key={i} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: "0.75rem 1rem", display: "grid", gap: "0.25rem" }}>
                                <strong style={{ color: "rgba(255,255,255,0.95)" }}>{ad.page} · {ad.days}d · {ad.hook}</strong>
                                {ad.headline && <p style={{ color: "rgba(229,191,68,0.9)", margin: 0, fontStyle: "italic" }}>&ldquo;{ad.headline}&rdquo;</p>}
                                {ad.angle && <p className={ui.subtle} style={{ margin: 0 }}>Angle: {ad.angle}</p>}
                                {ad.offer && <p className={ui.subtle} style={{ margin: 0 }}>Offer: {ad.offer}</p>}
                                {ad.whyWorking && <p className={ui.subtle} style={{ margin: 0 }}>Why it works: {ad.whyWorking}</p>}
                            </div>
                        ))}
                    </div>
                </Section>
            )}

            {Array.isArray(c.hookPatterns) && c.hookPatterns.length > 0 && (
                <Section title="Hook Patterns">
                    <div style={{ display: "grid", gap: "0.5rem" }}>
                        {c.hookPatterns.map((h, i) => (
                            <div key={i} style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
                                <span className={ui.badge}>{h.type}</span>
                                <span className={ui.subtle}>{h.frequency} · {h.description}</span>
                            </div>
                        ))}
                    </div>
                </Section>
            )}

            {c.offerPatterns && (
                <Section title="Offer Patterns">{prose(c.offerPatterns)}</Section>
            )}

            {c.copyInsights && (
                <Section title="Copy Insights">{prose(c.copyInsights)}</Section>
            )}

            {c.targetingInsights && (
                <Section title="Targeting Insights">{prose(c.targetingInsights)}</Section>
            )}

            {c.creativeFormats && (
                <Section title="Creative Formats">{prose(c.creativeFormats)}</Section>
            )}

            {Array.isArray(c.recommendations) && c.recommendations.length > 0 && (
                <Section title="Recommendations">
                    <ol style={{ paddingLeft: "1.25rem", display: "grid", gap: "0.4rem", margin: 0 }}>
                        {c.recommendations.map((rec, i) => (
                            <li key={i} style={{ color: "rgba(255,255,255,0.85)", lineHeight: 1.55 }}>{rec}</li>
                        ))}
                    </ol>
                </Section>
            )}

            {Array.isArray(c.repurposedAds) && c.repurposedAds.length > 0 && (
                <Section title={`Ready-to-Use Ad Drafts (${c.repurposedAds.length})`}>
                    <div style={{ display: "grid", gap: "0.75rem" }}>
                        {c.repurposedAds.map((ad, i) => (
                            <div key={i} style={{ background: "rgba(229,191,68,0.06)", border: "1px solid rgba(229,191,68,0.18)", borderRadius: 8, padding: "0.75rem 1rem", display: "grid", gap: "0.25rem" }}>
                                <strong style={{ color: "rgba(229,191,68,0.9)" }}>{ad.hookType} · {ad.headline}</strong>
                                {ad.hook && <p style={{ color: "rgba(255,255,255,0.9)", margin: 0, fontStyle: "italic" }}>{ad.hook}</p>}
                                {ad.body && <p className={ui.subtle} style={{ margin: 0 }}>{ad.body}</p>}
                                {ad.cta && <span className={ui.badge}>CTA: {ad.cta}</span>}
                            </div>
                        ))}
                    </div>
                </Section>
            )}
        </div>
    );
}

export default function IndividualReportPage() {
    const params = useParams<{ id: string }>();
    const reportId = useMemo(() => String(params?.id || ""), [params]);

    const [report, setReport] = useState<ReportItem | null>(null);
    const [view, setView] = useState<"formatted" | "raw">("formatted");
    const [error, setError] = useState("");

    useEffect(() => {
        async function loadReport() {
            if (!reportId) return;
            setError("");

            const res = await fetch(`/api/reports/${reportId}`, { cache: "no-store" });
            const data = await res.json().catch(() => null);
            if (!res.ok || !data?.report) {
                setError(data?.error || "Unable to load report.");
                return;
            }
            setReport(data.report as ReportItem);
        }

        void loadReport();
    }, [reportId]);

    const content = report?.content as ReportContent | null;
    const isStructured = content && typeof content === "object" && !Array.isArray(content) && !("raw" in content && Object.keys(content).length === 1);

    return (
        <section className={ui.card}>
            {error && <p className={ui.error}>{error}</p>}
            {!report && !error && <p className={ui.subtle}>Loading report...</p>}

            {report && (
                <>
                    <div className={ui.pageIntro}>
                        <div>
                            <p className={ui.sidebarEyebrow}>{report.report_type.toUpperCase()} Report</p>
                            <h2>{report.client_business || report.industry || "Competitive Intelligence"}</h2>
                            <p className={ui.subtle}>
                                {report.industry} · {report.ads_analyzed} ads analysed
                                {report.threshold_days ? ` · ${report.threshold_days}d winning threshold` : ""}
                                {report.scan_query ? ` · "${report.scan_query}"` : ""}
                            </p>
                        </div>
                        <p className={ui.subtle}>{new Date(report.created_at).toLocaleString("en-GB")}</p>
                    </div>

                    <div className={ui.filterGroup} style={{ marginBottom: "1.25rem" }}>
                        {isStructured && (
                            <button
                                type="button"
                                className={`${ui.filterPill} ${view === "formatted" ? ui.filterPillActive : ""}`.trim()}
                                onClick={() => setView("formatted")}
                            >
                                Formatted
                            </button>
                        )}
                        <button
                            type="button"
                            className={`${ui.filterPill} ${view === "raw" ? ui.filterPillActive : ""}`.trim()}
                            onClick={() => setView("raw")}
                        >
                            Raw JSON
                        </button>
                        <button
                            type="button"
                            className={ui.filterPill}
                            onClick={() => window.print()}
                        >
                            Export PDF
                        </button>
                    </div>

                    {view === "formatted" && isStructured
                        ? renderFormatted(content as ReportContent)
                        : (
                            <pre className={ui.pre}>
                                {view === "raw" && report.raw_content
                                    ? report.raw_content
                                    : JSON.stringify(report.content, null, 2)}
                            </pre>
                        )}
                </>
            )}
        </section>
    );
}
