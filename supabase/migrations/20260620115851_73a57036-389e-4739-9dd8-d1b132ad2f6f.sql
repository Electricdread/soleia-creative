GRANT SELECT ON public.creative_sessions TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.creative_sessions TO authenticated;
GRANT ALL ON public.creative_sessions TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.mood_board_items TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mood_board_items TO authenticated;
GRANT ALL ON public.mood_board_items TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.mood_board_reactions TO anon;
GRANT SELECT, INSERT, DELETE ON public.mood_board_reactions TO authenticated;
GRANT ALL ON public.mood_board_reactions TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.mood_board_comments TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mood_board_comments TO authenticated;
GRANT ALL ON public.mood_board_comments TO service_role;

GRANT SELECT ON public.session_scenes TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.session_scenes TO authenticated;
GRANT ALL ON public.session_scenes TO service_role;

CREATE POLICY "Admins can manage mood board items"
  ON public.mood_board_items
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can manage mood board reactions"
  ON public.mood_board_reactions
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can manage mood board comments"
  ON public.mood_board_comments
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));