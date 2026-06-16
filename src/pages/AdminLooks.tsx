import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Settings } from 'lucide-react';
import soleiaLogo from '@/assets/soleia-wide-logo.png';
import { LookBookView } from '@/components/admin/lookbook/LookBookView';

// This component is wrapped by ProtectedRoute with requireAdmin
export default function AdminLooks() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="absolute inset-0 bg-gradient-to-br from-black via-zinc-900 to-black" />

      {/* Header */}
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
              <img
                src={soleiaLogo}
                alt="Soleia"
                className="h-8 w-auto object-contain"
              />
            </div>

            <div className="flex items-center gap-3">
              <h1
                className="text-base sm:text-lg font-semibold text-foreground"
                style={{ fontFamily: 'DM Serif Display, serif' }}
              >
                Look Book
              </h1>
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

          {/* Subtitle */}
          <p className="mt-2 text-xs uppercase tracking-[0.25em] text-primary/80" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
            Looks Collection · Curated Motion Library
          </p>
        </div>
      </header>

      {/* Main */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-muted/60 backdrop-blur-sm border border-border rounded-xl p-4 sm:p-6">
          <LookBookView />
        </div>
      </main>
    </div>
  );
}
