## What I found

The badges are technically rendering on the active proposal page, but they are easy to miss:

- Event badge appears as a small red pill under the Event Date on the right side.
- Quote expiry badge appears as a small orange pill inside the validity notice.
- On the current proposal preview, I can see: `12d overdue` and `Quote expires: 5d left`.

So the issue is visibility/placement, not missing data or broken badge logic.

## Plan

### 1. Make the event deadline badge more prominent
Update `src/components/proposal/ProposalView.tsx` so the event countdown is displayed directly with the proposal title/client info area, not only tucked under the right-aligned event date.

Proposed header layout:
```text
04.14.26 Sandler Partners      Event Date
Prepared for Sandler Partners  Tue, Apr 14, 2026
[Event: 12d overdue]           Quote Date
```

This keeps the date column clean while making the urgency badge visible near the main event title.

### 2. Make the validity/quote expiry badge feel like part of the notice
Move the quote expiry countdown to the first line of the validity notice and increase its size slightly.

Proposed notice layout:
```text
This proposal is valid for 7 days, please respond until May 1, 2026.
[Quote expires: 5d left]
Confirmation within this period allows us to reserve production time.
```

### 3. Improve mobile visibility
On smaller screens, ensure both badges align left and wrap naturally instead of sitting in the right column where they can be overlooked.

### 4. Optional small styling adjustment
Use clearer labels:
- `Event: 12d overdue`
- `Quote expires: 5d left`

This avoids a standalone `12d overdue` badge that may not clearly communicate what deadline it refers to.

## Files to update

- `src/components/proposal/ProposalView.tsx`

No database changes are needed.