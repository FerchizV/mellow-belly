
CREATE TABLE public.places (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  neighborhood TEXT NOT NULL,
  type TEXT NOT NULL,
  is_totally_vegan BOOLEAN NOT NULL DEFAULT false,
  google_rating REAL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  place_id UUID NOT NULL REFERENCES public.places(id) ON DELETE CASCADE,
  item_ordered TEXT NOT NULL,
  flavor_rating INTEGER NOT NULL CHECK (flavor_rating BETWEEN 1 AND 5),
  comfort_score INTEGER NOT NULL CHECK (comfort_score BETWEEN 1 AND 5),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.places ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "places readable by all" ON public.places FOR SELECT USING (true);
CREATE POLICY "places insertable by all" ON public.places FOR INSERT WITH CHECK (true);

CREATE POLICY "reviews readable by all" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "reviews insertable by all" ON public.reviews FOR INSERT WITH CHECK (true);
CREATE POLICY "reviews updatable by all" ON public.reviews FOR UPDATE USING (true);
CREATE POLICY "reviews deletable by all" ON public.reviews FOR DELETE USING (true);

CREATE INDEX idx_reviews_place_id ON public.reviews(place_id);
CREATE INDEX idx_reviews_created_at ON public.reviews(created_at DESC);
