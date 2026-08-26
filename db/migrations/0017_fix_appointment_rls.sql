-- Fix broken RLS policies for appointment creation and cancellation
-- 
-- PROBLEM 1: "owners create appointments" requires status = 'requested' on INSERT
--   but createAppointment now inserts with status = 'scheduled' (auto-confirm flow)
-- PROBLEM 2: "owners cancel own appointments" WITH CHECK is logically impossible
--   (status = 'cancelled' AND status IN ('requested', 'scheduled') can never be true)

-- Drop old broken policies
DROP POLICY IF EXISTS "owners create appointments" ON public.appointments;
DROP POLICY IF EXISTS "owners cancel own appointments" ON public.appointments;

-- Allow owners to create appointments with either 'requested' or 'scheduled' status
-- (supports the auto-confirm flow where status is set directly to 'scheduled')
CREATE POLICY "owners create appointments" ON public.appointments
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.pet_owners
      WHERE pet_owners.pet_id = appointments.pet_id
      AND pet_owners.owner_profile_id = (SELECT auth.uid())
    )
    AND status IN ('requested', 'scheduled')
    AND owner_id = (SELECT auth.uid())
  );

-- Fix the owner cancellation policy:
-- USING checks the CURRENT row state (must be requested or scheduled)
-- WITH CHECK verifies the NEW row state (must be cancelled)
-- These are evaluated separately so there's no logical contradiction
CREATE POLICY "owners cancel own appointments" ON public.appointments
  FOR UPDATE TO authenticated
  USING (
    owner_id = (SELECT auth.uid())
    AND status IN ('requested', 'scheduled')
  )
  WITH CHECK (
    owner_id = (SELECT auth.uid())
    AND status = 'cancelled'
  );
