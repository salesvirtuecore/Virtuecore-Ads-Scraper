"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";

import ui from "@/app/app-ui.module.css";
import { useDashboard } from "@/app/dashboard/dashboard-context";

type FunnelAnalysis = {
    pageTitle: string;
    targetAudience: string;
    coreOffer: string;
    headline: string;
    subheadline: string;
    painPoints: string[];
    desireOutcomes: string[];
    socialProof: string[];
    cta: string;
    ctaPlacement: string;
    urgencyTactics: string[];
    objectionHandlers: string[];
    pricingMentioned: string;
    funnelType: string;
    copyTone: string;
    swipeableHooks: string[];
    strengths: string[];
    gaps: string[];
    recommendation: string;
};

type FunnelResult = {
    analysis: FunnelAnalysis;
    url: string;
    scrapedAt: string;
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div style={{ marginBottom: "1.5rem" }}>
            <h3 style={{
                fontSize: "0.72rem",
                fontWeight: 700,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                color: "rgba(229,191,68,0.7)",
                margin: "0 0 0.75rem",
            }}>{title}</h3>
            {children}
        </div>
    );
}

function Tag({ text }: { text: string }) {
    return (
        <span style={{
            display: "inline-block",
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "8px",
            padding: "0.3rem 0.65rem",
            fontSize: "0.85rem",
            color: "rgba(255,255,255,0.8)",
            margin: "0.2rem",
        }}>{text}</span>
    );
}

function ListTags({ items }: { items: string[] }) {
    if (!items?.length) return <span style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.85rem" }}>None identified</span>;
    return <div>{items.map((item, i) => <Tag key={i} text={item} />)}</div>;
}

export default function FunnelPage() {
    const { profile } = useDashboard();
    const [url, setUrl] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [result, setResult] = useState<FunnelResult | null>(null);

    const isUltimate = profile?.tier === "ultimate" || profile?.tier === "client";

    async function analyse(e: FormEvent) {
        e.preventDefault();
        setError("");
        setResult(null);
        setLoading(true);

        try {
            const res = await fetch("/api/funnel", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url }),
            });
            const data = await res.json() as { error?: string; analysis?: FunnelAnalysis; url?: string; scrapedAt?: string };
            if (!res.ok || data.error) {
                setError(data.error ?? "Something went wrong.");
            } else {
                setResult({ analysis: data.analysis!, url: data.url!, scrapedAt: data.scrapedAt! });
            }
        } catch {
            setError("Network error. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    if (!isUltimate) {
        return (
            <div style={{ maxWidth: 560, margin: "4rem auto", textAlign: "center", padding: "0 1rem" }}>
                <div style={{
                    background: "rgba(255,255,255,0.025)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: "20px",
                    padding: "3rem 2.5rem",
                }}>
                    <div style={{
                        width: 52,
                        height: 52,
                        borderRadius: "14px",
                        background: "rgba(229,191,68,0.1)",
                        border: "1px solid rgba(229,191,68,0.25)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "1.5rem",
                        margin: "0 auto 1.5rem",
                    }}>🔍</div>
                    <h2 style={{
                        fontFamily: "var(--font-display)",
                        fontSize: "1.6rem",
                        fontWeight: 700,
                        margin: "0 0 0.75rem",
                        letterSpacing: "-0.01em",
                    }}>Funnel Analyser</h2>
                    <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.95rem", lineHeight: 1.6, margin: "0 0 2rem" }}>
                        Paste any competitor&apos;s landing page URL and get a full AI breakdown — headline, hooks, CTAs, pain points, strengths, and gaps. Available on the <strong style={{ color: "rgba(229,191,68,0.85)" }}>Ultimate plan</strong>.
                    </p>
                    <Link href="/dashboard/upgrade" className={ui.inlineActionGold} style={{ display: "inline-block" }}>
                        Upgrade to Ultimate — £197/mo
                    </Link>
                </div>
            </div>
        );
    }

    const a = result?.analysis;

    return (
        <>
            <style>{`
                @keyframes fadeUp {
                    from { opacity: 0; transform: translateY(16px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                .funnel-input {
                    flex: 1;
                    background: rgba(255,255,255,0.04);
                    border: 1px solid rgba(255,255,255,0.12);
                    border-radius: 12px;
                    padding: 0.8rem 1rem;
                    color: #fff;
                    font-size: 0.95rem;
                    outline: none;
                    transition: border-color 0.18s, box-shadow 0.18s;
                    min-width: 0;
                }
                .funnel-input::placeholder { color: rgba(255,255,255,0.25); }
                .funnel-input:focus {
                    border-color: rgba(229,191,68,0.55);
                    box-shadow: 0 0 0 3px rgba(229,191,68,0.1);
                }
                .funnel-btn {
                    background: linear-gradient(120deg,#f0cb54,#cc9519);
                    color: #1e1703;
                    border: none;
                    border-radius: 12px;
                    padding: 0.8rem 1.5rem;
                    font-weight: 700;
                    font-size: 0.95rem;
                    cursor: pointer;
                    white-space: nowrap;
                    transition: opacity 0.15s, transform 0.15s;
                }
                .funnel-btn:hover:not(:disabled) { opacity: 0.9; transform: translateY(-1px); }
                .funnel-btn:disabled { opacity: 0.5; cursor: not-allowed; }
            `}</style>

            <div style={{ maxWidth: 860, margin: "0 auto", padding: "0 0.5rem" }}>
                {/* Header */}
                <div style={{ marginBottom: "2rem", animation: "fadeUp 0.4s ease both" }}>
                    <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.6rem", fontWeight: 700, margin: "0 0 0.4rem", letterSpacing: "-0.01em" }}>
                        Funnel Analyser
                    </h2>
                    <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.9rem", margin: 0 }}>
                        Paste a competitor&apos;s landing page URL to get a full funnel intelligence report.
                    </p>
                </div>

                {/* URL input */}
                <form onSubmit={analyse} style={{ display: "flex", gap: "0.75rem", marginBottom: "2rem", animation: "fadeUp 0.4s ease both", animationDelay: "0.05s" }}>
                    <input
                        className="funnel-input"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        type="url"
                        placeholder="https://competitor.com/landing-page"
                        required
                    />
                    <button type="submit" className="funnel-btn" disabled={loading}>
                        {loading ? "Analysing…" : "Analyse →"}
                    </button>
                </form>

                {loading && (
                    <div style={{
                        background: "rgba(255,255,255,0.02)",
                        border: "1px solid rgba(255,255,255,0.07)",
                        borderRadius: "16px",
                        padding: "2.5rem",
                        textAlign: "center",
                        animation: "fadeUp 0.4s ease both",
                    }}>
                        <p style={{ color: "rgba(255,255,255,0.4)", margin: 0, fontSize: "0.9rem" }}>
                            Scraping page and running AI analysis… this takes 15–30 seconds.
                        </p>
                    </div>
                )}

                {error && (
                    <p style={{
                        padding: "0.65rem 0.85rem",
                        background: "rgba(239,68,68,0.08)",
                        border: "1px solid rgba(239,68,68,0.2)",
                        borderRadius: "10px",
                        color: "#f87171",
                        fontSize: "0.88rem",
                        margin: "0 0 1.5rem",
                    }}>{error}</p>
                )}

                {a && (
                    <div style={{ animation: "fadeUp 0.45s ease both" }}>
                        {/* Summary card */}
                        <div style={{
                            background: "rgba(229,191,68,0.04)",
                            border: "1px solid rgba(229,191,68,0.18)",
                            borderRadius: "18px",
                            padding: "1.75rem",
                            marginBottom: "1.25rem",
                        }}>
                            <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "flex-start", marginBottom: "1.25rem" }}>
                                <div style={{ flex: 1, minWidth: 200 }}>
                                    <p style={{ color: "rgba(229,191,68,0.7)", fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", margin: "0 0 0.3rem" }}>Page</p>
                                    <p style={{ margin: 0, fontWeight: 600, fontSize: "1.05rem" }}>{a.pageTitle}</p>
                                </div>
                                <div style={{ flex: 1, minWidth: 200 }}>
                                    <p style={{ color: "rgba(229,191,68,0.7)", fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", margin: "0 0 0.3rem" }}>Funnel Type</p>
                                    <p style={{ margin: 0, fontSize: "0.95rem", color: "rgba(255,255,255,0.75)" }}>{a.funnelType}</p>
                                </div>
                                <div style={{ flex: 1, minWidth: 200 }}>
                                    <p style={{ color: "rgba(229,191,68,0.7)", fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", margin: "0 0 0.3rem" }}>Target Audience</p>
                                    <p style={{ margin: 0, fontSize: "0.95rem", color: "rgba(255,255,255,0.75)" }}>{a.targetAudience}</p>
                                </div>
                                <div style={{ flex: 1, minWidth: 200 }}>
                                    <p style={{ color: "rgba(229,191,68,0.7)", fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", margin: "0 0 0.3rem" }}>Copy Tone</p>
                                    <p style={{ margin: 0, fontSize: "0.95rem", color: "rgba(255,255,255,0.75)" }}>{a.copyTone}</p>
                                </div>
                            </div>

                            <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "1.25rem" }}>
                                <p style={{ color: "rgba(229,191,68,0.7)", fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", margin: "0 0 0.5rem" }}>Core Offer</p>
                                <p style={{ margin: 0, fontSize: "0.97rem", lineHeight: 1.6, color: "rgba(255,255,255,0.85)" }}>{a.coreOffer}</p>
                            </div>
                        </div>

                        {/* Copy */}
                        <div style={{
                            background: "rgba(255,255,255,0.025)",
                            border: "1px solid rgba(255,255,255,0.07)",
                            borderRadius: "18px",
                            padding: "1.75rem",
                            marginBottom: "1.25rem",
                        }}>
                            <Section title="Hero Headline">
                                <p style={{ margin: 0, fontSize: "1.05rem", fontStyle: "italic", color: "rgba(255,255,255,0.85)", lineHeight: 1.5 }}>&ldquo;{a.headline}&rdquo;</p>
                            </Section>
                            {a.subheadline && (
                                <Section title="Sub-Headline">
                                    <p style={{ margin: 0, fontSize: "0.93rem", color: "rgba(255,255,255,0.6)", lineHeight: 1.5 }}>{a.subheadline}</p>
                                </Section>
                            )}
                            <Section title="Primary CTA">
                                <p style={{ margin: 0 }}>
                                    <span style={{ background: "rgba(229,191,68,0.12)", border: "1px solid rgba(229,191,68,0.3)", borderRadius: "8px", padding: "0.3rem 0.75rem", fontSize: "0.9rem", color: "#e5bf44", fontWeight: 600 }}>{a.cta}</span>
                                    <span style={{ color: "rgba(255,255,255,0.35)", fontSize: "0.82rem", marginLeft: "0.75rem" }}>Placement: {a.ctaPlacement}</span>
                                </p>
                            </Section>
                            <div style={{ margin: 0 }}>
                                <Section title="Pricing">
                                    <p style={{ margin: 0, fontSize: "0.9rem", color: "rgba(255,255,255,0.65)" }}>{a.pricingMentioned}</p>
                                </Section>
                            </div>
                        </div>

                        {/* Pain / Desire / Social proof */}
                        <div style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                            gap: "1rem",
                            marginBottom: "1.25rem",
                        }}>
                            <div style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "16px", padding: "1.25rem" }}>
                                <Section title="Pain Points"><ListTags items={a.painPoints} /></Section>
                            </div>
                            <div style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "16px", padding: "1.25rem" }}>
                                <Section title="Desired Outcomes"><ListTags items={a.desireOutcomes} /></Section>
                            </div>
                            <div style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "16px", padding: "1.25rem" }}>
                                <Section title="Social Proof"><ListTags items={a.socialProof} /></Section>
                            </div>
                        </div>

                        {/* Urgency / Objections */}
                        <div style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                            gap: "1rem",
                            marginBottom: "1.25rem",
                        }}>
                            <div style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "16px", padding: "1.25rem" }}>
                                <Section title="Urgency & FOMO Tactics"><ListTags items={a.urgencyTactics} /></Section>
                            </div>
                            <div style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "16px", padding: "1.25rem" }}>
                                <Section title="Objection Handlers"><ListTags items={a.objectionHandlers} /></Section>
                            </div>
                        </div>

                        {/* Swipeable hooks */}
                        <div style={{
                            background: "rgba(255,255,255,0.025)",
                            border: "1px solid rgba(255,255,255,0.07)",
                            borderRadius: "18px",
                            padding: "1.75rem",
                            marginBottom: "1.25rem",
                        }}>
                            <Section title="Swipeable Hooks for Your Ads">
                                <div style={{ display: "grid", gap: "0.75rem" }}>
                                    {(a.swipeableHooks ?? []).map((hook, i) => (
                                        <div key={i} style={{
                                            display: "flex",
                                            gap: "0.85rem",
                                            alignItems: "flex-start",
                                            padding: "0.85rem 1rem",
                                            background: "rgba(229,191,68,0.04)",
                                            border: "1px solid rgba(229,191,68,0.12)",
                                            borderRadius: "12px",
                                        }}>
                                            <span style={{ color: "rgba(229,191,68,0.6)", fontWeight: 700, fontSize: "0.8rem", flexShrink: 0, paddingTop: "0.05rem" }}>0{i + 1}</span>
                                            <p style={{ margin: 0, fontSize: "0.92rem", color: "rgba(255,255,255,0.8)", lineHeight: 1.55 }}>{hook}</p>
                                        </div>
                                    ))}
                                </div>
                            </Section>
                        </div>

                        {/* Strengths / Gaps */}
                        <div style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr",
                            gap: "1rem",
                            marginBottom: "1.25rem",
                        }}>
                            <div style={{ background: "rgba(34,197,94,0.04)", border: "1px solid rgba(34,197,94,0.15)", borderRadius: "16px", padding: "1.25rem" }}>
                                <Section title="Strengths">
                                    <div style={{ display: "grid", gap: "0.5rem" }}>
                                        {(a.strengths ?? []).map((s, i) => (
                                            <div key={i} style={{ display: "flex", gap: "0.65rem", alignItems: "flex-start" }}>
                                                <span style={{ color: "#4ade80", fontSize: "0.8rem", flexShrink: 0, paddingTop: "0.1rem" }}>✓</span>
                                                <p style={{ margin: 0, fontSize: "0.88rem", color: "rgba(255,255,255,0.75)", lineHeight: 1.5 }}>{s}</p>
                                            </div>
                                        ))}
                                    </div>
                                </Section>
                            </div>
                            <div style={{ background: "rgba(239,68,68,0.04)", border: "1px solid rgba(239,68,68,0.15)", borderRadius: "16px", padding: "1.25rem" }}>
                                <Section title="Gaps & Weaknesses">
                                    <div style={{ display: "grid", gap: "0.5rem" }}>
                                        {(a.gaps ?? []).map((g, i) => (
                                            <div key={i} style={{ display: "flex", gap: "0.65rem", alignItems: "flex-start" }}>
                                                <span style={{ color: "#f87171", fontSize: "0.8rem", flexShrink: 0, paddingTop: "0.1rem" }}>✕</span>
                                                <p style={{ margin: 0, fontSize: "0.88rem", color: "rgba(255,255,255,0.75)", lineHeight: 1.5 }}>{g}</p>
                                            </div>
                                        ))}
                                    </div>
                                </Section>
                            </div>
                        </div>

                        {/* Strategic recommendation */}
                        <div style={{
                            background: "rgba(229,191,68,0.04)",
                            border: "1px solid rgba(229,191,68,0.18)",
                            borderRadius: "18px",
                            padding: "1.75rem",
                            marginBottom: "1.25rem",
                        }}>
                            <Section title="Strategic Recommendation">
                                <p style={{ margin: 0, fontSize: "0.97rem", lineHeight: 1.7, color: "rgba(255,255,255,0.82)" }}>{a.recommendation}</p>
                            </Section>
                        </div>

                        <p style={{ color: "rgba(255,255,255,0.2)", fontSize: "0.78rem", textAlign: "center", margin: "0.5rem 0 2rem" }}>
                            Scraped from {result?.url} · {result?.scrapedAt ? new Date(result.scrapedAt).toLocaleString("en-GB") : ""}
                        </p>
                    </div>
                )}
            </div>
        </>
    );
}
