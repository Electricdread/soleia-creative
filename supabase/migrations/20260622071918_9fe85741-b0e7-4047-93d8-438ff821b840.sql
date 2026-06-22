
CREATE TABLE public.session_previz_cues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clip_id uuid NOT NULL REFERENCES public.session_previz_clips(id) ON DELETE CASCADE,
  time_seconds numeric(10,3) NOT NULL DEFAULT 0,
  label text NOT NULL DEFAULT 'Cue',
  color text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX session_previz_cues_clip_idx
  ON public.session_previz_cues (clip_id, time_seconds);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.session_previz_cues TO authenticated;
GRANT SELECT ON public.session_previz_cues TO anon;
GRANT ALL ON public.session_previz_cues TO service_role;

ALTER TABLE public.session_previz_cues ENABLE ROW LEVEL SECURITY;

-- Admins: full access
CREATE POLICY "Admins manage all cues"
ON public.session_previz_cues
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Public read when the parent session is public
CREATE POLICY "Public can view cues for public sessions"
ON public.session_previz_cues
FOR SELECT
TO anon, authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.session_previz_clips spc
    JOIN public.creative_sessions cs ON cs.id = spc.session_id
    WHERE spc.id = session_previz_cues.clip_id
      AND cs.is_active = true
      AND cs.is_public = true
  )
);

CREATE TRIGGER set_session_previz_cues_updated_at
BEFORE UPDATE ON public.session_previz_cues
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
