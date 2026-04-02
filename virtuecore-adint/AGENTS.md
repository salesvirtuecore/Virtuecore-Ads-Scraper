<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

## n8n Automation — UK Travel Lead Finder

### What was built (branch: `claude/travel-company-ad-scraper-5DCGy`)

A fully automated n8n workflow that runs **every hour** and finds UK travel companies that:
- Have **no Meta Pixel** on their website (primary signal — not running Meta ads)
- Have **no active Meta ads** (confirmed via Apify + Meta Ad Library)
- Have **social media presence** (Facebook / Instagram / TikTok) — they have an audience but aren't monetising it

Results are saved to **Google Sheets** and a **Slack notification** is sent each run.

### Key files

| File | Purpose |
|---|---|
| `n8n/workflows/uk-travel-lead-finder.json` | The n8n workflow (import or deploy via script) |
| `scripts/push-n8n-workflows.mjs` | Deploys all workflows to `virtualcore.app.n8n.cloud` |
| `.github/workflows/deploy-n8n.yml` | GitHub Action that auto-deploys on every push |

### n8n instance
- URL: `https://virtualcore.app.n8n.cloud`
- API key stored as GitHub secret `N8N_API_KEY`
- Deploy command: `N8N_API_KEY=<token> node scripts/push-n8n-workflows.mjs`

### Workflow node summary (11 nodes)
1. **Every Hour** (Schedule) + **Run Manually** (Manual trigger)
2. **Read Existing Leads** — Google Sheets read, gets already-seen domains to skip
3. **Discover New Companies** — SerpAPI, 30 queries × 20 results = up to 600 candidates/run
4. **Has New Companies** — filter, skips run if nothing new
5. **Analyse Company** — Firecrawl scrape → pixel detection → Apify Meta Ad Library check → lead scoring
6. **Qualified Leads Only** — filter: no pixel + no active ads + social presence
7. **Sort by Lead Score** — highest scored first (max 100pts)
8. **Save Lead to Google Sheets** — appendOrUpdate with Domain as key (no duplicates)
9. **Aggregate Run Results**
10. **Hourly Run Summary** — builds Slack block-kit message
11. **Has New Leads** → **Send Slack Notification** — only fires when ≥1 new lead found

### Lead scoring
| Signal | Points |
|---|---|
| No Meta Pixel on site | +40 |
| No active ads confirmed | +20 |
| Has social presence | +15 |
| Ran ads in last 12 months | +15 |
| Facebook / Instagram / TikTok links | +4/4/2 |

### Google Sheet columns written per lead
Domain, Company Name, Website, Lead Score, No Pixel, No Active Ads,
Ad History, Total Ads Found, Most Recent Ad Date, Facebook, Facebook URL,
Instagram, Instagram URL, TikTok, YouTube, Page Title, Page Description,
Lead Reason, Top Ad Sample, Ad Snapshot URL, Scrape OK, Found At, Last Updated

### What still needs configuring in n8n
After deploying the workflow, open it in `virtualcore.app.n8n.cloud` and:

1. **Google Sheets nodes** (`Read Existing Leads` + `Save Lead to Google Sheets`)
   - Credential type: `Google Sheets OAuth2 API`
   - Connect your Google account via OAuth

2. **Slack node** (`Send Slack Notification`)
   - Credential type: `Slack API` (Bot Token)
   - Create a Slack app at api.slack.com, add `chat:write` scope, install to workspace

3. **n8n Environment Variables** (Settings → Variables):
   ```
   SERPAPI_KEY        — serpapi.com (company discovery via Google)
   FIRECRAWL_API_KEY  — firecrawl.dev (website scraping)
   APIFY_API_KEY      — apify.com (Meta Ad Library — same key the main app uses)
   GOOGLE_SHEET_ID    — ID from Google Sheet URL
   SLACK_CHANNEL_ID   — Slack channel ID (e.g. C0XXXXXXX)
   ```

4. Create a Google Sheet with a tab named **`UK Travel Leads`** and share it with the Google account used for OAuth.

### Apify actor used
Same actor as `src/app/api/search/route.ts`: `ZQyDz7154hrOfrDMK`
This scrapes the Meta Ad Library — no separate setup needed if `APIFY_API_KEY` is already set.
