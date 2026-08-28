DROP POLICY IF EXISTS "owners view permitted encounters" ON public.encounters;
CREATE POLICY "owners view permitted encounters" ON public.encounters
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.pet_owners
      WHERE pet_owners.pet_id = encounters.pet_id
      AND pet_owners.owner_profile_id = (SELECT auth.uid())
      AND pet_owners.can_view_medical_records = true
    )
  );

DROP POLICY IF EXISTS "owners view permitted notes" ON public.clinical_notes;
CREATE POLICY "owners view permitted notes" ON public.clinical_notes
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.encounters e
      JOIN public.pet_owners po ON po.pet_id = e.pet_id
      WHERE e.id = clinical_notes.encounter_id
      AND po.owner_profile_id = (SELECT auth.uid())
      AND po.can_view_medical_records = true
    )
  );

DROP POLICY IF EXISTS "owners view permitted diagnoses" ON public.diagnoses;
CREATE POLICY "owners view permitted diagnoses" ON public.diagnoses
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.encounters e
      JOIN public.pet_owners po ON po.pet_id = e.pet_id
      WHERE e.id = diagnoses.encounter_id
      AND po.owner_profile_id = (SELECT auth.uid())
      AND po.can_view_medical_records = true
    )
  );

DROP POLICY IF EXISTS "owners view permitted treatments" ON public.treatments;
CREATE POLICY "owners view permitted treatments" ON public.treatments
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.encounters e
      JOIN public.pet_owners po ON po.pet_id = e.pet_id
      WHERE e.id = treatments.encounter_id
      AND po.owner_profile_id = (SELECT auth.uid())
      AND po.can_view_medical_records = true
    )
  );

DROP POLICY IF EXISTS "owners view permitted prescriptions" ON public.prescriptions;
CREATE POLICY "owners view permitted prescriptions" ON public.prescriptions
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.encounters e
      JOIN public.pet_owners po ON po.pet_id = e.pet_id
      WHERE e.id = prescriptions.encounter_id
      AND po.owner_profile_id = (SELECT auth.uid())
      AND po.can_view_medical_records = true
    )
  );

DROP POLICY IF EXISTS "owners view permitted amendments" ON public.encounter_amendments;
CREATE POLICY "owners view permitted amendments" ON public.encounter_amendments
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.encounters e
      JOIN public.pet_owners po ON po.pet_id = e.pet_id
      WHERE e.id = encounter_amendments.encounter_id
      AND po.owner_profile_id = (SELECT auth.uid())
      AND po.can_view_medical_records = true
    )
  );