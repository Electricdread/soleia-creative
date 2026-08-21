-- HLTH and HLTH26 were the same booking entered twice, both on 17 Nov 2026.
--
-- The owner confirmed HLTH26 is the live one. The older HLTH packet carried
-- more text, but all of it was the standard pre_call boilerplate — the generic
-- Creative Guide, Pixel Map and Client Asset Collect inclusions every packet of
-- that kind is created with. HLTH26 holds the only client-specific instruction
-- ("Please upload your brand assets before October 15th, 2026").
--
-- Applied directly first; recorded here so a rebuild from migrations does not
-- resurrect the duplicate.

DELETE FROM public.drive_seen_files
 WHERE drive_folder_id = '1nlNOR9G1dxiTOM4LpoJ_h4gas6vZUBGi';

DELETE FROM public.pre_call_packets
 WHERE id = '588ad7cf-6e38-4c70-8a27-b5bffee915f2';

-- Only if nothing else ended up attached to it.
DELETE FROM public.jobs j
 WHERE j.id = 'a6800aa8-a230-5f04-9245-5043d356182a'
   AND NOT EXISTS (SELECT 1 FROM public.proposals p         WHERE p.job_id = j.id)
   AND NOT EXISTS (SELECT 1 FROM public.pre_call_packets k  WHERE k.job_id = j.id)
   AND NOT EXISTS (SELECT 1 FROM public.creative_sessions s WHERE s.job_id = j.id);
