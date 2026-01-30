import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { CreativeSessionManager } from '@/components/admin/CreativeSessionManager';
import { ArrowLeft, Loader2 } from 'lucide-react';
import showbloxLogo from '@/assets/showblox-full-logo.jpeg';

export default function AdminCreative() {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/admin/login');
    }
  }, [user, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-white" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

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
                src={showbloxLogo} 
                alt="ShowBlox" 
                className="h-8 w-auto object-contain"
              />
            </div>
            
            <h1 className="text-lg font-semibold text-white">
              ShowBlox Creative
            </h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-zinc-900/80 backdrop-blur-sm border border-zinc-800 rounded-xl p-6">
          <CreativeSessionManager />
        </div>
      </main>
    </div>
  );
}
