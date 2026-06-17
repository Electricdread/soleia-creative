CREATE OR REPLACE FUNCTION public.is_active_public_proposal(p_proposal_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.proposals
    WHERE id = p_proposal_id
      AND is_active = true
  )
$$;

DROP POLICY IF EXISTS "Anyone can view proposal items" ON public.proposal_items;
CREATE POLICY "Anyone can view proposal items"
ON public.proposal_items
FOR SELECT
TO public
USING (public.is_active_public_proposal(proposal_id));

DROP POLICY IF EXISTS "Anyone can view proposal gallery" ON public.proposal_gallery;
CREATE POLICY "Anyone can view proposal gallery"
ON public.proposal_gallery
FOR SELECT
TO public
USING (public.is_active_public_proposal(proposal_id));

DROP POLICY IF EXISTS "Anyone can view proposal timeline" ON public.proposal_timeline;
CREATE POLICY "Anyone can view proposal timeline"
ON public.proposal_timeline
FOR SELECT
TO public
USING (public.is_active_public_proposal(proposal_id));