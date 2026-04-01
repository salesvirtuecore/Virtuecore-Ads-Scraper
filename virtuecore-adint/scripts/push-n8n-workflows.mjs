import fs from "node:fs";
import path from "node:path";

const baseUrl = (process.env.N8N_BASE_URL || "").replace(/\/$/, "");
const apiKey = process.env.N8N_API_KEY || "";
const activateAfterPush = (process.env.N8N_ACTIVATE || "true").toLowerCase() !== "false";

if (!baseUrl) {
    console.error("Missing N8N_BASE_URL environment variable.");
    process.exit(1);
}

if (!apiKey) {
    console.error("Missing N8N_API_KEY environment variable.");
    process.exit(1);
}

const workflowFiles = [
    path.resolve("n8n/workflows/virtuecore-events-router.json"),
    path.resolve("n8n/workflows/virtuecore-event-relay.json"),
    path.resolve("n8n/workflows/uk-travel-lead-finder.json"),
];

const headers = {
    "Content-Type": "application/json",
    "X-N8N-API-KEY": apiKey,
};

async function requestJson(url, options = {}) {
    const res = await fetch(url, options);
    const text = await res.text();
    let data = null;
    try {
        data = text ? JSON.parse(text) : null;
    } catch {
        data = { raw: text };
    }
    if (!res.ok) {
        throw new Error(`HTTP ${res.status} for ${url}: ${JSON.stringify(data)}`);
    }
    return data;
}

async function listExistingWorkflows() {
    try {
        const data = await requestJson(`${baseUrl}/api/v1/workflows`, { headers });
        if (Array.isArray(data?.data)) return data.data;
        if (Array.isArray(data)) return data;
        return [];
    } catch {
        return [];
    }
}

async function upsertWorkflow(workflowPayload, existing) {
    const found = existing.find((w) => w.name === workflowPayload.name);
    const apiPayload = {
        name: workflowPayload.name,
        nodes: workflowPayload.nodes,
        connections: workflowPayload.connections,
        settings: workflowPayload.settings || {},
    };

    if (found?.id) {
        const updated = await requestJson(`${baseUrl}/api/v1/workflows/${found.id}`, {
            method: "PUT",
            headers,
            body: JSON.stringify(apiPayload),
        });
        return updated;
    }

    const created = await requestJson(`${baseUrl}/api/v1/workflows`, {
        method: "POST",
        headers,
        body: JSON.stringify(apiPayload),
    });
    return created;
}

async function setActive(workflowId, active) {
    return requestJson(`${baseUrl}/api/v1/workflows/${workflowId}/${active ? "activate" : "deactivate"}`, {
        method: "POST",
        headers,
    });
}

async function main() {
    const existing = await listExistingWorkflows();

    for (const wfFile of workflowFiles) {
        const raw = fs.readFileSync(wfFile, "utf8");
        const payload = JSON.parse(raw);

        const result = await upsertWorkflow(payload, existing);
        const workflowId = result?.id || result?.data?.id;

        if (!workflowId) {
            throw new Error(`Could not determine workflow id after upsert for ${payload.name}`);
        }

        if (activateAfterPush) {
            await setActive(workflowId, true);
        }

        console.log(`Pushed workflow: ${payload.name} (id: ${workflowId})`);
    }

    console.log("n8n workflow sync complete.");
}

main().catch((err) => {
    console.error(err.message || err);
    process.exit(1);
});
