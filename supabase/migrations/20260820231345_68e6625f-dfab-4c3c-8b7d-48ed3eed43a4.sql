-- Record what was signed, at the moment it is signed.
--
-- Nothing captured a signature before this. When a reset overwrote the line-item
-- selection on two live proposals, the only way back was the owner's memory and
-- a timestamp that happened to be sitting in a chat log. A signature is a
-- record; it should not depend on that.
--
-- Every signature now writes an immutable row: who signed, when, exactly which
-- items they took, the quantities they set, and the total those add up to.
-- Signing again appends rather than replaces, so a reopen-and-resign leaves both
-- versions readable side by side.

CREATE TABLE IF NOT EXISTS public.proposal_signature_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id uuid NOT NULL REFERENCES public.proposals(id) ON DELETE CASCADE,
  client_signature text NOT NULL,
  signed_at timestamptz NOT NULL,
  selected_item_ids uuid[] NOT NULL DEFAULT '{}',
  -- { "<item id>": <quantity>, ... } as the client left them.
  item_quantities jsonb NOT NULL DEFAULT '{}'::jsonb,
  total numeric,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS proposal_signature_history_proposal_idx
  ON public.proposal_signature_history (proposal_id, signed_at DESC);

ALTER TABLE public.proposal_signature_history ENABLE ROW LEVEL SECURITY;

-- Read-only to admins. Rows are written by the signing function, which runs as
-- definer, and are never updated or deleted by the application.
DROP POLICY IF EXISTS "Admins read signature history" ON public.proposal_signature_history;
CREATE POLICY "Admins read signature history" ON public.proposal_signature_history
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Capture helper, called from both signing overloads.
CREATE OR REPLACE FUNCTION public.capture_proposal_signature(p_proposal_id uuid)
RETURNS void
LANGUAGE sql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
  INSERT INTO public.proposal_signature_history (
    proposal_id, client_signature, signed_at, selected_item_ids, item_quantities, total
  )
  SELECT
    p.id,
    p.client_signature,
    p.signed_at,
    COALESCE((SELECT array_agg(i.id ORDER BY i.sort_order)
                FROM public.proposal_items i
               WHERE i.proposal_id = p.id AND i.client_selected), '{}'),
    COALESCE((SELECT jsonb_object_agg(i.id::text, i.quantity)
                FROM public.proposal_items i
               WHERE i.proposal_id = p.id), '{}'::jsonb),
    COALESCE((SELECT sum(i.price * GREATEST(i.quantity, 1))
                FROM public.proposal_items i
               WHERE i.proposal_id = p.id AND i.client_selected), 0)
  FROM public.proposals p
  WHERE p.id = p_proposal_id
    AND p.client_signature IS NOT NULL
    AND p.signed_at IS NOT NULL;
$$;

CREATE OR REPLACE FUNCTION public.sign_proposal_by_token(
  p_token text,
  p_signature text,
  p_item_quantities jsonb DEFAULT '[]'::jsonb,
  p_selected_ids uuid[] DEFAULT NULL::uuid[]
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

  PERFORM public.capture_proposal_signature(v_proposal_id);

  RETURN v_proposal_id;
END;
$function$;

-- Legacy three-argument overload, kept in step so any caller still on it records too.
CREATE OR REPLACE FUNCTION public.sign_proposal_by_token(
  p_token text,
  p_signature text,
  p_item_quantities jsonb DEFAULT '[]'::jsonb
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

  UPDATE public.proposals
     SET client_signature = btrim(p_signature),
         signed_at = now(),
         status = 'accepted'
   WHERE id = v_proposal_id;

  PERFORM public.capture_proposal_signature(v_proposal_id);

  RETURN v_proposal_id;
END;
$function$;

-- Put a recorded signature back, exactly as it was signed.
CREATE OR REPLACE FUNCTION public.restore_proposal_signature(p_history_id uuid)
RETURNS uuid
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.proposal_signature_history;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  SELECT * INTO v_row FROM public.proposal_signature_history WHERE id = p_history_id;
  IF v_row.id IS NULL THEN
    RAISE EXCEPTION 'signature record not found';
  END IF;

  UPDATE public.proposal_items i
     SET client_selected = (i.id = ANY(v_row.selected_item_ids)),
         quantity = COALESCE((v_row.item_quantities ->> i.id::text)::int, i.quantity)
   WHERE i.proposal_id = v_row.proposal_id;

  UPDATE public.proposals
     SET client_signature = v_row.client_signature,
         signed_at        = v_row.signed_at,
         status           = 'accepted'
   WHERE id = v_row.proposal_id;

  RETURN v_row.proposal_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.restore_proposal_signature(uuid) TO authenticated;

COMMENT ON TABLE public.proposal_signature_history IS
  'Immutable record of each signing: signature, timestamp, selected items and quantities. Written by sign_proposal_by_token.';