import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, LogOut, ExternalLink, Clock, Command, Users, FileText, Video, Zap, Send } from 'lucide-react';
import soleiaLogo from '@/assets/soleia-wide-logo.png';
import soleiaIcon from '@/assets/sol-icon.png';
import { EmailTemplateCard } from '@/components/admin/EmailTemplateCard';
import { DropboxLinkManager } from '@/components/admin/DropboxLinkManager';


const OPERATOR_EMAIL = 'luisdreams@me.com';

interface PortalCard {
  title: string;
  description: string;
  iconSrc?: string;
  icon?: React.ReactNode;
  href: string;
  external?: boolean;
}

const portals: PortalCard[] = [
  {
    title: 'Soleia Creative',
    description: 'Internal creative sessions, mood boards, and team collaboration',
    iconSrc: soleiaIcon,
    href: '/admin/creative',
  },
  {
    title: 'Soleia Creative Guide',
    description: 'Technical specifications and venue display documentation',
    iconSrc: soleiaIcon,
    href: '/creative-guide',
  },
  {
    title: 'Content Previz',
    description: 'Per-client video previews for content review and approval',
    icon: <Video className="w-6 h-6 text-zinc-400" />,
    href: '/admin/looks',
  },
  {
    title: 'Client Proposals',
    description: 'Create and manage interactive service agreements and quotes',
    icon: <FileText className="w-6 h-6 text-zinc-400" />,
    href: '/admin/proposals',
  },
  {
    title: 'User Management',
    description: 'Approve or reject new user access requests',
    icon: <Users className="w-6 h-6 text-zinc-400" />,
    href: '/admin/users',
  },
  {
    title: 'Delivery Guides',
    description: 'Session-based content delivery guides with asset upload links',
    icon: <Send className="w-6 h-6 text-zinc-400" />,
    href: '/delivery-guide',
  },
];

export default function AdminPortal() {
  const navigate = useNavigate();
  const { user, isAdmin, isLoading, signOut } = useAuth();
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/admin/login');
    }
  }, [user, isLoading, navigate]);

  // Fetch pending user count for badge
  useEffect(() => {
    if (!isLoading && isAdmin) {
      const fetchPending = async () => {
        try {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('user_id');
          const { data: adminRoles } = await supabase
            .from('user_roles')
            .select('user_id')
            .eq('role', 'admin');
          const adminIds = new Set(adminRoles?.map(r => r.user_id) || []);
          const pending = (profiles || []).filter(p => !adminIds.has(p.user_id)).length;
          setPendingCount(pending);
        } catch (e) {
          console.error('Failed to fetch pending count', e);
        }
      };
      fetchPending();
    }
  }, [isLoading, isAdmin]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/admin/login');
  };

  const handlePortalClick = (portal: PortalCard) => {
    if (portal.external) {
      window.open(portal.href, '_blank');
    } else {
      navigate(portal.href);
    }
  };

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

  // Show pending approval message for non-admin users
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-black flex flex-col">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-black via-zinc-900 to-black" />
        <div 
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '50px 50px'
          }}
        />

        {/* Header */}
        <header className="relative z-10 border-b border-zinc-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <img 
                src={soleiaLogo} 
                alt="Soleia" 
                className="h-10 w-auto object-contain"
              />
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="text-zinc-400 hover:text-white hover:bg-zinc-800"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </header>

        {/* Pending Approval Content */}
        <main className="relative z-10 flex-1 flex items-center justify-center px-4">
          <div className="max-w-md w-full text-center">
            <div className="w-20 h-20 rounded-full bg-amber-500/20 flex items-center justify-center mx-auto mb-6">
              <Clock className="w-10 h-10 text-amber-500" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-3">
              Pending Approval
            </h1>
            <p className="text-zinc-400 mb-6 leading-relaxed">
              Your registration is currently under review. An administrator will approve your access shortly. You'll receive a notification once your account has been approved.
            </p>
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-lg p-4">
              <p className="text-sm text-zinc-500">
                Signed in as: <span className="text-zinc-300">{user.email}</span>
              </p>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="relative z-10 border-t border-zinc-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <p className="text-center text-zinc-600 text-sm">
              © {new Date().getFullYear()} Soleia Creative Management System
            </p>
          </div>
        </footer>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-black overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-black via-zinc-900 to-black z-0" />
      
      {/* Subtle grid pattern overlay */}
      <div 
        className="fixed inset-0 z-[1] opacity-5 pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '50px 50px'
        }}
      />

      {/* Header */}
      <header className="relative z-10 border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <img 
              src={soleiaLogo} 
              alt="Soleia" 
              className="h-10 w-auto object-contain"
            />
            
            <div className="flex items-center gap-4">
              <span className="text-sm text-zinc-400 hidden sm:block">
                {user.email}
              </span>
              
              {/* Operator Console Link - Only visible to operator */}
              {user.email?.toLowerCase() === OPERATOR_EMAIL.toLowerCase() && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/office')}
                  className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 hover:border-cyan-500/50"
                >
                  <Command className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Operator Console</span>
                </Button>
              )}
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="text-zinc-400 hover:text-white hover:bg-zinc-800"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
            Admin Portal
          </h1>
          <p className="text-zinc-400 text-lg">
            Select a platform to manage
          </p>
        </div>

        {/* Portal Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {portals.map((portal) => (
            <button
              key={portal.title}
              onClick={() => handlePortalClick(portal)}
              className="group relative bg-zinc-900/80 backdrop-blur-sm border border-zinc-800 rounded-xl p-6 text-left transition-all duration-300 hover:border-zinc-600 hover:bg-zinc-800/80 hover:scale-[1.02] hover:shadow-2xl"
            >
              {/* Icon */}
              <div className="w-14 h-14 rounded-lg bg-white/5 border border-zinc-700 flex items-center justify-center mb-5 group-hover:bg-white/10 group-hover:border-zinc-600 transition-colors overflow-hidden">
                {portal.iconSrc ? (
                  <img 
                    src={portal.iconSrc} 
                    alt={portal.title} 
                    className="w-10 h-10 object-contain group-hover:scale-110 transition-transform"
                  />
                ) : portal.icon ? (
                  <div className="group-hover:scale-110 transition-transform">
                    {portal.icon}
                  </div>
                ) : null}
              </div>

              {/* Title */}
              <h2 className="text-xl font-semibold text-white mb-2 flex items-center gap-2">
                {portal.title}
                {portal.external && (
                  <ExternalLink className="w-4 h-4 text-zinc-500" />
                )}
                {portal.title === 'User Management' && pendingCount > 0 && (
                  <Badge className="bg-amber-500 text-black text-xs font-bold px-2 py-0.5 rounded-full ml-1">
                    {pendingCount}
                  </Badge>
                )}
              </h2>

              {/* Description */}
              <p className="text-zinc-400 text-sm leading-relaxed">
                {portal.description}
              </p>

              {/* Hover Arrow */}
              <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                  <svg 
                    className="w-4 h-4 text-white" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Client Templates Section */}
        <div className="max-w-5xl mx-auto mt-10 space-y-6">
          <h2 className="text-xl font-semibold text-white mb-4">Client Templates</h2>
          <EmailTemplateCard />
          <DropboxLinkManager />
        </div>
      </main>

      {/* Footer */}
      <footer className="absolute bottom-0 left-0 right-0 z-10 border-t border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-center text-zinc-600 text-sm">
            © {new Date().getFullYear()} Soleia Creative Management System
          </p>
        </div>
      </footer>
    </div>
  );
}
