"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

import ui from "@/app/app-ui.module.css";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setError("");
        setMessage("");
        setLoading(true);

        const res = await fetch("/api/auth/forgot-password", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email }),
        });

        setLoading(false);

        if (!res.ok) {
            setError("Something went wrong. Please try again.");
            return;
        }

        setMessage("If that email is registered, a reset link has been sent. Check your inbox.");
    }

    return (
        <main className={ui.authWrap}>
            <section className={ui.card}>
                <h1>Reset Password</h1>
                <p className={ui.subtle}>Enter your email and we will send you a reset link.</p>
                <form className={ui.formCol} onSubmit={handleSubmit}>
                    <input
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        type="email"
                        placeholder="Email"
                        required
                    />
                    <button type="submit" disabled={loading}>
                        {loading ? "Sending..." : "Send Reset Link"}
                    </button>
                    {error && <p className={ui.error}>{error}</p>}
                    {message && <p className={ui.success}>{message}</p>}
                </form>
                <p className={ui.subtle}>
                    <Link href="/auth/login">Back to sign in</Link>
                </p>
            </section>
        </main>
    );
}
