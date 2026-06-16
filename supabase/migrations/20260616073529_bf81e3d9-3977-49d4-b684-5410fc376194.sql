
-- =========================================================
-- Lock down public read on proposals; expose via token RPC
-- =========================================================
DROP POLICY IF EXISTS "Anyone can view active proposals" ON public.proposals;

CREATE OR REPLACE FUNCTION public.get_proposal_by_token(p_token text)
RETURNS SETOF public.proposals
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT *
  FROM public.proposals
  WHERE token = p_token
    AND is_active = true
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_proposal_by_token(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_proposal_by_token(text) TO anon, authenticated;

-- =========================================================
-- Restrict creative_sessions public reads to active+public
-- =========================================================
DROP POLICY IF EXISTS "Anyone can view creative sessions" ON public.creative_sessions;

CREATE POLICY "Public can view active public sessions"
  ON public.creative_sessions
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true AND is_public = true);

-- =========================================================
-- Tighten mood_board_* writes to active AND public sessions
-- (Token-possession remains the access capability; this
--  prevents writes/reads on private or archived sessions.)
-- =========================================================
DROP POLICY IF EXISTS "Anyone can view mood board items for active sessions" ON public.mood_board_items;
DROP POLICY IF EXISTS "Anyone can insert mood board items for active sessions" ON public.mood_board_items;
DROP POLICY IF EXISTS "Anyone can update mood board items for active sessions" ON public.mood_board_items;
DROP POLICY IF EXISTS "Anyone can delete mood board items for active sessions" ON public.mood_board_items;

CREATE POLICY "Public can view items in active public sessions"
  ON public.mood_board_items FOR SELECT TO anon, authenticated
  USING (EXISTS (
    SELECT 1 FROM public.creative_sessions cs
    WHERE cs.id = mood_board_items.session_id
      AND cs.is_active = true AND cs.is_public = true
  ));

CREATE POLICY "Public can insert items in active public sessions"
  ON public.mood_board_items FOR INSERT TO anon, authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.creative_sessions cs
    WHERE cs.id = mood_board_items.session_id
      AND cs.is_active = true AND cs.is_public = true
  ));

CREATE POLICY "Public can update items in active public sessions"
  ON public.mood_board_items FOR UPDATE TO anon, authenticated
  USING (EXISTS (
    SELECT 1 FROM public.creative_sessions cs
    WHERE cs.id = mood_board_items.session_id
      AND cs.is_active = true AND cs.is_public = true
  ));

CREATE POLICY "Public can delete items in active public sessions"
  ON public.mood_board_items FOR DELETE TO anon, authenticated
  USING (EXISTS (
    SELECT 1 FROM public.creative_sessions cs
    WHERE cs.id = mood_board_items.session_id
      AND cs.is_active = true AND cs.is_public = true
  ));

DROP POLICY IF EXISTS "Anyone can view comments for active sessions" ON public.mood_board_comments;
DROP POLICY IF EXISTS "Anyone can add comments for active sessions" ON public.mood_board_comments;
DROP POLICY IF EXISTS "Anyone can update comments for active sessions" ON public.mood_board_comments;
DROP POLICY IF EXISTS "Anyone can delete comments for active sessions" ON public.mood_board_comments;

CREATE POLICY "Public can view comments in active public sessions"
  ON public.mood_board_comments FOR SELECT TO anon, authenticated
  USING (EXISTS (
    SELECT 1 FROM public.mood_board_items mbi
    JOIN public.creative_sessions cs ON cs.id = mbi.session_id
    WHERE mbi.id = mood_board_comments.item_id
      AND cs.is_active = true AND cs.is_public = true
  ));

CREATE POLICY "Public can add comments in active public sessions"
  ON public.mood_board_comments FOR INSERT TO anon, authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.mood_board_items mbi
    JOIN public.creative_sessions cs ON cs.id = mbi.session_id
    WHERE mbi.id = mood_board_comments.item_id
      AND cs.is_active = true AND cs.is_public = true
  ));

CREATE POLICY "Public can update comments in active public sessions"
  ON public.mood_board_comments FOR UPDATE TO anon, authenticated
  USING (EXISTS (
    SELECT 1 FROM public.mood_board_items mbi
    JOIN public.creative_sessions cs ON cs.id = mbi.session_id
    WHERE mbi.id = mood_board_comments.item_id
      AND cs.is_active = true AND cs.is_public = true
  ));

CREATE POLICY "Public can delete comments in active public sessions"
  ON public.mood_board_comments FOR DELETE TO anon, authenticated
  USING (EXISTS (
    SELECT 1 FROM public.mood_board_items mbi
    JOIN public.creative_sessions cs ON cs.id = mbi.session_id
    WHERE mbi.id = mood_board_comments.item_id
      AND cs.is_active = true AND cs.is_public = true
  ));

DROP POLICY IF EXISTS "Anyone can view reactions for active sessions" ON public.mood_board_reactions;
DROP POLICY IF EXISTS "Anyone can add reactions for active sessions" ON public.mood_board_reactions;
DROP POLICY IF EXISTS "Anyone can remove reactions for active sessions" ON public.mood_board_reactions;

CREATE POLICY "Public can view reactions in active public sessions"
  ON public.mood_board_reactions FOR SELECT TO anon, authenticated
  USING (EXISTS (
    SELECT 1 FROM public.mood_board_items mbi
    JOIN public.creative_sessions cs ON cs.id = mbi.session_id
    WHERE mbi.id = mood_board_reactions.item_id
      AND cs.is_active = true AND cs.is_public = true
  ));

CREATE POLICY "Public can add reactions in active public sessions"
  ON public.mood_board_reactions FOR INSERT TO anon, authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.mood_board_items mbi
    JOIN public.creative_sessions cs ON cs.id = mbi.session_id
    WHERE mbi.id = mood_board_reactions.item_id
      AND cs.is_active = true AND cs.is_public = true
  ));

CREATE POLICY "Public can remove reactions in active public sessions"
  ON public.mood_board_reactions FOR DELETE TO anon, authenticated
  USING (EXISTS (
    SELECT 1 FROM public.mood_board_items mbi
    JOIN public.creative_sessions cs ON cs.id = mbi.session_id
    WHERE mbi.id = mood_board_reactions.item_id
      AND cs.is_active = true AND cs.is_public = true
  ));

-- =========================================================
-- Storage policies: admin-only writes/deletes on
-- clips, clip-previews, creative-uploads.
-- session-uploads: keep public INSERT (token-gated client
-- uploads), restrict DELETE to admins.
-- =========================================================
DROP POLICY IF EXISTS "Anyone can upload clips" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can delete clips from storage" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload clip previews" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can delete clip previews" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload to creative uploads" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can delete creative uploads" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can delete session uploads" ON storage.objects;

CREATE POLICY "Admins can upload clips"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'clips' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete clips"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'clips' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can upload clip previews"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'clip-previews' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete clip previews"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'clip-previews' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can upload creative uploads"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'creative-uploads' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete creative uploads"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'creative-uploads' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete session uploads"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'session-uploads' AND public.has_role(auth.uid(), 'admin'));

-- =========================================================
-- Email queue SECURITY DEFINER functions: set search_path
-- and restrict EXECUTE to service_role (used only from
-- edge functions).
-- =========================================================
ALTER FUNCTION public.enqueue_email(text, jsonb) SET search_path = public;
ALTER FUNCTION public.delete_email(text, bigint) SET search_path = public;
ALTER FUNCTION public.move_to_dlq(text, text, bigint, jsonb) SET search_path = public;
ALTER FUNCTION public.read_email_batch(text, integer, integer) SET search_path = public;

REVOKE ALL ON FUNCTION public.enqueue_email(text, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.delete_email(text, bigint) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.read_email_batch(text, integer, integer) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.delete_email(text, bigint) TO service_role;
GRANT EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) TO service_role;
