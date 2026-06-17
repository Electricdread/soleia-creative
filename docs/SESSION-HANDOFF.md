# Session Handoff — Soleia Creative App / Video Mapping

> Paste-ready context for continuing in a new chat. Fuller detail in
> [`docs/venue-video-mapping.md`](venue-video-mapping.md) and root `CLAUDE.md`.

## Context
Working in the **soleiacreativeapp** repo (React 18 + Vite + Tailwind, Supabase backend).
The live app is built on **Lovable**, which auto-commits to GitHub `origin/main` —
**`main` IS production** (live client proposal & creative-session links run off it).

## What we built and shipped (all LIVE on main)
1. **Creative Guide map** — replaced the venue map with a dark isometric render
   (`public/creative-guide/venue-layout-iso.png`), stripped the map HUD, added a
   360° tour deep-link button row — `src/components/creative-guide/InteractiveVenueMap.tsx`.
2. **Video Mapping page** at `/creative-guide/video-mapping`
   (`src/components/VenueVideoMappingView.tsx` + `src/pages/VenueVideoMapping.tsx`):
   editorial/Creative-Guide schema (light, gold, DM Serif), embedding an
   interactive 3D venue (`src/components/venue/RoomScene.tsx`) with Play Previz,
   Fullscreen, and mouse-nav. Built from real Unreal geometry (glTF in `public/venue/`).
3. **Lazy-loaded** the Video Mapping route so its ~260 KB-gz three.js bundle only
   loads on that page (proposals/sessions stay light) — `src/App.tsx`.
4. **Creative Guide top nav** — "360° Tour" item replaced with "Video Mapping" → routes to the page.

## Workflow / safety rules
- Lovable owns production. ALWAYS `git fetch` + check divergence before work.
  Local once drifted 94 commits behind and was missing DB migrations — never push
  the local tree blindly; author Supabase migrations only on up-to-date origin/main.
- Push flow used: branch `claude/...` → commit (Co-Authored-By footer) → `git checkout
  main && git merge --ff-only <branch> && git push origin main`. All pushes were clean
  fast-forwards. Verify with `npm run build`.
- The original 3D-prototype work is preserved on branch `backup/local-3d-prototype`.

## Key gotchas (don't relearn the hard way)
- 3D venue geometry comes from Unreal `E:\UE Projects\SOLEIAv2` (map Soleia_v2).
  UnrealMCP does NOT work (no plugin) — use the editor's Python console export scripts.
- Source show movies are Resolume **DXV .mov** (YCgCo) — ffmpeg breaks with any
  `-vf`/`-ss`. Use AME-exported .mp4, or transcode in passes with no filters.
- The 3D screen ShaderMaterial has no sRGB output encoding → textures use
  `NoColorSpace` + Canvas `NoToneMapping` (keeps previz video crisp). Bloom/
  postprocessing was removed (washed video, broke the reflector).
- Previz maps each screen to a rectangle of the 3840×2160 pixel map
  (`D:\SOLEIA\SOLEIApixmap.png`); rects live in `RoomScene.tsx` `REGIONS`
  (note DJ booth = 906,594, easy to misread as 904,504).

## Current state
Clean: local `main` == production (`de4592e`), working tree clean, build passes.

## Likely next steps
- Add the "dynamics of video mapping" explanatory content below the 3D panel
  (in the Creative Guide editorial style).
- More 360° tour deep-link buttons (give label + scene URL).
- Optionally re-export the outdoor SR/SL/Arch screens (not in the current glTF).
