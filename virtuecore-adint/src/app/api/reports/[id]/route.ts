import { NextRequest, NextResponse } from "next/server";

import { getSupabaseServerClient } from "@/lib/supabase/server";

type Params = {
    params: Promise<{ id: string }>;
};

export async function GET(_req: NextRequest, { params }: Params) {
    const { id } = await params;

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
        .select("role, org_id")
        .eq("id", userId)
        .single();

    if (profile.error || !profile.data) {
        return NextResponse.json({ error: "Profile not found." }, { status: 404 });
    }

    let query = supabase
        .from("reports")
        .select("id, report_type, content, raw_content, industry, threshold_days, ads_analyzed, created_at, user_id, org_id")
        .eq("id", id)
        .limit(1);

    if (profile.data.role === "admin") {
        query = query.eq("org_id", profile.data.org_id);
    } else {
        query = query.eq("user_id", userId);
    }

    const reportRes = await query.maybeSingle();
    if (reportRes.error) {
        return NextResponse.json({ error: reportRes.error.message }, { status: 500 });
    }

    if (!reportRes.data) {
        return NextResponse.json({ error: "Report not found." }, { status: 404 });
    }

    return NextResponse.json({ report: reportRes.data });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
    const { id } = await params;

    const supabase = await getSupabaseServerClient();
    if (!supabase) {
        return NextResponse.json({ error: "Supabase server client not configured." }, { status: 500 });
    }

    const auth = await supabase.auth.getUser();
    const userId = auth.data.user?.id;
    if (!userId) {
        return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { error } = await supabase
        .from("reports")
        .delete()
        .eq("id", id)
        .eq("user_id", userId);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
}
