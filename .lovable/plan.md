

## Plan: Add Asset Due Date to Client Asset Collect Email

### What Changes

**Add a "Due Date" input field** to the card UI and render a prominent deadline callout in the email body — positioned right after the greeting and before the asset checklist so it's the first thing the client sees.

### UI Changes (`ClientAssetCollectEmailCard.tsx`)

1. Add a new `dueDate` state (string, date input)
2. Add a third input field labeled **"Asset Due Date"** using `<Input type="date" />` in the form grid (switch to 3-column on sm)
3. Pass `dueDate` into `buildAssetCollectEmailHtml`

### Email Template Changes

Insert a bold deadline banner immediately after the "Hi [Client]" greeting, before the asset checklist:

- Gold-bordered box with a calendar icon (emoji), bold formatted date, and urgent but polite language
- Example rendering:

```text
┌─────────────────────────────────────────────┐
│  📅  Assets Due By: Friday, July 18, 2025   │
│  To keep your project on schedule, please    │
│  submit all materials by this date.          │
└─────────────────────────────────────────────┘
```

- Styled with `background:#fdf6e3; border:2px solid #DAA520; border-radius:8px; text-align:center`
- Date formatted as a readable string (e.g. "Friday, July 18, 2025")
- If no due date is entered, the banner is omitted from the email

### File to Edit
- `src/components/admin/ClientAssetCollectEmailCard.tsx`

