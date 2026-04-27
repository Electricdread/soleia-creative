## Universal Deadline Countdowns + Daily Email Digest

Add countdown badges across all modules (Proposals, Creative Sessions, Calendar Events, Delivery Guides, Content Previz) using `event_date` as the source of truth, an "Upcoming Deadlines" alert center on the Admin Portal, and a daily email digest sent to **luisdreamslv@gmail.com** summarizing what's due.

---

### 1. Shared Countdown Component

**New file**: `src/components/CountdownBadge.tsx`

A small pill component used everywhere. Props: `eventDate: string | null`, `label?: string`, `size?: 'sm' | 'md'`.

Urgency mapping (based on business days until `event_date`):

| Days remaining | Color | Label | Icon |
|---|---|---|---|
| Past due | Red (`bg-destructive`) | `Xd overdue` | AlertTriangle |
| 0 | Red | `Due today` | AlertTriangle |
| 1–3 | Red-soft (`bg-red-500/15 text-red-600`) | `Xd left` | Clock |
| 4–7 | Amber (`bg-amber-500/15 text-amber-600`) | `Xd left` | Clock |
| 8–21 | Gold (`bg-[#c49a3c]/15 text-[#c49a3c]`) | `Xd left` | CalendarClock |
| > 21 | Muted | `Xd left` | CalendarClock |
| No date | Hidden | — | — |

Renders nothing when `eventDate` is null (graceful fallback).

---

### 2. Module Integration

Add `<CountdownBadge eventDate={...} />` to:

- **Proposals** — `src/pages/AdminProposals.tsx` proposal cards + `src/components/proposal/ProposalView.tsx` header (client-facing)
- **Creative Sessions** — `src/components/admin/CreativeSessionCard.tsx` + `src/pages/SharedSession.tsx` header
- **Calendar Events** — `src/components/calendar/EventDetailPanel.tsx` (replaces/augments existing logic) + event list rows in `src/pages/AdminCalendar.tsx`
- **Delivery Guides** — `src/pages/SessionDeliveryGuide.tsx` + `src/pages/TailgateDeliveryGuide.tsx` headers
- **Content Previz** — `src/components/admin/ContentPrevizManager.tsx` cards

Source field per module:
- Proposals → `proposals.event_date`
- Creative Sessions → `creative_sessions.event_date`
- Calendar Events → `calendar_events.event_date` (or existing `content_deadline` if present)
- Delivery Guides → linked session's `event_date`
- Content Previz → linked `client_links.event_date`

---

### 3. Admin Portal "Upcoming Deadlines" Alert Center

**File**: `src/pages/AdminPortal.tsx`

New section above the existing dashboard cards:
- Aggregates Proposals + Creative Sessions + Calendar Events + Delivery Guides where `event_date` is within the next 30 days OR overdue.
- Sorted by urgency (overdue first, then ascending by date).
- Each row: module icon + title + `<CountdownBadge>` + click-through link.
- Section collapses gracefully if nothing is due in the window.
- Header shows total overdue + due-today counts (e.g. "3 overdue · 2 due today").

---

### 4. Browser Tab Pulse

**File**: `src/App.tsx`

Lightweight global hook that queries the four tables once on mount + every 5 min, counts overdue + due-today items, and prefixes `document.title` with `(N) ` when count > 0. No layout changes.

---

### 5. Daily Email Digest → luisdreamslv@gmail.com

**New edge function**: `supabase/functions/send-deadline-digest/index.ts`

- Uses existing `RESEND_API_KEY` (no new secrets).
- Queries Proposals, Creative Sessions, Calendar Events, Delivery Guides where `event_date` falls within the next 7 days or is overdue.
- Sends ONE branded HTML email per day to `luisdreamslv@gmail.com` with three grouped sections: 🔴 Overdue · 🟡 Due This Week · 🟢 Upcoming (8–21 days).
- Each row links back to the relevant admin page on `https://soleiacreative.app`.
- Uses Soleia branding (gold accent, `email-assets` bucket logo, dark header band) consistent with `mem://tech/email-rendering-strategy`.
- Skips sending if there are zero items in all sections (no spam).

**Schedule**: pg_cron job runs daily at **9:00 AM Eastern (14:00 UTC)**.

`supabase/config.toml` addition:
```toml
[functions.send-deadline-digest]
verify_jwt = false
```

Migration creates the cron schedule:
```sql
select cron.schedule(
  'soleia-deadline-digest',
  '0 14 * * *',
  $$ select net.http_post(
    url := 'https://rszawchsbpsmtrtvljta.supabase.co/functions/v1/send-deadline-digest',
    headers := '{"Content-Type":"application/json"}'::jsonb,
    body := '{}'::jsonb
  ); $$
);
```

Enables `pg_cron` and `pg_net` extensions if not already enabled.

---

### 6. No client-facing emails (yet)

Per your earlier choice, this plan sends in-app countdowns to clients (visible on shared session/proposal/delivery pages) but emails go ONLY to you. Client reminder emails can be added later if you want.

---

### Files Touched

**New**
- `src/components/CountdownBadge.tsx`
- `src/components/admin/UpcomingDeadlines.tsx`
- `src/hooks/useDeadlineCount.tsx`
- `supabase/functions/send-deadline-digest/index.ts`
- Migration: enable pg_cron/pg_net + schedule digest

**Modified**
- `src/App.tsx` (tab pulse)
- `src/pages/AdminPortal.tsx` (alert center)
- `src/pages/AdminProposals.tsx`, `src/components/proposal/ProposalView.tsx`
- `src/components/admin/CreativeSessionCard.tsx`, `src/pages/SharedSession.tsx`
- `src/components/calendar/EventDetailPanel.tsx`, `src/pages/AdminCalendar.tsx`
- `src/pages/SessionDeliveryGuide.tsx`, `src/pages/TailgateDeliveryGuide.tsx`
- `src/components/admin/ContentPrevizManager.tsx`
- `supabase/config.toml`

---

### QA
1. Open Admin Portal → "Upcoming Deadlines" section appears with overdue/due items.
2. Browser tab title shows `(N)` prefix when items overdue.
3. Each module card now displays a colored countdown badge.
4. Manually invoke `send-deadline-digest` → email arrives at luisdreamslv@gmail.com with 3 sections.
5. Verify cron job exists: `select * from cron.job where jobname = 'soleia-deadline-digest';`
