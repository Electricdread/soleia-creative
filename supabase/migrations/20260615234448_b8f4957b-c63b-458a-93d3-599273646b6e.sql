ALTER TABLE public.proposal_items
  ADD COLUMN IF NOT EXISTS client_selected boolean NOT NULL DEFAULT true;

CREATE OR REPLACE FUNCTION public.sign_proposal_by_token(
  p_token text,
  p_signature text,
  p_item_quantities jsonb DEFAULT '[]'::jsonb,
  p_selected_ids uuid[] DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_proposal_id uuid;
  v_item jsonb;
BEGIN
  IF p_signature IS NULL OR length(btrim(p_signature)) = 0 THEN
    RAISE EXCEPTION 'signature required';
  END IF;

  SELECT id INTO v_proposal_id
    FROM public.proposals
   WHERE token = p_token
     AND is_active = true
     AND status = 'sent';

  IF v_proposal_id IS NULL THEN
    RAISE EXCEPTION 'proposal not available for signing';
  END IF;

  IF jsonb_typeof(p_item_quantities) = 'array' THEN
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_item_quantities)
    LOOP
      UPDATE public.proposal_items
         SET quantity = GREATEST(0, COALESCE((v_item->>'qty')::int, quantity))
       WHERE id = (v_item->>'id')::uuid
         AND proposal_id = v_proposal_id;
    END LOOP;
  END IF;

  -- Record which items the client actually selected (scoped to this proposal)
  IF p_selected_ids IS NOT NULL THEN
    UPDATE public.proposal_items
       SET client_selected = (id = ANY(p_selected_ids))
     WHERE proposal_id = v_proposal_id;
  END IF;

  UPDATE public.proposals
     SET client_signature = btrim(p_signature),
         signed_at = now(),
         status = 'accepted'
   WHERE id = v_proposal_id;

  RETURN v_proposal_id;
END;
$function$;