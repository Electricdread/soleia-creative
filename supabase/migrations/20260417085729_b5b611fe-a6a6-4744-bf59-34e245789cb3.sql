DROP POLICY IF EXISTS "Anyone can view active creative sessions" ON public.creative_sessions;
CREATE POLICY "Anyone can view creative sessions"
ON public.creative_sessions
FOR SELECT
USING (true);