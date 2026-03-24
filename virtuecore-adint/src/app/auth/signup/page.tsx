"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";

import ui from "@/app/app-ui.module.css";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

const INDUSTRIES = ["Coaching", "Ecommerce", "Real Estate", "SaaS", "Agency", "Health", "Finance", "Other"];

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
                data: {
                    full_name: fullName,
                    business_name: businessName,
                    industry,
                },
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
        <main className={ui.authWrap}>
            <section className={ui.card}>
                <h1>Create Account</h1>
                <p className={ui.subtle}>Lead capture + signup flow with Supabase Auth.</p>
                <form className={ui.formCol} onSubmit={signUp}>
                    <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Full name" required />
                    <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="Email" required />
                    <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" minLength={8} placeholder="Password" required />
                    <input value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="Business name" required />
                    <select value={industry} onChange={(e) => setIndustry(e.target.value)}>
                        {INDUSTRIES.map((item) => <option key={item} value={item}>{item}</option>)}
                    </select>
                    <button type="submit" disabled={loading}>{loading ? "Creating..." : "Create Account"}</button>
                    {error && <p className={ui.error}>{error}</p>}
                    {message && <p className={ui.success}>{message}</p>}
                </form>
                <p className={ui.subtle}>Already have access? <Link href="/auth/login">Sign in</Link>.</p>
            </section>
        </main>
    );
}
