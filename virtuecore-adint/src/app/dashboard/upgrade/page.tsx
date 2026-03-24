"use client";

import { useState } from "react";

import ui from "@/app/app-ui.module.css";

const TIERS = [
    {
        name: "Free",
        price: "£0",
        bullets: ["Basic reports", "Limited weekly scans", "Starter insights"],
    },
    {
        name: "Pro",
        price: "£67 / month",
        bullets: ["Full strategy reports", "Higher scan limits", "Priority support"],
    },
    {
        name: "Client",
        price: "Managed",
        bullets: ["Agency-level scale", "Custom workflows", "Dedicated support"],
    },
];

export default function UpgradePage() {
    const [msg, setMsg] = useState("");
    const [loadingCycle, setLoadingCycle] = useState<"monthly" | "annual" | "">("");

    async function startCheckout(billing_cycle: "monthly" | "annual") {
        setLoadingCycle(billing_cycle);
        setMsg("");

        const res = await fetch("/api/stripe/checkout", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ billing_cycle }),
        });

        const data = await res.json().catch(() => null);
        setLoadingCycle("");

        if (!res.ok || !data?.url) {
            setMsg(data?.error || "Unable to start checkout.");
            return;
        }

        window.location.href = data.url;
    }

    return (
        <>
            <section className={ui.grid3}>
                {TIERS.map((tier) => (
                    <article key={tier.name} className={ui.card}>
                        <h3>{tier.name}</h3>
                        <p><strong>{tier.price}</strong></p>
                        {tier.bullets.map((bullet) => <p key={bullet} className={ui.subtle}>{bullet}</p>)}
                    </article>
                ))}
            </section>

            <section className={ui.card}>
                <h2>Checkout</h2>
                <div className={ui.grid2}>
                    <button type="button" onClick={() => startCheckout("monthly")} disabled={loadingCycle !== ""}>
                        {loadingCycle === "monthly" ? "Redirecting..." : "Go Pro Monthly"}
                    </button>
                    <button type="button" onClick={() => startCheckout("annual")} disabled={loadingCycle !== ""}>
                        {loadingCycle === "annual" ? "Redirecting..." : "Go Pro Annual"}
                    </button>
                </div>
                {msg && <p className={ui.error}>{msg}</p>}
            </section>
        </>
    );
}
