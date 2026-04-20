CREATE POLICY "Anyone can update item quantities for sent proposals"
ON public.proposal_items
FOR UPDATE
TO public
USING (
  EXISTS (
    SELECT 1 FROM public.proposals
    WHERE proposals.id = proposal_items.proposal_id
      AND proposals.is_active = true
      AND proposals.status = 'sent'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.proposals
    WHERE proposals.id = proposal_items.proposal_id
      AND proposals.is_active = true
      AND proposals.status = 'sent'
  )
);