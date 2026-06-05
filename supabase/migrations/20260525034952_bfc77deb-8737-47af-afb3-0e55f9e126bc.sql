-- 1. Restrict organizations SELECT to user's own org
DROP POLICY IF EXISTS "select_all_orgs_for_authenticated" ON public.organizations;

CREATE POLICY "select_own_org"
ON public.organizations
FOR SELECT
TO authenticated
USING (id = public.get_my_org_id());

-- 2. Tighten construction-photos storage SELECT to require matching report_photos record
DROP POLICY IF EXISTS "construction_photos_select" ON storage.objects;

CREATE POLICY "construction_photos_select"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'construction-photos'
  AND EXISTS (
    SELECT 1 FROM public.report_photos rp
    WHERE rp.storage_path = storage.objects.name
      AND rp.organization_id = public.get_my_org_id()
  )
);
