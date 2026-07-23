Update the Soleia Creative Package to state that it includes a 3D previsualization so clients can preview their content on the venue screens.

### Changes
1. **Rate Card page (`src/pages/RateCard.tsx`)**
   - Add a line in the package description block that says the package includes a 3D previz to view content on the screens.
   - Keep existing copy and formatting so it still fits the print layout.

2. **Line Item Library (database)**
   - Update the `line_item_templates` row with title `Immersive LED Environments & Branded Overlay Design` so the description and `Includes:` note match the Rate Card page. This ensures new proposals seeded from the library carry the same language.

### Notes
- No schema changes are needed.
- No other proposal or rate-card styling changes are in scope.
- The change will appear in the live preview immediately once implemented; no separate publish step.