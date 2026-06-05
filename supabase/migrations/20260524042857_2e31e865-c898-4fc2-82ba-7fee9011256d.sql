
-- 1. Harden SECURITY DEFINER functions: fixed search_path + explicit anon guard
CREATE OR REPLACE FUNCTION public.get_my_org_id()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  select organization_id from public.profiles
  where id = auth.uid() and auth.uid() is not null
$$;

CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  select role from public.profiles
  where id = auth.uid() and auth.uid() is not null
$$;

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
begin new.updated_at = now(); return new; end
$$;

CREATE OR REPLACE FUNCTION public.create_default_steps()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
declare
  steps text[] := array[
    'จัดทำแผนการจัดซื้อจัดจ้าง',
    'แต่งตั้งคณะกรรมการ',
    'กำหนดราคากลาง',
    'จัดทำ TOR',
    'ประกาศเชิญชวน / ประกวดราคา',
    'พิจารณาผลและประกาศผู้ชนะ',
    'เซ็นสัญญากับผู้รับจ้าง',
    'ติดตามความคืบหน้าก่อสร้าง',
    'ตรวจรับงานและเบิกจ่าย',
    'ปิดโครงการและคืนหลักประกัน'
  ];
  i int;
begin
  for i in 1..10 loop
    insert into public.procurement_steps
      (organization_id, project_id, step_number, step_name)
    values
      (new.organization_id, new.id, i, steps[i]);
  end loop;
  return new;
end
$$;

-- Revoke EXECUTE from anon (authenticated still needs it for RLS)
REVOKE EXECUTE ON FUNCTION public.get_my_org_id() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.get_my_role() FROM anon, public;
GRANT EXECUTE ON FUNCTION public.get_my_org_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_role() TO authenticated;

-- 2. Fix privilege escalation on profiles: split policy
DROP POLICY IF EXISTS org_isolation ON public.profiles;

CREATE POLICY profiles_select_same_org ON public.profiles
  FOR SELECT TO authenticated
  USING (organization_id = public.get_my_org_id());

CREATE POLICY profiles_insert_self ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());

-- Users may update their own profile, but cannot change organization_id or role
CREATE POLICY profiles_update_self ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid()
    AND organization_id = (select organization_id from public.profiles where id = auth.uid())
    AND role = (select role from public.profiles where id = auth.uid())
  );

-- Admins can manage profiles within their org
CREATE POLICY profiles_admin_manage ON public.profiles
  FOR ALL TO authenticated
  USING (organization_id = public.get_my_org_id() AND public.get_my_role() = 'admin')
  WITH CHECK (organization_id = public.get_my_org_id() AND public.get_my_role() = 'admin');

-- 3. Storage RLS policies
-- procurement-docs: gated through documents table
CREATE POLICY "procurement_docs_select" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'procurement-docs'
    AND EXISTS (
      SELECT 1 FROM public.documents d
      WHERE d.storage_path = storage.objects.name
        AND d.organization_id = public.get_my_org_id()
    )
  );

CREATE POLICY "procurement_docs_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'procurement-docs'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = public.get_my_org_id()::text
  );

CREATE POLICY "procurement_docs_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'procurement-docs'
    AND (storage.foldername(name))[1] = public.get_my_org_id()::text
  );

CREATE POLICY "procurement_docs_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'procurement-docs'
    AND (storage.foldername(name))[1] = public.get_my_org_id()::text
  );

-- construction-photos: gated through report_photos table
CREATE POLICY "construction_photos_select" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'construction-photos'
    AND EXISTS (
      SELECT 1 FROM public.report_photos rp
      WHERE rp.storage_path = storage.objects.name
        AND rp.organization_id = public.get_my_org_id()
    )
  );

CREATE POLICY "construction_photos_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'construction-photos'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = public.get_my_org_id()::text
  );

CREATE POLICY "construction_photos_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'construction-photos'
    AND (storage.foldername(name))[1] = public.get_my_org_id()::text
  );

CREATE POLICY "construction_photos_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'construction-photos'
    AND (storage.foldername(name))[1] = public.get_my_org_id()::text
  );
