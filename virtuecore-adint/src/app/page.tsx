import Link from "next/link";

import ui from "@/app/app-ui.module.css";
import HeroSection from "@/app/_components/HeroSection";

type Props = {
    searchParams: Promise<{ billing?: string }>;
};

const PRO_FEATURES = [
    "Scan the Meta Ads Library for any niche or keyword",
    "Identify winning ads running 3+ months (profitable signals)",
    "Filter by platform, format, country, and ad age",
    "Claude-powered competitive intelligence reports",
    "Market landscape, hook patterns, offer analysis",
    "3 ready-to-use ad copy drafts per report",
    "Full report library saved to your account",
    "25 scans per week",
];

const ULTIMATE_FEATURES = [
    "Everything in Pro",
    "Scrape competitor landing pages automatically",
    "Extract headline, offer, pricing, CTA, and social proof",
    "Full funnel breakdown — ad to conversion page",
    "Claude analyses the complete competitor journey",
    "Side-by-side funnel vs ad angle comparison",
    "Identify where competitors are strong or weak in their funnel",
    "200 scans per week + unlimited funnel analyses",
];

const HOW_IT_WORKS = [
    {
        step: "01",
        title: "Scan any niche",
        body: "Enter a keyword — we pull every active ad from the Meta Ads Library for that market. Filtered, sorted, and verified.",
    },
    {
        step: "02",
        title: "Select the winners",
        body: "Ads running 3+ months are marked as winning. They're profitable. Select the ones you want to analyse.",
    },
    {
        step: "03",
        title: "Get your report",
        body: "Claude reads every ad and returns a full competitive intelligence report — angles, offers, hooks, and recommendations written for your brand.",
    },
];

export default async function LandingPage({ searchParams }: Props) {
    const params = await searchParams;
    const billing = params.billing;

    return (
        <main style={{ fontFamily: "var(--font-sans)", overflowX: "hidden" }}>

            {/* ── Billing notices ── */}
            {billing === "success" && (
                <div style={{ maxWidth: 640, margin: "1.5rem auto 0", padding: "0 1rem" }}>
                    <div className={`${ui.notice} ${ui.noticeVerified}`}>
                        <span className={ui.noticeIcon}>✓</span>
                        <div>
                            <strong>Subscription active.</strong> Your account has been upgraded.{" "}
                            <Link href="/dashboard" className={ui.inlineActionGold}>Go to dashboard →</Link>
                        </div>
                    </div>
                </div>
            )}
            {billing === "cancelled" && (
                <div style={{ maxWidth: 640, margin: "1.5rem auto 0", padding: "0 1rem" }}>
                    <div className={`${ui.notice} ${ui.noticeDemo}`}>
                        <span className={ui.noticeIcon}>!</span>
                        <div>
                            Checkout was cancelled. No charge was made.{" "}
                            <Link href="/dashboard/upgrade" className={ui.inlineActionGold}>View plans →</Link>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Hero ── */}
            <HeroSection />

            {/* ── How it works ── */}
            <section style={{
                width: "min(1100px, 92vw)",
                margin: "0 auto 5rem",
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                gap: "1rem",
            }}>
                {HOW_IT_WORKS.map((item) => (
                    <div key={item.step} style={{
                        background: "rgba(255,255,255,0.03)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        borderRadius: "16px",
                        padding: "1.75rem",
                        display: "grid",
                        gap: "0.75rem",
                    }}>
                        <span style={{
                            color: "rgba(229,191,68,0.5)",
                            fontSize: "0.75rem",
                            fontWeight: 800,
                            letterSpacing: "0.15em",
                        }}>{item.step}</span>
                        <h3 style={{ margin: 0, fontSize: "1.15rem", fontWeight: 700 }}>{item.title}</h3>
                        <p style={{ margin: 0, color: "rgba(255,255,255,0.55)", lineHeight: 1.65, fontSize: "0.95rem" }}>{item.body}</p>
                    </div>
                ))}
            </section>

            {/* ── Pricing ── */}
            <section style={{
                width: "min(1100px, 92vw)",
                margin: "0 auto 6rem",
                display: "grid",
                gap: "2.5rem",
            }}>
                <div style={{ textAlign: "center", display: "grid", gap: "0.75rem" }}>
                    <p style={{
                        color: "rgba(229,191,68,0.75)",
                        fontSize: "0.72rem",
                        fontWeight: 700,
                        letterSpacing: "0.2em",
                        textTransform: "uppercase",
                        margin: 0,
                    }}>Pricing</p>
                    <h2 style={{ margin: 0, fontSize: "clamp(1.8rem, 3.5vw, 2.6rem)", fontWeight: 700 }}>
                        Two tiers. One goal.
                    </h2>
                    <p style={{ margin: "0 auto", maxWidth: 480, color: "rgba(255,255,255,0.5)", lineHeight: 1.6 }}>
                        Start with ad intelligence. Upgrade to full funnel analysis when you&apos;re ready to go deeper.
                    </p>
                </div>

                <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                    gap: "1rem",
                    alignItems: "start",
                }}>
                    {/* Free */}
                    <div style={{
                        background: "rgba(255,255,255,0.03)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: "20px",
                        padding: "2rem",
                        display: "grid",
                        gap: "1.5rem",
                    }}>
                        <div>
                            <p style={{ margin: "0 0 0.4rem", color: "rgba(255,255,255,0.45)", fontSize: "0.8rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" }}>Free</p>
                            <div style={{ display: "flex", alignItems: "baseline", gap: "0.35rem" }}>
                                <span style={{ fontSize: "2.5rem", fontWeight: 800 }}>£0</span>
                                <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.9rem" }}>/month</span>
                            </div>
                            <p style={{ margin: "0.5rem 0 0", color: "rgba(255,255,255,0.45)", fontSize: "0.9rem" }}>Try it out, no card needed.</p>
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
                            borderRadius: "10px",
                            textDecoration: "none",
                            fontSize: "0.95rem",
                        }}>
                            Get started free
                        </Link>
                    </div>

                    {/* Pro */}
                    <div style={{
                        background: "linear-gradient(145deg, rgba(229,191,68,0.1), rgba(229,191,68,0.04))",
                        border: "1px solid rgba(229,191,68,0.35)",
                        borderRadius: "20px",
                        padding: "2rem",
                        display: "grid",
                        gap: "1.5rem",
                        position: "relative",
                    }}>
                        <span style={{
                            position: "absolute",
                            top: "-13px",
                            left: "50%",
                            transform: "translateX(-50%)",
                            background: "linear-gradient(120deg, #f0cb54, #cc9519)",
                            color: "#1e1703",
                            fontSize: "0.7rem",
                            fontWeight: 800,
                            letterSpacing: "0.1em",
                            textTransform: "uppercase",
                            padding: "0.3rem 1rem",
                            borderRadius: "999px",
                            whiteSpace: "nowrap",
                        }}>Most popular</span>
                        <div>
                            <p style={{ margin: "0 0 0.4rem", color: "rgba(229,191,68,0.75)", fontSize: "0.8rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" }}>Pro</p>
                            <div style={{ display: "flex", alignItems: "baseline", gap: "0.35rem" }}>
                                <span style={{ fontSize: "2.5rem", fontWeight: 800 }}>£67</span>
                                <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.9rem" }}>/month</span>
                            </div>
                            <p style={{ margin: "0.5rem 0 0", color: "rgba(255,255,255,0.45)", fontSize: "0.9rem" }}>Full ad intelligence for agencies and brands.</p>
                        </div>
                        <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: "0.6rem" }}>
                            {PRO_FEATURES.map((f) => (
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
                            borderRadius: "10px",
                            textDecoration: "none",
                            fontSize: "0.95rem",
                        }}>
                            Start with Pro →
                        </Link>
                    </div>

                    {/* Ultimate */}
                    <div style={{
                        background: "rgba(255,255,255,0.03)",
                        border: "1px solid rgba(255,255,255,0.12)",
                        borderRadius: "20px",
                        padding: "2rem",
                        display: "grid",
                        gap: "1.5rem",
                        position: "relative",
                    }}>
                        <span style={{
                            position: "absolute",
                            top: "-13px",
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
                            borderRadius: "999px",
                            whiteSpace: "nowrap",
                        }}>Coming soon</span>
                        <div>
                            <p style={{ margin: "0 0 0.4rem", color: "rgba(255,255,255,0.45)", fontSize: "0.8rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" }}>Ultimate</p>
                            <div style={{ display: "flex", alignItems: "baseline", gap: "0.35rem" }}>
                                <span style={{ fontSize: "2.5rem", fontWeight: 800 }}>£197</span>
                                <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.9rem" }}>/month</span>
                            </div>
                            <p style={{ margin: "0.5rem 0 0", color: "rgba(255,255,255,0.45)", fontSize: "0.9rem" }}>Ads + full funnel. The complete picture.</p>
                        </div>
                        <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: "0.6rem" }}>
                            {ULTIMATE_FEATURES.map((f) => (
                                <li key={f} style={{ display: "flex", gap: "0.6rem", color: f === "Everything in Pro" ? "rgba(255,255,255,0.45)" : "rgba(255,255,255,0.82)", fontSize: "0.92rem" }}>
                                    <span style={{ color: f === "Everything in Pro" ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.5)", flexShrink: 0 }}>{f === "Everything in Pro" ? "↑" : "✓"}</span>{f}
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
                            borderRadius: "10px",
                            fontSize: "0.95rem",
                        }}>
                            Notify me when live
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Footer ── */}
            <footer style={{
                borderTop: "1px solid rgba(255,255,255,0.07)",
                padding: "2rem 0",
                textAlign: "center",
                color: "rgba(255,255,255,0.25)",
                fontSize: "0.85rem",
            }}>
                <p style={{ margin: 0 }}>
                    © {new Date().getFullYear()} VirtueCore · <Link href="/auth/login" style={{ color: "rgba(255,255,255,0.35)" }}>Sign in</Link>
                </p>
            </footer>
        </main>
    );
}
