import { NextResponse } from "next/server";

import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
    const supabase = await getSupabaseServerClient();
    if (!supabase) {
        return NextResponse.json({ error: "Supabase server client not configured." }, { status: 500 });
    }

    const auth = await supabase.auth.getUser();
    const userId = auth.data.user?.id;
    if (!userId) {
        return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const profile = await supabase
        .from("profiles")
        .select("role, tier")
        .eq("id", userId)
        .single();

    if (profile.error || !profile.data) {
        return NextResponse.json({ error: "Profile not found." }, { status: 404 });
    }

    const isAdmin = profile.data.role === "admin";
    const historyLimit = isAdmin ? 100 : profile.data.tier === "free" ? 5 : 30;

    let query = supabase
        .from("reports")
        .select("id, report_type, content, raw_content, industry, threshold_days, ads_analyzed, created_at")
        .order("created_at", { ascending: false })
        .limit(historyLimit);

    if (!isAdmin) {
        query = query.eq("user_id", userId);
    }

    const reports = await query;
    if (reports.error) {
        return NextResponse.json({ error: reports.error.message }, { status: 500 });
    }

    return NextResponse.json({
        reports: reports.data || [],
        historyLimit,
        tier: profile.data.tier,
        role: profile.data.role,
    });
}
