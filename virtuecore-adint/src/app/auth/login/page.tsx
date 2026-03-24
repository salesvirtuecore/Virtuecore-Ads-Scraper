"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import ui from "@/app/app-ui.module.css";
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
        <main className={ui.authWrap}>
            <section className={ui.card}>
                <h1>Sign In</h1>
                <p className={ui.subtle}>Use your invitation credentials to access VirtueCore Ad Intel.</p>
                <form className={ui.formCol} onSubmit={signIn}>
                    <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="Email" required />
                    <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Password" required />
                    <button type="submit" disabled={loading}>{loading ? "Signing In..." : "Sign In"}</button>
                    {error && <p className={ui.error}>{error}</p>}
                </form>
                <p className={ui.subtle}><Link href="/auth/forgot-password">Forgot your password?</Link></p>
                <p className={ui.subtle}>Need an account? <Link href="/auth/signup">Create one</Link>.</p>
            </section>
        </main>
    );
}
