DROP POLICY IF EXISTS "Anyone can update creative sessions" ON public.creative_sessions;
CREATE POLICY "Anyone can update creative sessions"
ON public.creative_sessions
FOR UPDATE
USING (true)
WITH CHECK (true);