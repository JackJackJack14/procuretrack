-- Tighten profile INSERT policies: user can only insert their own profile,
-- and only into an organization that has no other profiles yet (i.e. the
-- org they just created during onboarding). Admins can add members via
-- the existing profiles_admin_manage policy.

DROP POLICY IF EXISTS insert_profile ON public.profiles;
DROP POLICY IF EXISTS profiles_insert_self ON public.profiles;

CREATE POLICY profiles_insert_self
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (
  id = auth.uid()
  AND organization_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.organization_id = profiles.organization_id
  )
);