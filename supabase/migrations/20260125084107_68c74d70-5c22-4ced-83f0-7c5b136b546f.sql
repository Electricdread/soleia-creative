-- Add sort_order column to cached_clips for reordering
ALTER TABLE public.cached_clips 
ADD COLUMN IF NOT EXISTS sort_order integer DEFAULT 0;