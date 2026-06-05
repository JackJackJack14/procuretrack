grant usage on schema public to authenticated;

grant select, insert, update on table public.organizations to authenticated;
grant select, insert, update on table public.profiles to authenticated;

revoke all on table public.organizations from anon;
revoke all on table public.profiles from anon;