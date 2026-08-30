-- Fix RLS policies to support the 'booked' status for owners

DROP POLICY IF EXISTS "owners create appointments" ON public.appointments;
CREATE POLICY "owners create appointments" ON public.appointments
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.pet_owners
      WHERE pet_owners.pet_id = appointments.pet_id
      AND pet_owners.owner_profile_id = (SELECT auth.uid())
    )
    AND status IN ('requested', 'scheduled', 'booked')
    AND owner_id = (SELECT auth.uid())
  );

DROP POLICY IF EXISTS "owners cancel own appointments" ON public.appointments;
CREATE POLICY "owners cancel own appointments" ON public.appointments
  FOR UPDATE TO authenticated
  USING (
    owner_id = (SELECT auth.uid())
    AND status IN ('requested', 'scheduled', 'booked')
  )
  WITH CHECK (
    owner_id = (SELECT auth.uid())
    AND status = 'cancelled'
  );
