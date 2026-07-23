
-- 1. Security-definer helper: is a link active (used by child policies)
CREATE OR REPLACE FUNCTION public.is_active_link(p_link_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.client_links
     WHERE id = p_link_id AND is_active = true
  )
$$;

-- 2. Token lookups (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.get_client_link_by_token(p_token text)
RETURNS SETOF public.client_links
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT * FROM public.client_links
   WHERE token = p_token AND is_active = true
   LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.get_lookbook_share_by_token(p_token text)
RETURNS SETOF public.lookbook_shares
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT * FROM public.lookbook_shares
   WHERE token = p_token
     AND is_active = true
     AND (expires_at IS NULL OR expires_at > now())
   LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.get_packet_by_token(p_token text)
RETURNS SETOF public.pre_call_packets
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT * FROM public.pre_call_packets
   WHERE token = p_token AND is_active = true
   LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.get_proposal_items_by_token(p_token text)
RETURNS SETOF public.proposal_items
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT pi.* FROM public.proposal_items pi
   JOIN public.proposals p ON p.id = pi.proposal_id
   WHERE p.token = p_token AND p.is_active = true
   ORDER BY pi.sort_order NULLS LAST;
$$;

CREATE OR REPLACE FUNCTION public.get_proposal_gallery_by_token(p_token text)
RETURNS SETOF public.proposal_gallery
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT pg.* FROM public.proposal_gallery pg
   JOIN public.proposals p ON p.id = pg.proposal_id
   WHERE p.token = p_token AND p.is_active = true
   ORDER BY pg.sort_order NULLS LAST;
$$;

CREATE OR REPLACE FUNCTION public.get_proposal_timeline_by_token(p_token text)
RETURNS SETOF public.proposal_timeline
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT pt.* FROM public.proposal_timeline pt
   JOIN public.proposals p ON p.id = pt.proposal_id
   WHERE p.token = p_token AND p.is_active = true
   ORDER BY pt.sort_order NULLS LAST;
$$;

-- 3. Token-scoped delete for session_uploads
CREATE OR REPLACE FUNCTION public.delete_session_upload_by_token(p_token text, p_upload_id uuid)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_link_id uuid;
BEGIN
  SELECT id INTO v_link_id
    FROM public.client_links
   WHERE token = p_token AND is_active = true
   LIMIT 1;
  IF v_link_id IS NULL THEN
    RETURN false;
  END IF;
  DELETE FROM public.session_uploads
   WHERE id = p_upload_id AND link_id = v_link_id;
  RETURN FOUND;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_client_link_by_token(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_lookbook_share_by_token(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_packet_by_token(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_proposal_items_by_token(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_proposal_gallery_by_token(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_proposal_timeline_by_token(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.delete_session_upload_by_token(text, uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_active_link(uuid) TO anon, authenticated;

-- 4. Drop the too-permissive public policies
DROP POLICY IF EXISTS "Anyone can view active client links" ON public.client_links;
DROP POLICY IF EXISTS "Public can view active non-expired shares" ON public.lookbook_shares;
DROP POLICY IF EXISTS "Public can read deployed packets" ON public.pre_call_packets;
DROP POLICY IF EXISTS "Anyone can view proposal items" ON public.proposal_items;
DROP POLICY IF EXISTS "Anyone can view proposal gallery" ON public.proposal_gallery;
DROP POLICY IF EXISTS "Anyone can view proposal timeline" ON public.proposal_timeline;

-- 5. Rewrite child policies to use is_active_link (definer helper) so
--    anon does not need SELECT on client_links.
DROP POLICY IF EXISTS "Anyone can view clips for active links" ON public.link_clips;
CREATE POLICY "Anyone can view clips for active links" ON public.link_clips
  FOR SELECT USING (public.is_active_link(link_id));

DROP POLICY IF EXISTS "Anyone can view selections for active links" ON public.link_selections;
CREATE POLICY "Anyone can view selections for active links" ON public.link_selections
  FOR SELECT USING (public.is_active_link(link_id));

DROP POLICY IF EXISTS "Anyone can insert selections for active links" ON public.link_selections;
CREATE POLICY "Anyone can insert selections for active links" ON public.link_selections
  FOR INSERT WITH CHECK (public.is_active_link(link_id));

DROP POLICY IF EXISTS "Anyone can update selections for active links" ON public.link_selections;
CREATE POLICY "Anyone can update selections for active links" ON public.link_selections
  FOR UPDATE USING (public.is_active_link(link_id));

DROP POLICY IF EXISTS "Anyone can delete selections for active links" ON public.link_selections;
CREATE POLICY "Anyone can delete selections for active links" ON public.link_selections
  FOR DELETE USING (public.is_active_link(link_id));

DROP POLICY IF EXISTS "Anyone can view uploads for active links" ON public.session_uploads;
CREATE POLICY "Anyone can view uploads for active links" ON public.session_uploads
  FOR SELECT USING (public.is_active_link(link_id));

DROP POLICY IF EXISTS "Anyone can insert uploads for active links" ON public.session_uploads;
CREATE POLICY "Anyone can insert uploads for active links" ON public.session_uploads
  FOR INSERT WITH CHECK (public.is_active_link(link_id));

-- Remove blanket anon delete on session_uploads; deletes now go through
-- delete_session_upload_by_token which requires the session token.
DROP POLICY IF EXISTS "Anyone can delete uploads for active links" ON public.session_uploads;

DROP POLICY IF EXISTS "Anyone can view previews for active links" ON public.content_previews;
CREATE POLICY "Anyone can view previews for active links" ON public.content_previews
  FOR SELECT USING (public.is_active_link(link_id));
