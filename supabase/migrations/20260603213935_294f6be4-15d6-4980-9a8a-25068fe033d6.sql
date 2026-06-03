ALTER TABLE public.proposals ADD COLUMN IF NOT EXISTS proposal_scenario text NOT NULL DEFAULT 'pre_call_packet';

UPDATE public.proposals
SET proposal_scenario = CASE
  WHEN is_pre_call_packet = false THEN 'pre_packet_no_call'
  ELSE 'pre_call_packet'
END;

ALTER TABLE public.proposals
  ADD CONSTRAINT proposals_proposal_scenario_check
  CHECK (proposal_scenario IN ('pre_call_packet','pre_packet_no_call','direct_quote'));