## Goal

Update the "Soleia Creative Package" description to clarify what's included: 1–3 looks across all venue LED screens, all cabana/bungalow TVs, and elevators.

## Changes

**1. `src/pages/RateCard.tsx`** — Append an "Includes" line under the package paragraph:

> **Includes:** 1–3 looks across all venue LED screens, all cabana & bungalow TVs, and elevator displays.

Style as a small gold-eyebrow + inline text block inside the `rc-package` section so it prints on one page.

**2. Whatnot proposal (`0cc84505-acd7-4f5f-837d-713bee290365`)** — Update the `Immersive LED Environments & Branded Overlay Design` item description to append the same "Includes" sentence at the end of the existing paragraph. Price/title unchanged.

## Verification

- Visit `/rate-card` in preview — confirm the new inclusion line renders and print still fits one page.
- Open the Whatnot proposal — confirm the updated description appears on the package line item.

## Out of scope

- No changes to other proposals, `line_item_templates`, additional options, or venue contract callout.
