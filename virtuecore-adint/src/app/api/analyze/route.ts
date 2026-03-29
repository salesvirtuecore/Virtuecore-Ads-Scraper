import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { generateAnalysis } from "@/lib/anthropic";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { AccountTier } from "@/lib/types";

const payloadSchema = z.object({
    ads: z.array(
        z.object({
            id: z.string(),
            page: z.string(),
            body: z.string(),
            days: z.number(),
            spend: z.string(),
            format: z.string(),
            cta: z.string(),
            hook: z.string(),
            headline: z.string(),
            targeting: z.string(),
            platforms: z.array(z.string()),
            snapshotUrl: z.string().optional().default(""),
            source: z.enum(["META_LIBRARY", "DEMO_MOCK"]),
            fetchedAt: z.string(),
        })
    ).min(1),
    clientBiz: z.string().min(1),
    industry: z.string().min(1),
    thresholdDays: z.number().int().positive(),
    scanQuery: z.string().default(""),
    searchId: z.string().uuid().optional(),
    reportType: z.enum(["basic", "full", "strategy"]).default("full"),
});

export async function POST(req: NextRequest) {
    const body = await req.json().catch(() => null);
    const parsed = payloadSchema.safeParse(body);
    if (!parsed.success) {
        return NextResponse.json({ error: "Invalid analysis payload." }, { status: 400 });
    }

    const supabase = await getSupabaseServerClient();
    if (!supabase) {
        return NextResponse.json({ error: "Supabase server client not configured." }, { status: 500 });
    }

    let orgId = "";
    let userId = "";
    let tier: AccountTier = "free";

    const auth = await supabase.auth.getUser();
    if (!auth.data.user?.id) {
        return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }
    userId = auth.data.user.id;

    const profile = await supabase
        .from("profiles")
        .select("org_id, tier")
        .eq("id", userId)
        .single();

    if (profile.error || !profile.data) {
        return NextResponse.json({ error: "Profile not found." }, { status: 404 });
    }

    orgId = profile.data.org_id;
    tier = (profile.data.tier || "free") as AccountTier;

    if (tier === "free" && parsed.data.reportType !== "basic") {
        return NextResponse.json({ error: "upgrade_required" }, { status: 403 });
    }

    try {
        const data = await generateAnalysis(parsed.data);

        await supabase.from("usage_events").insert({
            org_id: orgId,
            user_id: userId,
            event_type: "analysis",
        });

        await supabase.from("adint_reports").insert({
            org_id: orgId,
            created_by: userId,
            user_id: userId,
            search_id: parsed.data.searchId || null,
            report_type: parsed.data.reportType,
            content: data.parsed || { raw: data.raw },
            raw_content: data.raw,
            industry: parsed.data.industry,
            threshold_days: parsed.data.thresholdDays,
            ads_analyzed: parsed.data.ads.length,
            tokens_input: 0,
            tokens_output: 0,
            client_business: parsed.data.clientBiz,
            scan_query: parsed.data.scanQuery,
            payload: data.parsed,
            raw_text: data.raw,
        });

        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json({ error: error?.message || "Analysis failed." }, { status: 500 });
    }
}
