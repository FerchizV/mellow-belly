DROP VIEW IF EXISTS public.reviews_feed;

CREATE OR REPLACE FUNCTION public.get_reviews_feed()
RETURNS TABLE (
  id uuid,
  place_id uuid,
  user_id uuid,
  item_ordered text,
  flavor_rating integer,
  comfort_score integer,
  is_public boolean,
  created_at timestamptz,
  notes text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    r.id,
    r.place_id,
    r.user_id,
    r.item_ordered,
    r.flavor_rating,
    r.comfort_score,
    r.is_public,
    r.created_at,
    CASE
      WHEN r.is_public OR (auth.uid() IS NOT NULL AND auth.uid() = r.user_id)
        THEN r.notes
      ELSE NULL
    END AS notes
  FROM public.reviews r
  ORDER BY r.created_at DESC;
$$;

REVOKE EXECUTE ON FUNCTION public.get_reviews_feed() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_reviews_feed() TO anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;