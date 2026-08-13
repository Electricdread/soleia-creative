# Presentation PDF on the Services page

Add a client-facing PDF to the **Presentation** line item on `/creative-guide/services`, with **View** and **Download** buttons.

## What you do

Upload the PDF into this chat. Once it's here, I'll host it and wire it up.

## What I'll build

1. Host the uploaded PDF so it is publicly reachable (CDN asset pointer, no login required).
2. In `src/pages/CreativeGuideServices.tsx`, render an action row under the **Presentation** card description:
   - **View PDF** — opens in a new tab.
   - **Download** — saves the file with a clean Soleia-branded filename.
3. Style both as compact gold-accent buttons matching the existing card typography (uppercase, tracked, bordered), 44px touch targets for mobile.
4. Only the Presentation card shows the buttons; every other line item stays untouched.

## Technical notes

- The buttons render inside the existing `article` card body, below the blurb paragraph, using a shared small `PdfActions` block so a second line item can reuse it later.
- File is referenced via a `.asset.json` pointer imported into the page — no database change, no rate card change.
