-- P1.3: Staff lifecycle and audit trail.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

CREATE OR REPLACE FUNCTION private.prevent_removing_final_active_admin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private
AS $$
BEGIN
  IF OLD.role = 'admin' AND OLD.is_active AND (NEW.role <> 'admin' OR NOT NEW.is_active) THEN
    PERFORM 1
    FROM public.profiles
    WHERE id <> OLD.id
      AND role = 'admin'
      AND is_active = true
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'The final active administrator cannot be deactivated or changed to veterinarian.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_final_active_admin ON public.profiles;
CREATE TRIGGER protect_final_active_admin
  BEFORE UPDATE OF role, is_active ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION private.prevent_removing_final_active_admin();

REVOKE ALL ON FUNCTION private.prevent_removing_final_active_admin() FROM PUBLIC, anon, authenticated;

CREATE TABLE IF NOT EXISTS public.staff_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  target_profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  action text NOT NULL,
  previous_values jsonb,
  next_values jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS staff_audit_logs_target_profile_id_idx
  ON public.staff_audit_logs USING btree (target_profile_id);
CREATE INDEX IF NOT EXISTS staff_audit_logs_created_at_idx
  ON public.staff_audit_logs USING btree (created_at);

ALTER TABLE public.staff_audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admins view staff audit logs" ON public.staff_audit_logs;
CREATE POLICY "admins view staff audit logs" ON public.staff_audit_logs
  FOR SELECT TO authenticated
  USING ((SELECT private.is_admin()));

REVOKE INSERT, UPDATE, DELETE ON public.staff_audit_logs FROM anon, authenticated;
