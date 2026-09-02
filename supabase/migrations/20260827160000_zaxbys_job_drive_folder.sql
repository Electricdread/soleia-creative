-- 2026-08-27: "09.30.26 |525 Productions x ZAXBYS" had two Drive folders.
-- The client's assets live in 1Dp29PmyzFQN4VTD8bRtx_pxPLObq1_ue (the packet
-- already pointed there); the job and its proposal pointed at the duplicate
-- 13I54HthySBuox6mCv7s0Fcz3oFHZfQOG, which only held Soleia's own guide zip
-- and pixel map. The owner confirmed 1Dp29… is the folder and relabelled
-- it in Drive. Data-only correction, applied the same day through Lovable;
-- kept here for the record. Idempotent.

update public.jobs
   set drive_folder_id  = '1Dp29PmyzFQN4VTD8bRtx_pxPLObq1_ue',
       drive_folder_url = 'https://drive.google.com/drive/folders/1Dp29PmyzFQN4VTD8bRtx_pxPLObq1_ue',
       updated_at       = now()
 where id = 'cabb46a4-b5eb-31c7-8547-2c7f0ca3e3a7'
   and drive_folder_id = '13I54HthySBuox6mCv7s0Fcz3oFHZfQOG';

update public.proposals
   set drive_folder_id  = '1Dp29PmyzFQN4VTD8bRtx_pxPLObq1_ue',
       drive_folder_url = 'https://drive.google.com/drive/folders/1Dp29PmyzFQN4VTD8bRtx_pxPLObq1_ue',
       updated_at       = now()
 where id = 'd1192cd7-5c9d-4d9b-b878-b34983fe998a'
   and drive_folder_id = '13I54HthySBuox6mCv7s0Fcz3oFHZfQOG';
