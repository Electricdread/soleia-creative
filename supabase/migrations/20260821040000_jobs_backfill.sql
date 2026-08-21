-- Attach the existing records to jobs.
--
-- The groupings come from src/lib/jobs.ts, run against a live snapshot and
-- reviewed on the Jobs screen before this was written. Records join when they
-- share a distinguishing name and do not contradict on date, which is what
-- pulls together the three cases nothing could group before:
--
--   MRI     = Ascend (proposal + packet) + MRI (session)
--   ZAXBYS  = MOC&CO x ZAXBYS, / MOC&CO x ZAXBYS / 525 Productions
--   Whatnot = "9.23.26 Whatnot" + "09.23.26 WHATNOT"
--
-- Ids are derived from each job's member set, so running this twice produces
-- the same 25 jobs rather than a second copy of every one. Every UPDATE is
-- guarded by `job_id IS NULL`, so it never overwrites an assignment made by
-- hand afterwards.
--
-- To undo: UPDATE proposals/pre_call_packets/creative_sessions SET job_id = NULL;
--          DELETE FROM public.jobs;

-- 25 jobs from 40 records
INSERT INTO public.jobs (id, title, client_name, event_date, track, is_active, drive_folder_id)
VALUES ('e5fd4baf-88a7-32b3-4667-aacc510d4623', 'Brian Porea', 'Brian Porea', '2026-04-08', 'creative', false, NULL)
ON CONFLICT (id) DO NOTHING;
UPDATE public.proposals SET job_id = 'e5fd4baf-88a7-32b3-4667-aacc510d4623' WHERE id IN ('946bb405-b7ed-4cf4-9931-417f22375f38') AND job_id IS NULL;
UPDATE public.creative_sessions SET job_id = 'e5fd4baf-88a7-32b3-4667-aacc510d4623' WHERE id IN ('2ac40bfd-e6d5-4027-88ab-7930649ad390') AND job_id IS NULL;
INSERT INTO public.jobs (id, title, client_name, event_date, track, is_active, drive_folder_id)
VALUES ('5e0d0d77-66f1-cad4-cad7-b6cc6307050f', 'BLACKBEAR Pictures', 'BLACKBEAR Pictures', '2026-04-13', 'in_house', false, NULL)
ON CONFLICT (id) DO NOTHING;
UPDATE public.creative_sessions SET job_id = '5e0d0d77-66f1-cad4-cad7-b6cc6307050f' WHERE id IN ('a9dd4040-c894-4bcf-ab5a-20b7fd207c87') AND job_id IS NULL;
INSERT INTO public.jobs (id, title, client_name, event_date, track, is_active, drive_folder_id)
VALUES ('30cc9af1-54f4-97d1-4000-5f22432eb193', 'Sandler Partners', 'Sandler Partners', '2026-04-14', 'creative', false, NULL)
ON CONFLICT (id) DO NOTHING;
UPDATE public.proposals SET job_id = '30cc9af1-54f4-97d1-4000-5f22432eb193' WHERE id IN ('6333aa36-da42-4f34-b895-dcceccd803e4') AND job_id IS NULL;
UPDATE public.creative_sessions SET job_id = '30cc9af1-54f4-97d1-4000-5f22432eb193' WHERE id IN ('a47b794e-6a3e-4189-a0de-ab9b25e0b2dd') AND job_id IS NULL;
INSERT INTO public.jobs (id, title, client_name, event_date, track, is_active, drive_folder_id)
VALUES ('495c4e8b-a40a-ef16-4359-cc423986c00b', 'ServiceNow', 'ServiceNow', '2026-05-04', 'creative', false, NULL)
ON CONFLICT (id) DO NOTHING;
UPDATE public.proposals SET job_id = '495c4e8b-a40a-ef16-4359-cc423986c00b' WHERE id IN ('ab6d615b-1fa0-4f68-978c-107038bc3043') AND job_id IS NULL;
UPDATE public.creative_sessions SET job_id = '495c4e8b-a40a-ef16-4359-cc423986c00b' WHERE id IN ('f4a5ca31-88a8-4207-9aa0-cf0d5e0cbfa3') AND job_id IS NULL;
INSERT INTO public.jobs (id, title, client_name, event_date, track, is_active, drive_folder_id)
VALUES ('0a2ee5aa-3d1f-b250-036a-a8263eef568c', 'Informa', 'Informa', '2026-05-06', 'in_house', false, NULL)
ON CONFLICT (id) DO NOTHING;
UPDATE public.creative_sessions SET job_id = '0a2ee5aa-3d1f-b250-036a-a8263eef568c' WHERE id IN ('7cd9320b-df48-4163-b836-1869b4dcb688') AND job_id IS NULL;
INSERT INTO public.jobs (id, title, client_name, event_date, track, is_active, drive_folder_id)
VALUES ('1b1547d9-ad6d-3135-be65-d5f8631e4765', 'NTT Data', 'NTT Data', '2026-05-20', 'creative', false, NULL)
ON CONFLICT (id) DO NOTHING;
UPDATE public.proposals SET job_id = '1b1547d9-ad6d-3135-be65-d5f8631e4765' WHERE id IN ('250977a0-417f-4788-95f4-d6520535adef') AND job_id IS NULL;
UPDATE public.creative_sessions SET job_id = '1b1547d9-ad6d-3135-be65-d5f8631e4765' WHERE id IN ('17ca9e72-35a3-43c3-8f27-8e9c54b40669') AND job_id IS NULL;
INSERT INTO public.jobs (id, title, client_name, event_date, track, is_active, drive_folder_id)
VALUES ('37205319-b4a3-d3d3-ebe5-f3606fb35b85', 'GainSight', 'GainSight', '2026-05-27', 'creative', false, '1V8Pu')
ON CONFLICT (id) DO NOTHING;
UPDATE public.proposals SET job_id = '37205319-b4a3-d3d3-ebe5-f3606fb35b85' WHERE id IN ('723d20b0-438a-4e03-bc30-643c2a10a817') AND job_id IS NULL;
INSERT INTO public.jobs (id, title, client_name, event_date, track, is_active, drive_folder_id)
VALUES ('0be6b7d8-1461-e751-e8a5-4c2514a7ec52', 'McDonald''s France', 'McDonald''s France', '2026-06-01', 'creative', false, NULL)
ON CONFLICT (id) DO NOTHING;
UPDATE public.proposals SET job_id = '0be6b7d8-1461-e751-e8a5-4c2514a7ec52' WHERE id IN ('bb1ab750-3213-40ad-8eb8-d8e500bf0776') AND job_id IS NULL;
UPDATE public.creative_sessions SET job_id = '0be6b7d8-1461-e751-e8a5-4c2514a7ec52' WHERE id IN ('5bf68437-440e-495d-98ac-9819f6ede9db') AND job_id IS NULL;
INSERT INTO public.jobs (id, title, client_name, event_date, track, is_active, drive_folder_id)
VALUES ('d3d63fa2-7973-dcb9-698a-2b24e5cc9837', 'The Vanderpump Hotel', 'The Vanderpump Hotel', '2026-06-11', 'creative', false, '1V_Rk')
ON CONFLICT (id) DO NOTHING;
UPDATE public.proposals SET job_id = 'd3d63fa2-7973-dcb9-698a-2b24e5cc9837' WHERE id IN ('62199637-565d-4f79-a04d-fdf36e08f7e3') AND job_id IS NULL;
INSERT INTO public.jobs (id, title, client_name, event_date, track, is_active, drive_folder_id)
VALUES ('417ee3c8-7915-7eea-39db-2d0745c866db', 'Transperfect', 'Transperfect', '2026-06-24', 'creative', false, '1n3Rh')
ON CONFLICT (id) DO NOTHING;
UPDATE public.proposals SET job_id = '417ee3c8-7915-7eea-39db-2d0745c866db' WHERE id IN ('b900896b-2818-4001-96fd-b201bc219964') AND job_id IS NULL;
INSERT INTO public.jobs (id, title, client_name, event_date, track, is_active, drive_folder_id)
VALUES ('8b9e0e53-eae8-6f0b-2a7f-c6e8a56ff155', '4th Of July', 'Ceasars Entertainment', '2026-07-04', 'creative', false, '1oTie')
ON CONFLICT (id) DO NOTHING;
UPDATE public.proposals SET job_id = '8b9e0e53-eae8-6f0b-2a7f-c6e8a56ff155' WHERE id IN ('19cf9851-6ddc-4d87-a0f8-d7c5eae387e3') AND job_id IS NULL;
UPDATE public.creative_sessions SET job_id = '8b9e0e53-eae8-6f0b-2a7f-c6e8a56ff155' WHERE id IN ('6b0bfaae-e42a-47c6-be4a-a0b143eab515') AND job_id IS NULL;
INSERT INTO public.jobs (id, title, client_name, event_date, track, is_active, drive_folder_id)
VALUES ('04960956-96fa-72c6-7076-06e66668cec9', 'Fudale', 'Fudale', '2026-07-20', 'creative', false, '1zGI8')
ON CONFLICT (id) DO NOTHING;
UPDATE public.proposals SET job_id = '04960956-96fa-72c6-7076-06e66668cec9' WHERE id IN ('41ffb935-aab0-45a4-977b-b915864ce862') AND job_id IS NULL;
UPDATE public.creative_sessions SET job_id = '04960956-96fa-72c6-7076-06e66668cec9' WHERE id IN ('07d1d0bd-a43e-4019-93cd-2aca8b3eaffe') AND job_id IS NULL;
INSERT INTO public.jobs (id, title, client_name, event_date, track, is_active, drive_folder_id)
VALUES ('7d427407-d9d6-f9e5-0ab8-42db648b1ad4', 'WWT', 'WWT', '2026-08-25', 'creative', true, '1f3OS1qVdyYYy38veTuSXUXEFkVxGP_If')
ON CONFLICT (id) DO NOTHING;
UPDATE public.pre_call_packets SET job_id = '7d427407-d9d6-f9e5-0ab8-42db648b1ad4' WHERE id IN ('fb28938f-7506-4fc3-b35c-fa9b650541c3') AND job_id IS NULL;
INSERT INTO public.jobs (id, title, client_name, event_date, track, is_active, drive_folder_id)
VALUES ('81386653-d603-ef42-a7c2-849b5a922d29', 'Soleia', 'Soleia', '2026-09-05', 'creative', true, '1Gv2zmdrDot-dtaR9U0TKYDFGNNOQeF6B')
ON CONFLICT (id) DO NOTHING;
UPDATE public.pre_call_packets SET job_id = '81386653-d603-ef42-a7c2-849b5a922d29' WHERE id IN ('8f4e3d04-460c-4186-86b4-42c958de3975') AND job_id IS NULL;
INSERT INTO public.jobs (id, title, client_name, event_date, track, is_active, drive_folder_id)
VALUES ('7b923d0f-1c54-bcf6-bb6c-0d6d445d425d', 'LiUNA!', 'LiUNA!', '2026-09-22', 'in_house', true, NULL)
ON CONFLICT (id) DO NOTHING;
UPDATE public.creative_sessions SET job_id = '7b923d0f-1c54-bcf6-bb6c-0d6d445d425d' WHERE id IN ('f254f295-1f2a-4eb3-b02b-92d87a9b4126') AND job_id IS NULL;
INSERT INTO public.jobs (id, title, client_name, event_date, track, is_active, drive_folder_id)
VALUES ('325c23b9-4a05-8b2c-794b-fc3cd1a7b286', 'Whatnot', 'Whatnot', '2026-09-23', 'creative', true, '1FDZgHBFPG3BOwBhkxpBd_rRcoUuY94V-')
ON CONFLICT (id) DO NOTHING;
UPDATE public.proposals SET job_id = '325c23b9-4a05-8b2c-794b-fc3cd1a7b286' WHERE id IN ('0cc84505-acd7-4f5f-837d-713bee290365') AND job_id IS NULL;
UPDATE public.pre_call_packets SET job_id = '325c23b9-4a05-8b2c-794b-fc3cd1a7b286' WHERE id IN ('69add0de-6f10-4780-a8a1-74dbf61d9ca2') AND job_id IS NULL;
INSERT INTO public.jobs (id, title, client_name, event_date, track, is_active, drive_folder_id)
VALUES ('df185445-6348-9586-8f3b-6a2dc6220a06', 'G2E', 'Interstate15', '2026-09-29', 'creative', true, '1vAEraT9S6L5P3b4yowv0FwaslwcgiZb-')
ON CONFLICT (id) DO NOTHING;
UPDATE public.proposals SET job_id = 'df185445-6348-9586-8f3b-6a2dc6220a06' WHERE id IN ('d7323e53-72c9-46a9-b7e2-1e64bac69fb1') AND job_id IS NULL;
UPDATE public.pre_call_packets SET job_id = 'df185445-6348-9586-8f3b-6a2dc6220a06' WHERE id IN ('7b02cce6-5a6e-4b03-9eb3-1c3be2f43754') AND job_id IS NULL;
UPDATE public.creative_sessions SET job_id = 'df185445-6348-9586-8f3b-6a2dc6220a06' WHERE id IN ('160b812a-c61b-4aac-bbb8-0d60355245f8') AND job_id IS NULL;
INSERT INTO public.jobs (id, title, client_name, event_date, track, is_active, drive_folder_id)
VALUES ('cabb46a4-b5eb-31c7-8547-2c7f0ca3e3a7', 'ZAXBYS', 'MOC&CO x ZAXBYS,', '2026-09-30', 'creative', true, '13I54HthySBuox6mCv7s0Fcz3oFHZfQOG')
ON CONFLICT (id) DO NOTHING;
UPDATE public.proposals SET job_id = 'cabb46a4-b5eb-31c7-8547-2c7f0ca3e3a7' WHERE id IN ('d1192cd7-5c9d-4d9b-b878-b34983fe998a') AND job_id IS NULL;
UPDATE public.pre_call_packets SET job_id = 'cabb46a4-b5eb-31c7-8547-2c7f0ca3e3a7' WHERE id IN ('fd453df1-86ce-4e2e-9573-30e855024ff8') AND job_id IS NULL;
UPDATE public.creative_sessions SET job_id = 'cabb46a4-b5eb-31c7-8547-2c7f0ca3e3a7' WHERE id IN ('8b2e2159-abed-482f-af8e-f7bc67541fbd') AND job_id IS NULL;
INSERT INTO public.jobs (id, title, client_name, event_date, track, is_active, drive_folder_id)
VALUES ('1c8c6b80-babe-507a-20f8-824f2157931a', 'NCAN', 'NCAN', '2026-10-05', 'creative', true, '14L1FvRaLaVK6BErq-DmmBU76ekODNmDi')
ON CONFLICT (id) DO NOTHING;
UPDATE public.pre_call_packets SET job_id = '1c8c6b80-babe-507a-20f8-824f2157931a' WHERE id IN ('9c9b0628-b382-4216-9f66-49a8a513aff4') AND job_id IS NULL;
INSERT INTO public.jobs (id, title, client_name, event_date, track, is_active, drive_folder_id)
VALUES ('a6800aa8-a230-5f04-9245-5043d356182a', 'HLTH', 'HLTH', '2026-11-17', 'creative', true, '1nlNOR9G1dxiTOM4LpoJ_h4gas6vZUBGi')
ON CONFLICT (id) DO NOTHING;
UPDATE public.pre_call_packets SET job_id = 'a6800aa8-a230-5f04-9245-5043d356182a' WHERE id IN ('588ad7cf-6e38-4c70-8a27-b5bffee915f2') AND job_id IS NULL;
INSERT INTO public.jobs (id, title, client_name, event_date, track, is_active, drive_folder_id)
VALUES ('8f7e22a3-9b21-0597-176b-3e978dbd2870', 'HLTH26', 'HLTH26', '2026-11-17', 'creative', true, '1WLpsHWB_mtKh1TwbMEW1f892PTc7lWd9')
ON CONFLICT (id) DO NOTHING;
UPDATE public.pre_call_packets SET job_id = '8f7e22a3-9b21-0597-176b-3e978dbd2870' WHERE id IN ('2a4228ec-ee08-4e65-b294-977b246ad188') AND job_id IS NULL;
INSERT INTO public.jobs (id, title, client_name, event_date, track, is_active, drive_folder_id)
VALUES ('86ab752e-a567-d7d3-7cff-0a5ac89baa53', 'AAPL', 'AAPL', '2026-11-19', 'creative', true, '1XhVGSSsXAZu8vKBO2AyxNdNmS6YOpu1K')
ON CONFLICT (id) DO NOTHING;
UPDATE public.proposals SET job_id = '86ab752e-a567-d7d3-7cff-0a5ac89baa53' WHERE id IN ('8c53b8b1-b709-4dc8-999a-388b56cf8006') AND job_id IS NULL;
UPDATE public.pre_call_packets SET job_id = '86ab752e-a567-d7d3-7cff-0a5ac89baa53' WHERE id IN ('e4c8d96b-687e-45fe-8cf1-13e6a0c55832') AND job_id IS NULL;
INSERT INTO public.jobs (id, title, client_name, event_date, track, is_active, drive_folder_id)
VALUES ('483e621a-e4ae-4c6c-d803-1d29c098574c', 'MRI', 'Ascend', NULL, 'creative', true, '1vY2H28t0N6nUXwejJll7uF5-lx1jYD3O')
ON CONFLICT (id) DO NOTHING;
UPDATE public.proposals SET job_id = '483e621a-e4ae-4c6c-d803-1d29c098574c' WHERE id IN ('dd6bd05f-d3d8-471d-b7c8-c73e1005cfde') AND job_id IS NULL;
UPDATE public.pre_call_packets SET job_id = '483e621a-e4ae-4c6c-d803-1d29c098574c' WHERE id IN ('795e5c56-4ac5-4a8c-84ac-e9919e11e4f4') AND job_id IS NULL;
UPDATE public.creative_sessions SET job_id = '483e621a-e4ae-4c6c-d803-1d29c098574c' WHERE id IN ('e0d86f82-162c-4f18-bc9f-fffa0e9c2a9e') AND job_id IS NULL;
INSERT INTO public.jobs (id, title, client_name, event_date, track, is_active, drive_folder_id)
VALUES ('3e6381ff-766c-8564-dd68-e6b159f004ab', 'Soleia', 'Soleia', NULL, 'in_house', true, NULL)
ON CONFLICT (id) DO NOTHING;
UPDATE public.creative_sessions SET job_id = '3e6381ff-766c-8564-dd68-e6b159f004ab' WHERE id IN ('2c4108a6-5b67-4440-a036-c3bf9d848bd2') AND job_id IS NULL;
INSERT INTO public.jobs (id, title, client_name, event_date, track, is_active, drive_folder_id)
VALUES ('cebb67db-fcc2-5255-1965-308a9ac9487e', 'Soleia LV', 'Soleia LV', NULL, 'in_house', true, NULL)
ON CONFLICT (id) DO NOTHING;
UPDATE public.creative_sessions SET job_id = 'cebb67db-fcc2-5255-1965-308a9ac9487e' WHERE id IN ('9ffdf383-b942-4283-a105-34f3af0be28a') AND job_id IS NULL;
