"use client";

import { motion, AnimatePresence, useInView } from "framer-motion";
import { useState, useEffect, useRef } from "react";

const STEP_DURATION = 3500;

const STEPS = [
    {
        number: "01",
        label: "Scanning ads",
        title: "Find every competitor ad",
        description:
            "Enter a keyword. We pull every active ad from the Meta Ads Library — filtered, sorted, and verified instantly.",
    },
    {
        number: "02",
        label: "Identifying winners",
        title: "Surface the profitable ones",
        description:
            "Ads running 3+ months signal profitability. We automatically flag the ones worth studying.",
    },
    {
        number: "03",
        label: "Report ready",
        title: "Your intelligence report",
        description:
            "AI analyses every winning ad and returns hooks, formats, angles, and copy recommendations for your brand.",
    },
];

/* -- State 0: Scanning -- */
function ScanningMockup() {
    const [typed, setTyped] = useState("");
    const [cards, setCards] = useState<number[]>([]);

    useEffect(() => {
        const target = "yoga mats";
        let i = 0;
        const typer = setInterval(() => {
            i++;
            setTyped(target.slice(0, i));
            if (i >= target.length) clearInterval(typer);
        }, 90);

        const cardTimers = [0, 1, 2, 3].map((idx) =>
            setTimeout(() => setCards((prev) => [...prev, idx]), 900 + idx * 220)
        );

        return () => {
            clearInterval(typer);
            cardTimers.forEach(clearTimeout);
        };
    }, []);

    return (
        <div style={{ display: "grid", gap: "0.7rem" }}>
            {/* Search bar */}
            <div style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(229,191,68,0.4)",
                borderRadius: 10,
                padding: "0.6rem 0.9rem",
                boxShadow: "0 0 18px rgba(229,191,68,0.07)",
            }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(229,191,68,0.7)" strokeWidth="2.5">
                    <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                </svg>
                <span style={{ color: "#fff", fontSize: "0.88rem", fontWeight: 500, flex: 1, fontFamily: "monospace" }}>
                    {typed}
                    <span style={{
                        display: "inline-block",
                        width: 2,
                        height: "0.9em",
                        background: "#e5bf44",
                        marginLeft: 2,
                        verticalAlign: "text-bottom",
                    }} />
                </span>
                <span style={{
                    background: "linear-gradient(120deg, #f0cb54, #cc9519)",
                    color: "#1e1703",
                    fontSize: "0.7rem",
                    fontWeight: 700,
                    padding: "0.22rem 0.55rem",
                    borderRadius: 6,
                    letterSpacing: "0.02em",
                }}>
                    Scan
                </span>
            </div>

            {/* Filter pills */}
            <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap" }}>
                {["Meta Ads", "United Kingdom", "All formats"].map((tag) => (
                    <span key={tag} style={{
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.09)",
                        color: "rgba(255,255,255,0.4)",
                        fontSize: "0.66rem",
                        padding: "0.18rem 0.45rem",
                        borderRadius: 5,
                    }}>
                        {tag}
                    </span>
                ))}
            </div>

            {/* Skeleton cards */}
            <div style={{ display: "grid", gap: "0.45rem" }}>
                {[0, 1, 2, 3].map((idx) => (
                    <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 6 }}
                        animate={cards.includes(idx) ? { opacity: 1, y: 0 } : {}}
                        transition={{ duration: 0.28 }}
                        style={{
                            background: "rgba(255,255,255,0.035)",
                            border: "1px solid rgba(255,255,255,0.06)",
                            borderRadius: 8,
                            padding: "0.55rem 0.7rem",
                            display: "flex",
                            alignItems: "center",
                            gap: "0.55rem",
                        }}
                    >
                        <div style={{ width: 34, height: 34, borderRadius: 6, background: "rgba(255,255,255,0.07)", flexShrink: 0 }} />
                        <div style={{ flex: 1, display: "grid", gap: "0.28rem" }}>
                            <div style={{ height: 7, background: "rgba(255,255,255,0.09)", borderRadius: 3, width: ["68%","82%","55%","74%"][idx] }} />
                            <div style={{ height: 6, background: "rgba(255,255,255,0.05)", borderRadius: 3, width: ["80%","65%","78%","60%"][idx] }} />
                        </div>
                        <div style={{ fontSize: "0.62rem", color: "rgba(255,255,255,0.2)", whiteSpace: "nowrap" }}>
                            Fetching...
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}

/* -- State 1: Winners identified -- */
const ADS = [
    { name: "YogaBody Pro — Summer Promo", days: 94, winner: true },
    { name: "Lululemon Mat Bundle", days: 12, winner: false },
    { name: "GreenEarth Yoga — Eco Range", days: 118, winner: true },
    { name: "FlexPro Starter Pack", days: 8, winner: false },
];

function WinnersMockup() {
    return (
        <div style={{ display: "grid", gap: "0.7rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.73rem" }}>24 ads found</span>
                <span style={{
                    color: "#e5bf44",
                    fontSize: "0.68rem",
                    fontWeight: 700,
                    background: "rgba(229,191,68,0.1)",
                    border: "1px solid rgba(229,191,68,0.22)",
                    padding: "0.15rem 0.5rem",
                    borderRadius: 5,
                }}>
                    2 winners identified
                </span>
            </div>

            <div style={{ display: "grid", gap: "0.45rem" }}>
                {ADS.map((ad, idx) => (
                    <motion.div
                        key={ad.name}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: idx * 0.1, duration: 0.3 }}
                        style={{
                            background: ad.winner ? "rgba(229,191,68,0.07)" : "rgba(255,255,255,0.02)",
                            border: ad.winner ? "1px solid rgba(229,191,68,0.28)" : "1px solid rgba(255,255,255,0.05)",
                            borderRadius: 8,
                            padding: "0.55rem 0.7rem",
                            display: "flex",
                            alignItems: "center",
                            gap: "0.55rem",
                            opacity: ad.winner ? 1 : 0.35,
                        }}
                    >
                        <div style={{
                            width: 34,
                            height: 34,
                            borderRadius: 6,
                            background: ad.winner ? "rgba(229,191,68,0.14)" : "rgba(255,255,255,0.05)",
                            flexShrink: 0,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                        }}>
                            {ad.winner && (
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="#e5bf44">
                                    <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
                                </svg>
                            )}
                        </div>
                        <div style={{ flex: 1, display: "grid", gap: "0.22rem" }}>
                            <span style={{ color: ad.winner ? "#fff" : "rgba(255,255,255,0.35)", fontSize: "0.78rem", fontWeight: 600 }}>
                                {ad.name}
                            </span>
                            {ad.winner ? (
                                <span style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "0.25rem",
                                    background: "rgba(34,197,94,0.12)",
                                    border: "1px solid rgba(34,197,94,0.28)",
                                    color: "#4ade80",
                                    fontSize: "0.61rem",
                                    fontWeight: 700,
                                    padding: "0.1rem 0.4rem",
                                    borderRadius: 4,
                                    width: "fit-content",
                                }}>
                                    {ad.days} days running
                                </span>
                            ) : (
                                <span style={{ color: "rgba(255,255,255,0.2)", fontSize: "0.68rem" }}>{ad.days} days</span>
                            )}
                        </div>
                        {ad.winner && (
                            <span style={{
                                background: "linear-gradient(120deg, #f0cb54, #cc9519)",
                                color: "#1e1703",
                                fontSize: "0.6rem",
                                fontWeight: 800,
                                padding: "0.18rem 0.45rem",
                                borderRadius: 5,
                                letterSpacing: "0.04em",
                                whiteSpace: "nowrap",
                            }}>
                                WINNER
                            </span>
                        )}
                    </motion.div>
                ))}
            </div>
        </div>
    );
}

/* -- State 2: Report -- */
const REPORT_LINES = [
    { label: "Top hook", value: "Fear of missing out" },
    { label: "Best format", value: "Single image" },
    { label: "Avg. run time", value: "47 days" },
    { label: "Recommended angle", value: "Social proof" },
];

function ReportMockup() {
    const [visible, setVisible] = useState<number[]>([]);

    useEffect(() => {
        const timers = REPORT_LINES.map((_, idx) =>
            setTimeout(() => setVisible((prev) => [...prev, idx]), 250 + idx * 280)
        );
        return () => timers.forEach(clearTimeout);
    }, []);

    return (
        <div style={{ display: "grid", gap: "0.7rem" }}>
            {/* Report header */}
            <div style={{
                display: "flex",
                alignItems: "center",
                gap: "0.55rem",
                paddingBottom: "0.6rem",
                borderBottom: "1px solid rgba(255,255,255,0.07)",
            }}>
                <div style={{
                    width: 30,
                    height: 30,
                    borderRadius: 8,
                    background: "linear-gradient(135deg, rgba(229,191,68,0.28), rgba(229,191,68,0.08))",
                    border: "1px solid rgba(229,191,68,0.32)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#e5bf44" strokeWidth="2.5">
                        <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                    </svg>
                </div>
                <div style={{ flex: 1 }}>
                    <div style={{ color: "#fff", fontSize: "0.82rem", fontWeight: 700 }}>Intelligence Report</div>
                    <div style={{ color: "rgba(255,255,255,0.38)", fontSize: "0.67rem" }}>yoga mats · 2 winning ads</div>
                </div>
                <span style={{
                    background: "rgba(34,197,94,0.12)",
                    border: "1px solid rgba(34,197,94,0.28)",
                    color: "#4ade80",
                    fontSize: "0.6rem",
                    fontWeight: 700,
                    padding: "0.15rem 0.45rem",
                    borderRadius: 5,
                }}>
                    Ready
                </span>
            </div>

            {/* Data rows */}
            <div style={{ display: "grid", gap: "0.42rem" }}>
                {REPORT_LINES.map((line, idx) => (
                    <motion.div
                        key={line.label}
                        initial={{ opacity: 0, x: -10 }}
                        animate={visible.includes(idx) ? { opacity: 1, x: 0 } : {}}
                        transition={{ duration: 0.32, ease: "easeOut" }}
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            padding: "0.48rem 0.65rem",
                            background: "rgba(255,255,255,0.03)",
                            border: "1px solid rgba(255,255,255,0.06)",
                            borderRadius: 8,
                            gap: "0.75rem",
                        }}
                    >
                        <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.73rem", whiteSpace: "nowrap" }}>
                            {line.label}
                        </span>
                        <span style={{ color: "#fff", fontSize: "0.78rem", fontWeight: 600, textAlign: "right" }}>
                            {line.value}
                        </span>
                    </motion.div>
                ))}
            </div>

            {/* Action row */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={visible.includes(3) ? { opacity: 1 } : {}}
                transition={{ delay: 0.28, duration: 0.35 }}
                style={{ display: "flex", gap: "0.45rem", marginTop: "0.15rem" }}
            >
                <div style={{
                    flex: 1,
                    background: "linear-gradient(120deg, rgba(240,203,84,0.14), rgba(204,149,25,0.08))",
                    border: "1px solid rgba(229,191,68,0.28)",
                    borderRadius: 8,
                    padding: "0.48rem 0.7rem",
                    fontSize: "0.7rem",
                    color: "#e5bf44",
                    fontWeight: 600,
                    textAlign: "center",
                }}>
                    View full report
                </div>
                <div style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.09)",
                    borderRadius: 8,
                    padding: "0.48rem 0.7rem",
                    fontSize: "0.7rem",
                    color: "rgba(255,255,255,0.4)",
                    fontWeight: 600,
                    textAlign: "center",
                }}>
                    Export PDF
                </div>
            </motion.div>
        </div>
    );
}

/* -- Progress bar -- */
function ProgressBar({ step, total, duration }: { step: number; total: number; duration: number }) {
    const barRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const el = barRef.current;
        if (!el) return;
        el.style.transition = "none";
        el.style.width = "0%";
        const raf = requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                el.style.transition = `width ${duration}ms linear`;
                el.style.width = "100%";
            });
        });
        return () => cancelAnimationFrame(raf);
    }, [step, duration]);

    return (
        <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
            {Array.from({ length: total }).map((_, i) => (
                <div
                    key={i}
                    style={{
                        flex: 1,
                        height: 3,
                        background: "rgba(255,255,255,0.1)",
                        borderRadius: 2,
                        overflow: "hidden",
                        position: "relative",
                    }}
                >
                    {i === step && (
                        <div
                            ref={barRef}
                            style={{
                                position: "absolute",
                                top: 0,
                                left: 0,
                                height: "100%",
                                background: "linear-gradient(90deg, #f0cb54, #cc9519)",
                                borderRadius: 2,
                                width: "0%",
                            }}
                        />
                    )}
                    {i < step && (
                        <div style={{
                            position: "absolute",
                            inset: 0,
                            background: "rgba(229,191,68,0.45)",
                            borderRadius: 2,
                        }} />
                    )}
                </div>
            ))}
        </div>
    );
}

/* -- Main export -- */
const MOCKUPS = [<ScanningMockup key="scan" />, <WinnersMockup key="win" />, <ReportMockup key="rep" />];

export default function DemoSection() {
    const [step, setStep] = useState(0);
    const sectionRef = useRef<HTMLElement>(null);
    const inView = useInView(sectionRef, { once: true, margin: "-80px 0px" });
    const started = useRef(false);

    useEffect(() => {
        if (!inView || started.current) return;
        started.current = true;
        const timer = setInterval(() => setStep((s) => (s + 1) % 3), STEP_DURATION);
        return () => clearInterval(timer);
    }, [inView]);

    return (
        <motion.section
            ref={sectionRef}
            initial={{ opacity: 0, y: 32 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, ease: "easeOut" }}
            style={{
                width: "min(1100px, 92vw)",
                margin: "0 auto 6rem",
                display: "grid",
                gap: "2.5rem",
            }}
        >
            {/* Section heading */}
            <div style={{ textAlign: "center", display: "grid", gap: "0.75rem" }}>
                <p style={{
                    color: "rgba(229,191,68,0.75)",
                    fontSize: "0.72rem",
                    fontWeight: 700,
                    letterSpacing: "0.2em",
                    textTransform: "uppercase",
                    margin: 0,
                }}>
                    See it in action
                </p>
                <h2 style={{ margin: 0, fontSize: "clamp(1.8rem, 3.5vw, 2.6rem)", fontWeight: 700 }}>
                    From keyword to report in minutes.
                </h2>
                <p style={{ margin: "0 auto", maxWidth: 480, color: "rgba(255,255,255,0.5)", lineHeight: 1.6 }}>
                    Watch how Virtuecore turns a search term into a full competitive intelligence report.
                </p>
            </div>

            {/* Body: left steps + right mockup */}
            <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(min(300px, 100%), 1fr))",
                gap: "2.5rem",
                alignItems: "center",
            }}>
                {/* Left: step list */}
                <div style={{ display: "grid", gap: "0" }}>
                    {STEPS.map((s, idx) => {
                        const active = idx === step;
                        return (
                            <motion.button
                                key={idx}
                                onClick={() => setStep(idx)}
                                animate={{
                                    borderLeftColor: active ? "rgba(229,191,68,0.7)" : "rgba(255,255,255,0.08)",
                                }}
                                transition={{ duration: 0.3 }}
                                style={{
                                    background: "none",
                                    border: "none",
                                    borderLeft: `3px solid ${active ? "rgba(229,191,68,0.7)" : "rgba(255,255,255,0.08)"}`,
                                    padding: "1.1rem 1.25rem",
                                    textAlign: "left",
                                    cursor: "pointer",
                                    display: "grid",
                                    gap: "0.3rem",
                                    transition: "border-left-color 0.3s ease",
                                }}
                            >
                                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                    <span style={{
                                        fontSize: "0.67rem",
                                        fontWeight: 800,
                                        letterSpacing: "0.16em",
                                        textTransform: "uppercase",
                                        color: active ? "rgba(229,191,68,0.85)" : "rgba(255,255,255,0.25)",
                                        transition: "color 0.3s ease",
                                    }}>
                                        {s.number} — {s.label}
                                    </span>
                                </div>
                                <span style={{
                                    fontSize: "1.05rem",
                                    fontWeight: 700,
                                    color: active ? "#ffffff" : "rgba(255,255,255,0.35)",
                                    transition: "color 0.3s ease",
                                    lineHeight: 1.3,
                                }}>
                                    {s.title}
                                </span>
                                <motion.span
                                    initial={false}
                                    animate={{
                                        opacity: active ? 1 : 0,
                                        height: active ? "auto" : 0,
                                        marginTop: active ? "0.2rem" : 0,
                                    }}
                                    transition={{ duration: 0.3, ease: "easeOut" }}
                                    style={{
                                        fontSize: "0.9rem",
                                        color: "rgba(255,255,255,0.55)",
                                        lineHeight: 1.6,
                                        display: "block",
                                        overflow: "hidden",
                                    }}
                                >
                                    {s.description}
                                </motion.span>
                            </motion.button>
                        );
                    })}
                </div>

                {/* Right: animated mockup */}
                <div style={{ display: "grid", gap: "1rem" }}>
                    <div style={{
                        background: "rgba(255,255,255,0.04)",
                        backdropFilter: "blur(16px)",
                        WebkitBackdropFilter: "blur(16px)",
                        border: "1px solid rgba(255,255,255,0.09)",
                        borderRadius: 20,
                        padding: "1.5rem",
                        minHeight: 280,
                        position: "relative",
                        overflow: "hidden",
                    }}>
                        {/* Top bar chrome */}
                        <div style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.35rem",
                            marginBottom: "1.1rem",
                            paddingBottom: "0.8rem",
                            borderBottom: "1px solid rgba(255,255,255,0.06)",
                        }}>
                            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "rgba(255,255,255,0.12)" }} />
                            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "rgba(255,255,255,0.12)" }} />
                            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "rgba(255,255,255,0.12)" }} />
                            <span style={{
                                flex: 1,
                                textAlign: "center",
                                fontSize: "0.68rem",
                                color: "rgba(255,255,255,0.25)",
                                letterSpacing: "0.05em",
                            }}>
                                intel.virtuecore.co.uk
                            </span>
                        </div>

                        {/* Animated content */}
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={step}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.4 }}
                            >
                                {MOCKUPS[step]}
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {/* Progress bars */}
                    <ProgressBar step={step} total={3} duration={STEP_DURATION} />
                </div>
            </div>
        </motion.section>
    );
}
