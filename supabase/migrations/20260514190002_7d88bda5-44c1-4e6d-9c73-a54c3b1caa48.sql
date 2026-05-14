DROP POLICY IF EXISTS "places insertable by all" ON public.places;
CREATE POLICY "auth users insert places" ON public.places FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);