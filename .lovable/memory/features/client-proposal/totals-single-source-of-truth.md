---
name: Proposal totals single source of truth
description: All proposal $ totals MUST go through src/lib/proposalTotals.ts. Never sum inline.
type: constraint
---
Every proposal total (live ProposalView, signed/accepted view, PDF, admin list, emails)
MUST be computed via `calcProposalTotal` / `calcLineTotal` from `src/lib/proposalTotals.ts`.

Rules enforced there:
- Unsigned proposal total = sum of items currently checked by the client (`selectedIds`). Empty = $0.
- Signed proposal total = sum of items with `client_selected === true`.
- Never read `proposals.total_amount` for display — it is a stale creation-time snapshot
  and is what caused the recurring $10,000 ghost total bug.
- PDF generator follows the same rule: only items with `client_selected === true` count.

**Why:** Previously totals were computed in 5+ places with subtly different filters
(`isAdmin ? grandTotal : total`, default-all-selected, stored total_amount, etc.).
Fixing one path left the others wrong. Consolidating prevents recurrence.

**How to apply:** When touching proposal pricing anywhere, import from `@/lib/proposalTotals`.
Do not write `items.reduce(... price * quantity ...)` inline.
