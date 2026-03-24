import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const inviteSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
    fullName: z.string().min(2),
    role: z.enum(["admin", "client"]).default("client"),
    orgId: z.string().uuid(),
    planTier: z.enum(["starter", "growth", "scale"]).default("growth"),
});

export async function POST(req: NextRequest) {
    const body = await req.json().catch(() => null);
    const parsed = inviteSchema.safeParse(body);
    if (!parsed.success) {
        return NextResponse.json({ error: "Invalid invite payload." }, { status: 400 });
    }

    const server = await getSupabaseServerClient();
    if (!server) {
        return NextResponse.json({ error: "Supabase server client not configured." }, { status: 500 });
    }

    const auth = await server.auth.getUser();
    if (!auth.data.user?.id) {
        return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const requester = await server
        .from("profiles")
        .select("role, org_id")
        .eq("id", auth.data.user.id)
        .single();

    if (requester.error || !requester.data || requester.data.role !== "admin") {
        return NextResponse.json({ error: "Only org admins can create users." }, { status: 403 });
    }

    const admin = getSupabaseAdminClient();
    if (!admin) {
        return NextResponse.json({ error: "Supabase admin client not configured." }, { status: 500 });
    }

    const { email, password, fullName, role, orgId, planTier } = parsed.data;
    if (requester.data.org_id !== orgId) {
        return NextResponse.json({ error: "You can only invite users into your own organization." }, { status: 403 });
    }

    const created = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
            full_name: fullName,
        },
    });

    if (created.error || !created.data.user) {
        return NextResponse.json({ error: created.error?.message || "Unable to create user." }, { status: 400 });
    }

    const profileInsert = await admin.from("profiles").upsert({
        id: created.data.user.id,
        full_name: fullName,
        role,
        org_id: orgId,
        plan_tier: planTier,
        invited_by: auth.data.user.id,
    });

    if (profileInsert.error) {
        return NextResponse.json({ error: profileInsert.error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, userId: created.data.user.id });
}
