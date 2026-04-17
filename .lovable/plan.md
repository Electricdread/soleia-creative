
You’re right to flag this. I checked the source and the requested UI is already implemented in code:

- `ClientLinkManager.tsx` already has the header Active toggle, a single “Copy Link” dropdown, and an isolated Delete button.
- `CreativeSessionCard.tsx` already has the same pattern.
- `AdminProposals.tsx` already has the same pattern.

What does not match is what you’re seeing:
- Your current preview state is `/admin/login?redirect=%2F`
- Your screenshot shows the old proposals UI

That strongly suggests this is a render/caching/version mismatch, not that the feature was never added.

### Plan
1. Verify the rendered admin pages, not just the source
   - Check `/admin/looks`, `/admin/creative`, and `/admin/proposals` after auth
   - Confirm each route is actually showing the updated component

2. Fix the stale UI source
   - If an older cached bundle is being shown, force the app to load the newest version
   - If needed, adjust update/caching behavior so admin pages stop showing outdated UI after changes

3. Only patch code if one route is still truly old
   - Re-touch the affected page/component only if it is rendering a different layout than the source
   - No database changes are needed

4. QA the exact problem you reported
   - Recheck the three admin sections at your current viewport size
   - Confirm duplicate link buttons are gone
   - Confirm Delete is visually separated and harder to misclick

### Technical details
Files to verify first:
- `src/components/admin/ClientLinkManager.tsx`
- `src/components/admin/CreativeSessionCard.tsx`
- `src/pages/AdminProposals.tsx`

Possible follow-up if caching is the cause:
- `vite.config.ts`
- `src/main.tsx`

### Expected outcome
The visible admin UI will match the updated source, so this is treated as a sync/visibility fix rather than redoing the same feature again.
