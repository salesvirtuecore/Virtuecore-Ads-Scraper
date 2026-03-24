import { randomBytes } from "node:crypto";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { fireZapierEvent } from "@/lib/zapier";

async function requireAdmin(server: Awaited<ReturnType<typeof getSupabaseServerClient>>) {
    if (!server) return null;
    const auth = await server.auth.getUser();
    const requesterId = auth.data.user?.id;
    if (!requesterId) return null;
    const res = await server
        .from("profiles")
        .select("id, role, org_id")
        .eq("id", requesterId)
        .single();
    if (res.error || !res.data || res.data.role !== "admin") return null;
    return { requesterId, orgId: res.data.org_id as string };
}

export async function GET() {
    const server = await getSupabaseServerClient();
    if (!server) {
        return NextResponse.json({ error: "Supabase server client not configured." }, { status: 500 });
    }
    const ctx = await requireAdmin(server);
    if (!ctx) {
        return NextResponse.json({ error: "Forbidden. Admins only." }, { status: 403 });
    }

    const usersRes = await server
        .from("profiles")
        .select(
            "id, email, full_name, business_name, tier, role, searches_used_this_week, total_searches, created_at",
        )
        .eq("org_id", ctx.orgId)
        .order("created_at", { ascending: false });

    if (usersRes.error) {
        return NextResponse.json({ error: usersRes.error.message }, { status: 500 });
    }

    const userIds = usersRes.data.map((u) => u.id);
    const reportsRes =
        userIds.length > 0
            ? await server.from("reports").select("user_id").in("user_id", userIds)
            : { data: [] as { user_id: string }[], error: null };

    const reportCounts: Record<string, number> = {};
    for (const r of reportsRes.data ?? []) {
        reportCounts[r.user_id] = (reportCounts[r.user_id] ?? 0) + 1;
    }

    return NextResponse.json({
        users: usersRes.data.map((u) => ({ ...u, report_count: reportCounts[u.id] ?? 0 })),
    });
}

const payloadSchema = z.object({
    email: z.string().email(),
    full_name: z.string().min(2),
    business_name: z.string().default(""),
    industry: z.string().default(""),
    tier: z.enum(["free", "pro", "client"]).default("client"),
    role: z.enum(["admin", "client"]).default("client"),
});

function makeTempPassword(): string {
    return `${randomBytes(6).toString("base64url")}A9!`;
}

export async function POST(req: NextRequest) {
    const body = await req.json().catch(() => null);
    const parsed = payloadSchema.safeParse(body);
    if (!parsed.success) {
        return NextResponse.json({ error: "Invalid user payload." }, { status: 400 });
    }

    const server = await getSupabaseServerClient();
    if (!server) {
        return NextResponse.json({ error: "Supabase server client not configured." }, { status: 500 });
    }

    const auth = await server.auth.getUser();
    const requesterId = auth.data.user?.id;
    if (!requesterId) {
        return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const requester = await server
        .from("profiles")
        .select("id, role, org_id")
        .eq("id", requesterId)
        .single();

    if (requester.error || !requester.data || requester.data.role !== "admin") {
        return NextResponse.json({ error: "Forbidden. Admins only." }, { status: 403 });
    }

    const admin = getSupabaseAdminClient();
    if (!admin) {
        return NextResponse.json({ error: "Supabase admin client not configured." }, { status: 500 });
    }

    const { email, full_name, business_name, industry, tier, role } = parsed.data;
    const temporaryPassword = makeTempPassword();

    const created = await admin.auth.admin.createUser({
        email,
        password: temporaryPassword,
        email_confirm: true,
        user_metadata: {
            full_name,
            business_name,
            industry,
            org_id: requester.data.org_id,
        },
    });

    if (created.error || !created.data.user) {
        return NextResponse.json({ error: created.error?.message || "Unable to create user." }, { status: 400 });
    }

    const newUserId = created.data.user.id;

    const profileUpsert = await admin
        .from("profiles")
        .upsert({
            id: newUserId,
            email,
            full_name,
            business_name,
            industry,
            tier,
            role,
            org_id: requester.data.org_id,
            invited_by: requesterId,
        })
        .select("id, email, full_name, business_name, industry, tier, role, org_id, created_at")
        .single();

    if (profileUpsert.error || !profileUpsert.data) {
        return NextResponse.json({ error: profileUpsert.error?.message || "Profile update failed." }, { status: 500 });
    }

    fireZapierEvent({
        event: "user_signed_up",
        userId: profileUpsert.data.id,
        orgId: profileUpsert.data.org_id,
        email: profileUpsert.data.email,
        meta: {
            role,
            tier,
            business_name,
            industry,
            invited_by: requesterId,
            source: "admin.users",
        },
    });

    return NextResponse.json({
        user: profileUpsert.data,
        temporary_password: temporaryPassword,
    });
}
