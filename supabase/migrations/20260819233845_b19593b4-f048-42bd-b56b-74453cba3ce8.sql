CREATE OR REPLACE FUNCTION public.reset_proposal_signature(p_proposal_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  UPDATE public.proposals
     SET client_signature = NULL,
         signed_at        = NULL,
         status           = 'sent',
         is_active        = true
   WHERE id = p_proposal_id;

  RETURN p_proposal_id;
END;
$function$;

COMMENT ON FUNCTION public.reset_proposal_signature(uuid) IS
  'Clears the signature and reopens a proposal for signing, keeping the client''s line-item selection.';