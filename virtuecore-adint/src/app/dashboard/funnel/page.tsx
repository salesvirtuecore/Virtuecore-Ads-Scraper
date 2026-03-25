"use client";

import { FormEvent, useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

import ui from "@/app/app-ui.module.css";
import { useDashboard } from "@/app/dashboard/dashboard-context";

/* -- Walkthrough step data -- */
const WALK_STEPS = [
    {
        number: "01",
        label: "Find a competitor",
        title: "Find a competitor's landing page",
        description: "Go to any competitor's website and copy the URL of their landing page or sales page. Any URL works — Shopify, ClickFunnels, WordPress, anything.",
        mockup: "url",
    },
    {
        number: "02",
        label: "We scrape and analyse",
        title: "We read the whole page for you",
        description: "Our AI scrapes the full page — headline, subheadline, CTA, pricing, pain points, social proof, urgency tactics — and analyses how they're trying to convert visitors.",
        mockup: "scrape",
    },
    {
        number: "03",
        label: "Get your report",
        title: "Your full funnel breakdown",
        description: "You get a complete intelligence report: their strengths, their gaps, hooks you can steal, and a clear recommendation on how to beat them.",
        mockup: "report",
    },
];

/* -- URL mockup -- */
function UrlMockup() {
    const [typed, setTyped] = useState("");
    const target = "https://competitor.com/landing-page";
    useEffect(() => {
        let i = 0;
        const t = setInterval(() => { i++; setTyped(target.slice(0, i)); if (i >= target.length) clearInterval(t); }, 55);
        return () => clearInterval(t);
    }, []);
    return (
        <div style={{ display: "grid", gap: "0.75rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "0.4rem 0.65rem" }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                <span style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.72rem", fontFamily: "monospace" }}>intel.virtuecore.co.uk</span>
            </div>
            <div style={{ background: "rgba(229,191,68,0.07)", border: "1px solid rgba(229,191,68,0.35)", borderRadius: 10, padding: "0.7rem 0.9rem" }}>
                <p style={{ margin: "0 0 0.3rem", color: "rgba(229,191,68,0.7)", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase" }}>Competitor URL</p>
                <span style={{ color: "#fff", fontSize: "0.82rem", fontFamily: "monospace" }}>
                    {typed}<span style={{ display: "inline-block", width: 1.5, height: "0.9em", background: "#e5bf44", marginLeft: 1, verticalAlign: "text-bottom" }} />
                </span>
            </div>
            <div style={{ display: "flex", gap: "0.4rem" }}>
                {["Copy link", "from browser", "address bar"].map((t) => (
                    <span key={t} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.35)", fontSize: "0.64rem", padding: "0.18rem 0.45rem", borderRadius: 5 }}>{t}</span>
                ))}
            </div>
        </div>
    );
}

/* -- Scrape mockup -- */
const SCRAPE_ITEMS = [
    { label: "Headline", delay: 0 },
    { label: "CTA button", delay: 280 },
    { label: "Pain points", delay: 560 },
    { label: "Social proof", delay: 840 },
    { label: "Urgency tactics", delay: 1120 },
];
function ScrapeMockup() {
    const [done, setDone] = useState<number[]>([]);
    useEffect(() => {
        const ts = SCRAPE_ITEMS.map((item, i) => setTimeout(() => setDone((d) => [...d, i]), item.delay + 300));
        return () => ts.forEach(clearTimeout);
    }, []);
    return (
        <div style={{ display: "grid", gap: "0.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ade80", boxShadow: "0 0 6px #4ade80" }} />
                <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.72rem" }}>Scraping page...</span>
            </div>
            {SCRAPE_ITEMS.map((item, i) => (
                <motion.div key={item.label} initial={{ opacity: 0, x: -8 }} animate={done.includes(i) ? { opacity: 1, x: 0 } : {}} transition={{ duration: 0.28 }}
                    style={{ display: "flex", alignItems: "center", gap: "0.6rem", padding: "0.45rem 0.65rem", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 7 }}>
                    <span style={{ color: "#4ade80", fontSize: "0.75rem" }}>✓</span>
                    <span style={{ color: "rgba(255,255,255,0.65)", fontSize: "0.78rem" }}>{item.label} extracted</span>
                </motion.div>
            ))}
        </div>
    );
}

/* -- Report mockup -- */
const REPORT_ITEMS = [
    { label: "Core offer", value: "Free strategy call → £2,400 retainer" },
    { label: "Biggest gap", value: "No pricing transparency" },
    { label: "Hook to steal", value: "\"What if you could...\"" },
    { label: "Recommendation", value: "Lead with results, not process" },
];
function ReportMockupWalk() {
    const [visible, setVisible] = useState<number[]>([]);
    useEffect(() => {
        const ts = REPORT_ITEMS.map((_, i) => setTimeout(() => setVisible((v) => [...v, i]), 200 + i * 300));
        return () => ts.forEach(clearTimeout);
    }, []);
    return (
        <div style={{ display: "grid", gap: "0.45rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", paddingBottom: "0.5rem", borderBottom: "1px solid rgba(255,255,255,0.07)", marginBottom: "0.15rem" }}>
                <div style={{ width: 22, height: 22, borderRadius: 6, background: "rgba(229,191,68,0.2)", border: "1px solid rgba(229,191,68,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#e5bf44" strokeWidth="2.5"><path d="M9 11l3 3L22 4"/></svg>
                </div>
                <span style={{ color: "#fff", fontSize: "0.78rem", fontWeight: 700 }}>Funnel Report Ready</span>
                <span style={{ marginLeft: "auto", background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.28)", color: "#4ade80", fontSize: "0.6rem", fontWeight: 700, padding: "0.1rem 0.4rem", borderRadius: 4 }}>Done</span>
            </div>
            {REPORT_ITEMS.map((item, i) => (
                <motion.div key={item.label} initial={{ opacity: 0, x: -8 }} animate={visible.includes(i) ? { opacity: 1, x: 0 } : {}} transition={{ duration: 0.3, ease: "easeOut" }}
                    style={{ display: "flex", justifyContent: "space-between", padding: "0.42rem 0.6rem", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 7, gap: "0.75rem" }}>
                    <span style={{ color: "rgba(255,255,255,0.38)", fontSize: "0.72rem", whiteSpace: "nowrap" }}>{item.label}</span>
                    <span style={{ color: "#fff", fontSize: "0.75rem", fontWeight: 600, textAlign: "right" }}>{item.value}</span>
                </motion.div>
            ))}
        </div>
    );
}

/* -- Walkthrough component -- */
const STEP_DURATION = 3800;
function FunnelWalkthrough() {
    const [step, setStep] = useState(0);
    const barRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const t = setInterval(() => setStep((s) => (s + 1) % 3), STEP_DURATION);
        return () => clearInterval(t);
    }, []);

    useEffect(() => {
        const el = barRef.current;
        if (!el) return;
        el.style.transition = "none";
        el.style.width = "0%";
        requestAnimationFrame(() => requestAnimationFrame(() => {
            el.style.transition = `width ${STEP_DURATION}ms linear`;
            el.style.width = "100%";
        }));
    }, [step]);

    const MOCKUPS = [<UrlMockup key="url" />, <ScrapeMockup key="scrape" />, <ReportMockupWalk key="report" />];

    return (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(280px,100%),1fr))", gap: "2rem", alignItems: "center", padding: "1.5rem 0 2rem" }}>
            {/* Left: steps */}
            <div style={{ display: "grid", gap: 0 }}>
                {WALK_STEPS.map((s, idx) => {
                    const active = idx === step;
                    return (
                        <button key={idx} type="button" onClick={() => setStep(idx)} style={{
                            background: "none", border: "none", cursor: "pointer", textAlign: "left",
                            borderLeft: `3px solid ${active ? "rgba(229,191,68,0.7)" : "rgba(255,255,255,0.08)"}`,
                            padding: "0.9rem 1.1rem", display: "grid", gap: "0.22rem",
                            transition: "border-left-color 0.3s",
                        }}>
                            <span style={{ fontSize: "0.65rem", fontWeight: 800, letterSpacing: "0.16em", textTransform: "uppercase", color: active ? "rgba(229,191,68,0.85)" : "rgba(255,255,255,0.22)" }}>
                                {s.number} — {s.label}
                            </span>
                            <span style={{ fontSize: "0.95rem", fontWeight: 700, color: active ? "#fff" : "rgba(255,255,255,0.3)", transition: "color 0.3s", lineHeight: 1.3 }}>
                                {s.title}
                            </span>
                            {active && (
                                <motion.span initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} transition={{ duration: 0.3 }}
                                    style={{ fontSize: "0.83rem", color: "rgba(255,255,255,0.5)", lineHeight: 1.6, display: "block", overflow: "hidden", marginTop: "0.2rem" }}>
                                    {s.description}
                                </motion.span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Right: mockup */}
            <div style={{ display: "grid", gap: "0.75rem" }}>
                <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: "1.25rem", minHeight: 220 }}>
                    {/* Chrome bar */}
                    <div style={{ display: "flex", gap: "0.3rem", marginBottom: "0.9rem", paddingBottom: "0.7rem", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                        {[0,1,2].map((i) => <div key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: "rgba(255,255,255,0.1)" }} />)}
                        <span style={{ flex: 1, textAlign: "center", fontSize: "0.64rem", color: "rgba(255,255,255,0.2)" }}>intel.virtuecore.co.uk/dashboard/funnel</span>
                    </div>
                    <AnimatePresence mode="wait">
                        <motion.div key={step} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.35 }}>
                            {MOCKUPS[step]}
                        </motion.div>
                    </AnimatePresence>
                </div>
                {/* Progress bars */}
                <div style={{ display: "flex", gap: "0.35rem" }}>
                    {[0,1,2].map((i) => (
                        <div key={i} style={{ flex: 1, height: 3, background: "rgba(255,255,255,0.08)", borderRadius: 2, overflow: "hidden", position: "relative" }}>
                            {i === step && <div ref={i === step ? barRef : undefined} style={{ position: "absolute", inset: 0, height: "100%", background: "linear-gradient(90deg,#f0cb54,#cc9519)", borderRadius: 2, width: "0%" }} />}
                            {i < step && <div style={{ position: "absolute", inset: 0, background: "rgba(229,191,68,0.4)", borderRadius: 2 }} />}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

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

                {/* URL input — stacked: field above button */}
                <form onSubmit={analyse} style={{ display: "grid", gap: "0.75rem", marginBottom: "1rem", animation: "fadeUp 0.4s ease both", animationDelay: "0.05s" }}>
                    <input
                        className="funnel-input"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        type="url"
                        placeholder="https://competitor.com/landing-page — paste any competitor URL here"
                        required
                        style={{ fontSize: "1rem", padding: "0.9rem 1.1rem" }}
                    />
                    <button type="submit" className="funnel-btn" disabled={loading} style={{ width: "100%", padding: "0.9rem", fontSize: "1rem" }}>
                        {loading ? "Analysing… (15–30 seconds)" : "Analyse →"}
                    </button>
                </form>

                {/* Walkthrough — only show when idle and no result */}
                {!loading && !result && <FunnelWalkthrough />}

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
