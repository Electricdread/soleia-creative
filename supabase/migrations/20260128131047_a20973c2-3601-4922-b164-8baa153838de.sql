-- Create junction table to associate clips with client sessions
CREATE TABLE public.link_clips (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  link_id UUID NOT NULL REFERENCES public.client_links(id) ON DELETE CASCADE,
  clip_id UUID NOT NULL REFERENCES public.cached_clips(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(link_id, clip_id)
);

-- Enable RLS
ALTER TABLE public.link_clips ENABLE ROW LEVEL SECURITY;

-- RLS policies for link_clips
CREATE POLICY "Anyone can view clips for active links"
ON public.link_clips FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM client_links
    WHERE client_links.id = link_clips.link_id
    AND client_links.is_active = true
  )
);

CREATE POLICY "Anyone can insert clips for links"
ON public.link_clips FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can delete clips for links"
ON public.link_clips FOR DELETE
USING (true);