-- P1.1 emergency backport: policy helpers must not be exposed as public RPCs.
CREATE SCHEMA IF NOT EXISTS private;

CREATE OR REPLACE FUNCTION private.is_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = (SELECT auth.uid()) AND role = 'admin'
  )
$$;

CREATE OR REPLACE FUNCTION private.is_own_profile_role_unchanged(new_role public.user_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT role IS NOT DISTINCT FROM new_role
  FROM public.profiles
  WHERE id = (SELECT auth.uid())
$$;

REVOKE ALL ON FUNCTION private.is_admin() FROM PUBLIC;
REVOKE ALL ON FUNCTION private.is_admin() FROM anon;
REVOKE ALL ON FUNCTION private.is_own_profile_role_unchanged(public.user_role) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.is_own_profile_role_unchanged(public.user_role) FROM anon;
GRANT USAGE ON SCHEMA private TO authenticated;
GRANT EXECUTE ON FUNCTION private.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION private.is_own_profile_role_unchanged(public.user_role) TO authenticated;

DROP POLICY IF EXISTS "admins manage profiles" ON public.profiles;
DROP POLICY IF EXISTS "users update own profile" ON public.profiles;
CREATE POLICY "users update own profile" ON public.profiles
  FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = id)
  WITH CHECK (
    (SELECT auth.uid()) = id
    AND (SELECT private.is_own_profile_role_unchanged(role))
  );
CREATE POLICY "admins manage profiles" ON public.profiles
  FOR ALL TO authenticated
  USING ((SELECT private.is_admin()))
  WITH CHECK ((SELECT private.is_admin()));

DROP POLICY IF EXISTS "staff view all pets" ON public.pets;
DROP POLICY IF EXISTS "admins manage pets" ON public.pets;
CREATE POLICY "staff view all pets" ON public.pets
  FOR SELECT TO authenticated
  USING (
    (SELECT private.is_admin()) OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (SELECT auth.uid()) AND role = 'veterinarian'
    )
  );
CREATE POLICY "admins manage pets" ON public.pets
  FOR ALL TO authenticated
  USING ((SELECT private.is_admin()))
  WITH CHECK ((SELECT private.is_admin()));

DROP POLICY IF EXISTS "admins manage pet_owners" ON public.pet_owners;
CREATE POLICY "admins manage pet_owners" ON public.pet_owners
  FOR ALL TO authenticated
  USING ((SELECT private.is_admin()))
  WITH CHECK ((SELECT private.is_admin()));

DROP POLICY IF EXISTS "admins manage services" ON public.services;
CREATE POLICY "admins manage services" ON public.services
  FOR ALL TO authenticated
  USING ((SELECT private.is_admin()))
  WITH CHECK ((SELECT private.is_admin()));

DROP POLICY IF EXISTS "admins manage notifications" ON public.notifications;
CREATE POLICY "admins manage notifications" ON public.notifications
  FOR ALL TO authenticated
  USING ((SELECT private.is_admin()))
  WITH CHECK ((SELECT private.is_admin()));

DROP POLICY IF EXISTS "admins manage blog images" ON storage.objects;
CREATE POLICY "admins manage blog images" ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id = 'blog-images' AND (SELECT private.is_admin()))
  WITH CHECK (bucket_id = 'blog-images' AND (SELECT private.is_admin()));

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public
AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM anon;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM authenticated;
DROP FUNCTION IF EXISTS public.is_own_profile_role_unchanged(public.user_role);
DROP FUNCTION IF EXISTS public.is_admin();
