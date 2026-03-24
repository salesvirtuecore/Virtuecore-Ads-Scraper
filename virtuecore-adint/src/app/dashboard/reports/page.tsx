"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import ui from "@/app/app-ui.module.css";
import type { ReportHistoryRow } from "@/lib/types";

export default function ReportsPage() {
    const [reports, setReports] = useState<ReportHistoryRow[]>([]);
    const [historyLimit, setHistoryLimit] = useState<number | null>(null);
    const [error, setError] = useState("");

    useEffect(() => {
        async function loadReports() {
            setError("");
            const res = await fetch("/api/reports", { cache: "no-store" });
            const data = await res.json().catch(() => null);
            if (!res.ok || !data) {
                setError(data?.error || "Unable to load reports.");
                return;
            }
            setReports((data.reports || []) as ReportHistoryRow[]);
            setHistoryLimit(typeof data.historyLimit === "number" ? data.historyLimit : null);
        }

        void loadReports();
    }, []);

    return (
        <section className={ui.card}>
            <h2>Report Library</h2>
            {historyLimit !== null && <p className={ui.subtle}>Showing latest {historyLimit} reports.</p>}
            {error && <p className={ui.error}>{error}</p>}
            <div className={ui.reportList}>
                {reports.map((r) => (
                    <Link key={r.id} href={`/dashboard/reports/${r.id}`} className={ui.reportItem}>
                        <strong>{r.report_type.toUpperCase()} report</strong>
                        <span>{r.industry || "Unknown industry"} • threshold {r.threshold_days ?? "—"}d</span>
                        <span>{r.ads_analyzed} ads analyzed</span>
                        <span>{new Date(r.created_at).toLocaleString()}</span>
                    </Link>
                ))}
                {!reports.length && !error && <p className={ui.subtle}>No reports yet.</p>}
            </div>
        </section>
    );
}
