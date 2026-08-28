ALTER TYPE "public"."appointment_status" ADD VALUE 'booked';

UPDATE public.appointments
SET status = 'booked'
WHERE status IN ('requested', 'scheduled', 'confirmed');