## Goal
Add a second packet flavor — "Pre-Call Creative Packet" — that points the client at the Creative Guide page and provisions a slim Google Drive folder containing **only** a Client Asset Collect subfolder (no Creative Guide zip, no Pixel Map).

## Changes

### 1. Schema
Add to `pre_call_packets`:
- `kind text not null default 'pre_call'` — values: `'pre_call'` (current full packet) or `'creative_pre_call'` (new slim variant).

### 2. Edge function `create-client-drive-folder`
Accept a new optional `folder_mode` argument:
- `'full'` (default) — current behaviour: Creative Guide + Pixel Map + Client Asset Collect, with the zip / pixel map / CDG uploads.
- `'asset_only'` — creates just `<Client> — <Event>/Client Asset Collect/`, skips all template uploads, still anyone-with-link writer.
Body of edge call from new packet kind sends `{ packet_id, folder_mode: 'asset_only' }`.

### 3. `AdminPackets` page
- Replace the single "New Packet" button with a small dropdown / two buttons: **Pre-Call Packet** and **Pre-Call Creative Packet**.
- Pass the chosen `kind` into `PacketEditor`.
- Badge each row with its kind.

### 4. `PacketEditor`
- Accept a `kind` prop (defaults to `pre_call` for legacy edits).
- Two default templates:
  - `pre_call` → current Soleia template (Creative Guide / Pixel Map / Client Asset Collect inclusions).
  - `creative_pre_call` → leaner template focused on the Creative Guide page:
    - Title: `Pre-Call Creative Packet`
    - Intro: "Review the Soleia Creative Guide before our pre-call and drop your assets in the shared folder."
    - Single inclusion: **Client Asset Collect** instructions.
    - Scope: same 21-business-day reminder.
- On save, pass `folder_mode: kind === 'creative_pre_call' ? 'asset_only' : 'full'` to the edge function.

### 5. `ClientPacket` page
- When `kind === 'creative_pre_call'`, the primary CTA becomes a large "Open Creative Guide" button that navigates to the Creative Guide page (`creative_guide_url`), and the Drive CTA reads "Upload your assets" pointing at the asset-only folder.
- Other packet kind keeps the existing two-card layout.

## Non-goals
- No changes to proposals, signed-proposal Drive flow, or other admin pages.
- No migration of existing packet rows — they default to `kind = 'pre_call'`.

## Files touched
- new migration: `kind` column on `pre_call_packets`
- `supabase/functions/create-client-drive-folder/index.ts`
- `src/components/admin/PacketEditor.tsx`
- `src/pages/AdminPackets.tsx`
- `src/pages/ClientPacket.tsx`
