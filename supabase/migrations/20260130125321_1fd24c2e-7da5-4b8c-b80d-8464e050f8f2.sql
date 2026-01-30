-- Add columns to store AI-generated cover images for creative sessions
ALTER TABLE public.creative_sessions 
ADD COLUMN IF NOT EXISTS cover_images JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS cover_themes TEXT[] DEFAULT NULL,
ADD COLUMN IF NOT EXISTS cover_generated_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;