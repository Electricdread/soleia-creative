

## Client-side quantity adjustment

### Behavior
On the public proposal view (non-admin, unsigned), each non-flat-fee line item gets a small quantity stepper (− qty +) the client can use to override the default qty. Line totals and the Quote Total recalculate live.

- Flat-fee items: no stepper (qty is meaningless), unchanged.
- Default qty per item = the admin-set `quantity` from `proposal_items`.
- Client adjustments are local UI state until they sign. On sign, the chosen quantities are persisted back to `proposal_items.quantity` so the admin sees exactly what was accepted.
- Min qty = 1. No artificial max.
- Selecting an item is still required to include it in the quote total (current behavior preserved). Adjusting qty on an unselected item updates its displayed line total but does not add to Quote Total until selected.
- Admin view & signed view: read-only as today (no stepper), but signed view shows the final accepted qty.

### UI
**Desktop table** (lines ~579–581): replace the static qty cell with a compact stepper:
```
[ −  ]  3  [ + ]
```
Two 28×28 ghost buttons flanking the number, gold focus ring, disabled when signed/admin.

**Mobile card** (line ~641): replace `Qty: 3` static text with the same stepper inline next to the unit, using 32px hit targets (mobile-ux 44px rule – use 32 since it's inline with text, but ensure padding gives ≥44px tap target on the buttons themselves).

### State
Add to `ProposalView`:
```ts
const [clientQty, setClientQty] = useState<Record<string, number>>(
  Object.fromEntries(items.map(i => [i.id, Number(i.quantity) || 1]))
);
```
Update `calcLineTotal` to read from `clientQty[i.id]` when on the client view (`!isAdmin && !signed`), otherwise from `i.quantity` (admin/signed = source of truth from DB).

### Persistence on sign
In `handleSign`, before calling `notify-proposal-signed`, run a single `upsert`/loop to update `proposal_items.quantity` for every selected item where `clientQty[id] !== item.quantity`. RLS already permits updates via `Anyone can sign active proposals` policy on proposals — but `proposal_items` RLS only allows admin manage + public read. **This requires a small RLS addition**: allow public UPDATE of `proposal_items.quantity` only when the parent proposal is `is_active=true AND status='sent'` (mirrors the sign policy). I'll add this migration as part of the change.

### Files
- `src/components/proposal/ProposalView.tsx` — stepper UI (desktop + mobile), `clientQty` state, updated `calcLineTotal`, persistence in `handleSign`.
- New migration — RLS policy on `proposal_items` allowing public quantity updates for active+sent proposals.

### Out of scope
- No changes to admin edit flow, PDF generator, gallery, or terms.
- No price editing for clients (rates are fixed).

