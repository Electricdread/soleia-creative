## Goal
Turn the Admin Portal home (`/admin`) from a thin "this week + templates" page into a real operations dashboard that shows, at a glance:

- What's overdue / due soon (already partially there)
- Status of every active client deliverable (proposals, sessions, previz links)
- Pending client actions (unsigned proposals, missing asset uploads, awaiting selections)
- Recent client activity (signatures, selections, uploads, mood-board additions)
- This week's events (kept, condensed)

Remove the Client Templates section (Dropbox link manager) from the home — it will stay accessible inside the relevant tools, just not on the dashboard.

## Files to change

1. **`src/pages/AdminPortal.tsx`** — restructure the `<main>` body, drop `DropboxLinkManager`, widen layout from `max-w-4xl` → `max-w-6xl`, add new dashboard grid.
2. **New: `src/components/admin/DashboardStatusGrid.tsx`** — 4 status cards (Proposals, Creative Sessions, Previz Links, Asset Uploads) with active counts + sub-status (sent / signed / awaiting).
3. **New: `src/components/admin/PendingActionsPanel.tsx`** — actionable list of items needing attention:
   - Proposals `status='sent'` and not signed (waiting on client signature) with days since sent
   - Active client links with no `link_selections` yet
   - Active client links with no `session_uploads` yet (asset collection pending)
   - Creative sessions with `is_public=true` but no recent mood-board activity
4. **New: `src/components/admin/RecentActivityFeed.tsx`** — chronological feed (last 14 days) merging:
   - Proposal signatures (`proposals.signed_at`)
   - New `link_selections`
   - New `session_uploads`
   - New `mood_board_items`
   Each row clickable to its detail page.
5. **Reuse: `src/components/admin/UpcomingDeadlines.tsx`** — keep at top, no change.
6. **Reuse: This Week strip** — keep, but compress (remove the long event list below the 7-day strip; the strip already shows dots-per-day, and the full list duplicates `/admin/calendar`). Tapping a day still routes to the calendar.

## Proposed layout

```
┌─────────────────────────────────────────────────────────────┐
│ Header (logo, theme, sign out)                              │
├─────────────────────────────────────────────────────────────┤
│ ⚠ Upcoming Deadlines (existing component, kept on top)      │
├─────────────────────────────────────────────────────────────┤
│ This Week  [Mon Tue Wed Thu Fri Sat Sun] → View Calendar    │
├─────────────────────────────────────────────────────────────┤
│ Status Grid (4 cards, 2x2 mobile / 4-up desktop)            │
│ ┌────────────┬────────────┬────────────┬────────────┐       │
│ │ Proposals  │ Sessions   │ Previz     │ Uploads    │       │
│ │ 4 active   │ 3 active   │ 0 active   │ 0 this wk  │       │
│ │ 2 sent     │ 1 public   │ —          │ 0 total    │       │
│ │ 0 signed   │ 3 mood/wk  │ —          │ —          │       │
│ └────────────┴────────────┴────────────┴────────────┘       │
├─────────────────────────────────────────────────────────────┤
│ Two-column on desktop, stacked on mobile:                   │
│ ┌──────────────────────────┬─────────────────────────────┐  │
│ │ Pending Actions          │ Recent Activity             │  │
│ │ • "Sandler Partners"     │ • Signed: Acme Proposal     │  │
│ │   sent 5d ago, unsigned  │ • Selection: Looks Apr-21   │  │
│ │ • Previz "Spring 26"     │ • Upload: client.zip        │  │
│ │   no selections yet      │ • Mood item: Vibrant Reel   │  │
│ │ • Session "Sandler"      │ ...                         │  │
│ │   no uploads received    │                             │  │
│ └──────────────────────────┴─────────────────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│ Footer                                                      │
└─────────────────────────────────────────────────────────────┘
```

The current "Client Templates" section (lines 524–529, `<DropboxLinkManager />`) is removed entirely from the home. The `DropboxLinkManager` component itself is left intact so it can still be reached from inside Creative Sessions / Looks where it belongs.

## Data source per panel

Status Grid (single batched fetch on mount, plus realtime subscription on the four tables):
- `proposals` → count by `status` filtered by `is_active=true`
- `creative_sessions` → count active, count `is_public=true`, count mood items in last 7d
- `client_links` → count active, count with at least one selection in last 7d
- `session_uploads` → count last 7 days, count total

Pending Actions:
- `proposals` where `is_active=true AND status='sent' AND signed_at IS NULL` → "Awaiting signature (Nd)"
- `client_links` where `is_active=true` LEFT JOIN `link_selections` IS NULL → "No selections yet"
- `client_links` where `is_active=true` LEFT JOIN `session_uploads` IS NULL → "No assets uploaded"
- Sort by oldest `created_at` first, cap at 8 rows, "View all" link per category.

Recent Activity (last 14 days, cap 12):
- `proposals` (signed_at not null) → "Signed by {client}"
- `link_selections` (created_at) → "Selection on {link}"
- `session_uploads` (created_at) → "Asset uploaded to {link}"
- `mood_board_items` (created_at) → "{added_by} added to {session}"
Each row: timestamp pill ("2h", "yesterday"), icon, label, deep link. Realtime subscribed to the 4 tables.

## Visual / styling rules
- Match existing dashboard tone: `bg-card`, `border-border`, gold accents `#c49a3c` / `text-primary`, `font-semibold` titles, mobile 44px hit targets.
- Status numbers in large `text-3xl font-bold`, sub-stats in `text-xs text-muted-foreground`.
- Pending Actions and Recent Activity panels: max-height with scroll, divider rows, hover bg, chevron.
- All panels collapse cleanly to single column at `< sm` and 2-column at `lg`.

## What stays the same
- Sidebar / portal navigation drawer
- Header, theme toggle, operator console button, sign-out
- Pending user count badge
- `useDeadlineCount` title prefix hook
- `UpcomingDeadlines` component on top
- Weekly day strip (the 7 little day buttons)
- Footer

## What is removed
- The full `weekEvents.map(...)` event list under the day strip (lines ~454–522). The day-strip dots already preview the day, and `/admin/calendar` shows the full list. This frees vertical space for the new dashboard panels.
- The entire `Client Templates` section + `<DropboxLinkManager />` (lines ~524–529).

## No database changes
All data needed is already in `proposals`, `creative_sessions`, `client_links`, `link_selections`, `session_uploads`, and `mood_board_items`. RLS already permits admin reads. Verified by sampling counts (4 active proposals, 2 sent, 3 active sessions, 3 mood items in last 7 days).