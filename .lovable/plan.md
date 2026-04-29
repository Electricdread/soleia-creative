## Goal

1. Rename the **Content Previz** card in the admin portal dropdown/grid to **Looks Collection**.
2. On the `/admin/looks` page, remove the **Client Sessions** tab (no longer needed here — it already lives elsewhere).
3. Replace the cluttered tab layout with a single **Look Book** — an elegant media gallery where videos can be uploaded and assigned to admin-managed categories.

## Changes

### 1. Portal card rename — `src/pages/AdminPortal.tsx`
- Card title: `Content Previz` → `Looks Collection`
- Description → `Curated motion library — upload, categorize, and browse looks.`
- Keep `/admin/looks` route and gold Video icon.

### 2. New database structure (migration)
Add an admin-managed categories table and link clips to a category:

```sql
create table public.lookbook_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  sort_order int default 0,
  created_at timestamptz not null default now()
);
alter table public.lookbook_categories enable row level security;
create policy "Anyone can read categories" on public.lookbook_categories
  for select using (true);
create policy "Admins manage categories" on public.lookbook_categories
  for all to authenticated
  using (has_role(auth.uid(), 'admin')) with check (has_role(auth.uid(), 'admin'));

alter table public.cached_clips
  add column if not exists category_id uuid references public.lookbook_categories(id) on delete set null;
```

The existing free-text `cached_clips.category` column stays for backward compatibility; the new gallery uses `category_id`.

### 3. New page layout — `src/pages/AdminLooks.tsx` (rewritten)

Replace the 5 tabs with a clean two-pane Look Book:

```text
┌─ Look Book ────────────── [+ Add Media] [Manage Categories] ┐
│ Categories: [All] [Ambient] [Logo] [Texture] [Cinematic]    │
│                                                             │
│ ┌────┐ ┌────┐ ┌────┐ ┌────┐                                 │
│ │vid │ │vid │ │vid │ │vid │   masonry / grid                │
│ └────┘ └────┘ └────┘ └────┘                                 │
└─────────────────────────────────────────────────────────────┘
```

- **Header**: Soleia logo, title `Look Book`, back to `/admin`.
- **Category bar**: pill filters (All + each category) loaded from `lookbook_categories`. Active pill uses gold `#c49a3c`.
- **Gallery grid**: 2/3/4 columns responsive; each tile is a hover-autoplay muted video (existing pattern from `SyncedAlbum`/clip thumbnails). Tap → fullscreen modal. Tile shows title + category badge. Admin actions on hover: Edit (title + category), Delete.
- **Add Media dialog**: drag-and-drop or file picker → reuses `BatchVideoUploader` flow (re-encode 720p WebM preview + original to `clips` bucket per existing batch-upload memory). After upload, prompts category assignment via select bound to `lookbook_categories`. Also includes a "Paste URL" tab using existing `AddClipForm` logic.
- **Manage Categories dialog**: list + add/rename/delete + drag-reorder via `@dnd-kit` (existing pattern). Deleting a category sets clips' `category_id` to null (does not delete clips).

### 4. New components
- `src/components/admin/lookbook/LookBookGallery.tsx` — grid + filter pills + hover preview.
- `src/components/admin/lookbook/LookBookCategoryBar.tsx` — pill filter row.
- `src/components/admin/lookbook/CategoryManagerDialog.tsx` — CRUD + reorder.
- `src/components/admin/lookbook/AddMediaDialog.tsx` — wraps existing `BatchVideoUploader` + `AddClipForm` and category selector.
- `src/components/admin/lookbook/EditClipDialog.tsx` — title + category edit (small wrapper around existing `ClipEditModal` if reusable).

### 5. Removals from `/admin/looks`
- Drop the **Client Sessions** tab entirely (`ClientLinkManager` stays usable on `/admin` portal where the Sessions card already routes — verify no orphaned link, otherwise leave it accessible elsewhere).
- Drop the standalone Upload / Add URL / Bulk / Manage Clips tab UI — their logic is folded into the Add Media + Edit dialogs of the Look Book.

### 6. Memory update
Refresh `mem://features/looks-collection-terminology` to reflect:
- "Looks Collection" portal label
- "Look Book" page subject
- New `lookbook_categories` table powers categorization

## Out of scope
- No changes to `cached_clips` original storage flow (Drive cold storage remains).
- No changes to client-facing `/preview/:token` flows.
- Existing `cached_clips.category` text column kept; UI just stops surfacing it.

## Files to edit / create
- edit `src/pages/AdminPortal.tsx` (card label + description)
- rewrite `src/pages/AdminLooks.tsx` (new Look Book layout)
- new `src/components/admin/lookbook/*` (5 components above)
- new migration: create `lookbook_categories` + `cached_clips.category_id`
- update `mem://features/looks-collection-terminology` and `mem://index.md` line for it
