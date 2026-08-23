alter table public.drive_seen_files
  add column if not exists missing_since timestamptz;

create index if not exists drive_seen_files_present_idx
  on public.drive_seen_files (drive_folder_id)
  where missing_since is null;