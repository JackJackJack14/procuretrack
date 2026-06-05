grant insert, select, update, delete on public.construction_reports to authenticated;
grant insert, select, update, delete on public.report_photos to authenticated;
grant insert, select, update, delete on public.contracts to authenticated;

-- Storage policies for construction-photos bucket
drop policy if exists "construction_photos_select" on storage.objects;
drop policy if exists "construction_photos_insert" on storage.objects;
drop policy if exists "construction_photos_delete" on storage.objects;

create policy "construction_photos_select" on storage.objects
for select to authenticated
using (
  bucket_id = 'construction-photos'
  and (split_part(name, '/', 1))::uuid = public.get_my_org_id()
);

create policy "construction_photos_insert" on storage.objects
for insert to authenticated
with check (
  bucket_id = 'construction-photos'
  and (split_part(name, '/', 1))::uuid = public.get_my_org_id()
);

create policy "construction_photos_delete" on storage.objects
for delete to authenticated
using (
  bucket_id = 'construction-photos'
  and (split_part(name, '/', 1))::uuid = public.get_my_org_id()
);