

## Remove the "Social Link" / OG share feature entirely

The og-preview link goes to a Supabase function URL that returns Open Graph meta tags for messaging-app previews — but in a browser it just looks broken/opaque. You don't want it. Removing it everywhere.

### What gets removed

**UI buttons & menu items**
- `src/pages/AdminProposals.tsx` — "Share Link (with preview)" dropdown item on each proposal card.
- `src/components/admin/CreativeSessionCard.tsx` — "Share Link" dropdown item on each creative session card.
- `src/components/admin/ClientLinkManager.tsx` — "Share Link" dropdown item on each client link.
- `src/components/admin/LinkPreviewCard.tsx` — the "Social Link" button (keep "Direct Link" + open-in-new-tab).

The remaining "Direct Link" / "Copy Link" actions stay — they already use `getPublicOrigin()` so they produce clean `https://soleiacreative.app/...` URLs.

**Helpers**
- `src/lib/ogShare.ts` — drop `getOgShareUrl`, `copyOgShareLink`, and the `OgLinkType` export. Keep `getPublicOrigin` and `copyDirectLink` (still used widely).

**Edge function**
- Delete `supabase/functions/og-preview/index.ts` and remove its deployment via `supabase--delete_edge_functions`. No other code references it.

**Memory cleanup**
- Remove the `[Dynamic Link Previews](mem://tech/dynamic-link-previews)` entry from `mem://index.md` and delete that memory file so future sessions don't try to re-add the feature.

### Verify after change
- Open the proposals dashboard → the row dropdown should have only "Copy Link", "Email Template", "Open in New Tab", "Edit", "Delete" (no "Share Link").
- Same for Creative Sessions and Client Links cards.
- All remaining copy buttons still produce `https://soleiacreative.app/...` URLs.
- No TypeScript errors from missing imports.

### Out of scope
Email templates and the rest of the sharing flow are untouched — they already use direct canonical URLs, not the og-preview function.

