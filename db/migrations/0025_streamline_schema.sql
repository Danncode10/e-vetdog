-- Migration: 0025_streamline_schema.sql
-- Description: Drop unused/confusing tables (check_ins, payment_corrections, notifications) and enum check_in_status

DROP TABLE IF EXISTS public.check_ins CASCADE;
DROP TABLE IF EXISTS public.payment_corrections CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TYPE IF EXISTS public.check_in_status CASCADE;
