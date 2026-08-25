-- P2.3.1: Admin-managed appointment schedules - fix missing table and RLS policies
-- This migration creates the appointment_schedules table and RLS policies

-- 1. Create enum for schedule status if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'schedule_status') THEN
        CREATE TYPE public.schedule_status AS ENUM ('active', 'inactive');
    END IF;
END
$$;

-- 2. Create appointment_schedules table if not exists
CREATE TABLE IF NOT EXISTS public.appointment_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day_of_week INT NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  max_capacity INT NOT NULL DEFAULT 1,
  status schedule_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Enable RLS if not already enabled
ALTER TABLE public.appointment_schedules ENABLE ROW LEVEL SECURITY;

-- 4. Policy: Allow read for authenticated users
CREATE POLICY "Allow read for authenticated"
  ON public.appointment_schedules FOR SELECT
  TO authenticated
  USING (true);

-- 5. Policy: Allow write for staff/admin (veterinarian or admin role)
CREATE POLICY "Allow write for staff/admin"
  ON public.appointment_schedules FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('veterinarian', 'admin')
    )
  );