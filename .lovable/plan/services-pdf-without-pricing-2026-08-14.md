# Services PDF without pricing

On `/creative-guide/services`, the View/Download buttons currently serve `Soleia-Creative-Services.pdf`, which is a rate card — it prints a price on every line (`$3,000`, `$750`, `$350`, …) plus the `1 × Unit` / `STARTING AT` labels. Goal: the client-facing PDF on this page shows the services and descriptions, no pricing.

## What I'll do

1. Produce a no-pricing variant of the existing PDF: `Soleia-Creative-Services-No-Pricing.pdf`, generated from the current file so the layout, typography, and gold styling stay identical.
2. Strip the entire right-hand price column from every services line: the dollar amounts, the `1 × Unit` quantity labels, and the `STARTING AT` caption above the package price. Everything else — headings, blurbs, "Included in your venue contract", The Process, Terms & Conditions, footer — stays untouched.
3. Point the Services page's **View Services PDF** and **Download** buttons at the new file, with the download filename `Soleia-Creative-Services.pdf` (clean name, no pricing inside).
4. Leave the priced rate card file in place and unchanged, so any internal/proposal use of it keeps working.
5. The **Presentation Guide** PDF contains no pricing — untouched.
6. Visual QA: render every page of the new PDF to images and check that no price, unit label, or leftover artifact remains and nothing else shifted or got clipped.

## Technical notes

- The PDF is a static uploaded asset (`public/Soleia-Creative-Services.pdf`), not output of the in-app jsPDF generators, so the no-pricing version is made by locating the price/unit text runs by coordinates and removing them from the page content streams (background-matched cover only if a glyph can't be cleanly removed).
- Only `src/pages/CreativeGuideServices.tsx` changes in the app: the `SERVICES_PDF_URL` constant and its `download` attribute, plus a bumped `DOCUMENT_VERSION` so cached copies don't linger.
- No database, rate card, or proposal changes.
