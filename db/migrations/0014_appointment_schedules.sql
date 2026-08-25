-- P2.3.1: Admin-managed appointment schedules and configuration
-- 1. Create new enum for schedule status
CREATE TYPE public.schedule_status AS ENUM (
  'active',
  'inactive'
);

-- 2. Create appointment_schedules table
-- This defines weekly recurring availability slots with capacity limits
CREATE TABLE public.appointment_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  day_of_week integer NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=Sunday, 6=Saturday
  start_time time with time zone NOT NULL,
  end_time time with time zone NOT NULL,
  max_capacity integer NOT NULL DEFAULT 3,
  current_bookings integer NOT NULL DEFAULT 0,
  status schedule_status NOT NULL DEFAULT 'active',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- 3. Create indexes
CREATE INDEX idx_appointment_schedules_day ON public.appointment_schedules (day_of_week);
CREATE INDEX idx_appointment_schedules_status ON public.appointment_schedules (status);

-- 4. Enable RLS
ALTER TABLE public.appointment_schedules ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies
-- Admins can manage all schedules
CREATE POLICY "admins manage appointment schedules" ON public.appointment_schedules
  FOR ALL TO authenticated
  USING ((SELECT private.is_admin()))
  WITH CHECK ((SELECT private.is_admin()));

-- Staff can view all schedules
CREATE POLICY "staff view appointment schedules" ON public.appointment_schedules
  FOR SELECT TO authenticated
  USING (
    (SELECT private.is_admin()) OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (SELECT auth.uid()) AND role = 'veterinarian'
    )
  );

-- 6. Grant usage on new type
GRANT USAGE ON TYPE public.schedule_status TO authenticated, anon;
