ALTER TABLE public.proposals
  ADD COLUMN IF NOT EXISTS drive_folder_url TEXT,
  ADD COLUMN IF NOT EXISTS drive_folder_id TEXT;