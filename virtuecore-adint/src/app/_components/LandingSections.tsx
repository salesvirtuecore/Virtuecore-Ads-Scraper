"use client";

import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { useRef, useEffect, useState } from "react";

/* ─── Types ──────────────────────────────────────────────────── */
type HowItWorksItem = { step: string; title: string; body: string };
type PricingFeature = string;

/* ─── Reusable fade-up wrapper ───────────────────────────────── */
function FadeUp({
    children,
    delay = 0,
    style,
}: {
    children: React.ReactNode;
    delay?: number;
    style?: React.CSSProperties;
}) {
    const ref = useRef<HTMLDivElement>(null);
    const inView = useInView(ref, { once: true, margin: "-60px 0px" });

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 28 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay, ease: "easeOut" }}
            style={style}
        >
            {children}
        </motion.div>
    );
}

/* ─── Section heading ────────────────────────────────────────── */
function SectionHeading({ label, title, subtitle }: { label: string; title: string; subtitle?: string }) {
    const ref = useRef<HTMLDivElement>(null);
    const inView = useInView(ref, { once: true, margin: "-60px 0px" });

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, ease: "easeOut" }}
            style={{ textAlign: "center", display: "grid", gap: "0.75rem" }}
        >
            <p style={{
                color: "rgba(229,191,68,0.75)",
                fontSize: "0.72rem",
                fontWeight: 700,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                margin: 0,
            }}>
                {label}
            </p>
            <h2 style={{ margin: 0, fontSize: "clamp(1.8rem, 3.5vw, 2.6rem)", fontWeight: 700 }}>
                {title}
            </h2>
            {subtitle && (
                <p style={{ margin: "0 auto", maxWidth: 480, color: "rgba(255,255,255,0.5)", lineHeight: 1.6 }}>
                    {subtitle}
                </p>
            )}
        </motion.div>
    );
}

/* ─── Animated feature card ──────────────────────────────────── */
function FeatureCard({ item, delay }: { item: HowItWorksItem; delay: number }) {
    const ref = useRef<HTMLDivElement>(null);
    const inView = useInView(ref, { once: true, margin: "-60px 0px" });

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 36 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
            whileHover={{
                borderColor: "rgba(229,191,68,0.55)",
                boxShadow: "0 0 28px rgba(229,191,68,0.1), 0 4px 24px rgba(0,0,0,0.45)",
            }}
            style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 16,
                padding: "1.75rem",
                display: "grid",
                gap: "0.75rem",
                transition: "border-color 0.25s ease, box-shadow 0.25s ease",
                cursor: "default",
            }}
        >
            <span style={{
                color: "rgba(229,191,68,0.5)",
                fontSize: "0.75rem",
                fontWeight: 800,
                letterSpacing: "0.15em",
            }}>
                {item.step}
            </span>
            <h3 style={{ margin: 0, fontSize: "1.15rem", fontWeight: 700 }}>{item.title}</h3>
            <p style={{ margin: 0, color: "rgba(255,255,255,0.55)", lineHeight: 1.65, fontSize: "0.95rem" }}>
                {item.body}
            </p>
        </motion.div>
    );
}

/* ─── Count-up number ────────────────────────────────────────── */
function CountUp({ value, prefix = "", suffix = "" }: { value: number; prefix?: string; suffix?: string }) {
    const ref = useRef<HTMLSpanElement>(null);
    const inView = useInView(ref, { once: true, margin: "-40px 0px" });
    const [display, setDisplay] = useState(0);

    useEffect(() => {
        if (!inView) return;
        const duration = 1500;
        const start = performance.now();
        const tick = (now: number) => {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            // ease out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            setDisplay(Math.round(eased * value));
            if (progress < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
    }, [inView, value]);

    return (
        <span ref={ref}>
            {prefix}{display}{suffix}
        </span>
    );
}

/* ─── Pricing card ───────────────────────────────────────────── */
function PricingCard({
    delay,
    children,
    highlight,
}: {
    delay: number;
    children: React.ReactNode;
    highlight?: boolean;
}) {
    const ref = useRef<HTMLDivElement>(null);
    const inView = useInView(ref, { once: true, margin: "-40px 0px" });

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 32 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
            style={{
                background: highlight
                    ? "linear-gradient(145deg, rgba(229,191,68,0.1), rgba(229,191,68,0.04))"
                    : "rgba(255,255,255,0.03)",
                border: highlight
                    ? "1px solid rgba(229,191,68,0.35)"
                    : "1px solid rgba(255,255,255,0.1)",
                borderRadius: 20,
                padding: "2rem",
                display: "grid",
                gap: "1.5rem",
                position: "relative",
            }}
        >
            {children}
        </motion.div>
    );
}

/* ─── Main export ────────────────────────────────────────────── */
export default function LandingSections({
    howItWorks,
    proFeatures,
    ultimateFeatures,
}: {
    howItWorks: HowItWorksItem[];
    proFeatures: PricingFeature[];
    ultimateFeatures: PricingFeature[];
}) {
    return (
        <>
            {/* ── How it works ── */}
            <section style={{
                width: "min(1100px, 92vw)",
                margin: "0 auto 5rem",
                display: "grid",
                gap: "1.5rem",
            }}>
                <SectionHeading label="How it works" title="Three steps to competitor clarity." />
                <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                    gap: "1rem",
                }}>
                    {howItWorks.map((item, i) => (
                        <FeatureCard key={item.step} item={item} delay={i * 0.15} />
                    ))}
                </div>
            </section>

            {/* ── Pricing ── */}
            <section style={{
                width: "min(1100px, 92vw)",
                margin: "0 auto 6rem",
                display: "grid",
                gap: "2.5rem",
            }}>
                <SectionHeading
                    label="Pricing"
                    title="Two tiers. One goal."
                    subtitle="Start with ad intelligence. Upgrade to full funnel analysis when you're ready to go deeper."
                />

                <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                    gap: "1rem",
                    alignItems: "start",
                }}>
                    {/* Free */}
                    <PricingCard delay={0}>
                        <div>
                            <p style={{ margin: "0 0 0.4rem", color: "rgba(255,255,255,0.45)", fontSize: "0.8rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" }}>
                                Free
                            </p>
                            <div style={{ display: "flex", alignItems: "baseline", gap: "0.35rem" }}>
                                <span style={{ fontSize: "2.5rem", fontWeight: 800 }}>
                                    £<CountUp value={0} />
                                </span>
                                <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.9rem" }}>/month</span>
                            </div>
                            <p style={{ margin: "0.5rem 0 0", color: "rgba(255,255,255,0.45)", fontSize: "0.9rem" }}>
                                Try it out, no card needed.
                            </p>
                        </div>
                        <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: "0.6rem" }}>
                            {["5 scans per week", "Basic AI reports", "Ad results table"].map((f) => (
                                <li key={f} style={{ display: "flex", gap: "0.6rem", color: "rgba(255,255,255,0.55)", fontSize: "0.92rem" }}>
                                    <span style={{ color: "rgba(255,255,255,0.25)", flexShrink: 0 }}>—</span>{f}
                                </li>
                            ))}
                        </ul>
                        <Link href="/auth/signup" style={{
                            display: "block",
                            textAlign: "center",
                            background: "rgba(255,255,255,0.07)",
                            border: "1px solid rgba(255,255,255,0.15)",
                            color: "#fff",
                            fontWeight: 600,
                            padding: "0.75rem",
                            borderRadius: 10,
                            textDecoration: "none",
                            fontSize: "0.95rem",
                        }}>
                            Get started free
                        </Link>
                    </PricingCard>

                    {/* Pro */}
                    <PricingCard delay={0.15} highlight>
                        <span style={{
                            position: "absolute",
                            top: -13,
                            left: "50%",
                            transform: "translateX(-50%)",
                            background: "linear-gradient(120deg, #f0cb54, #cc9519)",
                            color: "#1e1703",
                            fontSize: "0.7rem",
                            fontWeight: 800,
                            letterSpacing: "0.1em",
                            textTransform: "uppercase",
                            padding: "0.3rem 1rem",
                            borderRadius: 999,
                            whiteSpace: "nowrap",
                        }}>
                            Most popular
                        </span>
                        <div>
                            <p style={{ margin: "0 0 0.4rem", color: "rgba(229,191,68,0.75)", fontSize: "0.8rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" }}>
                                Pro
                            </p>
                            <div style={{ display: "flex", alignItems: "baseline", gap: "0.35rem" }}>
                                <span style={{ fontSize: "2.5rem", fontWeight: 800 }}>
                                    £<CountUp value={67} />
                                </span>
                                <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.9rem" }}>/month</span>
                            </div>
                            <p style={{ margin: "0.5rem 0 0", color: "rgba(255,255,255,0.45)", fontSize: "0.9rem" }}>
                                Full ad intelligence for agencies and brands.
                            </p>
                        </div>
                        <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: "0.6rem" }}>
                            {proFeatures.map((f) => (
                                <li key={f} style={{ display: "flex", gap: "0.6rem", color: "rgba(255,255,255,0.82)", fontSize: "0.92rem" }}>
                                    <span style={{ color: "#e5bf44", flexShrink: 0 }}>✓</span>{f}
                                </li>
                            ))}
                        </ul>
                        <Link href="/auth/signup" style={{
                            display: "block",
                            textAlign: "center",
                            background: "linear-gradient(120deg, #f0cb54, #cc9519)",
                            color: "#1e1703",
                            fontWeight: 700,
                            padding: "0.85rem",
                            borderRadius: 10,
                            textDecoration: "none",
                            fontSize: "0.95rem",
                        }}>
                            Start with Pro →
                        </Link>
                    </PricingCard>

                    {/* Ultimate */}
                    <PricingCard delay={0.3}>
                        <span style={{
                            position: "absolute",
                            top: -13,
                            left: "50%",
                            transform: "translateX(-50%)",
                            background: "rgba(255,255,255,0.12)",
                            border: "1px solid rgba(255,255,255,0.2)",
                            color: "#fff",
                            fontSize: "0.7rem",
                            fontWeight: 800,
                            letterSpacing: "0.1em",
                            textTransform: "uppercase",
                            padding: "0.3rem 1rem",
                            borderRadius: 999,
                            whiteSpace: "nowrap",
                        }}>
                            Coming soon
                        </span>
                        <div>
                            <p style={{ margin: "0 0 0.4rem", color: "rgba(255,255,255,0.45)", fontSize: "0.8rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" }}>
                                Ultimate
                            </p>
                            <div style={{ display: "flex", alignItems: "baseline", gap: "0.35rem" }}>
                                <span style={{ fontSize: "2.5rem", fontWeight: 800 }}>
                                    £<CountUp value={197} />
                                </span>
                                <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.9rem" }}>/month</span>
                            </div>
                            <p style={{ margin: "0.5rem 0 0", color: "rgba(255,255,255,0.45)", fontSize: "0.9rem" }}>
                                Ads + full funnel. The complete picture.
                            </p>
                        </div>
                        <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: "0.6rem" }}>
                            {ultimateFeatures.map((f) => (
                                <li key={f} style={{ display: "flex", gap: "0.6rem", color: f === "Everything in Pro" ? "rgba(255,255,255,0.45)" : "rgba(255,255,255,0.82)", fontSize: "0.92rem" }}>
                                    <span style={{ color: f === "Everything in Pro" ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.5)", flexShrink: 0 }}>
                                        {f === "Everything in Pro" ? "↑" : "✓"}
                                    </span>
                                    {f}
                                </li>
                            ))}
                        </ul>
                        <div style={{
                            textAlign: "center",
                            background: "rgba(255,255,255,0.04)",
                            border: "1px solid rgba(255,255,255,0.1)",
                            color: "rgba(255,255,255,0.4)",
                            fontWeight: 600,
                            padding: "0.85rem",
                            borderRadius: 10,
                            fontSize: "0.95rem",
                        }}>
                            Notify me when live
                        </div>
                    </PricingCard>
                </div>
            </section>
        </>
    );
}
