-- Create the update function first
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create table for cached clips
CREATE TABLE public.cached_clips (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  external_id TEXT NOT NULL,
  title TEXT NOT NULL,
  thumbnail TEXT,
  video_url TEXT,
  preview_url TEXT,
  resolution TEXT DEFAULT '4K',
  duration TEXT,
  category TEXT NOT NULL,
  source_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(external_id, category)
);

-- Create index for faster category lookups
CREATE INDEX idx_cached_clips_category ON public.cached_clips(category);

-- Create index for search
CREATE INDEX idx_cached_clips_title ON public.cached_clips USING gin(to_tsvector('english', title));

-- Enable RLS
ALTER TABLE public.cached_clips ENABLE ROW LEVEL SECURITY;

-- Allow public read access (clips are public content)
CREATE POLICY "Anyone can view cached clips"
ON public.cached_clips
FOR SELECT
USING (true);

-- Create updated_at trigger
CREATE TRIGGER update_cached_clips_updated_at
BEFORE UPDATE ON public.cached_clips
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();