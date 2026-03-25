import Link from "next/link";

import ui from "@/app/app-ui.module.css";
import HeroSection from "@/app/_components/HeroSection";
import LandingSections from "@/app/_components/LandingSections";

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

            {/* ── How it works + Pricing (scroll-animated) ── */}
            <LandingSections
                howItWorks={HOW_IT_WORKS}
                proFeatures={PRO_FEATURES}
                ultimateFeatures={ULTIMATE_FEATURES}
            />

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
