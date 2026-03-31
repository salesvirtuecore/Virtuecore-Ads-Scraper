import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface HealthCheck {
  status: 'ok' | 'degraded' | 'down'
  timestamp: string
  app: string
  version: string
  uptime: number
  services: Record<string, 'ok' | 'down'>
  responseTime: Record<string, number>
}

function makeSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
}

export async function GET() {
  const start = Date.now()
  const checks: HealthCheck = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    app: 'virtuecore-adint',
    version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
    uptime: process.uptime(),
    services: {},
    responseTime: {},
  }

  // Supabase
  try {
    const dbStart = Date.now()
    const supabase = makeSupabase()
    const { error } = await supabase.from('profiles').select('id').limit(1)
    checks.services.database = error ? 'down' : 'ok'
    checks.responseTime.database = Date.now() - dbStart
  } catch {
    checks.services.database = 'down'
    checks.responseTime.database = -1
  }

  // Stripe
  try {
    const stripeStart = Date.now()
    const r = await fetch('https://api.stripe.com/v1/balance', {
      headers: { Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}` },
    })
    checks.services.stripe = r.ok ? 'ok' : 'down'
    checks.responseTime.stripe = Date.now() - stripeStart
  } catch {
    checks.services.stripe = 'down'
    checks.responseTime.stripe = -1
  }

  // Claude API
  try {
    const claudeStart = Date.now()
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 10,
        messages: [{ role: 'user', content: 'ping' }],
      }),
    })
    checks.services.claude_api = r.ok ? 'ok' : 'down'
    checks.responseTime.claude_api = Date.now() - claudeStart
  } catch {
    checks.services.claude_api = 'down'
    checks.responseTime.claude_api = -1
  }

  // Firecrawl
  try {
    const fcStart = Date.now()
    const r = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.FIRECRAWL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url: 'https://example.com', formats: ['markdown'] }),
    })
    checks.services.firecrawl = r.ok ? 'ok' : 'down'
    checks.responseTime.firecrawl = Date.now() - fcStart
  } catch {
    checks.services.firecrawl = 'down'
    checks.responseTime.firecrawl = -1
  }

  const statuses = Object.values(checks.services)
  if (statuses.every((s) => s === 'ok')) checks.status = 'ok'
  else if (statuses.every((s) => s === 'down')) checks.status = 'down'
  else checks.status = 'degraded'

  checks.responseTime.total = Date.now() - start

  return NextResponse.json(checks, {
    status: checks.status === 'ok' ? 200 : 503,
    headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' },
  })
}
