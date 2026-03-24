"use client";

import { FormEvent, useState } from "react";

import ui from "@/app/app-ui.module.css";
import type { AccountTier } from "@/lib/types";

import { useDashboard } from "../dashboard-context";

export default function AdminPage() {
    const { profile } = useDashboard();

    const [inviteEmail, setInviteEmail] = useState("");
    const [inviteName, setInviteName] = useState("");
    const [inviteBusinessName, setInviteBusinessName] = useState("");
    const [inviteIndustry, setInviteIndustry] = useState("");
    const [inviteRole, setInviteRole] = useState<"admin" | "client">("client");
    const [inviteTier, setInviteTier] = useState<AccountTier>("client");
    const [msg, setMsg] = useState("");

    async function createUser(e: FormEvent) {
        e.preventDefault();
        setMsg("");

        const res = await fetch("/api/admin/users", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                email: inviteEmail,
                full_name: inviteName,
                business_name: inviteBusinessName,
                industry: inviteIndustry,
                role: inviteRole,
                tier: inviteTier,
            }),
        });
        const data = await res.json().catch(() => null);

        if (!res.ok) {
            setMsg(data?.error || "Create user failed.");
            return;
        }

        const temp = typeof data?.temporary_password === "string" ? data.temporary_password : "(not returned)";
        setMsg(`User created. Temporary password: ${temp}`);
        setInviteEmail("");
        setInviteName("");
        setInviteBusinessName("");
        setInviteIndustry("");
    }

    if (profile.role !== "admin") {
        return (
            <section className={ui.card}>
                <h2>Admin Panel</h2>
                <p className={ui.error}>Admins only.</p>
            </section>
        );
    }

    return (
        <section className={ui.card}>
            <h2>Admin Panel</h2>
            <p className={ui.subtle}>Create users with role/tier assignment.</p>
            <form className={ui.grid4} onSubmit={createUser}>
                <input value={inviteName} onChange={(e) => setInviteName(e.target.value)} placeholder="Full name" required />
                <input value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="Email" type="email" required />
                <input value={inviteBusinessName} onChange={(e) => setInviteBusinessName(e.target.value)} placeholder="Business name" />
                <input value={inviteIndustry} onChange={(e) => setInviteIndustry(e.target.value)} placeholder="Industry" />
                <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value as "admin" | "client")}>
                    <option value="client">Client</option>
                    <option value="admin">Admin</option>
                </select>
                <select value={inviteTier} onChange={(e) => setInviteTier(e.target.value as AccountTier)}>
                    <option value="free">Free</option>
                    <option value="pro">Pro</option>
                    <option value="client">Client</option>
                </select>
                <button type="submit">Create Account</button>
            </form>
            {msg && <p className={ui.success}>{msg}</p>}
        </section>
    );
}
