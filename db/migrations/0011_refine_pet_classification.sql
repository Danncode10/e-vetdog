-- P1.5 refinement: retain a user-supplied description for other species and
-- remove the non-MVP microchip field. The live table was verified empty before
-- this tracked migration was added.
ALTER TABLE public.pets ADD COLUMN species_detail text;
ALTER TABLE public.pets DROP COLUMN microchip_id;

DROP FUNCTION public.create_owned_pet(
  text,
  public.pet_species,
  text,
  public.pet_sex,
  date,
  integer,
  text,
  text,
  text
);

CREATE FUNCTION public.create_owned_pet(
  p_name text,
  p_species public.pet_species,
  p_species_detail text DEFAULT NULL,
  p_breed text DEFAULT NULL,
  p_sex public.pet_sex DEFAULT 'unknown',
  p_date_of_birth date DEFAULT NULL,
  p_age integer DEFAULT NULL,
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

  IF p_species = 'other' AND btrim(coalesce(p_species_detail, '')) = '' THEN
    RAISE EXCEPTION 'Please specify the species';
  END IF;

  IF p_age IS NOT NULL AND p_age < 0 THEN
    RAISE EXCEPTION 'Age cannot be negative';
  END IF;

  INSERT INTO public.pets (
    name,
    species,
    species_detail,
    breed,
    sex,
    date_of_birth,
    age,
    color,
    notes
  )
  VALUES (
    btrim(p_name),
    p_species,
    CASE WHEN p_species = 'other' THEN nullif(btrim(p_species_detail), '') ELSE NULL END,
    nullif(btrim(p_breed), ''),
    p_sex,
    p_date_of_birth,
    p_age,
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
  text,
  public.pet_sex,
  date,
  integer,
  text,
  text
) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_owned_pet(
  text,
  public.pet_species,
  text,
  text,
  public.pet_sex,
  date,
  integer,
  text,
  text
) TO authenticated;
