ALTER TABLE "services" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access on services" ON "services";
CREATE POLICY "Allow public read access on services" ON "services" FOR SELECT USING (true);
