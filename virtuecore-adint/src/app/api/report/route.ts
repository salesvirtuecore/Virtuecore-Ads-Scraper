import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import { fireZapierEvent } from "@/lib/zapier";
import type { AccountTier, AdRecord } from "@/lib/types";

const adSchema = z.object({
    id: z.string(),
    page: z.string(),
    pageId: z.string().optional(),
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
    creativeLinkUrl: z.string().optional(),
    startTime: z.string().optional(),
    deliveryStatus: z.string().optional(),
    source: z.enum(["META_LIBRARY", "DEMO_MOCK"]),
    fetchedAt: z.string(),
});

const payloadSchema = z.object({
    search_id: z.string().uuid().optional(),
    report_type: z.enum(["basic", "full", "strategy"]),
    selected_ads: z.array(z.union([z.string(), adSchema])).min(1),
    client_business: z.string().trim().min(1).max(120).optional(),
    industry: z.string().min(1),
    threshold_days: z.number().int().positive(),
});

function buildPrompt(args: {
    selectedAds: AdRecord[];
    clientBusiness: string;
    industry: string;
    thresholdDays: number;
    reportType: "basic" | "full" | "strategy";
}): string {
    const { selectedAds, clientBusiness, industry, thresholdDays, reportType } = args;

    const adSummary = selectedAds
        .map((a, i) => `AD ${i + 1} — "${a.page}"\nHeadline: ${a.headline}\nHook Type: ${a.hook}\nCopy: ${a.body}\nCTA: "${a.cta}" | Format: ${a.format} | Platforms: ${a.platforms.join(",")}\nDays Active: ${a.days}${a.days >= thresholdDays ? " ← WINNING (3+ months)" : ""}\nTargeting: ${a.targeting}`)
        .join("\n\n");

    const winningAds = selectedAds.filter((a) => a.days >= thresholdDays);

    const basePrompt = `You are a senior Meta ads strategist at VirtueCore, a UK marketing agency. Produce a competitive intelligence report for: "${clientBusiness}" (Industry: ${industry}).

FRAMEWORK: Identify ads running 3+ months (${thresholdDays}+ days) — these are profitable. Study angles, offers, headlines, copy length, and targeting signals.

WINNING ADS IN THIS DATASET: ${winningAds.length} of ${selectedAds.length} have run 3+ months.

AD DATA:
${adSummary}

Return ONLY valid JSON (no markdown, no preamble):
{
  "landscape": "2–3 sentence overview of competitive landscape and positioning gaps",
  "winningAds": [
    {"page":"name","days":0,"hook":"type","headline":"headline","angle":"what angle/positioning they're using","offer":"what they're offering and how","copyLength":"short/medium/long","targeting":"inferred audience","whyWorking":"why this ad has lasted 3+ months"}
  ],
  "hookPatterns": [
    {"type":"hook name","frequency":"X of ${selectedAds.length} ads","description":"why this trigger works in this market"}
  ],
  "offerPatterns": "2–3 sentences on how competitors structure offers, risk reversal, pricing",
  "copyInsights": "2–3 sentences on copy length, style, and what's working",
  "targetingInsights": "2–3 sentences on inferred targeting patterns and audience signals",
  "creativeFormats": "2–3 sentences on what formats dominate and why",
  "repurposedAds": [
    {"hookType":"type","headline":"headline for ${clientBusiness}","hook":"opening line","body":"2–4 sentence body copy for ${clientBusiness}","cta":"call to action"},
    {"hookType":"type","headline":"headline for ${clientBusiness}","hook":"opening line","body":"2–4 sentence body copy for ${clientBusiness}","cta":"call to action"},
    {"hookType":"type","headline":"headline for ${clientBusiness}","hook":"opening line","body":"2–4 sentence body copy for ${clientBusiness}","cta":"call to action"}
  ],
  "recommendations": [
    "Specific recommendation 1 for ${clientBusiness}",
    "Specific recommendation 2 for ${clientBusiness}",
    "Specific recommendation 3 for ${clientBusiness}",
    "Specific recommendation 4 for ${clientBusiness}",
    "Specific recommendation 5 for ${clientBusiness}"
  ],
  "opportunityGap": "1–2 sentences on the biggest positioning gap ${clientBusiness} can exploit"
}`;

    const tierAddition =
        reportType === "basic"
            ? `\n\nBasic report prompt additions: Keep analysis surface-level. Identify patterns and active advertisers but do NOT provide strategic recommendations, budget guidance, or creative suggestions. End with this exact CTA: 'Want the full competitive strategy breakdown? Upgrade to Pro or book a free strategy call with our team.'`
            : reportType === "full"
                ? `\n\nFull report prompt additions: Provide detailed competitive analysis including creative format breakdown, messaging analysis, estimated targeting approaches, strengths/weaknesses per competitor, opportunities and threats. Be specific and actionable.`
                : `\n\nStrategy report prompt additions: Provide everything in a full analysis PLUS: recommended counter-strategies with specific ad angles, creative format recommendations, budget allocation guidance, and a prioritised 30-day action plan broken into weekly actions. Use the competitor data as evidence for every recommendation. End with: 'Need help executing this strategy? VirtueCore can manage your entire ad operation. Book a free strategy call.'`;

    return `${basePrompt}${tierAddition}`;
}

export async function POST(req: NextRequest) {
    const body = await req.json().catch(() => null);
    const parsed = payloadSchema.safeParse(body);
    if (!parsed.success) {
        return NextResponse.json({ error: "Invalid report payload." }, { status: 400 });
    }

    const supabase = await getSupabaseServerClient();
    if (!supabase) {
        return NextResponse.json({ error: "Supabase server client not configured." }, { status: 500 });
    }

    const auth = await supabase.auth.getUser();
    const userId = auth.data.user?.id;
    if (!userId) {
        return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const profileRes = await supabase
        .from("profiles")
        .select("org_id, full_name, business_name, email, tier")
        .eq("id", userId)
        .single();

    if (profileRes.error || !profileRes.data) {
        return NextResponse.json({ error: "Profile not found." }, { status: 404 });
    }

    const tier = (profileRes.data.tier || "free") as AccountTier;
    const { search_id, report_type, selected_ads, client_business, industry, threshold_days } = parsed.data;

    if (tier === "free" && report_type !== "basic") {
        return NextResponse.json({ error: "upgrade_required" }, { status: 403 });
    }

    let scanQuery = "";
    const byId = new Map<string, AdRecord>();

    if (search_id) {
        const searchRes = await supabase
            .from("searches")
            .select("id, query, ads_data")
            .eq("id", search_id)
            .eq("user_id", userId)
            .single();

        if (!searchRes.error && searchRes.data) {
            scanQuery = searchRes.data.query || "";
            const fromSearch = Array.isArray(searchRes.data.ads_data) ? (searchRes.data.ads_data as AdRecord[]) : [];
            for (const a of fromSearch) byId.set(a.id, a);
        }
    }

    const selectedAds: AdRecord[] = selected_ads
        .map((item) => {
            if (typeof item === "string") return byId.get(item) || null;
            return item as AdRecord;
        })
        .filter((a): a is AdRecord => !!a);

    if (!selectedAds.length) {
        return NextResponse.json({ error: "No valid selected ads." }, { status: 400 });
    }

    const clientBusiness =
        client_business?.trim() ||
        profileRes.data.business_name?.trim() ||
        profileRes.data.full_name?.trim() ||
        "the client";

    const prompt = buildPrompt({
        selectedAds,
        clientBusiness,
        industry,
        thresholdDays: threshold_days,
        reportType: report_type,
    });

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
        return NextResponse.json({ error: "ANTHROPIC_API_KEY is not configured." }, { status: 500 });
    }

    const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey,
            "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
            model: "claude-sonnet-4-20250514",
            max_tokens: 4000,
            messages: [{ role: "user", content: prompt }],
        }),
    });

    const anthropicData = await anthropicRes.json().catch(() => null);
    if (!anthropicRes.ok || anthropicData?.error) {
        return NextResponse.json(
            { error: anthropicData?.error?.message || "Anthropic request failed." },
            { status: 500 }
        );
    }

    const raw = (anthropicData?.content || []).map((b: { text?: string }) => b?.text || "").join("");
    let parsedJson: unknown = null;
    try {
        parsedJson = JSON.parse(raw.replace(/```json|```/g, "").trim());
    } catch {
        parsedJson = null;
    }

    const usage = anthropicData?.usage || {};
    const tokensInput = Number(usage?.input_tokens || 0);
    const tokensOutput = Number(usage?.output_tokens || 0);

    const insertRes = await supabase
        .from("reports")
        .insert({
            org_id: profileRes.data.org_id,
            created_by: userId,
            user_id: userId,
            search_id: search_id || null,
            report_type,
            content: parsedJson || { raw },
            raw_content: raw,
            industry,
            threshold_days,
            ads_analyzed: selectedAds.length,
            tokens_input: tokensInput,
            tokens_output: tokensOutput,
            client_business: clientBusiness,
            scan_query: scanQuery,
            payload: parsedJson,
            raw_text: raw,
        })
        .select("id")
        .single();

    if (insertRes.error) {
        return NextResponse.json({ error: insertRes.error.message }, { status: 500 });
    }

    fireZapierEvent({
        event: "report_generated",
        userId,
        orgId: profileRes.data.org_id,
        email: profileRes.data.email,
        meta: {
            reportType: report_type,
            reportId: insertRes.data?.id,
            searchId: search_id,
            adsAnalyzed: selectedAds.length,
            tier,
            tokensInput,
            tokensOutput,
        },
    });

    return NextResponse.json({
        report_id: insertRes.data?.id,
        report_type,
        parsed: parsedJson,
        raw,
        tokens_input: tokensInput,
        tokens_output: tokensOutput,
    });
}
