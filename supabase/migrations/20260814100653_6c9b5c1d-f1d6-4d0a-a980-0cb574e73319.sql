DROP POLICY IF EXISTS "Public can view previz clips for active sessions" ON public.session_previz_clips;
CREATE POLICY "Public can view previz clips for public active sessions"
ON public.session_previz_clips
FOR SELECT
TO anon, authenticated
USING (EXISTS (
  SELECT 1 FROM public.creative_sessions s
  WHERE s.id = session_previz_clips.session_id
    AND s.is_active = true
    AND s.is_public = true
));