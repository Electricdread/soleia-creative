
CREATE TABLE public.content_previews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  link_id UUID NOT NULL REFERENCES public.client_links(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  subtitle TEXT,
  video_url TEXT,
  video_type TEXT DEFAULT 'video/mp4',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.content_previews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view previews for active links"
  ON public.content_previews FOR SELECT
  TO public
  USING (EXISTS (
    SELECT 1 FROM public.client_links
    WHERE client_links.id = content_previews.link_id AND client_links.is_active = true
  ));

CREATE POLICY "Admins can manage content previews"
  ON public.content_previews FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
