# Remove Marquee/Ticker references site-wide

The Marquee/Ticker display type is referenced across the Content Delivery Guide, Creative Guide (Display Specs + printable PDF), data model, and Tutorial page. I'll remove all of it.

## Changes

**1. `src/lib/creativeGuide.ts`**
- Remove the `ticker` entry from `DISPLAY_SPECS` (lines 133–159).
- Remove `'ticker'` from the `category` union type (line 15).
- Remove `tickerSpecs` / `tickerDisplay` entries from the assets map (lines 413–414).

**2. `src/pages/DeliveryGuide.tsx`**
- Remove the `ticker` entry from the specs array (lines 61–69).

**3. `src/components/creative-guide/DisplaySpecsView.tsx`**
- Remove `TickerVideoCarousel` import, `TICKER_ASSETS_ZIP`, `isTicker` branch, ticker icon/badge map entries, `handleDownloadTickerAssets`, and the conditional ticker carousel + download button blocks.

**4. `src/components/creative-guide/PrintableCreativeGuide.tsx`**
- Remove the `'ticker'` entry from `categoryIcons`.

**5. `src/components/creative-guide/TickerVideoCarousel.tsx`**
- Delete the file (only consumer was DisplaySpecsView).

**6. `src/pages/Tutorial.tsx`**
- Remove ticker mentions: bullet at line 364, description at line 452, spec card at line 515, video carousels copy at line 555, list item at line 618, description at line 677. Reword adjacent copy so lists/sentences still read naturally.

## Out of scope
- No DB migrations (no ticker rows in DB).
- Public asset files under `/public/creative-guide/` (ticker-specs.jpg, ticker-display.jpg, TICKER-MARQUEE.zip, marquee-ticker-media/) are left on disk — unreferenced after this change. Say the word if you want them deleted too.
