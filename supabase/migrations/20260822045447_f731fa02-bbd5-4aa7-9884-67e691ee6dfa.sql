alter table public.drive_seen_files
  add column if not exists parent_folder_id   text,
  add column if not exists parent_folder_name text,
  add column if not exists final_slot         text;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'drive_seen_files_final_slot_check'
  ) then
    alter table public.drive_seen_files
      add constraint drive_seen_files_final_slot_check
      check (final_slot is null or final_slot in ('elevator', 'tv', 'main_leds', 'ticker_marquee'));
  end if;
end $$;

create index if not exists drive_seen_files_final_slot_idx
  on public.drive_seen_files (proposal_id, final_slot)
  where final_slot is not null;

comment on column public.drive_seen_files.parent_folder_id is
  'Drive id of the folder the file actually sits in — not the folder that was scanned.';
comment on column public.drive_seen_files.parent_folder_name is
  'Folder name as Drive reports it, kept verbatim so a mis-slotted file can be explained.';
comment on column public.drive_seen_files.final_slot is
  'Resolved delivery surface: elevator | tv | main_leds | ticker_marquee. Null when the file is not in a Finals subfolder.';