import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getSupabaseServerClient } from "@/lib/supabase/server";

const patchSchema = z.object({
    full_name: z.string().trim().min(1).max(120).optional(),
    business_name: z.string().trim().max(120).optional(),
    industry: z.string().trim().max(80).optional(),
    industry_preference: z.string().trim().max(80).optional(),
    custom_threshold_days: z.number().int().positive().max(3650).optional(),
});

export async function PATCH(req: NextRequest) {
    const supabase = await getSupabaseServerClient();
    if (!supabase) {
        return NextResponse.json({ error: "Supabase not configured." }, { status: 500 });
    }

    const auth = await supabase.auth.getUser();
    const userId = auth.data.user?.id;
    if (!userId) {
        return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
        return NextResponse.json({ error: "Invalid profile update payload." }, { status: 400 });
    }

    const updates: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(parsed.data)) {
        if (value !== undefined) updates[key] = value;
    }

    if (!Object.keys(updates).length) {
        return NextResponse.json({ error: "No valid fields to update." }, { status: 400 });
    }

    updates.updated_at = new Date().toISOString();

    const { error } = await supabase.from("profiles").update(updates).eq("id", userId);
    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
}
