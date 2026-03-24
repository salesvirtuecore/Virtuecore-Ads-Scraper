-- Step: reset weekly search counters on an hourly schedule via pg_cron.
-- Requires the pg_cron extension to be enabled in the Supabase project.

create extension if not exists pg_cron;

create or replace function public.reset_weekly_searches()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
    update public.profiles
    set searches_used_this_week = 0,
        week_reset_at = date_trunc('week', now()) + interval '7 days'
    where week_reset_at <= now();
end;
$$;

do $$
declare
    existing_job_id bigint;
begin
    select jobid
    into existing_job_id
    from cron.job
    where jobname = 'reset-weekly-searches'
    limit 1;

    if existing_job_id is not null then
        perform cron.unschedule(existing_job_id);
    end if;

    perform cron.schedule(
        'reset-weekly-searches',
        '0 * * * *',
        'select public.reset_weekly_searches()'
    );
end;
$$;
