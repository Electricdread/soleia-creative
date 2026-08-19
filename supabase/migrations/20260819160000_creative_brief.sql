-- Creative brief: a short questionnaire a client fills in inside their session.
--
-- Captures the direction we would otherwise have to draw out over email —
-- mood, vibe, colour, what to avoid, how they want the elevator moment used,
-- whether the room turns over to a party, and how many looks they want.
--
-- Reachable only through the session token, using the same security-definer
-- pattern as the proposal RPCs, so a client never needs an account and no
-- table is exposed directly.

CREATE TABLE IF NOT EXISTS public.creative_briefs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_link_id uuid NOT NULL REFERENCES public.client_links(id) ON DELETE CASCADE,
  mood text,
  vibe text,
  color_scheme text,
  avoid text,
  elevator_mode text,          -- 'messages' | 'branding_loop' | 'undecided'
  elevator_up text,
  elevator_down text,
  transforms_to_party text,    -- 'yes' | 'no' | 'unsure'
  looks_count int,
  notes text,
  submitted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT creative_briefs_client_link_unique UNIQUE (client_link_id),
  CONSTRAINT creative_briefs_elevator_mode_check
    CHECK (elevator_mode IS NULL OR elevator_mode IN ('messages','branding_loop','undecided')),
  CONSTRAINT creative_briefs_party_check
    CHECK (transforms_to_party IS NULL OR transforms_to_party IN ('yes','no','unsure')),
  CONSTRAINT creative_briefs_looks_check
    CHECK (looks_count IS NULL OR (looks_count >= 1 AND looks_count <= 5))
);

-- Whether the questionnaire appears in a given session.
ALTER TABLE public.client_links
  ADD COLUMN IF NOT EXISTS brief_enabled boolean NOT NULL DEFAULT false;

ALTER TABLE public.creative_briefs ENABLE ROW LEVEL SECURITY;

-- No direct client access; everything goes through the RPCs below.
DROP POLICY IF EXISTS "Admins manage creative briefs" ON public.creative_briefs;
CREATE POLICY "Admins manage creative briefs" ON public.creative_briefs
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Read the brief for an active session.
CREATE OR REPLACE FUNCTION public.get_creative_brief_by_token(p_token text)
RETURNS SETOF public.creative_briefs
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT b.*
  FROM public.creative_briefs b
  JOIN public.client_links l ON l.id = b.client_link_id
  WHERE l.token = p_token
    AND l.is_active
    AND (l.expires_at IS NULL OR l.expires_at > now());
$$;

-- Create or update the brief for an active session. Upserts so the client's
-- answers can be saved as they type without a separate "start" step.
CREATE OR REPLACE FUNCTION public.save_creative_brief_by_token(
  p_token text,
  p_mood text DEFAULT NULL,
  p_vibe text DEFAULT NULL,
  p_color_scheme text DEFAULT NULL,
  p_avoid text DEFAULT NULL,
  p_elevator_mode text DEFAULT NULL,
  p_elevator_up text DEFAULT NULL,
  p_elevator_down text DEFAULT NULL,
  p_transforms_to_party text DEFAULT NULL,
  p_looks_count int DEFAULT NULL,
  p_notes text DEFAULT NULL,
  p_submit boolean DEFAULT false
)
RETURNS public.creative_briefs
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_link_id uuid;
  v_row public.creative_briefs;
BEGIN
  SELECT l.id INTO v_link_id
  FROM public.client_links l
  WHERE l.token = p_token
    AND l.is_active
    AND l.brief_enabled
    AND (l.expires_at IS NULL OR l.expires_at > now());

  IF v_link_id IS NULL THEN
    RAISE EXCEPTION 'Session not found, inactive, or questionnaire not enabled';
  END IF;

  INSERT INTO public.creative_briefs AS b (
    client_link_id, mood, vibe, color_scheme, avoid, elevator_mode,
    elevator_up, elevator_down, transforms_to_party, looks_count, notes,
    submitted_at
  ) VALUES (
    v_link_id, p_mood, p_vibe, p_color_scheme, p_avoid, p_elevator_mode,
    p_elevator_up, p_elevator_down, p_transforms_to_party, p_looks_count, p_notes,
    CASE WHEN p_submit THEN now() ELSE NULL END
  )
  ON CONFLICT (client_link_id) DO UPDATE SET
    mood                = EXCLUDED.mood,
    vibe                = EXCLUDED.vibe,
    color_scheme        = EXCLUDED.color_scheme,
    avoid               = EXCLUDED.avoid,
    elevator_mode       = EXCLUDED.elevator_mode,
    elevator_up         = EXCLUDED.elevator_up,
    elevator_down       = EXCLUDED.elevator_down,
    transforms_to_party = EXCLUDED.transforms_to_party,
    looks_count         = EXCLUDED.looks_count,
    notes               = EXCLUDED.notes,
    -- Once submitted it stays submitted; later edits keep the original stamp.
    submitted_at        = COALESCE(b.submitted_at, EXCLUDED.submitted_at),
    updated_at          = now()
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_creative_brief_by_token(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.save_creative_brief_by_token(
  text, text, text, text, text, text, text, text, text, int, text, boolean
) TO anon, authenticated;

COMMENT ON TABLE public.creative_briefs IS
  'Client-completed creative questionnaire for a session. Written only via save_creative_brief_by_token.';
