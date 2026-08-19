-- Move the creative brief onto the creative session it belongs to.
--
-- The questionnaire was first hung off client_links — the gallery session,
-- which sits behind a login. It belongs to the public creative session at
-- /creative/:token: the surface a client is actually sent to ahead of a
-- creative call. Both tables were empty, so this repoints rather than migrates,
-- and refuses to run if that is ever untrue.

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.creative_briefs) THEN
    RAISE EXCEPTION 'creative_briefs has rows — repoint them before running this migration';
  END IF;
EXCEPTION
  WHEN undefined_table THEN NULL;
END $$;

-- Whether the questionnaire appears in a given creative session.
ALTER TABLE public.creative_sessions
  ADD COLUMN IF NOT EXISTS brief_enabled boolean NOT NULL DEFAULT false;

-- The client_links flag is unused now that the brief lives on the session.
ALTER TABLE public.client_links DROP COLUMN IF EXISTS brief_enabled;

DROP FUNCTION IF EXISTS public.save_creative_brief_by_token(
  text, text, text, text, text, text, text, text, text, int, text, boolean);
DROP FUNCTION IF EXISTS public.get_creative_brief_by_token(text);
DROP TABLE IF EXISTS public.creative_briefs;

CREATE TABLE public.creative_briefs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creative_session_id uuid NOT NULL REFERENCES public.creative_sessions(id) ON DELETE CASCADE,
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
  CONSTRAINT creative_briefs_session_unique UNIQUE (creative_session_id),
  CONSTRAINT creative_briefs_elevator_mode_check
    CHECK (elevator_mode IS NULL OR elevator_mode IN ('messages','branding_loop','undecided')),
  CONSTRAINT creative_briefs_party_check
    CHECK (transforms_to_party IS NULL OR transforms_to_party IN ('yes','no','unsure')),
  CONSTRAINT creative_briefs_looks_check
    CHECK (looks_count IS NULL OR (looks_count >= 1 AND looks_count <= 5))
);

ALTER TABLE public.creative_briefs ENABLE ROW LEVEL SECURITY;

-- No direct client access; clients reach the brief only through the RPCs below.
DROP POLICY IF EXISTS "Admins manage creative briefs" ON public.creative_briefs;
CREATE POLICY "Admins manage creative briefs" ON public.creative_briefs
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Read the brief for a session the client can actually open.
CREATE OR REPLACE FUNCTION public.get_creative_brief_by_token(p_token text)
RETURNS SETOF public.creative_briefs
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT b.*
  FROM public.creative_briefs b
  JOIN public.creative_sessions s ON s.id = b.creative_session_id
  WHERE s.token = p_token
    AND s.is_active
    AND s.is_public;
$$;

-- Create or update the brief. Upserts so answers save as they are typed,
-- without a separate "start" step.
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
  v_session_id uuid;
  v_row public.creative_briefs;
BEGIN
  SELECT s.id INTO v_session_id
  FROM public.creative_sessions s
  WHERE s.token = p_token
    AND s.is_active
    AND s.is_public
    AND s.brief_enabled;

  IF v_session_id IS NULL THEN
    RAISE EXCEPTION 'Session not found, inactive, or questionnaire not enabled';
  END IF;

  INSERT INTO public.creative_briefs AS b (
    creative_session_id, mood, vibe, color_scheme, avoid, elevator_mode,
    elevator_up, elevator_down, transforms_to_party, looks_count, notes,
    submitted_at
  ) VALUES (
    v_session_id, p_mood, p_vibe, p_color_scheme, p_avoid, p_elevator_mode,
    p_elevator_up, p_elevator_down, p_transforms_to_party, p_looks_count, p_notes,
    CASE WHEN p_submit THEN now() ELSE NULL END
  )
  ON CONFLICT (creative_session_id) DO UPDATE SET
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
  'Client-completed creative questionnaire for a creative session. Written only via save_creative_brief_by_token.';
