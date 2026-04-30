# Remove "Overdue" Badge from Sandler Partners

## What I found

There are two Sandler Partners records in the database:

1. **Proposal** "04.14.26 Sandler Partners" — event date `2026-04-14`, status `sent`, **already signed on 2026-04-25**. Today is April 30, so the event date is 16 days in the past, which is why a red "16d overdue" badge is appearing.
2. **Creative Session** "Sandler Partners" — already marked inactive (closed). Same overdue math applies if displayed.

The shared helper `isProposalClosed()` already correctly identifies the proposal as closed (because `signed_at` is set), and it's properly used by `UpcomingDeadlines` and the browser-tab `useDeadlineCount`. **Those two places already exclude it.**

The bug is that the standalone `CountdownBadge` component is rendered in three list views without checking whether the item is closed or inactive:

- `src/pages/AdminProposals.tsx` (proposal list cards) — shows badge even when proposal is signed/won/invoiced
- `src/components/admin/CreativeSessionCard.tsx` (session list) — shows badge even when session is inactive
- `src/components/admin/ClientLinkManager.tsx` (link list) — shows badge even when link is inactive

So the Sandler proposal shows "16d overdue" even though it was signed. The (inactive) Sandler session would also show it if rendered.

## The fix

Suppress the `CountdownBadge` whenever the item is "done" — no need to flag a deadline that's already been met or for an item that's been turned off. This is a one-line gating change in each of the three call sites; no new logic, no DB changes.

### Specific changes

**`src/pages/AdminProposals.tsx`** (line 473)
Wrap the badge so it only renders for active, non-closed proposals:
```tsx
{p.is_active && !isProposalClosed(p) && (
  <CountdownBadge eventDate={p.event_date} />
)}
```
Add the `isProposalClosed` import from `@/lib/proposalStatus`.

**`src/components/admin/CreativeSessionCard.tsx`** (line 278)
Only show countdown for active sessions:
```tsx
{session.is_active && <CountdownBadge eventDate={session.event_date} />}
```

**`src/components/admin/ClientLinkManager.tsx`** (line 425)
Only show countdown for active links:
```tsx
{link.is_active && <CountdownBadge eventDate={link.event_date} />}
```

### Why this is the right fix (vs. editing the Sandler row)

This isn't a Sandler-specific data issue — the proposal data is already correct (`signed_at` is set, session is `is_active = false`). The badges are simply not respecting that state. Fixing the gating logic resolves Sandler today and prevents the same false-overdue noise on every future signed proposal or closed session/link.

## Files to modify

- `src/pages/AdminProposals.tsx`
- `src/components/admin/CreativeSessionCard.tsx`
- `src/components/admin/ClientLinkManager.tsx`

No database changes, no migrations, no edge function changes.

Approve to apply the fix.