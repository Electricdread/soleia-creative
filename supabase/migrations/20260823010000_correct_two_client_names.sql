-- Two clients the records disagreed about, settled by the owner.
--
-- The MRI job carried three different clients: `Ascend` on the job, proposal
-- and session, `CN` on the packet. The ZAXBYS job carried `MOC&CO x ZAXBYS` on
-- the packet and proposal and `525 Productions` on the session. Neither was a
-- typo — they were different answers, so they could not be normalised, only
-- decided. The owner decided: MRI, and 525 Productions.
--
-- `525 Productions` is spelled as the creative session already spelled it,
-- rather than as a new variant.
--
-- Scoped by job id, because a name like `MRI` is too short to match on safely.

update public.jobs set client_name = 'MRI'
 where id = '483e621a-e4ae-4c6c-d803-1d29c098574c';
update public.pre_call_packets set client_name = 'MRI'
 where job_id = '483e621a-e4ae-4c6c-d803-1d29c098574c';
update public.proposals set client_name = 'MRI'
 where job_id = '483e621a-e4ae-4c6c-d803-1d29c098574c';
update public.creative_sessions set client_name = 'MRI'
 where job_id = '483e621a-e4ae-4c6c-d803-1d29c098574c';

update public.jobs set client_name = '525 Productions'
 where id = 'cabb46a4-b5eb-31c7-8547-2c7f0ca3e3a7';
update public.pre_call_packets set client_name = '525 Productions'
 where job_id = 'cabb46a4-b5eb-31c7-8547-2c7f0ca3e3a7';
update public.proposals set client_name = '525 Productions'
 where job_id = 'cabb46a4-b5eb-31c7-8547-2c7f0ca3e3a7';
update public.creative_sessions set client_name = '525 Productions'
 where job_id = 'cabb46a4-b5eb-31c7-8547-2c7f0ca3e3a7';
