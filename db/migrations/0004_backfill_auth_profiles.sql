-- Existing Auth users created before the profile trigger need an application
-- profile before owner-scoped RLS and profile settings can work.
INSERT INTO public.profiles (id, email, role)
SELECT id, email, 'owner'::public.user_role
FROM auth.users
ON CONFLICT (id) DO NOTHING;
