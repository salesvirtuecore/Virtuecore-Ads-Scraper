"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export default function LoginPage() {
    const router = useRouter();
    const supabase = useMemo(() => getSupabaseBrowserClient(), []);

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    async function signIn(e: FormEvent) {
        e.preventDefault();
        setError("");

        if (!supabase) {
            setError("Supabase client is not configured.");
            return;
        }

        setLoading(true);
        const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
        setLoading(false);

        if (authError) {
            setError(authError.message);
            return;
        }

        router.replace("/dashboard");
    }

    return (
        <>
            <style>{`
                @keyframes fadeUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                .vc-field {
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
                .vc-field::placeholder { color: rgba(255,255,255,0.3); }
                .vc-field:focus {
                    border-color: rgba(229,191,68,0.65);
                    background: rgba(229,191,68,0.05);
                    box-shadow: 0 0 0 3px rgba(229,191,68,0.1);
                }
                .vc-btn {
                    width: 100%;
                    padding: 0.95rem;
                    border-radius: 12px;
                    border: none;
                    background: linear-gradient(120deg, #f0cb54, #cc9519);
                    color: #1e1703;
                    font-family: var(--font-sans);
                    font-size: 1rem;
                    font-weight: 700;
                    cursor: pointer;
                    transition: opacity 0.15s ease, transform 0.15s ease, box-shadow 0.15s ease;
                    box-shadow: 0 4px 20px rgba(229,191,68,0.25);
                }
                .vc-btn:hover:not(:disabled) {
                    opacity: 0.92;
                    transform: translateY(-1px);
                    box-shadow: 0 6px 28px rgba(229,191,68,0.35);
                }
                .vc-btn:disabled { opacity: 0.55; cursor: not-allowed; }
            `}</style>

            <main style={{
                minHeight: "100vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "2rem 1rem",
            }}>
                <div style={{
                    width: "min(440px, 100%)",
                    animation: "fadeUp 0.5s ease both",
                    display: "grid",
                    gap: "2rem",
                }}>
                    {/* Brand */}
                    <div style={{ textAlign: "center", animation: "fadeUp 0.5s ease both", animationDelay: "0.05s" }}>
                        <p style={{
                            color: "rgba(229,191,68,0.75)",
                            fontSize: "0.7rem",
                            fontWeight: 700,
                            letterSpacing: "0.22em",
                            textTransform: "uppercase",
                            margin: "0 0 1rem",
                        }}>
                            VirtueCore · Ad Intelligence
                        </p>
                        <h1 style={{
                            fontFamily: "var(--font-display)",
                            fontSize: "clamp(1.9rem, 4vw, 2.6rem)",
                            fontWeight: 700,
                            letterSpacing: "-0.01em",
                            margin: "0 0 0.5rem",
                            background: "linear-gradient(135deg, #ffffff 45%, rgba(229,191,68,0.8) 100%)",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                            backgroundClip: "text",
                        }}>
                            Welcome back.
                        </h1>
                        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.95rem", margin: 0 }}>
                            Sign in to your Ad Intelligence account.
                        </p>
                    </div>

                    {/* Card */}
                    <div style={{
                        background: "rgba(255,255,255,0.03)",
                        border: "1px solid rgba(255,255,255,0.09)",
                        borderRadius: "24px",
                        padding: "2.25rem",
                        display: "grid",
                        gap: "1.25rem",
                        animation: "fadeUp 0.5s ease both",
                        animationDelay: "0.1s",
                    }}>
                        <form onSubmit={signIn} style={{ display: "grid", gap: "0.75rem" }}>
                            <input
                                className="vc-field"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                type="email"
                                placeholder="Email address"
                                required
                                autoComplete="email"
                            />
                            <input
                                className="vc-field"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                type="password"
                                placeholder="Password"
                                required
                                autoComplete="current-password"
                            />

                            <div style={{ display: "flex", justifyContent: "flex-end" }}>
                                <Link href="/auth/forgot-password" style={{
                                    color: "rgba(229,191,68,0.65)",
                                    fontSize: "0.85rem",
                                    textDecoration: "none",
                                    fontWeight: 500,
                                }}>
                                    Forgot password?
                                </Link>
                            </div>

                            <button type="submit" className="vc-btn" disabled={loading}>
                                {loading ? "Signing in..." : "Sign in →"}
                            </button>

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
                        </form>

                        <p style={{
                            color: "rgba(255,255,255,0.35)",
                            fontSize: "0.88rem",
                            margin: 0,
                            textAlign: "center",
                        }}>
                            No account?{" "}
                            <Link href="/auth/signup" style={{ color: "rgba(229,191,68,0.8)", textDecoration: "none", fontWeight: 600 }}>
                                Create one free
                            </Link>
                        </p>
                    </div>
                </div>
            </main>
        </>
    );
}
