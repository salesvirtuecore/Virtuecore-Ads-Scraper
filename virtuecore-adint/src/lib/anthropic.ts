import type { AdRecord } from "@/lib/types";

export async function generateAnalysis(args: {
    ads: AdRecord[];
    clientBiz: string;
    industry: string;
    thresholdDays: number;
}) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
        throw new Error("ANTHROPIC_API_KEY is not configured.");
    }

    const { ads, clientBiz, industry, thresholdDays } = args;
    const adSummary = ads
        .map((a, i) => `AD ${i + 1} — \"${a.page}\"\nHeadline: ${a.headline}\nHook: ${a.hook}\nCopy: ${a.body}\nCTA: ${a.cta}\nDays Active: ${a.days}`)
        .join("\n\n");

    const prompt = `You are a senior Meta ads strategist at VirtueCore. Produce a competitive intelligence report for "${clientBiz}" (Industry: ${industry}). Winning threshold is ${thresholdDays}+ days. Return ONLY valid JSON with keys: landscape, winningAds, hookPatterns, offerPatterns, copyInsights, targetingInsights, creativeFormats, repurposedAds, recommendations, opportunityGap.\n\nAD DATA:\n${adSummary}`;

    const res = await fetch("https://api.anthropic.com/v1/messages", {
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

    const data = await res.json();
    if (!res.ok || data?.error) {
        throw new Error(data?.error?.message || "Anthropic request failed.");
    }

    const raw = (data.content || []).map((b: { type: string; text?: string }) => b?.text ?? "").join("");
    let parsed = null;
    try {
        parsed = JSON.parse(raw.replace(/```json|```/g, "").trim());
    } catch {
        parsed = null;
    }

    return { raw, parsed };
}
