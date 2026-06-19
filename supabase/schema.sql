-- Reference schema file representing the current Supabase Cloud Database setup.
-- This file matches the exact column types and nullability from your live database.

-- 1. Places Table
CREATE TABLE public.places (
  id TEXT PRIMARY KEY,
  name TEXT,
  address TEXT,
  neighborhood TEXT,
  type TEXT,
  is_totally_vegan BOOLEAN,
  google_rating REAL, -- this was in some migrations but may not be in information_schema unless it was skipped
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  created_at TIMESTAMPTZ
);

-- 2. Profiles Table
CREATE TABLE public.profiles (
  id TEXT PRIMARY KEY,
  display_name TEXT,
  created_at TIMESTAMPTZ
);

-- 3. Reviews Table
CREATE TABLE public.reviews (
  id TEXT PRIMARY KEY,
  place_id TEXT REFERENCES public.places(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES auth.users(id) ON DELETE SET NULL,
  item_ordered TEXT,
  flavor_rating BIGINT,
  comfort_score BIGINT,
  notes TEXT,
  is_public BOOLEAN,
  created_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE public.places ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Policies for Places
CREATE POLICY "places readable by all" ON public.places FOR SELECT USING (true);
CREATE POLICY "auth users update places" ON public.places FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL);

-- Policies for Profiles
CREATE POLICY "profiles readable by all" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "users insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid()::text = id);
CREATE POLICY "users update own profile" ON public.profiles FOR UPDATE USING (auth.uid()::text = id);

-- Policies for Reviews
CREATE POLICY "owner reads own reviews" ON public.reviews FOR SELECT USING (auth.uid()::text = user_id);
CREATE POLICY "authed user inserts own review" ON public.reviews FOR INSERT WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY "owner updates own review" ON public.reviews FOR UPDATE USING (auth.uid()::text = user_id);
CREATE POLICY "owner deletes own review" ON public.reviews FOR DELETE USING (auth.uid()::text = user_id);

-- 4. Function: get_reviews_feed
CREATE OR REPLACE FUNCTION public.get_reviews_feed()
RETURNS TABLE (
  id uuid,
  place_id uuid,
  user_id uuid,
  item_ordered text,
  flavor_rating integer, -- Postgres will cast bigint to integer when returning via the function, or we can change these to bigint/text if preferred
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
    r.id::uuid,
    r.place_id::uuid,
    r.user_id::uuid,
    r.item_ordered,
    r.flavor_rating::integer,
    r.comfort_score::integer,
    r.is_public,
    r.created_at,
    CASE
      WHEN r.is_public OR (auth.uid() IS NOT NULL AND auth.uid() = r.user_id::uuid)
        THEN r.notes
      ELSE NULL
    END AS notes
  FROM public.reviews r
  ORDER BY r.created_at DESC;
$$;

-- Grant permissions for reviews feed
REVOKE EXECUTE ON FUNCTION public.get_reviews_feed() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_reviews_feed() TO anon, authenticated;
