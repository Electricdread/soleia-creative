

## Plan: Add 21-Day Deadline Banner to Footer & Upload Notification Request

### Current State
The Content Delivery Email template (`CollectAssetsEmailCard.tsx`) provides technical instructions for DXV3 encoding and content submission, but lacks:
1. A prominent 21-day deadline banner in the footer
2. A request asking clients to notify the team when files are uploaded

### Changes Required

**File: `src/components/admin/CollectAssetsEmailCard.tsx`**

#### 1. Add Upload Notification Request (before closing paragraph)
Insert a gold-bordered instruction block after "Tips for Best Results" and before the final closing paragraph:
- Use existing `buildInstructionBlock()` pattern
- Title: "PLEASE NOTIFY US"
- Content: "Once you've uploaded all files to the project folder, please send a confirmation email to luisdreamslv@gmail.com so we can begin testing and approval."

#### 2. Add 21-Day Deadline Banner to Footer
Insert a new table row **before** the dark footer with contact info (between line 110 and 111):
- Full-width gold-bordered banner
- Light yellow background (#fdf6e3)
- Calendar emoji (📅) + bold "21 BUSINESS DAYS REQUIRED"
- Explain assets must be uploaded 21 business days before the event for testing and approval
- Matching visual style to `ClientAssetCollectEmailCard.tsx` deadline banner

#### 3. Update Plain-Text Version
Update `buildAssetsEmailText()` to include:
- Upload notification request after "Tips for Best Results"
- Deadline reminder at the end

### Visual Design
- **Upload Notification Block**: Gold left-border (#DAA520), light beige background (#faf8f3), matches existing instruction blocks
- **Footer Deadline Banner**: Full-width gold border (#DAA520), light yellow background (#fdf6e3), prominent typography, sits above dark contact footer
- Maintains email-safe table structure with inline styles

### Technical Approach
- Reuse `buildInstructionBlock()` helper for upload notification
- Insert new table row for deadline banner before existing footer
- Maintain accessibility with `role="presentation"` and semantic markup
- No breaking changes to component props or behavior

