ALTER TABLE public.proposal_items ALTER COLUMN client_selected SET DEFAULT false;

UPDATE public.proposal_items pi
SET client_selected = false
FROM public.proposals p
WHERE p.id = pi.proposal_id
  AND p.signed_at IS NULL
  AND pi.client_selected = true;