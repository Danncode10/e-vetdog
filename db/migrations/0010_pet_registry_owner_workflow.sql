-- P1.5: owner pet management and staff registry access.
-- pet_owners remains the sole authority for owner-to-pet relationships.

CREATE OR REPLACE FUNCTION private.is_owner()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = (SELECT auth.uid())
      AND role = 'owner'
      AND is_active = true
  )
$$;

CREATE OR REPLACE FUNCTION private.is_veterinarian()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = (SELECT auth.uid())
      AND role = 'veterinarian'
      AND is_active = true
  )
$$;

REVOKE ALL ON FUNCTION private.is_owner() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION private.is_veterinarian() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.is_owner() TO authenticated;
GRANT EXECUTE ON FUNCTION private.is_veterinarian() TO authenticated;

-- Veterinarians need owner contact details for the clinic registry, but may not
-- change profiles or see staff/admin profiles through this policy.
CREATE POLICY "veterinarians view owner profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (role = 'owner' AND (SELECT private.is_veterinarian()));

-- A linked owner can keep patient details current. Ownership links and their
-- permission flags remain staff-managed to prevent self-granted access.
CREATE POLICY "owners update linked pets" ON public.pets
  FOR UPDATE TO authenticated
  USING (
    (SELECT private.is_owner())
    AND EXISTS (
      SELECT 1
      FROM public.pet_owners
      WHERE pet_owners.pet_id = pets.id
        AND pet_owners.owner_profile_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    (SELECT private.is_owner())
    AND EXISTS (
      SELECT 1
      FROM public.pet_owners
      WHERE pet_owners.pet_id = pets.id
        AND pet_owners.owner_profile_id = (SELECT auth.uid())
    )
  );

-- Direct INSERT on pets cannot safely establish the required pet_owners row.
-- This narrowly scoped RPC creates both records atomically for the signed-in
-- owner and never accepts a caller-controlled owner id.
CREATE OR REPLACE FUNCTION public.create_owned_pet(
  p_name text,
  p_species public.pet_species,
  p_breed text DEFAULT NULL,
  p_sex public.pet_sex DEFAULT 'unknown',
  p_date_of_birth date DEFAULT NULL,
  p_age integer DEFAULT NULL,
  p_microchip_id text DEFAULT NULL,
  p_color text DEFAULT NULL,
  p_notes text DEFAULT NULL
)
RETURNS public.pets
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  new_pet public.pets;
BEGIN
  IF (SELECT auth.uid()) IS NULL OR NOT (SELECT private.is_owner()) THEN
    RAISE EXCEPTION 'Only active owners can add pets';
  END IF;

  IF btrim(coalesce(p_name, '')) = '' THEN
    RAISE EXCEPTION 'A pet name is required';
  END IF;

  IF p_age IS NOT NULL AND p_age < 0 THEN
    RAISE EXCEPTION 'Age cannot be negative';
  END IF;

  INSERT INTO public.pets (
    name,
    species,
    breed,
    sex,
    date_of_birth,
    age,
    microchip_id,
    color,
    notes
  )
  VALUES (
    btrim(p_name),
    p_species,
    nullif(btrim(p_breed), ''),
    p_sex,
    p_date_of_birth,
    p_age,
    nullif(btrim(p_microchip_id), ''),
    nullif(btrim(p_color), ''),
    nullif(btrim(p_notes), '')
  )
  RETURNING * INTO new_pet;

  INSERT INTO public.pet_owners (
    pet_id,
    owner_profile_id,
    relationship,
    is_primary_contact,
    can_view_medical_records,
    can_receive_notifications
  )
  VALUES (
    new_pet.id,
    (SELECT auth.uid()),
    'owner',
    true,
    true,
    true
  );

  RETURN new_pet;
END;
$$;

REVOKE ALL ON FUNCTION public.create_owned_pet(
  text,
  public.pet_species,
  text,
  public.pet_sex,
  date,
  integer,
  text,
  text,
  text
) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_owned_pet(
  text,
  public.pet_species,
  text,
  public.pet_sex,
  date,
  integer,
  text,
  text,
  text
) TO authenticated;
