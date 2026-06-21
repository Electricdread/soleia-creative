## Creative Director — draft page (unlinked)

Build the Luis Dreams section as its own standalone page first, with **no link from anywhere in the app**. We iterate on copy and layout there, then later wire it into the Creative Guide.

### Route
- New route `/creative-director` registered in `src/App.tsx`.
- Wrapped in `ProtectedRoute` (admin-only, same as other internal pages).
- Not added to `NAV_LINKS`, footer, sitemap, or any menu. Only reachable by typing the URL.
- `<meta name="robots" content="noindex,nofollow">` on the page.

### File
- New: `src/pages/CreativeDirector.tsx`
- Reuses existing tokens (`surface-elevated`, gold accents `#c49a3c`, `font-display`, `font-mono`), shadcn `Tabs`, and shared layout chrome consistent with the Creative Guide.

### Page structure
1. **Hero / intro block**
   - Eyebrow: `Creative Director`
   - Headline: `Luis Dreams`
   - Lead paragraph (2–3 sentences). Mentions **once**: "At Soleia, the brand is the headliner."
   - Portrait on the left at `md+`, stacked above on mobile. Slot: `src/assets/luis-dreams-portrait.jpg` with graceful fallback (dark card + `soleia-icon.png` + "Portrait coming soon") so the page never looks broken.
   - No stat strip.

2. **Tabbed bio** (shadcn `Tabs`, gold underline on active, mobile-scrollable tab list)
   - **Bio** — full long-form biography: decade-plus designing visual language for nightclubs, touring artists, festival stages; live VJ residencies; transition into branded environments; arrival at Soleia leading the fusion of nightlife production craft with corporate brand activation.
   - **LIV Miami** — career-defining residency at LIV Nightclub Miami; live VJ sets, custom motion content for headlining DJs, LED programming and reactive show design that shaped LIV's modern visual identity.
   - **Miami Vice × Michael Mann** — worked with Michael Mann on the opening sequence of the new *Miami Vice*; curated and operated the on-screen club visuals so the room reads as a real Miami nightclub on camera. Rare credit where club-floor visual direction crosses into feature-film cinematography.
   - **Live Artist Work** — direct collaboration with global artists and DJs on custom show content, most notably 50 Cent's Dome event (designed and ran headline visuals); ongoing bespoke visual sets for touring DJs and artists — the same discipline now applied to Soleia's corporate clients.

   Tab bodies: short stack of paragraphs, `text-muted-foreground`, `leading-relaxed`, `max-w-prose`. Default tab: Bio.

### Out of scope for this round
- No edits to `CreativeGuideView.tsx`, `PrintableCreativeGuide.tsx`, `NAV_LINKS`, or footer.
- No new DB tables, no admin editor.
- No stat strip. "Brand is the headliner" appears exactly once.

### After approval / iteration
Once you sign off on copy and layout on `/creative-director`, a follow-up turn will:
- Embed the same component into the Creative Guide as the `#director` section, and
- Add `Director` to the guide's nav + printable PDF.

### Open item
Portrait image: drop `src/assets/luis-dreams-portrait.jpg`, or tell me to pull one of the `luis-liv-*.png` portraits from the Luis Dreams project. Ships with a placeholder either way.
