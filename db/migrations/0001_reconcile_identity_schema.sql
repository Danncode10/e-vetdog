-- E-VetDoc Identity Schema Reconciliation
-- 1. Drop template tables no longer needed
DROP TABLE IF EXISTS public.leads CASCADE;
DROP TABLE IF EXISTS public.bookings CASCADE;
DROP TABLE IF EXISTS public.gallery_items CASCADE;
DROP TABLE IF EXISTS public.blog_posts CASCADE;
DROP TABLE IF EXISTS public.analytics_events CASCADE;
DROP TABLE IF EXISTS public.audit_logs CASCADE;

-- 2. Replace the template role enum.
-- Existing admins stay admins; every legacy `user` (and any unexpected legacy
-- value) becomes an owner. Drop the old enum-backed default before changing
-- the column type so this migration can be replayed against a populated DB.
ALTER TABLE public.profiles ALTER COLUMN role DROP DEFAULT;
ALTER TABLE public.profiles ALTER COLUMN role TYPE text USING role::text;
UPDATE public.profiles
SET role = CASE WHEN role = 'admin' THEN 'admin' ELSE 'owner' END;
DROP TYPE IF EXISTS public.user_role CASCADE;
CREATE TYPE public.user_role AS ENUM ('admin', 'veterinarian', 'owner');
ALTER TABLE public.profiles ALTER COLUMN role TYPE public.user_role USING role::public.user_role;

-- 3. Create new enums for pets and pet_owners
CREATE TYPE public.pet_species AS ENUM ('dog', 'cat', 'bird', 'rabbit', 'reptile', 'other');
CREATE TYPE public.pet_sex AS ENUM ('male', 'female', 'unknown');
CREATE TYPE public.owner_relationship AS ENUM ('owner', 'co_owner', 'family', 'caretaker');

-- 4. Update profiles table with E-VetDoc fields
ALTER TABLE public.profiles
  ALTER COLUMN role SET DEFAULT 'owner',
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS address text,
  ADD COLUMN IF NOT EXISTS emergency_contact_name text,
  ADD COLUMN IF NOT EXISTS emergency_contact_phone text,
  DROP COLUMN IF EXISTS age,
  DROP COLUMN IF EXISTS birthday,
  DROP COLUMN IF EXISTS gender;

-- 5. Create pets table
CREATE TABLE public.pets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  species public.pet_species NOT NULL,
  breed text,
  sex public.pet_sex NOT NULL DEFAULT 'unknown',
  date_of_birth date,
  age integer,
  microchip_id text,
  color text,
  notes text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX idx_pets_name ON public.pets USING btree (name);
CREATE INDEX idx_pets_species ON public.pets USING btree (species);

-- 6. Create pet_owners table (sole ownership model)
CREATE TABLE public.pet_owners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id uuid NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  owner_profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  relationship public.owner_relationship NOT NULL DEFAULT 'owner',
  is_primary_contact boolean NOT NULL DEFAULT false,
  can_view_medical_records boolean NOT NULL DEFAULT true,
  can_receive_notifications boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX idx_pet_owners_pet_id ON public.pet_owners USING btree (pet_id);
CREATE INDEX idx_pet_owners_owner_profile_id ON public.pet_owners USING btree (owner_profile_id);
CREATE UNIQUE INDEX unique_pet_owner ON public.pet_owners USING btree (pet_id, owner_profile_id);

-- 7. Enable RLS on new tables
ALTER TABLE public.pets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pet_owners ENABLE ROW LEVEL SECURITY;

-- 8. Update is_admin() function to use new enum
CREATE SCHEMA IF NOT EXISTS private;

CREATE OR REPLACE FUNCTION private.is_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = (SELECT auth.uid()) AND role = 'admin'
  )
$$;

-- The policy invokes this SECURITY DEFINER helper rather than re-querying
-- profiles inside the policy, which would recurse through profile RLS.
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

-- 9. RLS Policies for profiles (updated for new roles)
DROP POLICY IF EXISTS "users view own profile" ON public.profiles;
DROP POLICY IF EXISTS "users update own profile" ON public.profiles;
DROP POLICY IF EXISTS "admins manage profiles" ON public.profiles;

CREATE POLICY "users view own profile" ON public.profiles
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = id);

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

-- 10. RLS Policies for pets
-- Owners can view pets linked to them through pet_owners
CREATE POLICY "owners view linked pets" ON public.pets
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.pet_owners
      WHERE pet_owners.pet_id = pets.id
      AND pet_owners.owner_profile_id = (SELECT auth.uid())
    )
  );

-- Admins and veterinarians can view all pets
CREATE POLICY "staff view all pets" ON public.pets
  FOR SELECT TO authenticated
  USING (
    (SELECT private.is_admin()) OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (SELECT auth.uid()) AND role = 'veterinarian'
    )
  );

-- Only admins can manage pets (create, update, delete)
CREATE POLICY "admins manage pets" ON public.pets
  FOR ALL TO authenticated
  USING ((SELECT private.is_admin()))
  WITH CHECK ((SELECT private.is_admin()));

-- 11. RLS Policies for pet_owners
-- Owners can view their own pet_owners records
CREATE POLICY "owners view own pet_owners" ON public.pet_owners
  FOR SELECT TO authenticated
  USING (owner_profile_id = (SELECT auth.uid()));

-- Owners can add themselves as co-owners (with appropriate permissions)
CREATE POLICY "owners insert pet_owners" ON public.pet_owners
  FOR INSERT TO authenticated
  WITH CHECK (owner_profile_id = (SELECT auth.uid()));

-- Admins can manage all pet_owners
CREATE POLICY "admins manage pet_owners" ON public.pet_owners
  FOR ALL TO authenticated
  USING ((SELECT private.is_admin()))
  WITH CHECK ((SELECT private.is_admin()));

-- Veterinarians can view pet_owners for pets they treat
CREATE POLICY "veterinarians view pet_owners" ON public.pet_owners
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (SELECT auth.uid()) AND role = 'veterinarian'
    )
  );

-- 12. Update triggers for new tables
CREATE TRIGGER pets_updated_at
  BEFORE UPDATE ON public.pets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER pet_owners_updated_at
  BEFORE UPDATE ON public.pet_owners
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
