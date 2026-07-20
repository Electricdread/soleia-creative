## Fix: Add-ons missing on public `/rate-card`

**Cause:** `/rate-card` is public (no auth). `line_item_templates` RLS only permits admin reads, so the anon fetch returns 0 rows and the "Additional Services" section is empty.

**Approach:** Add a `SECURITY DEFINER` RPC that returns only the fields needed for the public rate card. No RLS relaxation on the base table.

### Changes

1. **Migration** — create `public.get_rate_card_addons()`
   - Returns: `id, name, price, unit, category, ideal_for, long_description, deliverables, sort_order`
   - `SECURITY DEFINER`, `STABLE`, `search_path = public`
   - Filters: `is_active = true`, excludes the `elevator_package` template already featured at the top
   - Order: `category`, `sort_order NULLS LAST`, `name`
   - `GRANT EXECUTE ... TO anon, authenticated`

2. **`src/pages/RateCard.tsx`**
   - Replace the `.from('line_item_templates').select(...)` call with `supabase.rpc('get_rate_card_addons')`
   - Keep the existing grouping/rendering as-is

3. **`src/pages/AdminProposals.tsx`** (optional consistency)
   - Point the "Rate Card" button's data fetch to the same RPC so admin + client render identical content

### Not in scope
- No changes to the elevator package block, styling, or PDF
- No changes to the item-select proposal flow (planned separately per your answer)

Approve and I'll ship it.