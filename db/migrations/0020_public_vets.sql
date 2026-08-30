CREATE POLICY "anyone can view veterinarians" ON public.profiles
  FOR SELECT TO authenticated
  USING (role = 'veterinarian' OR role = 'admin');