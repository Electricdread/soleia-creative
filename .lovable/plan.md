# Editable Rate Card — Admin Drag-to-Reorder

Make `/rate-card` fully database-driven and let signed-in admins reorder line items with drag-and-drop. New order persists to `line_item_templates.sort_order` and is what every client sees.

## 1. Data migration (one-time)

Sync the hardcoded arrays in `src/pages/RateCard.tsx` into `line_item_templates` so the DB is the single source of truth:

- **Additional Options**: Static Logo, Transparent Logo Animation, Elevator Dynamic Animation, Elevator Created by Client, Elevator Static Logo, Individual Cabana / Bungalow Logo, 3D Previz.
- **Video Mapping & Load Fees**: Mapped by Soleia Creative Team, Mapped to Spec by Client, Outside Arch Specific Video, Performing Artist — Mapped by Soleia Creative Team.
- Ensure `line_item_categories` has rows for `Additional Options` and `Video Mapping & Load Fees` with the current `sort_order` (Additional Options first).

Idempotent upsert by `title` so re-running is safe and existing IDs used by proposals are preserved.

## 2. Public read RPC

`get_rate_card_addons()` already returns items ordered by category + `sort_order`. Confirm/keep that ordering — no schema change needed for reads.

## 3. Admin reorder RPC

Add `admin_reorder_rate_card_items(p_items jsonb)` — `SECURITY DEFINER`, `has_role(auth.uid(),'admin')` gate. Accepts `[{id, sort_order}, ...]` and updates `line_item_templates.sort_order` in a single statement. Grant EXECUTE to `authenticated`.

(RLS on `line_item_templates` already restricts writes to admins; the RPC just makes batching one round-trip.)

## 4. `/rate-card` page changes (`src/pages/RateCard.tsx`)

- Remove the hardcoded `ADDITIONAL_OPTIONS` and `VIDEO_MAPPING` arrays.
- Fetch categories via `get_rate_card_categories()` and items via `get_rate_card_addons()` on mount; render each category section from the fetched data (keep the exact ivory/gold visual layout, `ServiceRow`, section labels, print CSS, etc.).
- Featured "Soleia Creative Package" section, venue-contract callout, "The Process", and "Terms & Conditions" stay hardcoded (they aren't line items).
- Detect admin via `useAuth()`:
  - Anonymous / non-admin: identical read-only view they see today.
  - Admin: each row gets a drag handle (grip icon, left side, `no-print` + `tap-44`). Use `@dnd-kit/core` + `@dnd-kit/sortable` (already in the project for other DND lists) with `TouchSensor` (200ms delay, 5px tolerance) per the mobile-reordering memory.
  - Reordering is scoped **within a category** (Additional Options items reorder among themselves; Video Mapping items among themselves). No cross-category drops.
  - On drop: optimistic local reorder → call `admin_reorder_rate_card_items` with the new `sort_order` values for just that category → toast on success/failure, revert on error.
- Hide drag handles, Print/PDF buttons keep working unchanged (`no-print`).

## 5. Verification

- Admin: reorder items on desktop and mobile viewport, refresh, confirm order persists and matches what an anonymous browser sees.
- Anonymous: `/rate-card` renders identical layout to today with the DB-sourced items.
- Print preview still fits one page (existing print CSS is unaffected — same rows, same section labels).
- New proposals seeded from `line_item_templates` continue to pick up the same categories/order.

## Technical notes

- No changes to `ProposalView`, PDF generator, or editorial services pages — they already read from `line_item_templates`.
- `@dnd-kit` packages are already installed (used by `SortableClipCard`, etc.), so no new dependency.
- Migration will only touch `line_item_templates` / `line_item_categories` rows and add the reorder RPC; no destructive drops.
