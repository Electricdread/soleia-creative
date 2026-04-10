-- Add proposal_id to creative_sessions
ALTER TABLE public.creative_sessions
  ADD COLUMN proposal_id uuid REFERENCES public.proposals(id) ON DELETE SET NULL;

-- Migrate existing links
UPDATE public.creative_sessions cs
SET proposal_id = p.id
FROM public.proposals p
WHERE p.session_id = cs.id;

-- Drop old column from proposals
ALTER TABLE public.proposals DROP COLUMN session_id;