import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Settings } from 'lucide-react';
import { StoragePanel } from '@/components/admin/StoragePanel';
import soleiaLogo from '@/assets/soleia-wide-logo.png';

// Wrapped by ProtectedRoute requireAdmin in App.tsx
export default function AdminStorage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="absolute inset-0 bg-gradient-to-br from-black via-zinc-900 to-black" />

      <header className="relative z-10 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/admin')}
                className="text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div className="h-6 w-px bg-zinc-700" />
              <img src={soleiaLogo} alt="Soleia" className="h-8 w-auto object-contain" />
            </div>

            <div className="flex items-center gap-3">
              <h1 className="font-display text-lg text-foreground">Storage & Archive</h1>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/admin')}
                className="text-muted-foreground hover:text-foreground hover:bg-muted h-8 w-8"
                aria-label="Go to admin portal"
              >
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-muted/80 backdrop-blur-sm border border-border rounded-xl p-6">
          <StoragePanel />
        </div>
      </main>
    </div>
  );
}
