-- P1.1 emergency backport: an owner may update contact details, never role.
-- This is intentionally idempotent because 0001 includes the policy for fresh
-- databases, while the connected development project was changed before its
-- migration history was recorded.
CREATE SCHEMA IF NOT EXISTS private;

CREATE OR REPLACE FUNCTION private.is_own_profile_role_unchanged(new_role public.user_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT role IS NOT DISTINCT FROM new_role
  FROM public.profiles
  WHERE id = (SELECT auth.uid())
$$;

REVOKE ALL ON FUNCTION private.is_own_profile_role_unchanged(public.user_role) FROM PUBLIC, anon;
GRANT USAGE ON SCHEMA private TO authenticated;
GRANT EXECUTE ON FUNCTION private.is_own_profile_role_unchanged(public.user_role) TO authenticated;

DROP POLICY IF EXISTS "users update own profile" ON public.profiles;
CREATE POLICY "users update own profile" ON public.profiles
  FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = id)
  WITH CHECK (
    (SELECT auth.uid()) = id
    AND (SELECT private.is_own_profile_role_unchanged(role))
  );
