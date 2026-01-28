-- Create storage bucket for session uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('session-uploads', 'session-uploads', true);

-- Create RLS policies for the bucket
CREATE POLICY "Anyone can view session uploads"
ON storage.objects FOR SELECT
USING (bucket_id = 'session-uploads');

CREATE POLICY "Anyone can upload to session uploads"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'session-uploads');

CREATE POLICY "Anyone can delete session uploads"
ON storage.objects FOR DELETE
USING (bucket_id = 'session-uploads');

-- Create table for tracking session uploads
CREATE TABLE public.session_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  link_id UUID NOT NULL REFERENCES public.client_links(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.session_uploads ENABLE ROW LEVEL SECURITY;

-- RLS policies - allow access for active links only
CREATE POLICY "Anyone can view uploads for active links"
ON public.session_uploads FOR SELECT
USING (EXISTS (
  SELECT 1 FROM client_links
  WHERE client_links.id = session_uploads.link_id
  AND client_links.is_active = true
));

CREATE POLICY "Anyone can insert uploads for active links"
ON public.session_uploads FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM client_links
  WHERE client_links.id = session_uploads.link_id
  AND client_links.is_active = true
));

CREATE POLICY "Anyone can delete uploads for active links"
ON public.session_uploads FOR DELETE
USING (EXISTS (
  SELECT 1 FROM client_links
  WHERE client_links.id = session_uploads.link_id
  AND client_links.is_active = true
));

-- Enable realtime for session_uploads
ALTER PUBLICATION supabase_realtime ADD TABLE public.session_uploads;