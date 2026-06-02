-- Restrict updates on places to authenticated users only
DROP POLICY IF EXISTS "places updatable by all" ON public.places;

CREATE POLICY "auth users update places"
ON public.places
FOR UPDATE
TO authenticated
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- Lock down SECURITY DEFINER function: only allow authenticated callers
REVOKE EXECUTE ON FUNCTION public.get_reviews_feed() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_reviews_feed() TO authenticated;