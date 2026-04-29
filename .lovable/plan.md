## Look Book — Full Edit Dialog + Shareable Client Links

Two upgrades to `/admin/looks`:

### 1. Expanded Edit Dialog

Currently `EditDialog` in `LookBookView.tsx` only edits **title** + **category**. Expand it to also edit:

- Title
- Resolution (free-text input, e.g. `4K`, `1080p`, `8192×1080`)
- Duration (free-text, e.g. `00:15`, `8s loop`)
- Category (existing dropdown from `lookbook_categories`)

Updates `cached_clips` row in place — no re-upload, no thumbnail change. Save button writes `{ title, resolution, duration, category_id, category }` and refreshes the gallery.

### 2. Shareable Look Book Links

Generate a token-based public link to any **subset of looks** (filtered by category, or hand-picked) that can be pasted into a proposal, creative guide, or branded HTML email.

#### New table: `lookbook_shares`

```text
id              uuid pk
token           text unique           — short random token used in URL
title           text                  — admin label, e.g. "Spring Cinematic Selects"
intro_note      text nullable         — optional headline shown to client
category_id     uuid nullable         — null = all clips, or scope to one category
clip_ids        uuid[] nullable       — null = use category/all, or hand-picked subset
is_active       boolean default true
expires_at      timestamptz nullable  — optional expiry
view_count      integer default 0
created_by      uuid
created_at      timestamptz default now()
```

RLS:
- Admins: ALL (manage)
- Public SELECT: only when `is_active = true AND (expires_at is null or expires_at > now())`

#### New public route

`/looks/:token` → `src/pages/SharedLookBook.tsx`

- Fetches share by token (public read)
- Resolves clips: hand-picked > category-filtered > all
- Renders dark Soleia-branded gallery (Soleia wide logo header, gold accents, DM Serif title, JetBrains Mono meta)
- Same hover-autoplay tile + tap-fullscreen behavior as admin
- No edit/delete affordances; clean client view
- Optional intro note shown above gallery
- Tracks `view_count` increment on load

Added to `src/App.tsx` routing as a public route (no `ProtectedRoute`).

#### New admin UI: Share dialog

Add a **Share** button to the Look Book toolbar (next to Categories / Add Media) and a small "Manage shares" entry. Two components:

- `ShareLookBookDialog.tsx` — create a new share. Form: title, optional note, scope (All / specific category), optional expiry date, optional manual clip subset (uses currently filtered/visible clips with checkboxes). Generates token, inserts row, shows the public URL with **Copy Link** + **Copy as HTML email snippet** + **Copy as Markdown** buttons.
- `ManageLookBookSharesDialog.tsx` — list of existing shares with view count, expiry, copy link, deactivate, delete.

The **Copy as HTML email snippet** produces a small Soleia-branded `<table>` block (matches existing email patterns from `mem://tech/email-rendering-strategy`) with a centered gold CTA button linking to `https://soleiacreative.app/looks/{token}` — so it can be dropped into any client email, proposal, or creative guide.

The **Copy Link** uses `getPublicOrigin()` from `src/lib/ogShare.ts` so the canonical `soleiacreative.app` domain is always used.

### Files to change

- `supabase/migrations/<new>.sql` — create `lookbook_shares` + RLS
- `src/components/admin/lookbook/LookBookView.tsx` — expand EditDialog (resolution/duration), add Share button
- `src/components/admin/lookbook/ShareLookBookDialog.tsx` — new
- `src/components/admin/lookbook/ManageLookBookSharesDialog.tsx` — new
- `src/pages/SharedLookBook.tsx` — new public page
- `src/App.tsx` — add `/looks/:token` route

### Out of scope

- No re-upload / new thumbnail capture in the edit dialog (existing AddLookMediaDialog handles new media).
- No per-clip approval/selection flow on the shared page (this is presentational; selection-style flows live in client sessions).
