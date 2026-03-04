import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { OperatorGuard } from '@/components/office/OperatorGuard';
import { SessionIndicators } from '@/components/office/SessionIndicators';
import { ProjectProgress } from '@/components/office/ProjectProgress';
import { ActivityChart } from '@/components/office/ActivityChart';
import { EmbeddedWorkspaces } from '@/components/office/EmbeddedWorkspaces';
import { SuperPromptGenerator } from '@/components/office/SuperPromptGenerator';
import { QuickEntryForm } from '@/components/office/QuickEntryForm';
import { Button } from '@/components/ui/button';
import { LogOut, ArrowLeft, Command, Zap } from 'lucide-react';
import soleiaLogo from '@/assets/soleia-wide-logo.png';

function OfficePortalContent() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Gradient background */}
      <div className="fixed inset-0 bg-gradient-to-br from-zinc-900 via-black to-zinc-900" />
      <div 
        className="fixed inset-0 opacity-[0.02]"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0)',
          backgroundSize: '24px 24px'
        }}
      />

      {/* Header */}
      <header className="relative z-10 border-b border-zinc-800/80 bg-zinc-900/50 backdrop-blur-xl sticky top-0">
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/admin')}
                className="text-zinc-400 hover:text-white hover:bg-zinc-800 -ml-2"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                <span className="hidden sm:inline">Portal</span>
              </Button>
              
              <div className="h-6 w-px bg-zinc-800" />
              
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center">
                  <Command className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h1 className="font-tech text-sm font-bold text-white uppercase tracking-wider">
                    Operator Console
                  </h1>
                  <p className="font-tech text-[10px] text-zinc-500 uppercase tracking-widest">
                    Luis Dreams • Visual Site Operator
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                <Zap className="w-3 h-3 text-emerald-400" />
                <span className="font-tech text-[10px] text-emerald-400 uppercase tracking-wider">Online</span>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="text-zinc-400 hover:text-white hover:bg-zinc-800"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Session Indicators */}
        <section>
          <SessionIndicators />
        </section>

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Charts & Progress */}
          <div className="lg:col-span-2 space-y-6">
            <ActivityChart />
            
            {/* Embedded Workspaces */}
            <section>
              <div className="flex items-center gap-2 mb-3">
                <h2 className="font-tech text-xs uppercase tracking-wider text-zinc-400">Creative Workspaces</h2>
                <div className="flex-1 h-px bg-zinc-800" />
              </div>
              <EmbeddedWorkspaces />
            </section>
          </div>

          {/* Right Column - Quick Actions & Tools */}
          <div className="space-y-6">
            <QuickEntryForm />
            <ProjectProgress />
          </div>
        </div>

        {/* Super Prompt Generator - Full Width */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <h2 className="font-tech text-xs uppercase tracking-wider text-zinc-400">AI Prompt Tools</h2>
            <div className="flex-1 h-px bg-zinc-800" />
          </div>
          <SuperPromptGenerator />
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-zinc-800/50 mt-12">
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <img 
              src={soleiaLogo} 
              alt="Soleia" 
              className="h-6 w-auto opacity-50"
            />
            <p className="font-tech text-[10px] text-zinc-600 uppercase tracking-wider">
              Operator Console v1.0 • {new Date().getFullYear()}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function OfficePortal() {
  return (
    <OperatorGuard>
      <OfficePortalContent />
    </OperatorGuard>
  );
}
