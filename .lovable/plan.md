# Auto-fill new proposals from the Line Item Library

## Problem
The proposal page is blank because the proposal was created with no items. Existing client UX already supports selection + quantity steppers + live subtotal — it just needs items to render.

## Behavior (after fix)
- On creating a new proposal, the full Line Item Library is copied into `proposal_items` automatically.
- Client opens the proposal → sees the full menu, ticks the items they want, adjusts quantity (`+ / -`), and the **Quote Total** updates live as the subtotal of selected lines.
- Admin can still edit/remove items via the existing "Edit Items" button.

## Changes

### 1. `src/pages/AdminProposals.tsx` — auto-seed in `handleCreate`
After creating the proposal row, when the admin didn't type any custom items, fetch the library and insert all 9 templates as `proposal_items`:
```ts
if (validItems.length === 0) {
  const { data: tpls } = await supabase
    .from('line_item_templates')
    .select('category, title, description, price')
    .order('category').order('title');
  if (tpls?.length) {
    await supabase.from('proposal_items').insert(
      tpls.map((t, idx) => ({
        proposal_id: proposal.id,
        title: t.title,
        description: t.description,
        price: Number(t.price) || 0,
        quantity: 1,
        category: t.category,
        unit: null,
        is_flat_fee: false,
        sort_order: idx,
      }))
    );
  }
}
```
If the admin did type items, behavior is unchanged.

### 2. Backfill the existing empty `Fudale TranformanTEST` proposal
One-off insert of the 9 library templates into `proposal_items` for `proposal_id = ddce5aff-fb79-4e9a-a3d1-01e582ea596d` so the live link shows the menu immediately.

### 3. (Optional copy tweak in `ProposalView.tsx`)
The "Total" label for unsigned client view already says "Quote Total". No change needed — selection + quantity + live subtotal logic is already wired.

## Out of scope
- No schema migration.
- No client-view UI rewrite.

## Files touched
- `src/pages/AdminProposals.tsx`
- One `proposal_items` data insert for the Fudale backfill
