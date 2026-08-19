-- P1.3: Sync profile display names from Supabase Auth metadata.
-- Auth metadata is used only for display names, never for authorization.

CREATE OR REPLACE FUNCTION private.auth_user_display_name(metadata jsonb)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT NULLIF(
    BTRIM(
      COALESCE(
        metadata ->> 'full_name',
        metadata ->> 'name',
        metadata ->> 'display_name'
      )
    ),
    ''
  );
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private
AS $$
DECLARE
  profile_full_name text;
BEGIN
  profile_full_name := private.auth_user_display_name(NEW.raw_user_meta_data);

  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, profile_full_name)
  ON CONFLICT (id) DO UPDATE
  SET
    email = EXCLUDED.email,
    full_name = COALESCE(NULLIF(BTRIM(public.profiles.full_name), ''), EXCLUDED.full_name);

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_profile_from_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private
AS $$
DECLARE
  profile_full_name text;
BEGIN
  profile_full_name := private.auth_user_display_name(NEW.raw_user_meta_data);

  UPDATE public.profiles
  SET
    email = NEW.email,
    full_name = COALESCE(NULLIF(BTRIM(public.profiles.full_name), ''), profile_full_name)
  WHERE id = NEW.id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_profile_from_auth_user ON auth.users;
CREATE TRIGGER sync_profile_from_auth_user
  AFTER UPDATE OF email, raw_user_meta_data ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.sync_profile_from_auth_user();

UPDATE public.profiles AS profile
SET full_name = private.auth_user_display_name(auth_user.raw_user_meta_data)
FROM auth.users AS auth_user
WHERE profile.id = auth_user.id
  AND (profile.full_name IS NULL OR BTRIM(profile.full_name) = '')
  AND private.auth_user_display_name(auth_user.raw_user_meta_data) IS NOT NULL;

REVOKE ALL ON FUNCTION private.auth_user_display_name(jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.auth_user_display_name(jsonb) FROM anon;
REVOKE ALL ON FUNCTION private.auth_user_display_name(jsonb) FROM authenticated;

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM anon;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM authenticated;

REVOKE ALL ON FUNCTION public.sync_profile_from_auth_user() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.sync_profile_from_auth_user() FROM anon;
REVOKE ALL ON FUNCTION public.sync_profile_from_auth_user() FROM authenticated;
