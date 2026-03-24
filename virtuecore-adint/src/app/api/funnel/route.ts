import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import FirecrawlApp from "@mendable/firecrawl-js";
import { z } from "zod";

import { getSupabaseServerClient } from "@/lib/supabase/server";

const funnelSchema = z.object({
    url: z.string().url("Must be a valid URL"),
});

export async function POST(req: NextRequest) {
    const body = await req.json().catch(() => null);
    const parsed = funnelSchema.safeParse(body);
    if (!parsed.success) {
        return NextResponse.json({ error: "Invalid URL." }, { status: 400 });
    }

    const { url } = parsed.data;

    const supabase = await getSupabaseServerClient();
    if (!supabase) {
        return NextResponse.json({ error: "Server client not configured." }, { status: 500 });
    }

    const auth = await supabase.auth.getUser();
    if (!auth.data.user?.id) {
        return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { data: profile } = await supabase
        .from("profiles")
        .select("tier, org_id")
        .eq("id", auth.data.user.id)
        .single();

    if (!profile || profile.tier !== "ultimate") {
        return NextResponse.json(
            { error: "Funnel Analyser requires the Ultimate plan." },
            { status: 403 }
        );
    }

    // Scrape the landing page with Firecrawl
    const firecrawlKey = process.env.FIRECRAWL_API_KEY;
    if (!firecrawlKey) {
        return NextResponse.json({ error: "Firecrawl not configured." }, { status: 500 });
    }

    let pageContent = "";
    try {
        const fc = new FirecrawlApp({ apiKey: firecrawlKey });
        const result = await fc.scrapeUrl(url, { formats: ["markdown"] });
        if (result.success && result.markdown) {
            pageContent = result.markdown.slice(0, 12000); // cap tokens
        } else {
            return NextResponse.json({ error: "Failed to scrape the URL. Check it is publicly accessible." }, { status: 422 });
        }
    } catch {
        return NextResponse.json({ error: "Firecrawl scrape failed. Check the URL and try again." }, { status: 422 });
    }

    // Analyse with Claude
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const systemPrompt = `You are a conversion copywriting expert and funnel strategist.
You analyse competitor landing pages and return a structured JSON breakdown.
Return ONLY valid JSON — no markdown fences, no prose outside the JSON object.`;

    const userPrompt = `Analyse this competitor landing page content and return a JSON object with these exact keys:

{
  "pageTitle": "string — inferred page/brand name",
  "targetAudience": "string — who this page is written for",
  "coreOffer": "string — the primary value proposition in one sentence",
  "headline": "string — the main hero headline",
  "subheadline": "string — supporting headline or tagline",
  "painPoints": ["array of strings — customer pains addressed"],
  "desireOutcomes": ["array of strings — desired outcomes promised"],
  "socialProof": ["array of strings — testimonials, stats, logos mentioned"],
  "cta": "string — primary call to action text",
  "ctaPlacement": "string — where CTA appears (above fold / mid / end / multiple)",
  "urgencyTactics": ["array of strings — any scarcity, urgency, or FOMO elements"],
  "objectionHandlers": ["array of strings — guarantees, FAQs, risk-reversals"],
  "pricingMentioned": "string — any pricing info visible, or 'not shown'",
  "funnelType": "string — e.g. VSL, long-form sales letter, opt-in, webinar, product page",
  "copyTone": "string — e.g. authority, urgency, empathy, aspirational",
  "swipeableHooks": ["array of 3 hooks from this page you could adapt for ads"],
  "strengths": ["array of 3 things this funnel does well"],
  "gaps": ["array of 3 weaknesses or missing elements"],
  "recommendation": "string — 2-3 sentence strategic summary of how to beat this funnel"
}

PAGE CONTENT:
${pageContent}`;

    try {
        const message = await anthropic.messages.create({
            model: "claude-sonnet-4-20250514",
            max_tokens: 2048,
            messages: [{ role: "user", content: userPrompt }],
            system: systemPrompt,
        });

        const raw = message.content[0].type === "text" ? message.content[0].text : "";
        let analysis: Record<string, unknown>;
        try {
            analysis = JSON.parse(raw);
        } catch {
            // Try to extract JSON from the response
            const match = raw.match(/\{[\s\S]+\}/);
            if (match) {
                analysis = JSON.parse(match[0]);
            } else {
                return NextResponse.json({ error: "Failed to parse AI analysis." }, { status: 500 });
            }
        }

        // Log usage event
        await supabase.from("usage_events").insert({
            org_id: profile?.org_id ?? null,
            user_id: auth.data.user.id,
            event_type: "funnel_analysis",
        });

        return NextResponse.json({ analysis, url, scrapedAt: new Date().toISOString() });
    } catch {
        return NextResponse.json({ error: "AI analysis failed." }, { status: 500 });
    }
}
