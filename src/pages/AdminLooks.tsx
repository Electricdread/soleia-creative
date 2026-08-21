import { AdminShell } from '@/components/admin/AdminShell';
import { LookBookView } from '@/components/admin/lookbook/LookBookView';

// Wrapped by ProtectedRoute requireAdmin in App.tsx
export default function AdminLooks() {
  return (
    <AdminShell title="Look Book" subtitle="Curated motion library">
      <div className="rounded-xl border border-border bg-card p-4 sm:p-6">
        <LookBookView />
      </div>
    </AdminShell>
  );
}
