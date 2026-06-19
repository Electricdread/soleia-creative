ALTER TABLE public.pre_call_packets
  ADD COLUMN IF NOT EXISTS drive_folder_url text,
  ADD COLUMN IF NOT EXISTS drive_folder_id text,
  ADD COLUMN IF NOT EXISTS creative_guide_url text DEFAULT 'https://soleiacreative.app/creative-guide';