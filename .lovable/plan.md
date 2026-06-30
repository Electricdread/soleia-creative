## Reset signed proposal + admin reset button

### 1. Reset the Fudale × GitHub proposal now
Run a data update on proposal token `8d55d68d...`:
- `client_signature` → `NULL`
- `signed_at` → `NULL`
- `status` → `sent`
- `proposal_items.client_selected` → `NULL` for that proposal (clear client selections so they can re-pick)

Quantities adjusted by the client during signing are left as-is (they were edits, not signature state). Confirm if you'd also like quantities restored to originals — that requires a separate snapshot we don't currently store.

### 2. Add an admin "Reset signature" button
**Location:** Admin proposal detail/edit view (`src/pages/AdminProposalEdit.tsx` or the proposal row actions in the admin proposals list — whichever you prefer; default to both: row action + detail page header).

**UI:**
- Button only visible when `status = 'accepted'` AND `client_signature IS NOT NULL`
- Label: "Reset signature" with an Undo/RotateCcw icon, destructive-outline style
- Confirmation dialog: "This will clear the client signature and reopen the proposal for signing. Continue?"

**Backend:** New SECURITY DEFINER RPC `reset_proposal_signature(p_proposal_id uuid)`:
- Requires caller to be admin (`has_role(auth.uid(), 'admin')`)
- Clears `client_signature`, `signed_at`, sets `status = 'sent'`
- Clears `client_selected` on related `proposal_items`
- Returns the proposal id

**Client:** On success, toast "Proposal reopened for signing" and refresh the proposal data.

### Technical notes
- New migration adds the RPC + grants execute to `authenticated`
- No schema changes to tables
- No changes to client-facing `ProposalView.tsx`
