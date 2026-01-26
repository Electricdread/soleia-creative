-- Create table for shared selections per client link
CREATE TABLE public.link_selections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  link_id UUID NOT NULL REFERENCES public.client_links(id) ON DELETE CASCADE,
  clip_id TEXT NOT NULL,
  clip_title TEXT NOT NULL,
  clip_thumbnail TEXT,
  clip_category TEXT,
  note TEXT DEFAULT '',
  placements TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(link_id, clip_id)
);

-- Enable RLS
ALTER TABLE public.link_selections ENABLE ROW LEVEL SECURITY;

-- Create permissive policies for shared access (anyone with the link can interact)
CREATE POLICY "Anyone can view selections for active links"
ON public.link_selections
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.client_links 
    WHERE id = link_id AND is_active = true
  )
);

CREATE POLICY "Anyone can insert selections for active links"
ON public.link_selections
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.client_links 
    WHERE id = link_id AND is_active = true
  )
);

CREATE POLICY "Anyone can update selections for active links"
ON public.link_selections
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.client_links 
    WHERE id = link_id AND is_active = true
  )
);

CREATE POLICY "Anyone can delete selections for active links"
ON public.link_selections
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.client_links 
    WHERE id = link_id AND is_active = true
  )
);

-- Enable realtime for live sync across viewers
ALTER PUBLICATION supabase_realtime ADD TABLE public.link_selections;

-- Add trigger for updated_at
CREATE TRIGGER update_link_selections_updated_at
  BEFORE UPDATE ON public.link_selections
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();