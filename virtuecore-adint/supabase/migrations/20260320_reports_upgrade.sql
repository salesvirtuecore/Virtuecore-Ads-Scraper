-- Step: reshape reports for user-owned history and richer report metadata.
-- Keeps legacy columns temporarily so current migration can proceed without data loss.

alter table public.reports
    add column if not exists user_id uuid references public.profiles(id) on delete cascade,
    add column if not exists search_id uuid references public.searches(id) on delete cascade,
    add column if not exists report_type text,
    add column if not exists content jsonb,
    add column if not exists raw_content text,
    add column if not exists ads_analyzed integer default 0,
    add column if not exists tokens_input integer default 0,
    add column if not exists tokens_output integer default 0;

update public.reports
set user_id = created_by
where user_id is null;

update public.reports
set content = payload
where content is null and payload is not null;

update public.reports
set raw_content = raw_text
where raw_content is null and raw_text is not null;

update public.reports
set report_type = 'full'
where report_type is null;

alter table public.reports
    alter column user_id set not null,
    alter column report_type set not null,
    alter column content set not null;

alter table public.reports
    drop constraint if exists reports_report_type_check,
    add constraint reports_report_type_check check (report_type in ('basic', 'full', 'strategy'));

alter table public.reports
    alter column created_at set default now();

drop policy if exists "reports-org-read" on public.reports;
drop policy if exists "reports-org-write" on public.reports;
drop policy if exists "reports-self-read" on public.reports;
drop policy if exists "reports-self-insert" on public.reports;
drop policy if exists "reports-admin-read-all" on public.reports;

create policy "reports-self-read"
on public.reports
for select
using (user_id = auth.uid());

create policy "reports-self-insert"
on public.reports
for insert
with check (user_id = auth.uid());

create policy "reports-admin-read-all"
on public.reports
for select
using (
    exists (
        select 1
        from public.profiles admin_profile
        where admin_profile.id = auth.uid()
          and admin_profile.role = 'admin'
    )
);

create index if not exists idx_reports_user_created_at on public.reports(user_id, created_at desc);
create index if not exists idx_reports_search_id on public.reports(search_id);
create index if not exists idx_reports_report_type on public.reports(report_type);
