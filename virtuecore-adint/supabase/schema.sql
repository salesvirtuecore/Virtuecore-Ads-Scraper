-- ─────────────────────────────────────────────────────────────
-- VirtueCore Ad Intelligence — Supabase Schema
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New query)
-- Safe to re-run: uses CREATE TABLE IF NOT EXISTS + CREATE OR REPLACE
-- ─────────────────────────────────────────────────────────────

-- ── profiles ─────────────────────────────────────────────────
create table if not exists public.profiles (
    id                      uuid references auth.users(id) on delete cascade primary key,
    org_id                  uuid,
    full_name               text,
    email                   text,
    business_name           text,
    industry                text,
    role                    text        not null default 'client',
    tier                    text        not null default 'free',
    plan_tier               text        not null default 'growth',
    stripe_customer_id      text,
    stripe_subscription_id  text,
    searches_used_this_week integer     not null default 0,
    total_searches          integer     not null default 0,
    week_reset_at           timestamptz,
    created_at              timestamptz not null default now(),
    updated_at              timestamptz not null default now()
);

-- ── searches ─────────────────────────────────────────────────
create table if not exists public.searches (
    id             uuid        primary key default gen_random_uuid(),
    user_id        uuid        references auth.users(id) on delete cascade not null,
    query          text        not null,
    country        text        not null default 'GB',
    results_count  integer     not null default 0,
    provenance     text,
    ads_data       jsonb,
    created_at     timestamptz not null default now()
);

-- ── reports ──────────────────────────────────────────────────
create table if not exists public.reports (
    id               uuid        primary key default gen_random_uuid(),
    org_id           uuid,
    created_by       uuid        references auth.users(id) on delete set null,
    user_id          uuid        references auth.users(id) on delete cascade not null,
    search_id        uuid        references public.searches(id) on delete set null,
    report_type      text        not null,
    content          jsonb,
    raw_content      text,
    industry         text,
    threshold_days   integer,
    ads_analyzed     integer     not null default 0,
    tokens_input     integer     not null default 0,
    tokens_output    integer     not null default 0,
    client_business  text,
    scan_query       text,
    payload          jsonb,
    raw_text         text,
    created_at       timestamptz not null default now()
);

-- ── usage_events ─────────────────────────────────────────────
create table if not exists public.usage_events (
    id          uuid        primary key default gen_random_uuid(),
    user_id     uuid        references auth.users(id) on delete cascade not null,
    org_id      uuid,
    event_type  text        not null,
    meta        jsonb,
    created_at  timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────
-- Row Level Security
-- ─────────────────────────────────────────────────────────────
alter table public.profiles     enable row level security;
alter table public.searches     enable row level security;
alter table public.reports      enable row level security;
alter table public.usage_events enable row level security;

-- profiles
drop policy if exists "Users can read own profile"   on public.profiles;
drop policy if exists "Users can update own profile"  on public.profiles;
drop policy if exists "Service role bypass profiles"  on public.profiles;

create policy "Users can read own profile"
    on public.profiles for select
    using (auth.uid() = id);

create policy "Users can update own profile"
    on public.profiles for update
    using (auth.uid() = id);

-- Service role can do everything (used by admin API + Stripe webhook)
create policy "Service role bypass profiles"
    on public.profiles for all
    using (auth.role() = 'service_role');

-- searches
drop policy if exists "Users can read own searches"   on public.searches;
drop policy if exists "Users can insert own searches" on public.searches;

create policy "Users can read own searches"
    on public.searches for select
    using (auth.uid() = user_id);

create policy "Users can insert own searches"
    on public.searches for insert
    with check (auth.uid() = user_id);

-- Service role full access (search cache bypass)
drop policy if exists "Service role bypass searches" on public.searches;
create policy "Service role bypass searches"
    on public.searches for all
    using (auth.role() = 'service_role');

-- reports
drop policy if exists "Users can read own reports"   on public.reports;
drop policy if exists "Users can insert own reports" on public.reports;

create policy "Users can read own reports"
    on public.reports for select
    using (auth.uid() = user_id);

create policy "Users can insert own reports"
    on public.reports for insert
    with check (auth.uid() = user_id);

drop policy if exists "Service role bypass reports" on public.reports;
create policy "Service role bypass reports"
    on public.reports for all
    using (auth.role() = 'service_role');

-- usage_events
drop policy if exists "Users can read own events"   on public.usage_events;
drop policy if exists "Users can insert own events" on public.usage_events;

create policy "Users can read own events"
    on public.usage_events for select
    using (auth.uid() = user_id);

create policy "Users can insert own events"
    on public.usage_events for insert
    with check (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────
-- Auto-create profile row on signup
-- ─────────────────────────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger as $$
begin
    insert into public.profiles (id, email, full_name, business_name, industry)
    values (
        new.id,
        new.email,
        new.raw_user_meta_data->>'full_name',
        new.raw_user_meta_data->>'business_name',
        coalesce(new.raw_user_meta_data->>'industry', 'Other')
    )
    on conflict (id) do nothing;
    return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
    after insert on auth.users
    for each row execute procedure public.handle_new_user();

-- ─────────────────────────────────────────────────────────────
-- Indexes for common query patterns
-- ─────────────────────────────────────────────────────────────
create index if not exists searches_user_id_idx      on public.searches(user_id);
create index if not exists reports_user_id_idx       on public.reports(user_id);
create index if not exists reports_created_at_idx    on public.reports(created_at desc);
create index if not exists usage_events_user_id_idx  on public.usage_events(user_id);
create index if not exists profiles_stripe_cust_idx  on public.profiles(stripe_customer_id);
