-- P2.1: Appointment schema, lifecycle, and RLS
-- 1. Create new enums for appointments
CREATE TYPE public.appointment_status AS ENUM (
  'requested',
  'scheduled',
  'completed',
  'cancelled',
  'no_show'
);

CREATE TYPE public.check_in_status AS ENUM (
  'checked_in',
  'in_progress',
  'completed'
);

CREATE TYPE public.appointment_mode AS ENUM (
  'in_person',
  'virtual'
);

CREATE TYPE public.cancellation_reason AS ENUM (
  'owner_request',
  'clinic_emergency',
  'weather',
  'no_veterinarian_available',
  'pet_health_issue',
  'other'
);

CREATE TYPE public.reschedule_reason AS ENUM (
  'owner_request',
  'veterinarian_unavailable',
  'clinic_schedule_conflict',
  'equipment_issue',
  'pet_health_issue',
  'other'
);

-- 2. Create appointments table
CREATE TABLE public.appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id uuid NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  service_id uuid REFERENCES public.services(id) ON DELETE SET NULL,
  status public.appointment_status NOT NULL DEFAULT 'requested',
  mode public.appointment_mode NOT NULL DEFAULT 'in_person',
  reason text,
  notes text,
  preferred_date date,
  preferred_time text,
  scheduled_start timestamp with time zone,
  scheduled_end timestamp with time zone,
  assigned_veterinarian_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  requested_at timestamp with time zone NOT NULL DEFAULT now(),
  confirmed_at timestamp with time zone,
  completed_at timestamp with time zone,
  cancelled_at timestamp with time zone,
  cancellation_reason public.cancellation_reason,
  rescheduled_from uuid REFERENCES public.appointments(id) ON DELETE SET NULL,
  no_show_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- 3. Create appointment_status_history table
CREATE TABLE public.appointment_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id uuid NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  previous_status public.appointment_status,
  new_status public.appointment_status NOT NULL,
  changed_by_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  reason text,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- 4. Create check_ins table
CREATE TABLE public.check_ins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id uuid REFERENCES public.appointments(id) ON DELETE SET NULL,
  pet_id uuid REFERENCES public.pets(id) ON DELETE SET NULL,
  owner_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  status public.check_in_status NOT NULL DEFAULT 'checked_in',
  walk_in boolean NOT NULL DEFAULT false,
  arrival_time timestamp with time zone NOT NULL DEFAULT now(),
  service_start timestamp with time zone,
  service_end timestamp with time zone,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- 5. Create indexes
CREATE INDEX idx_appointments_pet_id ON public.appointments USING btree (pet_id);
CREATE INDEX idx_appointments_owner_id ON public.appointments USING btree (owner_id);
CREATE INDEX idx_appointments_status ON public.appointments USING btree (status);
CREATE INDEX idx_appointments_scheduled_start ON public.appointments USING btree (scheduled_start);
CREATE INDEX idx_appointments_assigned_veterinarian_id ON public.appointments USING btree (assigned_veterinarian_id);

CREATE INDEX idx_appointment_status_history_appointment_id ON public.appointment_status_history USING btree (appointment_id);
CREATE INDEX idx_appointment_status_history_created_at ON public.appointment_status_history USING btree (created_at);

CREATE INDEX idx_check_ins_appointment_id ON public.check_ins USING btree (appointment_id);
CREATE INDEX idx_check_ins_pet_id ON public.check_ins USING btree (pet_id);
CREATE INDEX idx_check_ins_owner_id ON public.check_ins USING btree (owner_id);
CREATE INDEX idx_check_ins_arrival_time ON public.check_ins USING btree (arrival_time);

-- 6. Enable RLS on new tables
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointment_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.check_ins ENABLE ROW LEVEL SECURITY;

-- 7. RLS Policies for appointments
-- Owners can view appointments for their linked pets
CREATE POLICY "owners view own appointments" ON public.appointments
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.pet_owners
      WHERE pet_owners.pet_id = appointments.pet_id
      AND pet_owners.owner_profile_id = (SELECT auth.uid())
    )
  );

-- Owners can create appointment requests for their linked pets
CREATE POLICY "owners create appointments" ON public.appointments
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.pet_owners
      WHERE pet_owners.pet_id = appointments.pet_id
      AND pet_owners.owner_profile_id = (SELECT auth.uid())
    )
    AND status = 'requested'
    AND owner_id = (SELECT auth.uid())
  );

-- Owners can cancel their own requested/scheduled appointments
CREATE POLICY "owners cancel own appointments" ON public.appointments
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.pet_owners
      WHERE pet_owners.pet_id = appointments.pet_id
      AND pet_owners.owner_profile_id = (SELECT auth.uid())
    )
    AND status IN ('requested', 'scheduled')
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.pet_owners
      WHERE pet_owners.pet_id = appointments.pet_id
      AND pet_owners.owner_profile_id = (SELECT auth.uid())
    )
    AND (
      (status = 'cancelled' AND status IN ('requested', 'scheduled'))
      OR (status = 'requested')
    )
  );

-- Veterinarians and admins can view all appointments
CREATE POLICY "staff view all appointments" ON public.appointments
  FOR SELECT TO authenticated
  USING (
    (SELECT private.is_admin()) OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (SELECT auth.uid()) AND role = 'veterinarian'
    )
  );

-- Veterinarians and admins can update appointments (schedule, reassign, complete, etc.)
CREATE POLICY "staff manage appointments" ON public.appointments
  FOR UPDATE TO authenticated
  USING (
    (SELECT private.is_admin()) OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (SELECT auth.uid()) AND role = 'veterinarian'
    )
  )
  WITH CHECK (
    (SELECT private.is_admin()) OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (SELECT auth.uid()) AND role = 'veterinarian'
    )
  );

-- Admins can delete appointments
CREATE POLICY "admins delete appointments" ON public.appointments
  FOR DELETE TO authenticated
  USING ((SELECT private.is_admin()));

-- 8. RLS Policies for appointment_status_history
-- Owners can view status history for their appointments
CREATE POLICY "owners view appointment status history" ON public.appointment_status_history
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.appointments a
      JOIN public.pet_owners po ON po.pet_id = a.pet_id
      WHERE a.id = appointment_status_history.appointment_id
      AND po.owner_profile_id = (SELECT auth.uid())
    )
  );

-- Staff can view all status history
CREATE POLICY "staff view appointment status history" ON public.appointment_status_history
  FOR SELECT TO authenticated
  USING (
    (SELECT private.is_admin()) OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (SELECT auth.uid()) AND role = 'veterinarian'
    )
  );

-- Status history inserts are handled by triggers/services
CREATE POLICY "system insert status history" ON public.appointment_status_history
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- 9. RLS Policies for check_ins
-- Owners can view check-ins for their pets' appointments
CREATE POLICY "owners view check-ins" ON public.check_ins
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.pet_owners
      WHERE pet_owners.pet_id = check_ins.pet_id
      AND pet_owners.owner_profile_id = (SELECT auth.uid())
    )
  );

-- Staff can view all check-ins
CREATE POLICY "staff view check-ins" ON public.check_ins
  FOR SELECT TO authenticated
  USING (
    (SELECT private.is_admin()) OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (SELECT auth.uid()) AND role = 'veterinarian'
    )
  );

-- Staff can manage check-ins
CREATE POLICY "staff manage check-ins" ON public.check_ins
  FOR ALL TO authenticated
  USING (
    (SELECT private.is_admin()) OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (SELECT auth.uid()) AND role = 'veterinarian'
    )
  )
  WITH CHECK (
    (SELECT private.is_admin()) OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (SELECT auth.uid()) AND role = 'veterinarian'
    )
  );

-- 10. Create triggers for updated_at
CREATE TRIGGER appointments_updated_at
  BEFORE UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER check_ins_updated_at
  BEFORE UPDATE ON public.check_ins
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- 11. Create trigger function for appointment status history
CREATE OR REPLACE FUNCTION public.log_appointment_status_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  current_user_id uuid := (SELECT auth.uid());
BEGIN
  -- Only log if status actually changed
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.appointment_status_history (
      appointment_id,
      previous_status,
      new_status,
      changed_by_id,
      reason,
      notes
    ) VALUES (
      NEW.id,
      OLD.status,
      NEW.status,
      current_user_id,
      CASE
        WHEN NEW.status = 'cancelled' THEN NEW.cancellation_reason::text
        WHEN NEW.status = 'scheduled' AND OLD.status = 'requested' THEN 'confirmed'
        WHEN NEW.status = 'no_show' THEN 'no_show'
        ELSE NULL
      END,
      NEW.notes
    );
  END IF;
  RETURN NEW;
END;
$$;

-- 12. Attach trigger to appointments table
CREATE TRIGGER trigger_log_appointment_status_change
  AFTER UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.log_appointment_status_change();

-- 13. Grant execute on trigger function
GRANT EXECUTE ON FUNCTION public.log_appointment_status_change() TO authenticated;

-- 14. Helper function to check for double-booking
CREATE OR REPLACE FUNCTION public.check_double_booking(
  p_veterinarian_id uuid,
  p_start timestamp with time zone,
  p_end timestamp with time zone,
  p_exclude_appointment_id uuid DEFAULT NULL
)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.appointments
    WHERE assigned_veterinarian_id = p_veterinarian_id
    AND status IN ('requested', 'scheduled')
    AND scheduled_start IS NOT NULL
    AND scheduled_end IS NOT NULL
    AND scheduled_start < p_end
    AND scheduled_end > p_start
    AND (p_exclude_appointment_id IS NULL OR id <> p_exclude_appointment_id)
  );
$$;

REVOKE ALL ON FUNCTION public.check_double_booking(uuid, timestamp with time zone, timestamp with time zone, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.check_double_booking(uuid, timestamp with time zone, timestamp with time zone, uuid) TO authenticated;

-- 15. Grant usage on new types
GRANT USAGE ON TYPE public.appointment_status TO authenticated, anon;
GRANT USAGE ON TYPE public.check_in_status TO authenticated, anon;
GRANT USAGE ON TYPE public.appointment_mode TO authenticated, anon;
GRANT USAGE ON TYPE public.cancellation_reason TO authenticated, anon;
GRANT USAGE ON TYPE public.reschedule_reason TO authenticated, anon;