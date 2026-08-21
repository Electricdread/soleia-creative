import { AdminShell } from '@/components/admin/AdminShell';
import { StoragePanel } from '@/components/admin/StoragePanel';

// Wrapped by ProtectedRoute requireAdmin in App.tsx
export default function AdminStorage() {
  return (
    <AdminShell title="Storage" subtitle="Drive connection, usage, and cold archive">
      <div className="rounded-xl border border-border bg-card p-6">
        <StoragePanel />
      </div>
    </AdminShell>
  );
}
