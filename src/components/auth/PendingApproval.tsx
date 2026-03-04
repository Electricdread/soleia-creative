import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Clock, LogOut } from 'lucide-react';
import soleiaIcon from '@/assets/sol-icon.png';

export function PendingApproval() {
  const { signOut, user } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
      <div className="absolute inset-0 bg-gradient-to-br from-black via-zinc-900 to-black" />
      <div 
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '50px 50px'
        }}
      />

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-12">
          <img 
            src={soleiaIcon} 
            alt="Soleia" 
            className="h-20 w-20 object-contain mb-4"
          />
          <span className="text-2xl font-bold tracking-wide text-white">SOLEIA</span>
        </div>

        {/* Pending Card */}
        <div className="bg-zinc-900/80 backdrop-blur-sm border border-zinc-800 rounded-lg p-8 shadow-2xl text-center">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-amber-500/20 flex items-center justify-center">
            <Clock className="w-8 h-8 text-amber-500" />
          </div>
          
          <h1 className="text-xl font-semibold text-white mb-2">Pending Approval</h1>
          <p className="text-zinc-400 mb-6">
            Your account ({user?.email}) is awaiting admin approval. You'll receive access once approved.
          </p>

          <Button 
            onClick={handleSignOut}
            variant="outline"
            className="w-full border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>

        <p className="text-center text-zinc-600 text-sm mt-6">
          Soleia Creative Management System
        </p>
      </div>
    </div>
  );
}
