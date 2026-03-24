-- Step: upgrade profiles schema for auth, tiers, and Stripe metadata.
-- Keeps existing org/workspace columns so current features keep working during migration.

alter table public.profiles
    add column if not exists email text,
    add column if not exists business_name text,
    add column if not exists industry text,
    add column if not exists tier text not null default 'free',
    add column if not exists stripe_customer_id text,
    add column if not exists stripe_subscription_id text,
    add column if not exists searches_used_this_week integer not null default 0,
    add column if not exists total_searches integer not null default 0,
    add column if not exists week_reset_at timestamptz not null default (date_trunc('week', now()) + interval '7 days'),
    add column if not exists winning_threshold_days integer default 30,
    add column if not exists custom_threshold boolean default false,
    add column if not exists updated_at timestamptz not null default now();

-- Backfill email from auth.users for existing rows.
update public.profiles p
set email = u.email
from auth.users u
where p.id = u.id
  and p.email is null;

-- Ensure email is always present.
alter table public.profiles
    alter column email set not null;

-- Align role + tier constraints with new spec.
alter table public.profiles
    drop constraint if exists profiles_role_check,
    add constraint profiles_role_check check (role in ('admin', 'client')),
    drop constraint if exists profiles_tier_check,
    add constraint profiles_tier_check check (tier in ('free', 'pro', 'client'));

-- Keep updated_at current on every mutation.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

drop trigger if exists trg_profiles_updated_at on public.profiles;

create trigger trg_profiles_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

create index if not exists idx_profiles_email on public.profiles(email);
create index if not exists idx_profiles_tier on public.profiles(tier);
