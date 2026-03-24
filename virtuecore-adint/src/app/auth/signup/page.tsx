"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";

const INDUSTRIES = ["Coaching", "Ecommerce", "Real Estate", "SaaS", "Agency", "Health", "Finance", "Other"];

const PROOF_POINTS = [
    "Scan the Meta Ads Library for any niche",
    "Identify ads running 3+ months — the profitable ones",
    "Claude-powered competitive intelligence reports",
    "Hook patterns, offer breakdowns, ad copy drafts",
];

export default function SignupPage() {
    const supabase = useMemo(() => getSupabaseBrowserClient(), []);

    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [businessName, setBusinessName] = useState("");
    const [industry, setIndustry] = useState("Coaching");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    async function signUp(e: FormEvent) {
        e.preventDefault();
        setError("");
        setMessage("");

        if (!supabase) {
            setError("Supabase client is not configured.");
            return;
        }

        setLoading(true);
        const { error: signUpError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { full_name: fullName, business_name: businessName, industry },
            },
        });
        setLoading(false);

        if (signUpError) {
            setError(signUpError.message);
            return;
        }

        setMessage("Account created. Check your email to confirm, then sign in.");
    }

    return (
        <>
            <style>{`
                @keyframes fadeUp {
                    from { opacity: 0; transform: translateY(22px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to   { opacity: 1; }
                }
                @keyframes shimmer {
                    0%   { background-position: -200% center; }
                    100% { background-position: 200% center; }
                }
                .vc-signup-field {
                    width: 100%;
                    background: rgba(255,255,255,0.055);
                    border: 1px solid rgba(255,255,255,0.13);
                    border-radius: 12px;
                    padding: 0.85rem 1rem;
                    color: #fff;
                    font-family: var(--font-sans);
                    font-size: 0.97rem;
                    transition: border-color 0.18s ease, background 0.18s ease, box-shadow 0.18s ease;
                    outline: none;
                    box-sizing: border-box;
                }
                .vc-signup-field::placeholder {
                    color: rgba(255,255,255,0.3);
                }
                .vc-signup-field:focus {
                    border-color: rgba(229,191,68,0.65);
                    background: rgba(229,191,68,0.05);
                    box-shadow: 0 0 0 3px rgba(229,191,68,0.1);
                }
                .vc-signup-field option {
                    background: #111;
                    color: #fff;
                }
                .vc-signup-btn {
                    width: 100%;
                    padding: 0.95rem;
                    border-radius: 12px;
                    border: none;
                    background: linear-gradient(120deg, #f0cb54, #cc9519);
                    color: #1e1703;
                    font-family: var(--font-sans);
                    font-size: 1rem;
                    font-weight: 700;
                    letter-spacing: 0.02em;
                    cursor: pointer;
                    transition: opacity 0.15s ease, transform 0.15s ease, box-shadow 0.15s ease;
                    box-shadow: 0 4px 20px rgba(229,191,68,0.25);
                }
                .vc-signup-btn:hover:not(:disabled) {
                    opacity: 0.92;
                    transform: translateY(-1px);
                    box-shadow: 0 6px 28px rgba(229,191,68,0.35);
                }
                .vc-signup-btn:disabled {
                    opacity: 0.55;
                    cursor: not-allowed;
                    transform: none;
                }
                .proof-item {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    color: rgba(255,255,255,0.65);
                    font-size: 0.92rem;
                    line-height: 1.4;
                }
            `}</style>

            <main style={{
                minHeight: "100vh",
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                animation: "fadeIn 0.4s ease both",
            }}>

                {/* ── Left: Brand panel ── */}
                <div style={{
                    padding: "3rem 4rem",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    gap: "2.5rem",
                    animation: "fadeUp 0.55s ease both",
                    animationDelay: "0.05s",
                }}>
                    <div>
                        <p style={{
                            color: "rgba(229,191,68,0.75)",
                            fontSize: "0.72rem",
                            fontWeight: 700,
                            letterSpacing: "0.22em",
                            textTransform: "uppercase",
                            margin: "0 0 1.25rem",
                        }}>
                            VirtueCore · Ad Intelligence
                        </p>

                        <h1 style={{
                            fontFamily: "var(--font-display)",
                            fontSize: "clamp(2.2rem, 3.5vw, 3.2rem)",
                            fontWeight: 700,
                            lineHeight: 1.12,
                            letterSpacing: "-0.01em",
                            margin: "0 0 1.25rem",
                            background: "linear-gradient(135deg, #ffffff 45%, rgba(229,191,68,0.8) 100%)",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                            backgroundClip: "text",
                        }}>
                            Your competitors&apos;<br />
                            <em style={{ fontStyle: "italic" }}>best ads</em><br />
                            are already running.
                        </h1>

                        <p style={{
                            color: "rgba(255,255,255,0.5)",
                            fontSize: "1.05rem",
                            lineHeight: 1.65,
                            margin: 0,
                            maxWidth: 380,
                        }}>
                            Find out exactly what&apos;s working in your market — before your next campaign goes live.
                        </p>
                    </div>

                    <div style={{ display: "grid", gap: "0.85rem" }}>
                        {PROOF_POINTS.map((point, i) => (
                            <div
                                key={point}
                                className="proof-item"
                                style={{
                                    animation: "fadeUp 0.5s ease both",
                                    animationDelay: `${0.2 + i * 0.07}s`,
                                }}
                            >
                                <span style={{
                                    width: 22,
                                    height: 22,
                                    borderRadius: "50%",
                                    background: "rgba(229,191,68,0.15)",
                                    border: "1px solid rgba(229,191,68,0.35)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    flexShrink: 0,
                                    fontSize: "0.7rem",
                                    color: "#e5bf44",
                                    fontWeight: 700,
                                }}>✓</span>
                                {point}
                            </div>
                        ))}
                    </div>

                    <p style={{
                        color: "rgba(255,255,255,0.2)",
                        fontSize: "0.82rem",
                        margin: 0,
                        animation: "fadeUp 0.5s ease both",
                        animationDelay: "0.55s",
                    }}>
                        Free plan available · No credit card required
                    </p>
                </div>

                {/* ── Right: Form panel ── */}
                <div style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "2.5rem 2rem",
                    borderLeft: "1px solid rgba(255,255,255,0.06)",
                    animation: "fadeUp 0.55s ease both",
                    animationDelay: "0.12s",
                }}>
                    <div style={{
                        width: "min(420px, 100%)",
                        background: "rgba(255,255,255,0.03)",
                        border: "1px solid rgba(255,255,255,0.09)",
                        borderRadius: "24px",
                        padding: "2.5rem",
                        display: "grid",
                        gap: "1.5rem",
                    }}>
                        <div>
                            <h2 style={{
                                fontFamily: "var(--font-display)",
                                fontSize: "1.75rem",
                                fontWeight: 700,
                                margin: "0 0 0.4rem",
                                letterSpacing: "-0.01em",
                            }}>
                                Create your account
                            </h2>
                            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.9rem", margin: 0 }}>
                                Takes 30 seconds. No card needed.
                            </p>
                        </div>

                        <form
                            onSubmit={signUp}
                            style={{ display: "grid", gap: "0.75rem" }}
                        >
                            <input
                                className="vc-signup-field"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                placeholder="Full name"
                                required
                                autoComplete="name"
                            />
                            <input
                                className="vc-signup-field"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                type="email"
                                placeholder="Work email"
                                required
                                autoComplete="email"
                            />
                            <input
                                className="vc-signup-field"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                type="password"
                                minLength={8}
                                placeholder="Password (min 8 characters)"
                                required
                                autoComplete="new-password"
                            />
                            <input
                                className="vc-signup-field"
                                value={businessName}
                                onChange={(e) => setBusinessName(e.target.value)}
                                placeholder="Business name"
                                required
                            />
                            <select
                                className="vc-signup-field"
                                value={industry}
                                onChange={(e) => setIndustry(e.target.value)}
                            >
                                {INDUSTRIES.map((item) => (
                                    <option key={item} value={item}>{item}</option>
                                ))}
                            </select>

                            <div style={{ paddingTop: "0.25rem" }}>
                                <button type="submit" className="vc-signup-btn" disabled={loading}>
                                    {loading ? "Creating account..." : "Create free account →"}
                                </button>
                            </div>

                            {error && (
                                <p style={{
                                    margin: 0,
                                    padding: "0.65rem 0.85rem",
                                    background: "rgba(239,68,68,0.1)",
                                    border: "1px solid rgba(239,68,68,0.25)",
                                    borderRadius: "8px",
                                    color: "#f87171",
                                    fontSize: "0.88rem",
                                }}>{error}</p>
                            )}
                            {message && (
                                <p style={{
                                    margin: 0,
                                    padding: "0.65rem 0.85rem",
                                    background: "rgba(34,197,94,0.1)",
                                    border: "1px solid rgba(34,197,94,0.25)",
                                    borderRadius: "8px",
                                    color: "#4ade80",
                                    fontSize: "0.88rem",
                                }}>{message}</p>
                            )}
                        </form>

                        <p style={{
                            color: "rgba(255,255,255,0.35)",
                            fontSize: "0.88rem",
                            margin: 0,
                            textAlign: "center",
                        }}>
                            Already have an account?{" "}
                            <Link href="/auth/login" style={{ color: "rgba(229,191,68,0.8)", textDecoration: "none", fontWeight: 600 }}>
                                Sign in
                            </Link>
                        </p>
                    </div>
                </div>
            </main>
        </>
    );
}
