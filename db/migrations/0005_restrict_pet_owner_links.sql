-- Owners may view their existing pet relationships, but cannot grant
-- themselves access to an arbitrary pet by inserting a relationship row.
-- Pet/co-owner assignment is performed by an authorized staff workflow.
DROP POLICY IF EXISTS "owners insert pet_owners" ON public.pet_owners;
