## Add "Services" page to Creative Guide

### 1. New route & page
- Add `/creative-guide/services` route in `src/App.tsx`.
- Create `src/pages/CreativeGuideServices.tsx` (public, matches CreativeGuide styling — ivory/dark theme, Soleia header/nav, Reveal animations).
- Add "Services" link to the CreativeGuideView nav (`NAV_LINKS`) linking to `/creative-guide/services`.

### 2. Line item blurbs
Editorial-style cards for every current line item in the database (in `sort_order`):

1. **Immersive LED Environments & Branded Overlay Design** — full-venue custom design across all LED zones tailored to brand identity.
2. **Static Logo** — high-res static brand mark placed across specified screens.
3. **Mapped by Soleia Creative Team** — our team builds bespoke motion graphics mapped to venue screens.
4. **Transparent Logo Animation** — animated transparent logo overlay for use across LED environments. **Includes embedded explainer video** (uploaded `transparent_logo_explainer_1.mp4`).
5. **Mapped to Spec by Client** — client delivers their own pixel-mapped content per Soleia specs.
6. **Elevator Dynamic Animation** — bespoke portrait animation for elevator displays (up/down/idle).
7. **LED Screens Specific Zone Mapping** — maps visuals to specific outside-arch LED zones.
8. **Performing Artist — Mapped by Soleia Creative Team** — custom artist-facing visuals and stage looks.
9. **Elevator Created by Client** — client-supplied elevator content following provided brief.
10. **Elevator Static Logo** — static portrait logo for elevator idle.
11. **Individual Cabana / Bungalow Logo** — dedicated per-screen feed on selected cabanas/bungalows.
12. **3D Previz** — 3D preview of your content running on the venue screens ahead of the event.
13. **NEW — Client-Supplied Device Presentation Playback** — Support for client-provided laptops or devices used for PowerPoint presentations, awards, and other presentation content, including connection, playback coordination, screen routing, and onsite testing for proper display.

### 3. Transparent Logo Animation video
- Upload `transparent_logo_explainer_1.mp4` via `lovable-assets` CLI → `src/assets/transparent_logo_explainer_1.mp4.asset.json`.
- Embed as autoplaying, muted, looping, tap-for-fullscreen video (matching `ElevatorVideoPreview` pattern) inside that service's card.

### 4. New line item in DB
- Insert `Client-Supplied Device Presentation Playback` into `line_item_templates` (category: Additional Options; price left at 0 / TBD unless you specify — please confirm price below).
- This automatically flows into `/rate-card` (which reads from DB) and the proposal item picker.

### Open questions
- Price for **Client-Supplied Device Presentation Playback**? (defaulting to $0 / "Quoted" if unspecified)
- Should the Services page be **public** (like Creative Guide) or **admin-only**?
