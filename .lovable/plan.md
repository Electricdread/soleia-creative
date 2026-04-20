

## Fix: Proposal (and all client) share links use canonical `soleiacreative.app`

### Root cause
Every admin "copy link" / email-template builder uses `window.location.origin`. When the admin is working from the Lovable preview (`id-preview--…lovable.app`) or the staging `.lovable.app` URL, the copied link bakes in that origin. Clients then receive a non-canonical preview URL that may be access-restricted or look untrusted.

The canonical production domain is already hardcoded as `https://soleiacreative.app` in the edge functions (`generate-session-email`, `og-preview`). The frontend share helpers need the same source of truth.

### Fix

**1. Create a single `getPublicOrigin()` helper** in `src/lib/ogShare.ts`:
- Returns `https://soleiacreative.app` whenever the current `window.location.hostname` is *not* `soleiacreative.app` / `www.soleiacreative.app` (i.e., on Lovable previews, localhost, staging).
- Returns `window.location.origin` when already on the canonical domain (so it works correctly if/when the domain changes or in case of self-hosting).

**2. Replace all client-side share/copy URLs to use this helper.** All of these currently leak the wrong origin:

| File | Line | What it builds |
|---|---|---|
| `src/lib/ogShare.ts` | `copyDirectLink` | any direct link |
| `src/pages/AdminProposals.tsx` | 164 | `/proposal/{token}` copy |
| `src/components/admin/ProposalEmailCard.tsx` | 189 | proposal email body link |
| `src/components/admin/CreativeSessionEmailCard.tsx` | 179 | session email body link |
| `src/components/admin/CreativeSessionManager.tsx` | 61 | `/creative/{token}` copy |
| `src/components/admin/ClientLinkManager.tsx` | 185 | `/session/{token}` copy |
| `src/components/admin/ContentPrevizManager.tsx` | 163 | `/preview/{token}` copy |
| `src/components/admin/CreativeSessionCard.tsx` | 504, 511 | `/delivery/{token}` copy |
| `src/components/admin/LinkPreviewCard.tsx` | 19 | direct preview link |

Out of scope (correctly using `window.location.origin`):
- `useAuth.tsx` / `AdminSetup.tsx` `emailRedirectTo` — must be the runtime origin so Supabase redirects back to wherever the admin is signing up.
- `DeliveryGuide.tsx` line 102 — internal PDF generation only.

**3. Also strip the `?edit=true` admin URL when admins use the in-page "Copy public link" button** — already handled by current code (only `copyLink`/`copyOgShareLink` are used for sharing), no change needed.

### Files
- `src/lib/ogShare.ts` — add `getPublicOrigin()`, update `copyDirectLink` + `getOgShareUrl` is already correct (uses Supabase URL).
- 8 admin component files listed above — replace `${window.location.origin}` with `${getPublicOrigin()}` for client-share links.

### QA
After the change: open the admin from the Lovable preview, copy a proposal link → confirm the clipboard contains `https://soleiacreative.app/proposal/<token>` (not `id-preview--…lovable.app`). Repeat for the session, creative, preview, and delivery copy buttons.

