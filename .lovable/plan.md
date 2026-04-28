## Move Storage panel out of `/admin/looks`

You're right — `/admin/looks` is the Manage Clips area (Content Previz). The Drive Storage tools are operator-level infrastructure and belong in the Admin Portal alongside User Management, Email Previews, etc.

### Changes

1. **Create new page `src/pages/AdminStorage.tsx`**
   - Route: `/admin/storage` (protected via `ProtectedRoute`, same pattern as other admin pages).
   - Renders `<StoragePanel />` inside the standard admin page shell (Soleia header, back-to-portal nav, dark/light theme aware).

2. **Register the route in `src/App.tsx`**
   - Add `<Route path="/admin/storage" element={<ProtectedRoute><AdminStorage /></ProtectedRoute>} />`.

3. **Add a Portal card in `src/pages/AdminPortal.tsx`**
   - New entry in the `portals` array:
     - Title: `Storage & Archive`
     - Description: `Drive connection health, storage usage, and migrate older clips to cold archive`
     - Icon: `HardDrive` (lucide) in `#c49a3c`
     - Href: `/admin/storage`

4. **Revert `src/pages/AdminLooks.tsx`**
   - Remove the Storage tab and the `<StoragePanel />` import/usage so the Manage Clips page returns to its previous focused layout.

### Files
- New: `src/pages/AdminStorage.tsx`
- Edit: `src/App.tsx`, `src/pages/AdminPortal.tsx`, `src/pages/AdminLooks.tsx`

No changes to `StoragePanel.tsx`, edge functions, or DB — only relocation.
