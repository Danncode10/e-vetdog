-- P1.3: Staff audit logs are append-only from server code.
REVOKE ALL ON TABLE public.staff_audit_logs FROM PUBLIC;
REVOKE ALL ON TABLE public.staff_audit_logs FROM anon;
REVOKE ALL ON TABLE public.staff_audit_logs FROM authenticated;

GRANT SELECT ON TABLE public.staff_audit_logs TO authenticated;
