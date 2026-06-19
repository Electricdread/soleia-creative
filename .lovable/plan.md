## Problem
- `/admin/packets` is empty (table has 0 rows) and the "New Packet" form is blank, so there's nothing useful to deploy.
- Drive folder creation (Creative Guide / Pixel Map / Client Asset Collect) only runs when a proposal is signed — packets never trigger it.

## Goal
Make a new pre-call packet immediately useful: pre-fill it with content pointing at the Creative Guide, and on save spin up the same Google Drive folder structure already used for signed proposals.

## Changes

### 1. Schema
Add to `pre_call_packets`:
- `drive_folder_url text`
- `drive_folder_id text`
- `creative_guide_url text` (defaults to `https://soleiacreative.app/creative-guide`, editable)

### 2. Edge function `create-client-drive-folder`
Generalize so it accepts either `proposal_id` OR `packet_id`:
- Reads `client_name` + `event_name`/`title` from the matching table.
- Builds the same folder tree (`Soleia Clients / <Client> — <Event> / 01_Soleia Creative Guide / 02_Pixel Map / 03_Client Asset Collect`) with the existing zip/pixel-map/CDG uploads.
- Persists `drive_folder_url` + `drive_folder_id` back to whichever row called it.
- Idempotent — returns the existing folder when already set.

### 3. `PacketEditor` template
Replace the blank `empty` constant with a Soleia default:
- Title: `Soleia Pre-Call Packet`
- Intro: short paragraph welcoming the client and pointing to the Creative Guide link.
- `creative_guide_url` field rendered above inclusions.
- Inclusions seeded with three cards:
  1. **Creative Guide** — purpose + live link.
  2. **Pixel Map** — LED canvas overview, link to Drive folder.
  3. **Client Asset Collect** — what/how to upload.
- Scope: standard 21-business-day timeline reminder (matches existing memory).

After a successful insert/update, call `supabase.functions.invoke('create-client-drive-folder', { body: { packet_id }})` and toast the returned folder URL. Failure is non-fatal (toast warning).

### 4. `AdminPackets` row
- Show an "Open Drive folder" button when `drive_folder_url` is set.
- Add a "Create Drive folder" action for older rows that don't have one yet.

### 5. `ClientPacket` page
- Add a prominent CTA section linking to the Creative Guide URL.
- If `drive_folder_url` is present, show a secondary CTA linking to the shared Drive folder ("Upload your assets here").

## Non-goals
- No changes to proposal flow, totals, or other pages.
- Existing signed proposals continue to call the edge function exactly as before.

## Files touched
- new migration: add 3 columns to `pre_call_packets`
- `supabase/functions/create-client-drive-folder/index.ts`
- `src/components/admin/PacketEditor.tsx`
- `src/pages/AdminPackets.tsx`
- `src/pages/ClientPacket.tsx`
