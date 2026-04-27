## Issue

The `CountdownBadge` shows on the **admin proposals list** (`/admin/proposals`), but **not on the live client-facing proposal page** (`/proposal/:token`) — which is what you see when you open an "active proposal." That's why the deadline countdown looks missing.

Verified data is fine — e.g. `04.14.26 Sandler Partners` has `event_date = 2026-04-14`, so it should display "13d overdue."

## Fix

### 1. `src/components/proposal/ProposalView.tsx` — show countdown next to Event Date

In the header's right column where Event Date is rendered (around line 412-417), add a `CountdownBadge` directly under the formatted date so the client sees urgency at a glance.

```tsx
import { CountdownBadge } from '@/components/CountdownBadge';

{eventDate && (
  <div>
    <span className="block text-[10px] tracking-[0.15em] uppercase text-[#95a5a6] font-semibold">Event Date</span>
    <span className="text-[#2c3e50] font-medium">{format(eventDate, 'EEE, MMM d, yyyy')}</span>
    <div className="mt-1 flex justify-end">
      <CountdownBadge eventDate={proposal.event_date} size="md" />
    </div>
  </div>
)}
```

### 2. Also add the badge to the **Validity Notice** banner

The "valid for X days, please respond until …" banner (line 427-435) is the natural place to surface a *quote-expiry* countdown for the client. Add a small countdown anchored to `expiryDate`:

```tsx
<div className="mt-2">
  <CountdownBadge eventDate={addDays(quoteDate, proposal.validity_days || 7).toISOString().slice(0,10)} prefix="Quote expires:" size="sm" />
</div>
```

This gives clients two clear urgency cues: **event countdown** + **quote-validity countdown**.

### 3. Quick sanity pass on the badge logic

`CountdownBadge` already handles overdue / due-today / <7d / <21d / >21d tones correctly and renders for any non-null date, so no changes needed there. The bug is purely that it was never mounted on `ProposalView`.

## Files Modified
- `src/components/proposal/ProposalView.tsx` (add import + 2 badge placements)

## Out of scope (already working)
- Admin proposal list badge (`AdminProposals.tsx` line 473) ✅
- Creative Sessions, Client Links, Calendar event detail badges ✅
- Daily 9am ET deadline digest email ✅