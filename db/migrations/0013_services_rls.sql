ALTER TABLE "services" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access on services" ON "services" FOR SELECT USING (true);
