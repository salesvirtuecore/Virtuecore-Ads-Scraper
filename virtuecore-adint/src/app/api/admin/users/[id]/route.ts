import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSupabaseServerClient } from "@/lib/supabase/server";

type Params = {
    params: Promise<{ id: string }>;
};

const patchSchema = z.object({
    tier: z.enum(["free", "pro", "client"]).optional(),
    role: z.enum(["admin", "client"]).optional(),
});

export async function PATCH(req: NextRequest, { params }: Params) {
    const { id } = await params;

    const body = await req.json().catch(() => null);
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success || (!parsed.data.tier && !parsed.data.role)) {
        return NextResponse.json({ error: "Provide tier or role to update." }, { status: 400 });
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
        .select("role, org_id")
        .eq("id", requesterId)
        .single();

    if (requester.error || !requester.data || requester.data.role !== "admin") {
        return NextResponse.json({ error: "Forbidden. Admins only." }, { status: 403 });
    }

    const admin = getSupabaseAdminClient();
    if (!admin) {
        return NextResponse.json({ error: "Supabase admin client not configured." }, { status: 500 });
    }

    // Verify target user belongs to the same org
    const target = await admin
        .from("profiles")
        .select("id, org_id")
        .eq("id", id)
        .eq("org_id", requester.data.org_id)
        .single();

    if (target.error || !target.data) {
        return NextResponse.json({ error: "User not found in your organization." }, { status: 404 });
    }

    const updates: Record<string, string> = {};
    if (parsed.data.tier) updates.tier = parsed.data.tier;
    if (parsed.data.role) updates.role = parsed.data.role;

    const { error } = await admin.from("profiles").update(updates).eq("id", id);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
}
