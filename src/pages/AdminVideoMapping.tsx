import { useNavigate } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AdminShell } from '@/components/admin/AdminShell';
import { VenuePrevizManager } from '@/components/admin/VenuePrevizManager';

// Wrapped by ProtectedRoute requireAdmin in App.tsx
export default function AdminVideoMapping() {
  const navigate = useNavigate();

  return (
    <AdminShell
      title="Previz movie"
      subtitle="The mapped show that plays across every screen on the Video Mapping page"
      actions={
        <Button variant="outline" size="sm" onClick={() => navigate('/creative-guide/video-mapping')}>
          <ExternalLink className="mr-2 h-4 w-4" /> Open viewer
        </Button>
      }
    >
      <div className="max-w-3xl">
        <VenuePrevizManager />
      </div>
    </AdminShell>
  );
}
