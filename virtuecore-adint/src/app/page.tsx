import Link from "next/link";

import ui from "@/app/app-ui.module.css";

type Props = {
    searchParams: Promise<{ billing?: string }>;
};

export default async function LandingPage({ searchParams }: Props) {
    const params = await searchParams;
    const billing = params.billing;

    return (
        <main className={ui.hero}>
            {billing === "success" && (
                <section className={`${ui.notice} ${ui.noticeVerified}`} style={{ margin: "0 auto", maxWidth: 640 }}>
                    <span className={ui.noticeIcon}>✓</span>
                    <div>
                        <strong>Subscription active.</strong> Your account has been upgraded.{" "}
                        <Link href="/dashboard" className={ui.inlineActionGold}>Go to dashboard →</Link>
                    </div>
                </section>
            )}

            {billing === "cancelled" && (
                <section className={`${ui.notice} ${ui.noticeDemo}`} style={{ margin: "0 auto", maxWidth: 640 }}>
                    <span className={ui.noticeIcon}>!</span>
                    <div>
                        Checkout was cancelled. No charge was made.{" "}
                        <Link href="/dashboard/upgrade" className={ui.inlineActionGold}>View plans →</Link>
                    </div>
                </section>
            )}

            <section className={ui.card}>
                <h1 className={ui.heroTitle}>Ad intelligence that turns competitor spend into your edge.</h1>
                <p className={ui.subtle}>
                    VirtueCore Ad Intel scans Meta ads, tracks what is winning, and builds strategy-ready reports for your brand or clients.
                </p>
                <div className={ui.ctaRow}>
                    <Link href="/auth/signup"><button type="button">Get Started</button></Link>
                    <Link href="/auth/login"><button type="button">Sign In</button></Link>
                </div>
            </section>

            <section className={ui.card}>
                <h2>What You Get</h2>
                <div className={ui.formCol}>
                    <p className={ui.subtle}>Live Meta ad scanner with source verification</p>
                    <p className={ui.subtle}>Report library stored in Supabase</p>
                    <p className={ui.subtle}>Tiered access with Stripe upgrade path</p>
                    <p className={ui.subtle}>n8n automation events for growth workflows</p>
                </div>
            </section>
        </main>
    );
}
