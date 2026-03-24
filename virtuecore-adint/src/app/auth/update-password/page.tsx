"use client";

import { FormEvent, Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import ui from "@/app/app-ui.module.css";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

function UpdatePasswordForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const supabase = useMemo(() => getSupabaseBrowserClient(), []);

    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [ready, setReady] = useState(false);

    useEffect(() => {
        if (!supabase) {
            setReady(true);
            return;
        }

        const code = searchParams?.get("code");
        if (!code) {
            setReady(true);
            return;
        }

        supabase.auth.exchangeCodeForSession(code).then(({ error: codeError }) => {
            if (codeError) setError(codeError.message);
            setReady(true);
        });
    }, [supabase, searchParams]);

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setError("");

        if (password !== confirm) {
            setError("Passwords do not match.");
            return;
        }

        if (!supabase) {
            setError("Supabase client is not configured.");
            return;
        }

        setLoading(true);
        const { error: updateError } = await supabase.auth.updateUser({ password });
        setLoading(false);

        if (updateError) {
            setError(updateError.message);
            return;
        }

        router.replace("/dashboard");
    }

    if (!ready) {
        return <p className={ui.subtle}>Verifying reset link...</p>;
    }

    return (
        <>
            <h1>Set New Password</h1>
            <p className={ui.subtle}>Choose a new password for your account.</p>
            <form className={ui.formCol} onSubmit={handleSubmit}>
                <input
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    type="password"
                    minLength={8}
                    placeholder="New password"
                    required
                />
                <input
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    type="password"
                    minLength={8}
                    placeholder="Confirm new password"
                    required
                />
                <button type="submit" disabled={loading}>
                    {loading ? "Updating..." : "Update Password"}
                </button>
                {error && <p className={ui.error}>{error}</p>}
            </form>
        </>
    );
}

export default function UpdatePasswordPage() {
    return (
        <main className={ui.authWrap}>
            <section className={ui.card}>
                <Suspense fallback={<p className={ui.subtle}>Loading...</p>}>
                    <UpdatePasswordForm />
                </Suspense>
            </section>
        </main>
    );
}
