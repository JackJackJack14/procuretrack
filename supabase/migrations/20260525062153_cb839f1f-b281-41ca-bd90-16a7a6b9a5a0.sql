-- Drop all existing INSERT policies on profiles to consolidate
DROP POLICY IF EXISTS profiles_insert_self ON public.profiles;
DROP POLICY IF EXISTS insert_profile ON public.profiles;
DROP POLICY IF EXISTS secure_profile_insert ON public.profiles;

-- Single consolidated INSERT policy:
-- 1. Users can only insert their own profile (id = auth.uid())
-- 2. organization_id must be set
-- 3. Either: it's a brand-new org (no profiles yet) AND role is 'admin' (onboarding flow)
--    OR: role is 'member' (will be reassigned via admin_manage policy after invite)
-- Note: existing profiles_admin_manage policy still allows admins to INSERT members
--       into their own org via the ALL policy
CREATE POLICY profiles_insert_self_bootstrap
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (
  id = auth.uid()
  AND organization_id IS NOT NULL
  AND role = 'admin'
  AND NOT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.organization_id = profiles.organization_id
  )
);
