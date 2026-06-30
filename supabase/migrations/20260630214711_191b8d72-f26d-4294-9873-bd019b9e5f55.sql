
CREATE OR REPLACE FUNCTION public.reset_proposal_signature(p_proposal_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  UPDATE public.proposal_items
     SET client_selected = true
   WHERE proposal_id = p_proposal_id;

  UPDATE public.proposals
     SET client_signature = NULL,
         signed_at = NULL,
         status = 'sent'
   WHERE id = p_proposal_id;

  RETURN p_proposal_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.reset_proposal_signature(uuid) TO authenticated;

UPDATE public.proposal_items
   SET client_selected = true
 WHERE proposal_id = (SELECT id FROM public.proposals WHERE token = '8d55d68d42dba309ecebc01067ff56c6047a9c6963c87b7da9b8783bd6db08de');

UPDATE public.proposals
   SET client_signature = NULL,
       signed_at = NULL,
       status = 'sent'
 WHERE token = '8d55d68d42dba309ecebc01067ff56c6047a9c6963c87b7da9b8783bd6db08de';
