-- Step: automatically create a profile row whenever a new auth user is created.
-- This supports invitation-only auth now and future self-serve signup later.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
    insert into public.profiles (id, email, full_name, business_name, industry)
    values (
        new.id,
        new.email,
        coalesce(new.raw_user_meta_data->>'full_name', ''),
        coalesce(new.raw_user_meta_data->>'business_name', ''),
        coalesce(new.raw_user_meta_data->>'industry', '')
    )
    on conflict (id) do update
    set email = excluded.email,
        full_name = excluded.full_name,
        business_name = excluded.business_name,
        industry = excluded.industry;

    return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();
