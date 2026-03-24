-- Step: replace org-based profile RLS with self/admin rules and add searches.
-- Note: Postgres RLS is row-level, not column-level. The admin update policy below
-- allows admins to update any profile row. If you need admins limited to only role/tier,
-- enforce that in a SECURITY DEFINER RPC or a trigger guard in a later step.

drop policy if exists "profiles-own-read" on public.profiles;
drop policy if exists "profiles-admin-manage-org" on public.profiles;
drop policy if exists "profiles-self-read" on public.profiles;
drop policy if exists "profiles-self-update" on public.profiles;
drop policy if exists "profiles-admin-read-all" on public.profiles;
drop policy if exists "profiles-admin-update-all" on public.profiles;

create policy "profiles-self-read"
on public.profiles
for select
using (id = auth.uid());

create policy "profiles-self-update"
on public.profiles
for update
using (id = auth.uid())
with check (id = auth.uid());

create policy "profiles-admin-read-all"
on public.profiles
for select
using (
    exists (
        select 1
        from public.profiles admin_profile
        where admin_profile.id = auth.uid()
          and admin_profile.role = 'admin'
    )
);

create policy "profiles-admin-update-all"
on public.profiles
for update
using (
    exists (
        select 1
        from public.profiles admin_profile
        where admin_profile.id = auth.uid()
          and admin_profile.role = 'admin'
    )
)
with check (
    exists (
        select 1
        from public.profiles admin_profile
        where admin_profile.id = auth.uid()
          and admin_profile.role = 'admin'
    )
);

create table if not exists public.searches (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references public.profiles(id) on delete cascade not null,
    query text not null,
    country text default 'GB',
    results_count integer default 0,
    provenance text default 'meta-live' check (provenance in ('meta-live', 'meta-live-empty', 'meta-error', 'demo-mock')),
    ads_data jsonb,
    created_at timestamptz not null default now()
);

alter table public.searches enable row level security;

drop policy if exists "searches-self-read" on public.searches;
drop policy if exists "searches-self-insert" on public.searches;
drop policy if exists "searches-admin-read-all" on public.searches;

create policy "searches-self-read"
on public.searches
for select
using (user_id = auth.uid());

create policy "searches-self-insert"
on public.searches
for insert
with check (user_id = auth.uid());

create policy "searches-admin-read-all"
on public.searches
for select
using (
    exists (
        select 1
        from public.profiles admin_profile
        where admin_profile.id = auth.uid()
          and admin_profile.role = 'admin'
    )
);

create index if not exists idx_searches_user_created_at on public.searches(user_id, created_at desc);
create index if not exists idx_searches_provenance on public.searches(provenance);
