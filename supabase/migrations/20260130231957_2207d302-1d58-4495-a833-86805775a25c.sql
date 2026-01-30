-- Create table for caching synced creative content
CREATE TABLE IF NOT EXISTS public.synced_creative_content (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  external_id TEXT NOT NULL,
  source TEXT NOT NULL, -- 'midjourney', 'openart', etc.
  url TEXT NOT NULL,
  thumbnail TEXT,
  title TEXT,
  media_type TEXT DEFAULT 'image', -- 'image' or 'video'
  width INTEGER,
  height INTEGER,
  sort_order INTEGER,
  synced_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(external_id, source)
);

-- Enable RLS
ALTER TABLE public.synced_creative_content ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read cached content (public gallery)
CREATE POLICY "Synced content is publicly readable"
  ON public.synced_creative_content
  FOR SELECT
  USING (true);

-- Only admins can insert/update/delete using existing user_roles table
CREATE POLICY "Admins can manage synced content"
  ON public.synced_creative_content
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Create index for efficient queries
CREATE INDEX idx_synced_content_source ON public.synced_creative_content(source);
CREATE INDEX idx_synced_content_sort ON public.synced_creative_content(sort_order NULLS LAST, synced_at DESC);