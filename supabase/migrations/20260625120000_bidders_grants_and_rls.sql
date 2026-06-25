-- Grant bidders table permissions for project delete
grant insert, select, update, delete on public.bidders to authenticated;

alter table public.bidders enable row level security;

drop policy if exists bidders_org_isolation on public.bidders;
create policy bidders_org_isolation on public.bidders
  for all
  to authenticated
  using (organization_id = public.get_my_org_id())
  with check (organization_id = public.get_my_org_id());

notify pgrst, 'reload schema';
