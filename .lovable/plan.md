## Goal

Point the **After Effects Template** tile in the proposal Pre-Call Resources to the client's Google Drive folder, so it no longer duplicates the Creative Guide tile.

---

### `src/components/proposal/ProposalView.tsx`

In the Pre-Call Resources grid (around line 1000), change the AE tile behavior:

- **When `driveUrl` exists** (proposal signed → folder created):
  - `href` = `driveUrl` (same root client folder as Collect Assets Folder, opens in new tab)
  - Subtitle: `Open the shared Drive folder to grab the AE project file.`
- **When no `driveUrl` yet**:
  - Render `disabled` Tile (greyed, no link)
  - Subtitle: `Available in your Drive folder after sign-off.`
- **Admin special case** (`isAdmin && !driveUrl`): also disabled with the same copy (folder will appear once generated via the Collect Assets tile).

Keep icon `Sparkles`, title `After Effects Template`, and current grid placement between Creative Guide and Collect Assets Folder.

### Out of scope

- No changes to `DisplaySpecsView.tsx` — the `#ae-template` hash flow on `/creative-guide` stays as-is for internal admin use.
- No changes to proposal emails, edge functions, or Drive folder layout.
- No new database fields.
