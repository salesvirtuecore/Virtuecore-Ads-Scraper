-- Ensure profile auto-creation includes org context for workspaces where org_id is required.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
    insert into public.profiles (id, email, full_name, business_name, industry, org_id)
    values (
        new.id,
        new.email,
        coalesce(new.raw_user_meta_data->>'full_name', ''),
        coalesce(new.raw_user_meta_data->>'business_name', ''),
        coalesce(new.raw_user_meta_data->>'industry', ''),
        nullif(new.raw_user_meta_data->>'org_id', '')::uuid
    )
    on conflict (id) do update
    set email = excluded.email,
        full_name = excluded.full_name,
        business_name = excluded.business_name,
        industry = excluded.industry,
        org_id = coalesce(public.profiles.org_id, excluded.org_id);

    return new;
end;
$$;
