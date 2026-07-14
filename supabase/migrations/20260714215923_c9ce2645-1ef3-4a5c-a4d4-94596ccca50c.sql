
ALTER TABLE public.line_item_templates
  ADD COLUMN IF NOT EXISTS long_description text,
  ADD COLUMN IF NOT EXISTS deliverables text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS ideal_for text,
  ADD COLUMN IF NOT EXISTS sort_order integer;

CREATE TABLE IF NOT EXISTS public.line_item_categories (
  name text PRIMARY KEY,
  intro text,
  sort_order integer,
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.line_item_categories TO authenticated;
GRANT ALL ON public.line_item_categories TO service_role;

ALTER TABLE public.line_item_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage line item categories"
  ON public.line_item_categories FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can read line item categories"
  ON public.line_item_categories FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));
