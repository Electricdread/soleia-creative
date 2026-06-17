import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { VenuePrevizManager } from '@/components/admin/VenuePrevizManager';
import soleiaLogo from '@/assets/soleia-wide-logo.png';

// Wrapped by ProtectedRoute requireAdmin in App.tsx
export default function AdminVideoMapping() {
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
              <div className="h-6 w-px bg-border" />
              <img src={soleiaLogo} alt="Soleia" className="h-8 w-auto object-contain" />
            </div>

            <div className="flex items-center gap-3">
              <h1 className="font-display text-lg text-foreground">Video Mapping</h1>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/creative-guide/video-mapping')}
                className="text-muted-foreground hover:text-foreground hover:bg-muted h-8 w-8"
                aria-label="Open the Video Mapping page"
              >
                <ExternalLink className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h2 className="font-display text-2xl text-foreground">Previz Movie</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            The mapped show that plays across every screen when a viewer hits “Play Previz” on the Video Mapping page.
          </p>
        </div>
        <VenuePrevizManager />
      </main>
    </div>
  );
}
