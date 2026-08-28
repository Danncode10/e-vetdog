-- P3.1: Clinical workspace schema, triggers, and RLS policies

-- 1. Create clinical enums
CREATE TYPE public.encounter_status AS ENUM ('draft', 'signed');
CREATE TYPE public.prescription_status AS ENUM ('active', 'cancelled', 'completed');

-- 2. Create encounters table
CREATE TABLE public.encounters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id uuid REFERENCES public.appointments(id) ON DELETE SET NULL,
  pet_id uuid NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  veterinarian_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  status public.encounter_status NOT NULL DEFAULT 'draft',
  notes text,
  signed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- 3. Create clinical_notes table
CREATE TABLE public.clinical_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  encounter_id uuid NOT NULL REFERENCES public.encounters(id) ON DELETE CASCADE,
  chief_complaint text,
  subjective text,
  objective text,
  assessment text,
  plan text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- 4. Create diagnoses table
CREATE TABLE public.diagnoses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  encounter_id uuid NOT NULL REFERENCES public.encounters(id) ON DELETE CASCADE,
  diagnosis_code text,
  description text NOT NULL,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- 5. Create treatments table
CREATE TABLE public.treatments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  encounter_id uuid NOT NULL REFERENCES public.encounters(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  cost numeric(10, 2),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- 6. Create prescriptions table
CREATE TABLE public.prescriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  encounter_id uuid NOT NULL REFERENCES public.encounters(id) ON DELETE CASCADE,
  veterinarian_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  pet_id uuid NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  medication_name text NOT NULL,
  dosage text NOT NULL,
  frequency text NOT NULL,
  duration text NOT NULL,
  instructions text,
  status public.prescription_status NOT NULL DEFAULT 'active',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- 7. Create encounter_amendments table
CREATE TABLE public.encounter_amendments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  encounter_id uuid NOT NULL REFERENCES public.encounters(id) ON DELETE RESTRICT,
  veterinarian_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  amendment_text text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- 8. Create indexes
CREATE INDEX idx_encounters_appointment_id ON public.encounters USING btree (appointment_id);
CREATE INDEX idx_encounters_pet_id ON public.encounters USING btree (pet_id);
CREATE INDEX idx_encounters_veterinarian_id ON public.encounters USING btree (veterinarian_id);
CREATE INDEX idx_encounters_status ON public.encounters USING btree (status);

CREATE INDEX idx_clinical_notes_encounter_id ON public.clinical_notes USING btree (encounter_id);
CREATE INDEX idx_diagnoses_encounter_id ON public.diagnoses USING btree (encounter_id);
CREATE INDEX idx_treatments_encounter_id ON public.treatments USING btree (encounter_id);

CREATE INDEX idx_prescriptions_encounter_id ON public.prescriptions USING btree (encounter_id);
CREATE INDEX idx_prescriptions_pet_id ON public.prescriptions USING btree (pet_id);
CREATE INDEX idx_prescriptions_veterinarian_id ON public.prescriptions USING btree (veterinarian_id);

CREATE INDEX idx_encounter_amendments_encounter_id ON public.encounter_amendments USING btree (encounter_id);

-- 9. Enable RLS on all clinical tables
ALTER TABLE public.encounters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinical_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diagnoses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.treatments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.encounter_amendments ENABLE ROW LEVEL SECURITY;

-- 10. RLS Policies for encounters
CREATE POLICY "staff view all encounters" ON public.encounters
  FOR SELECT TO authenticated
  USING (
    (SELECT private.is_admin()) OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (SELECT auth.uid()) AND role = 'veterinarian'
    )
  );

CREATE POLICY "owners view permitted encounters" ON public.encounters
  FOR SELECT TO authenticated
  USING (
    status = 'signed' AND
    EXISTS (
      SELECT 1 FROM public.pet_owners
      WHERE pet_owners.pet_id = encounters.pet_id
      AND pet_owners.owner_profile_id = (SELECT auth.uid())
      AND pet_owners.can_view_medical_records = true
    )
  );

CREATE POLICY "staff insert encounters" ON public.encounters
  FOR INSERT TO authenticated
  WITH CHECK (
    (SELECT private.is_admin()) OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (SELECT auth.uid()) AND role = 'veterinarian'
    )
  );

CREATE POLICY "staff update draft encounters" ON public.encounters
  FOR UPDATE TO authenticated
  USING (
    status = 'draft' AND (
      (SELECT private.is_admin()) OR
      EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = (SELECT auth.uid()) AND role = 'veterinarian'
      )
    )
  )
  WITH CHECK (
    (SELECT private.is_admin()) OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (SELECT auth.uid()) AND role = 'veterinarian'
    )
  );

CREATE POLICY "admins delete encounters" ON public.encounters
  FOR DELETE TO authenticated
  USING ((SELECT private.is_admin()));

-- 11. RLS Policies for clinical_notes
CREATE POLICY "staff view all notes" ON public.clinical_notes
  FOR SELECT TO authenticated
  USING (
    (SELECT private.is_admin()) OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (SELECT auth.uid()) AND role = 'veterinarian'
    )
  );

CREATE POLICY "owners view permitted notes" ON public.clinical_notes
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.encounters e
      JOIN public.pet_owners po ON po.pet_id = e.pet_id
      WHERE e.id = clinical_notes.encounter_id
      AND e.status = 'signed'
      AND po.owner_profile_id = (SELECT auth.uid())
      AND po.can_view_medical_records = true
    )
  );

CREATE POLICY "staff manage notes" ON public.clinical_notes
  FOR ALL TO authenticated
  USING (
    (
      (SELECT private.is_admin()) OR
      EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = (SELECT auth.uid()) AND role = 'veterinarian'
      )
    ) AND EXISTS (
      SELECT 1 FROM public.encounters e
      WHERE e.id = clinical_notes.encounter_id
      AND e.status = 'draft'
    )
  )
  WITH CHECK (
    (
      (SELECT private.is_admin()) OR
      EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = (SELECT auth.uid()) AND role = 'veterinarian'
      )
    ) AND EXISTS (
      SELECT 1 FROM public.encounters e
      WHERE e.id = clinical_notes.encounter_id
      AND e.status = 'draft'
    )
  );

-- 12. RLS Policies for diagnoses
CREATE POLICY "staff view all diagnoses" ON public.diagnoses
  FOR SELECT TO authenticated
  USING (
    (SELECT private.is_admin()) OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (SELECT auth.uid()) AND role = 'veterinarian'
    )
  );

CREATE POLICY "owners view permitted diagnoses" ON public.diagnoses
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.encounters e
      JOIN public.pet_owners po ON po.pet_id = e.pet_id
      WHERE e.id = diagnoses.encounter_id
      AND e.status = 'signed'
      AND po.owner_profile_id = (SELECT auth.uid())
      AND po.can_view_medical_records = true
    )
  );

CREATE POLICY "staff manage diagnoses" ON public.diagnoses
  FOR ALL TO authenticated
  USING (
    (
      (SELECT private.is_admin()) OR
      EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = (SELECT auth.uid()) AND role = 'veterinarian'
      )
    ) AND EXISTS (
      SELECT 1 FROM public.encounters e
      WHERE e.id = diagnoses.encounter_id
      AND e.status = 'draft'
    )
  )
  WITH CHECK (
    (
      (SELECT private.is_admin()) OR
      EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = (SELECT auth.uid()) AND role = 'veterinarian'
      )
    ) AND EXISTS (
      SELECT 1 FROM public.encounters e
      WHERE e.id = diagnoses.encounter_id
      AND e.status = 'draft'
    )
  );

-- 13. RLS Policies for treatments
CREATE POLICY "staff view all treatments" ON public.treatments
  FOR SELECT TO authenticated
  USING (
    (SELECT private.is_admin()) OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (SELECT auth.uid()) AND role = 'veterinarian'
    )
  );

CREATE POLICY "owners view permitted treatments" ON public.treatments
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.encounters e
      JOIN public.pet_owners po ON po.pet_id = e.pet_id
      WHERE e.id = treatments.encounter_id
      AND e.status = 'signed'
      AND po.owner_profile_id = (SELECT auth.uid())
      AND po.can_view_medical_records = true
    )
  );

CREATE POLICY "staff manage treatments" ON public.treatments
  FOR ALL TO authenticated
  USING (
    (
      (SELECT private.is_admin()) OR
      EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = (SELECT auth.uid()) AND role = 'veterinarian'
      )
    ) AND EXISTS (
      SELECT 1 FROM public.encounters e
      WHERE e.id = treatments.encounter_id
      AND e.status = 'draft'
    )
  )
  WITH CHECK (
    (
      (SELECT private.is_admin()) OR
      EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = (SELECT auth.uid()) AND role = 'veterinarian'
      )
    ) AND EXISTS (
      SELECT 1 FROM public.encounters e
      WHERE e.id = treatments.encounter_id
      AND e.status = 'draft'
    )
  );

-- 14. RLS Policies for prescriptions
CREATE POLICY "staff view all prescriptions" ON public.prescriptions
  FOR SELECT TO authenticated
  USING (
    (SELECT private.is_admin()) OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (SELECT auth.uid()) AND role = 'veterinarian'
    )
  );

CREATE POLICY "owners view permitted prescriptions" ON public.prescriptions
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.encounters e
      JOIN public.pet_owners po ON po.pet_id = e.pet_id
      WHERE e.id = prescriptions.encounter_id
      AND e.status = 'signed'
      AND po.owner_profile_id = (SELECT auth.uid())
      AND po.can_view_medical_records = true
    )
  );

CREATE POLICY "staff manage prescriptions" ON public.prescriptions
  FOR ALL TO authenticated
  USING (
    (
      (SELECT private.is_admin()) OR
      EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = (SELECT auth.uid()) AND role = 'veterinarian'
      )
    ) AND EXISTS (
      SELECT 1 FROM public.encounters e
      WHERE e.id = prescriptions.encounter_id
      AND e.status = 'draft'
    )
  )
  WITH CHECK (
    (
      (SELECT private.is_admin()) OR
      EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = (SELECT auth.uid()) AND role = 'veterinarian'
      )
    ) AND EXISTS (
      SELECT 1 FROM public.encounters e
      WHERE e.id = prescriptions.encounter_id
      AND e.status = 'draft'
    )
  );

-- 15. RLS Policies for encounter_amendments
CREATE POLICY "staff view all amendments" ON public.encounter_amendments
  FOR SELECT TO authenticated
  USING (
    (SELECT private.is_admin()) OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (SELECT auth.uid()) AND role = 'veterinarian'
    )
  );

CREATE POLICY "owners view permitted amendments" ON public.encounter_amendments
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.encounters e
      JOIN public.pet_owners po ON po.pet_id = e.pet_id
      WHERE e.id = encounter_amendments.encounter_id
      AND e.status = 'signed'
      AND po.owner_profile_id = (SELECT auth.uid())
      AND po.can_view_medical_records = true
    )
  );

CREATE POLICY "staff insert amendments" ON public.encounter_amendments
  FOR INSERT TO authenticated
  WITH CHECK (
    (
      (SELECT private.is_admin()) OR
      EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = (SELECT auth.uid()) AND role = 'veterinarian'
      )
    ) AND EXISTS (
      SELECT 1 FROM public.encounters e
      WHERE e.id = encounter_amendments.encounter_id
      AND e.status = 'signed'
    )
  );

-- 16. Create triggers for updated_at
CREATE TRIGGER encounters_updated_at
  BEFORE UPDATE ON public.encounters
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER clinical_notes_updated_at
  BEFORE UPDATE ON public.clinical_notes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER prescriptions_updated_at
  BEFORE UPDATE ON public.prescriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- 17. Grant usage on new types
GRANT USAGE ON TYPE public.encounter_status TO authenticated, anon;
GRANT USAGE ON TYPE public.prescription_status TO authenticated, anon;
