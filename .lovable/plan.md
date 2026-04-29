## Fix Look Book Add Media flow

The "Add Media" dialog opens, but clicking the dropzone often does nothing and uploads silently fail to start. Three concrete causes were identified.

### Problems found

1. **Dropzone is silently disabled when no category is picked.**
   The hidden `<input type="file">` has `disabled={!categoryId}` and the visible drop area gets `cursor-not-allowed` + `opacity-50`. When the user clicks, nothing happens and there is no toast or visible explanation. If no categories exist yet, the Select shows only "Create a category first." with no shortcut to actually create one — a dead-end UX.

2. **Click target is unreliable.**
   The `<input>` is `absolute inset-0` over the dropzone, but the dropzone also has its own `cursor-pointer` and click handlers stacked with `<input>` siblings. On some browsers/iOS, the overlay input does not receive the synthetic click. We will switch to an explicit "Browse files" button that calls `fileInputRef.current?.click()`, plus keep drag-and-drop on the surrounding area.

3. **No user feedback when the upload pipeline starts/fails early.**
   `extractVideoMetadata` runs in a loop with `await` before clearing the input — if any file is corrupt or browser can't decode it, the whole queue stalls silently. We will wrap the loop in try/catch per item and toast on failure, and start queue processing even if metadata extraction fails (thumbnail is optional in the queue UI).

### Changes

**`src/components/admin/lookbook/AddLookMediaDialog.tsx`**
- Replace the hidden full-cover input with a normal hidden input + a visible **Browse files** button (always rendered) and a **Drop zone** (drag/drop only). The button is enabled only when a category is chosen; when not, it shows a helper line: *"Pick or create a category first"* with an inline **Create category** action that opens the Category Manager.
- Add a "Create category" inline shortcut (`onCreateCategory` prop) that closes the upload dialog and opens `CategoryManagerDialog`, so users are never stuck.
- Toast a clear message when the user attempts to add files without a category, instead of silently doing nothing.
- Per-file try/catch around `extractVideoMetadata` so a single bad file no longer blocks the queue. Always call `uploadQueue.addFiles` first, then attach optional thumbnails.
- Add `onClick` handler to the visible drop area that triggers the file picker as a fallback (so clicking the zone also works, not only the button).
- Show inline error text and a "Retry" hint when a queue item fails (already partly there — make the error message readable instead of `[object Object]` by extracting `.message`).
- Reset the queue/thumbnails state when the dialog closes so reopening starts clean.

**`src/components/admin/lookbook/LookBookView.tsx`**
- Wire a new `onCreateCategory` callback into `AddLookMediaDialog` that closes Add Media and opens `CategoryManagerDialog`. After categories change, reload and reopen Add Media.
- When the user clicks **Add Media** and there are zero categories, open the Category Manager first with a toast: *"Create at least one category to organize your looks."*

### Out of scope

- The Drive upload edge function (`upload-to-drive`) itself appears healthy; no logs of failures. We will not change it. If after this fix uploads still fail server-side, we will inspect `upload-to-drive` logs in a follow-up.
- Video re-encoding pipeline (`compressVideo`) is unchanged.

### Verification

After the fix:
- Open `/admin/looks` → click **Add Media**.
- With no categories: a toast prompts you to create one and the Category Manager opens.
- With a category selected: clicking the dropzone OR the **Browse files** button opens the OS file picker.
- Dragging files in still works.
- A bad/corrupt file shows an error in its queue row but other files keep processing.
