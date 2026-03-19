import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { CreativeSessionManager } from '@/components/admin/CreativeSessionManager';
import { ArrowLeft, Settings } from 'lucide-react';
import soleiaLogo from '@/assets/soleia-wide-logo.png';

export default function AdminCreative() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-black">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-black via-zinc-900 to-black" />

      {/* Header */}
      <header className="relative z-10 border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/admin')}
                className="text-zinc-400 hover:text-white hover:bg-zinc-800"
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
              <h1 className="text-lg font-semibold text-white">
                Soleia Creative
              </h1>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/admin')}
                className="text-zinc-400 hover:text-white hover:bg-zinc-800 h-8 w-8"
                aria-label="Go to admin portal"
              >
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-zinc-900/80 backdrop-blur-sm border border-zinc-800 rounded-xl overflow-hidden p-6">
          <CreativeSessionManager />
        </div>
      </main>
    </div>
  );
}
