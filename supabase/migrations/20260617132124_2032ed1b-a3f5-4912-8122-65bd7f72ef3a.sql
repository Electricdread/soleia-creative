
CREATE TABLE public.session_previz_clips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.creative_sessions(id) ON DELETE CASCADE,
  title text NOT NULL,
  url text NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  is_default boolean NOT NULL DEFAULT false,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX session_previz_clips_session_idx ON public.session_previz_clips(session_id, sort_order);

GRANT SELECT ON public.session_previz_clips TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.session_previz_clips TO authenticated;
GRANT ALL ON public.session_previz_clips TO service_role;

ALTER TABLE public.session_previz_clips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage previz clips"
  ON public.session_previz_clips FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Public can view previz clips for active sessions"
  ON public.session_previz_clips FOR SELECT
  TO anon, authenticated
  USING (EXISTS (
    SELECT 1 FROM public.creative_sessions s
    WHERE s.id = session_previz_clips.session_id AND s.is_active = true
  ));

CREATE TRIGGER session_previz_clips_updated_at
  BEFORE UPDATE ON public.session_previz_clips
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
