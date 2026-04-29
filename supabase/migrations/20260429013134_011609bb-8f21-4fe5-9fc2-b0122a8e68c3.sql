CREATE TABLE public.lookbook_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.lookbook_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read lookbook categories"
  ON public.lookbook_categories FOR SELECT
  USING (true);

CREATE POLICY "Admins manage lookbook categories"
  ON public.lookbook_categories FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_lookbook_categories_updated_at
  BEFORE UPDATE ON public.lookbook_categories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.cached_clips
  ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES public.lookbook_categories(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_cached_clips_category_id ON public.cached_clips(category_id);

INSERT INTO public.lookbook_categories (name, slug, sort_order) VALUES
  ('Ambient', 'ambient', 10),
  ('Logo Reveal', 'logo-reveal', 20),
  ('Transition', 'transition', 30),
  ('Texture', 'texture', 40),
  ('Cinematic', 'cinematic', 50)
ON CONFLICT (slug) DO NOTHING;