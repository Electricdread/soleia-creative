

## Plan: Clean Up Content Delivery Email Template

### Problem
The Content Delivery Email (`CollectAssetsEmailCard.tsx`) contains content delivery-specific language that doesn't apply — references to LED Pixel Map, After Effects project files, Content Delivery Guide PDF, consulting fees, and elevator/ticker displays. The email should simply direct clients to a cloud folder to upload their assets.

### Changes to `src/components/admin/CollectAssetsEmailCard.tsx`

Remove from the HTML template:
- The asset list block (LED Pixel Map, After Effects project file, Content Delivery Guide PDF)
- The paragraph about screens displaying rendered content
- The paragraph about LED consulting load fees
- The paragraph about elevator and ticker displays

Replace with clean, simple copy:
- Opening line: "We are pleased to provide you with a dedicated project folder for **[Project Name]**."
- Brief instruction to upload company assets (logos, branding, fonts, etc.) into the labeled folder
- Keep the gold "Access Project Folder" CTA button
- Keep the tip box about using the link to upload files
- Keep the closing line and footer as-is

One file edit, template HTML only.

