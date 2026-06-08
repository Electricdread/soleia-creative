
-- cached_clips: admin-only writes
DROP POLICY IF EXISTS "Anyone can insert clips" ON public.cached_clips;
DROP POLICY IF EXISTS "Anyone can update clips" ON public.cached_clips;
DROP POLICY IF EXISTS "Anyone can delete clips" ON public.cached_clips;
CREATE POLICY "Admins manage cached clips"
  ON public.cached_clips FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- client_links: admin-only writes
DROP POLICY IF EXISTS "Anyone can create client links" ON public.client_links;
DROP POLICY IF EXISTS "Anyone can update client links" ON public.client_links;
DROP POLICY IF EXISTS "Anyone can delete client links" ON public.client_links;
CREATE POLICY "Admins manage client links"
  ON public.client_links FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- creative_sessions: admin-only writes
DROP POLICY IF EXISTS "Anyone can create creative sessions" ON public.creative_sessions;
DROP POLICY IF EXISTS "Anyone can update creative sessions" ON public.creative_sessions;
DROP POLICY IF EXISTS "Anyone can delete creative sessions" ON public.creative_sessions;
CREATE POLICY "Admins manage creative sessions"
  ON public.creative_sessions FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- link_clips: admin-only writes (reads remain public for active links)
DROP POLICY IF EXISTS "Anyone can insert clips for links" ON public.link_clips;
DROP POLICY IF EXISTS "Anyone can delete clips for links" ON public.link_clips;
CREATE POLICY "Admins manage link clips"
  ON public.link_clips FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- calendar_event_tripleseat_cache: drop public read
DROP POLICY IF EXISTS "Anyone can read tripleseat cache" ON public.calendar_event_tripleseat_cache;

-- site_settings: replace public-read-all with limited keys
DROP POLICY IF EXISTS "Anyone can read site settings" ON public.site_settings;
CREATE POLICY "Public read of public dropbox URLs"
  ON public.site_settings FOR SELECT
  TO anon, authenticated
  USING (key IN ('soleia_dropbox_url', 'tailgate_dropbox_url'));

-- lookbook_shares: drop broad public update; add safe RPC
DROP POLICY IF EXISTS "Public can increment view count on active shares" ON public.lookbook_shares;

CREATE OR REPLACE FUNCTION public.increment_lookbook_share_view(p_token text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.lookbook_shares
     SET view_count = COALESCE(view_count, 0) + 1
   WHERE token = p_token
     AND is_active = true
     AND (expires_at IS NULL OR expires_at > now());
END;
$$;
REVOKE ALL ON FUNCTION public.increment_lookbook_share_view(text) FROM public;
GRANT EXECUTE ON FUNCTION public.increment_lookbook_share_view(text) TO anon, authenticated;

-- proposals: drop public update; add safe sign RPC
DROP POLICY IF EXISTS "Anyone can sign active proposals" ON public.proposals;
DROP POLICY IF EXISTS "Anyone can update item quantities for sent proposals" ON public.proposal_items;

CREATE OR REPLACE FUNCTION public.sign_proposal_by_token(
  p_token text,
  p_signature text,
  p_item_quantities jsonb DEFAULT '[]'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_proposal_id uuid;
  v_item jsonb;
BEGIN
  IF p_signature IS NULL OR length(btrim(p_signature)) = 0 THEN
    RAISE EXCEPTION 'signature required';
  END IF;

  SELECT id INTO v_proposal_id
    FROM public.proposals
   WHERE token = p_token
     AND is_active = true
     AND status = 'sent';

  IF v_proposal_id IS NULL THEN
    RAISE EXCEPTION 'proposal not available for signing';
  END IF;

  -- Apply optional client-adjusted quantities (only for items on this proposal)
  IF jsonb_typeof(p_item_quantities) = 'array' THEN
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_item_quantities)
    LOOP
      UPDATE public.proposal_items
         SET quantity = GREATEST(0, COALESCE((v_item->>'qty')::int, quantity))
       WHERE id = (v_item->>'id')::uuid
         AND proposal_id = v_proposal_id;
    END LOOP;
  END IF;

  UPDATE public.proposals
     SET client_signature = btrim(p_signature),
         signed_at = now(),
         status = 'accepted'
   WHERE id = v_proposal_id;

  RETURN v_proposal_id;
END;
$$;
REVOKE ALL ON FUNCTION public.sign_proposal_by_token(text, text, jsonb) FROM public;
GRANT EXECUTE ON FUNCTION public.sign_proposal_by_token(text, text, jsonb) TO anon, authenticated;
