
CREATE TABLE public.line_item_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  price numeric NOT NULL DEFAULT 0,
  category text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.line_item_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage line item templates"
  ON public.line_item_templates FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can read line item templates"
  ON public.line_item_templates FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));
