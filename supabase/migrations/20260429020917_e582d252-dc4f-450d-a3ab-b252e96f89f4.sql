CREATE TABLE public.lookbook_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token text NOT NULL UNIQUE,
  title text NOT NULL,
  intro_note text,
  category_id uuid REFERENCES public.lookbook_categories(id) ON DELETE SET NULL,
  clip_ids uuid[],
  is_active boolean NOT NULL DEFAULT true,
  expires_at timestamptz,
  view_count integer NOT NULL DEFAULT 0,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_lookbook_shares_token ON public.lookbook_shares(token);

ALTER TABLE public.lookbook_shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage lookbook shares"
  ON public.lookbook_shares
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Public can view active non-expired shares"
  ON public.lookbook_shares
  FOR SELECT
  TO public
  USING (is_active = true AND (expires_at IS NULL OR expires_at > now()));

CREATE POLICY "Public can increment view count on active shares"
  ON public.lookbook_shares
  FOR UPDATE
  TO public
  USING (is_active = true AND (expires_at IS NULL OR expires_at > now()))
  WITH CHECK (is_active = true AND (expires_at IS NULL OR expires_at > now()));

CREATE TRIGGER update_lookbook_shares_updated_at
  BEFORE UPDATE ON public.lookbook_shares
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();