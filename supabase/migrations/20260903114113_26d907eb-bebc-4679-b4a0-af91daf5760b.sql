-- A discount belongs to the proposal, not to its line items.
--
-- The tempting shortcut is a negative line item, and it is wrong: a line can be
-- unticked, reordered, or left out of the accepted scope, so the discount could
-- silently disappear from the very total it was meant to reduce. Recorded here
-- it survives whatever the client selects.
alter table public.proposals
  add column if not exists discount_type text check (discount_type in ('percent', 'amount')),
  add column if not exists discount_value numeric,
  add column if not exists discount_label text;

-- Both halves, or neither: a value with no kind cannot be applied, and a kind
-- with no value is a half-finished thought that would read as "0% off".
alter table public.proposals
  drop constraint if exists proposals_discount_complete;
alter table public.proposals
  add constraint proposals_discount_complete check (
    (discount_type is null and discount_value is null)
    or (discount_type is not null and discount_value is not null and discount_value > 0)
  );

-- What signing records.
--
-- This function already disagreed with the app: it multiplies price by quantity
-- for every item, so a flat-fee line was overcharged in the stored figure while
-- proposalTotals.ts had it right. That disagreement is surfaced rather than
-- hidden (studio-sync publishes totals_disagree), but a discount would have
-- widened it every time — the history would record a number above what the
-- client agreed to pay, which is the one direction that must never happen.
--
-- So it now honours both: is_flat_fee ignores quantity, and the proposal's
-- discount comes off the accepted scope, floored at zero. Existing history rows
-- are untouched; this only governs signings from here on.
create or replace function public.capture_proposal_signature(p_proposal_id uuid)
 returns void
 language sql
 security definer
 set search_path to 'public'
as $function$
  INSERT INTO public.proposal_signature_history (
    proposal_id, client_signature, signed_at, selected_item_ids, item_quantities, total
  )
  SELECT
    p.id,
    p.client_signature,
    p.signed_at,
    COALESCE((SELECT array_agg(i.id ORDER BY i.sort_order)
                FROM public.proposal_items i
               WHERE i.proposal_id = p.id AND i.client_selected), '{}'),
    COALESCE((SELECT jsonb_object_agg(i.id::text, i.quantity)
                FROM public.proposal_items i
               WHERE i.proposal_id = p.id), '{}'::jsonb),
    GREATEST(
      round(
        COALESCE((SELECT sum(
                    CASE WHEN i.is_flat_fee THEN i.price
                         ELSE i.price * GREATEST(COALESCE(i.quantity, 1), 1)
                    END)
                    FROM public.proposal_items i
                   WHERE i.proposal_id = p.id AND i.client_selected), 0)
        - CASE
            WHEN p.discount_type = 'percent' THEN
              COALESCE((SELECT sum(
                          CASE WHEN i.is_flat_fee THEN i.price
                               ELSE i.price * GREATEST(COALESCE(i.quantity, 1), 1)
                          END)
                          FROM public.proposal_items i
                         WHERE i.proposal_id = p.id AND i.client_selected), 0)
              * (LEAST(p.discount_value, 100) / 100.0)
            WHEN p.discount_type = 'amount' THEN COALESCE(p.discount_value, 0)
            ELSE 0
          END,
        2),
      0)
  FROM public.proposals p
  WHERE p.id = p_proposal_id
    AND p.client_signature IS NOT NULL
    AND p.signed_at IS NOT NULL;
$function$;