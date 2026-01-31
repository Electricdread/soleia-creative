-- Add a column to track featured images for the editorial summary
ALTER TABLE public.creative_sessions 
ADD COLUMN IF NOT EXISTS featured_images jsonb DEFAULT '[]'::jsonb;