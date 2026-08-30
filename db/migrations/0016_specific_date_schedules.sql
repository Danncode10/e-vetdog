-- P2.3.2: Specific date schedules and overrides
-- 1. Add new columns to appointment_schedules table for specific date support
ALTER TABLE public.appointment_schedules
  ADD COLUMN IF NOT EXISTS specific_date DATE,
  ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS is_closed BOOLEAN NOT NULL DEFAULT false;

-- 2. Update existing records to set default values (is_recurring=true for backward compatibility)
UPDATE public.appointment_schedules
SET is_recurring = true,
    is_closed = false
WHERE specific_date IS NULL;

-- 3. Create index on specific_date for fast lookups when resolving overrides
CREATE INDEX IF NOT EXISTS idx_appointment_schedules_specific_date ON public.appointment_schedules (specific_date);
CREATE INDEX IF NOT EXISTS idx_appointment_schedules_is_closed ON public.appointment_schedules (is_closed);

-- 4. RLS Policies - existing policies remain, but add check for closed schedules
-- Existing policies for admin/staff viewing apply; applications should check is_closed flag

-- 5. Grant usage on any new constraints if needed (none in this case)