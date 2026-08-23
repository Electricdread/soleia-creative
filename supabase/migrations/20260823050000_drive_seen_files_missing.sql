-- A file deleted in Drive lived on in this table for ever.
--
-- drive_seen_files is append-only: the watcher records what it finds and
-- nothing ever removed a row, so a file the owner deleted in Drive kept
-- appearing in the dashboard's activity and kept counting towards a job's
-- assets. The sweep already knows what is in the folder; this gives it
-- somewhere to say what is no longer there.
--
-- Nullable on purpose: null means present, which is what every existing row is.
alter table public.drive_seen_files
  add column if not exists missing_since timestamptz;

create index if not exists drive_seen_files_present_idx
  on public.drive_seen_files (drive_folder_id)
  where missing_since is null;
