-- Add is_public column to creative_sessions table for public/private toggle
ALTER TABLE public.creative_sessions 
ADD COLUMN is_public boolean NOT NULL DEFAULT false;