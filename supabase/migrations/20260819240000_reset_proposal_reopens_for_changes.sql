-- Reset a signed proposal so a client can change something.
--
-- The reset promised to reopen a proposal for signing and did not, in two ways.
--
-- It left is_active untouched. get_proposal_by_token requires is_active, so a
-- deactivated proposal stayed unreachable: the client was handed a dead link
-- rather than a reopened one. Most signed proposals here are deactivated, so
-- this was the common case, not the edge one.
--
-- It also set every line item back to client_selected = true, discarding the
-- selection the client had actually signed. Someone who wanted to change a
-- single line had to re-choose all of them. Their selection is now left exactly
-- as they left it, which is the point of reopening rather than resending.

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
