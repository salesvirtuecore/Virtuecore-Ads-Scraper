export type AutomationEvent =
    | "user_signed_up"
    | "search_completed"
    | "third_search"
    | "limit_reached"
    | "report_generated"
    | "upgrade_to_pro"
    | "subscription_cancelled"
    | "payment_failed";

export type WebhookUser = {
    id: string;
    email?: string;
    full_name?: string;
    business_name?: string;
    industry?: string;
    tier?: string;
    role?: string;
    org_id?: string;
};

export type ZapierPayload = {
    event: AutomationEvent;
    userId?: string;
    orgId?: string;
    email?: string;
    meta?: Record<string, unknown>;
};

function normalizeEventKey(event: AutomationEvent): string {
    return event.replace(/[^a-zA-Z0-9]/g, "_").toUpperCase();
}

function resolveWebhookUrl(event: AutomationEvent): string {
    const eventKey = normalizeEventKey(event);
    const perEventUrl = process.env[`N8N_WEBHOOK_${eventKey}_URL`];
    return (
        perEventUrl ||
        process.env.N8N_WEBHOOK_URL ||
        process.env.ZAPIER_WEBHOOK_URL ||
        ""
    );
}

export function fireWebhook(event: AutomationEvent, user: WebhookUser, data?: unknown): void {
    const url = resolveWebhookUrl(event);
    if (!url) return;

    fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            event,
            user,
            data,
            timestamp: new Date().toISOString(),
            source: "virtuecore-adint",
        }),
    }).catch(() => { });
}

export function fireZapierEvent(payload: ZapierPayload): void {
    fireWebhook(
        payload.event,
        {
            id: payload.userId || "unknown",
            email: payload.email,
            org_id: payload.orgId,
        },
        payload.meta
    );
}
