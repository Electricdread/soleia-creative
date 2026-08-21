import { AdminShell } from '@/components/admin/AdminShell';
import { CreativeSessionManager } from '@/components/admin/CreativeSessionManager';
import { CreativeSessionEmailCard } from '@/components/admin/CreativeSessionEmailCard';

// Wrapped by ProtectedRoute requireAdmin in App.tsx
export default function AdminCreative() {
  return (
    <AdminShell title="Creative sessions" subtitle="Mood boards, briefs and the live client session links">
      <div className="space-y-6">
        <CreativeSessionEmailCard />
        <div className="rounded-xl border border-border bg-card p-6">
          <CreativeSessionManager />
        </div>
      </div>
    </AdminShell>
  );
}
