ALTER TABLE public.cached_clips
  ADD COLUMN IF NOT EXISTS drive_file_id text,
  ADD COLUMN IF NOT EXISTS drive_web_view_link text,
  ADD COLUMN IF NOT EXISTS original_storage text NOT NULL DEFAULT 'supabase';

CREATE INDEX IF NOT EXISTS idx_cached_clips_original_storage
  ON public.cached_clips (original_storage);