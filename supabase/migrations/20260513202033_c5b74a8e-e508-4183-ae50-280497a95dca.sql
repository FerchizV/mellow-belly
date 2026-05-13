-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles readable by all"
  ON public.profiles FOR SELECT USING (true);

CREATE POLICY "users insert own profile"
  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "users update own profile"
  ON public.profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'display_name',
      split_part(NEW.email, '@', 1)
    )
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Reviews: add user_id and is_public
ALTER TABLE public.reviews
  ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN is_public BOOLEAN NOT NULL DEFAULT false;

-- Tighten reviews RLS: drop old open policies
DROP POLICY IF EXISTS "reviews readable by all" ON public.reviews;
DROP POLICY IF EXISTS "reviews insertable by all" ON public.reviews;
DROP POLICY IF EXISTS "reviews updatable by all" ON public.reviews;
DROP POLICY IF EXISTS "reviews deletable by all" ON public.reviews;

-- Owner-only direct access on the base table (notes are sensitive)
CREATE POLICY "owner reads own reviews"
  ON public.reviews FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "authed user inserts own review"
  ON public.reviews FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "owner updates own review"
  ON public.reviews FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "owner deletes own review"
  ON public.reviews FOR DELETE USING (auth.uid() = user_id);

-- Public/community feed view: masks notes for non-owners unless is_public
CREATE OR REPLACE VIEW public.reviews_feed
WITH (security_invoker = off) AS
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
FROM public.reviews r;

GRANT SELECT ON public.reviews_feed TO anon, authenticated;