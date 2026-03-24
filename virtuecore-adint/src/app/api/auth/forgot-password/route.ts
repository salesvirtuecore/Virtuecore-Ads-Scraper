import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getSupabaseAdminClient } from "@/lib/supabase/admin";

const bodySchema = z.object({
    email: z.string().email(),
});

function resolveN8nUrl(): string {
    return (
        process.env.N8N_WEBHOOK_PASSWORD_RESET_URL ||
        process.env.N8N_WEBHOOK_URL ||
        process.env.ZAPIER_WEBHOOK_URL ||
        ""
    );
}

export async function POST(req: NextRequest) {
    const body = await req.json().catch(() => null);
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
        return NextResponse.json({ error: "Invalid email." }, { status: 400 });
    }

    const { email } = parsed.data;

    const admin = getSupabaseAdminClient();
    if (!admin) {
        return NextResponse.json({ error: "Server not configured." }, { status: 500 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";
    const redirectTo = `${appUrl}/auth/update-password`;

    // Generate the password reset link server-side so n8n can embed it in a custom email.
    // generateLink returns data.properties.action_link which contains the one-time token.
    const { data, error } = await admin.auth.admin.generateLink({
        type: "recovery",
        email,
        options: { redirectTo },
    });

    if (error) {
        // Do not reveal whether the email exists — return success regardless.
        console.error("generateLink error:", error.message);
        return NextResponse.json({ success: true });
    }

    const resetLink = data?.properties?.action_link || "";
    const n8nUrl = resolveN8nUrl();

    if (n8nUrl && resetLink) {
        fetch(n8nUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                event: "password_reset_requested",
                email,
                resetLink,
                appUrl,
                timestamp: new Date().toISOString(),
                source: "virtuecore-adint",
            }),
        }).catch(() => { });
    }

    // Always return success — never reveal if an email is registered.
    return NextResponse.json({ success: true });
}
