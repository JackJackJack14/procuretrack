-- Restrict update_own_org to safe columns only; protect plan/billing/storage fields
DROP POLICY IF EXISTS update_own_org ON public.organizations;

CREATE POLICY update_own_org ON public.organizations
  FOR UPDATE
  TO authenticated
  USING (id = public.get_my_org_id())
  WITH CHECK (
    id = public.get_my_org_id()
    AND plan IS NOT DISTINCT FROM (SELECT o.plan FROM public.organizations o WHERE o.id = public.get_my_org_id())
    AND plan_expires_at IS NOT DISTINCT FROM (SELECT o.plan_expires_at FROM public.organizations o WHERE o.id = public.get_my_org_id())
    AND is_active IS NOT DISTINCT FROM (SELECT o.is_active FROM public.organizations o WHERE o.id = public.get_my_org_id())
    AND storage_used_bytes IS NOT DISTINCT FROM (SELECT o.storage_used_bytes FROM public.organizations o WHERE o.id = public.get_my_org_id())
  );

-- Server-side function for storage usage accounting (called from app after upload/delete)
CREATE OR REPLACE FUNCTION public.adjust_storage_usage(delta bigint)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  org uuid;
BEGIN
  org := public.get_my_org_id();
  IF org IS NULL THEN
    RAISE EXCEPTION 'No organization for current user';
  END IF;
  UPDATE public.organizations
  SET storage_used_bytes = GREATEST(0, COALESCE(storage_used_bytes, 0) + delta)
  WHERE id = org;
END;
$$;

REVOKE ALL ON FUNCTION public.adjust_storage_usage(bigint) FROM public;
GRANT EXECUTE ON FUNCTION public.adjust_storage_usage(bigint) TO authenticated;