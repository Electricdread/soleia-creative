-- Record where in a client's Drive folder a file actually landed.
--
-- drive_seen_files.drive_folder_id has always held the folder the watcher was
-- asked to scan, not the folder the file sits in. The walk is recursive, so a
-- file three levels down looked identical to one dropped at the root — which
-- made "which surface is this final for?" unanswerable.
--
-- parent_folder_id / parent_folder_name capture the real parent. final_slot is
-- the resolved surface, computed once by the watcher (see
-- supabase/functions/_shared/finalSlots.ts) so the admin UI is a plain query
-- rather than folder-name string matching in the browser.

alter table public.drive_seen_files
  add column if not exists parent_folder_id   text,
  add column if not exists parent_folder_name text,
  add column if not exists final_slot         text;

-- Only the four known surfaces, or nothing. A file dropped loose in 04_Finals
-- stays null on purpose: it should read as unfiled rather than be quietly
-- counted against a surface nobody chose.
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

-- The job timeline asks "which slots have anything, for this proposal" on every
-- render, so index the pair it filters on.
create index if not exists drive_seen_files_final_slot_idx
  on public.drive_seen_files (proposal_id, final_slot)
  where final_slot is not null;

comment on column public.drive_seen_files.parent_folder_id is
  'Drive id of the folder the file actually sits in — not the folder that was scanned.';
comment on column public.drive_seen_files.parent_folder_name is
  'Folder name as Drive reports it, kept verbatim so a mis-slotted file can be explained.';
comment on column public.drive_seen_files.final_slot is
  'Resolved delivery surface: elevator | tv | main_leds | ticker_marquee. Null when the file is not in a Finals subfolder.';
