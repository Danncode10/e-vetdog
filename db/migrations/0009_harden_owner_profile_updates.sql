-- P1.4: Owner-facing profile updates may change contact details only.
-- Keep role, activation, and mirrored-auth email under authorized server/admin flows.
CREATE OR REPLACE FUNCTION private.is_own_profile_update_permitted(
  new_email text,
  new_role public.user_role,
  new_is_active boolean
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    email IS NOT DISTINCT FROM new_email
    AND role IS NOT DISTINCT FROM new_role
    AND is_active IS NOT DISTINCT FROM new_is_active
  FROM public.profiles
  WHERE id = (SELECT auth.uid())
$$;

REVOKE ALL ON FUNCTION private.is_own_profile_update_permitted(text, public.user_role, boolean) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.is_own_profile_update_permitted(text, public.user_role, boolean) FROM anon;
GRANT EXECUTE ON FUNCTION private.is_own_profile_update_permitted(text, public.user_role, boolean) TO authenticated;

DROP POLICY IF EXISTS "users update own profile" ON public.profiles;
CREATE POLICY "users update own profile" ON public.profiles
  FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = id)
  WITH CHECK (
    (SELECT auth.uid()) = id
    AND (SELECT private.is_own_profile_update_permitted(email, role, is_active))
  );
