-- Core schema for VirtueCore AdInt multi-tenant workspace model.
create extension if not exists "pgcrypto";

create table if not exists public.orgs (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    slug text unique,
    created_at timestamptz not null default now()
);

create table if not exists public.profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    full_name text not null,
    role text not null check (role in ('admin', 'client')),
    org_id uuid not null references public.orgs(id) on delete cascade,
    plan_tier text not null check (plan_tier in ('starter', 'growth', 'scale')) default 'growth',
    invited_by uuid references auth.users(id) on delete set null,
    created_at timestamptz not null default now()
);

create table if not exists public.invitations (
    id uuid primary key default gen_random_uuid(),
    org_id uuid not null references public.orgs(id) on delete cascade,
    email text not null,
    role text not null check (role in ('admin', 'client')),
    plan_tier text not null check (plan_tier in ('starter', 'growth', 'scale')) default 'growth',
    token text not null unique,
    invited_by uuid not null references auth.users(id) on delete cascade,
    accepted_at timestamptz,
    expires_at timestamptz not null default (now() + interval '14 days'),
    created_at timestamptz not null default now(),
    unique (org_id, email)
);

create table if not exists public.reports (
    id uuid primary key default gen_random_uuid(),
    org_id uuid not null references public.orgs(id) on delete cascade,
    created_by uuid not null references auth.users(id) on delete cascade,
    client_business text not null,
    industry text not null,
    threshold_days integer not null default 7,
    scan_query text not null,
    payload jsonb,
    raw_text text,
    created_at timestamptz not null default now()
);

create table if not exists public.usage_events (
    id bigserial primary key,
    org_id uuid not null references public.orgs(id) on delete cascade,
    user_id uuid not null references auth.users(id) on delete cascade,
    event_type text not null check (event_type in ('scan', 'analysis')),
    created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.invitations enable row level security;
alter table public.reports enable row level security;
alter table public.usage_events enable row level security;
alter table public.orgs enable row level security;

create policy "profiles-own-read"
on public.profiles
for select
using (id = auth.uid());

create policy "profiles-admin-manage-org"
on public.profiles
for all
using (
    exists (
        select 1
        from public.profiles admin_profile
        where admin_profile.id = auth.uid()
          and admin_profile.role = 'admin'
          and admin_profile.org_id = profiles.org_id
    )
)
with check (
    exists (
        select 1
        from public.profiles admin_profile
        where admin_profile.id = auth.uid()
          and admin_profile.role = 'admin'
          and admin_profile.org_id = profiles.org_id
    )
);

create policy "orgs-members-read"
on public.orgs
for select
using (
    exists (
        select 1
        from public.profiles p
        where p.id = auth.uid()
          and p.org_id = orgs.id
    )
);

create policy "invites-admin-read-write"
on public.invitations
for all
using (
    exists (
        select 1
        from public.profiles p
        where p.id = auth.uid()
          and p.role = 'admin'
          and p.org_id = invitations.org_id
    )
)
with check (
    exists (
        select 1
        from public.profiles p
        where p.id = auth.uid()
          and p.role = 'admin'
          and p.org_id = invitations.org_id
    )
);

create policy "reports-org-read"
on public.reports
for select
using (
    exists (
        select 1
        from public.profiles p
        where p.id = auth.uid()
          and p.org_id = reports.org_id
    )
);

create policy "reports-org-write"
on public.reports
for insert
with check (
    created_by = auth.uid()
    and exists (
        select 1
        from public.profiles p
        where p.id = auth.uid()
          and p.org_id = reports.org_id
    )
);

create policy "usage-org-read"
on public.usage_events
for select
using (
    exists (
        select 1
        from public.profiles p
        where p.id = auth.uid()
          and p.org_id = usage_events.org_id
    )
);

create policy "usage-self-write"
on public.usage_events
for insert
with check (
    user_id = auth.uid()
    and exists (
        select 1
        from public.profiles p
        where p.id = auth.uid()
          and p.org_id = usage_events.org_id
    )
);

create index if not exists idx_profiles_org_id on public.profiles(org_id);
create index if not exists idx_reports_org_created_at on public.reports(org_id, created_at desc);
create index if not exists idx_usage_org_type_created_at on public.usage_events(org_id, event_type, created_at desc);
