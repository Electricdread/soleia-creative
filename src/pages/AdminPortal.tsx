import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, LogOut, ExternalLink, Clock, Command, Users, FileText, Video, Zap, Send, Calendar, Palette, BookOpen, Eye, FolderOpen, MapPin, ArrowRight, Menu, X, Sun, Moon } from 'lucide-react';
import { useTheme } from 'next-themes';
import soleiaLogo from '@/assets/soleia-wide-logo.png';
import soleiaIcon from '@/assets/sol-icon.png';
import { EmailTemplateCard } from '@/components/admin/EmailTemplateCard';
import { DropboxLinkManager } from '@/components/admin/DropboxLinkManager';
import { format, parseISO, startOfWeek, endOfWeek, eachDayOfInterval, isWithinInterval, isSameDay, isToday } from 'date-fns';
import { getStatusBarColor, type EventStatus } from '@/components/calendar/EventStatusBadge';


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
    title: 'Event Calendar',
    description: 'View upcoming events synced from Triple Seat',
    icon: <Calendar className="w-6 h-6 text-[#c49a3c]" />,
    href: '/admin/calendar',
  },
  {
    title: 'Soleia Creative Guide',
    description: 'Technical specifications and venue display documentation',
    iconSrc: soleiaIcon,
    href: '/creative-guide',
  },
  {
    title: 'Delivery Guides',
    description: 'Session-based content delivery guides with asset upload links',
    icon: <Send className="w-6 h-6 text-[#c49a3c]" />,
    href: '/delivery-guide',
  },
  {
    title: 'Client Proposals',
    description: 'Create and manage interactive service agreements and quotes',
    icon: <FileText className="w-6 h-6 text-[#c49a3c]" />,
    href: '/admin/proposals',
  },
  {
    title: 'Creative Sessions',
    description: 'Internal creative sessions, mood boards, and team collaboration',
    iconSrc: soleiaIcon,
    href: '/admin/creative',
  },
  {
    title: 'Content Previz',
    description: 'Per-client video previews for content review and approval',
    icon: <Video className="w-6 h-6 text-[#c49a3c]" />,
    href: '/admin/looks',
  },
  {
    title: 'User Management',
    description: 'Approve or reject new user access requests',
    icon: <Users className="w-6 h-6 text-[#c49a3c]" />,
    href: '/admin/users',
  },
];
export default function AdminPortal() {
  const navigate = useNavigate();
  const { user, isAdmin, isLoading, signOut } = useAuth();
  const [pendingCount, setPendingCount] = useState(0);
  const [weekEvents, setWeekEvents] = useState<{ uid: string; summary: string; dtstart: string; dtend: string; location: string; status: string }[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [statusOverrides, setStatusOverrides] = useState<Record<string, EventStatus>>({});
  const [sidebarOpen, setSidebarOpen] = useState(false);

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

  // Fetch this week's calendar events
  useEffect(() => {
    if (!isLoading && isAdmin) {
      const fetchWeekEvents = async () => {
        setEventsLoading(true);
        try {
          const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
          const res = await fetch(`https://${projectId}.supabase.co/functions/v1/fetch-ical`, {
            headers: {
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
              'Content-Type': 'application/json',
            },
          });
          const data = await res.json();
          if (data.events) {
            const now = new Date();
            const weekStart = startOfWeek(now);
            const weekEnd = endOfWeek(now);
            const thisWeek = data.events.filter((e: any) => {
              try {
                const d = parseISO(e.dtstart);
                return isWithinInterval(d, { start: weekStart, end: weekEnd });
              } catch { return false; }
            }).sort((a: any, b: any) => new Date(a.dtstart).getTime() - new Date(b.dtstart).getTime());
            setWeekEvents(thisWeek);
          }
          // Fetch status overrides
          const { data: meta } = await supabase.from('calendar_event_metadata').select('event_uid, status_override');
          if (meta) {
            const map: Record<string, EventStatus> = {};
            meta.forEach((m) => { if (m.status_override) map[m.event_uid] = m.status_override as EventStatus; });
            setStatusOverrides(map);
          }
        } catch (e) {
          console.error('Failed to fetch week events:', e);
        }
        setEventsLoading(false);
      };
      fetchWeekEvents();
    }
  }, [isLoading, isAdmin]);

  const stripTripleseatPrefix = (summary: string): string => {
    return summary.replace(/^\[(D|T|P|C)\]\s*/i, '');
  };

  const detectStatusFromPrefix = (summary: string): EventStatus | null => {
    const match = summary.match(/^\[(D|T|P|C)\]/i);
    if (!match) return null;
    const code = match[1].toUpperCase();
    if (code === 'D') return 'definite';
    if (code === 'T') return 'tentative';
    if (code === 'P') return 'prospect';
    if (code === 'C') return 'cancelled';
    return null;
  };

  const getEventStatus = (event: { uid: string; status: string; summary?: string }): EventStatus => {
    if (statusOverrides[event.uid]) return statusOverrides[event.uid];
    if (event.summary) {
      const fromPrefix = detectStatusFromPrefix(event.summary);
      if (fromPrefix) return fromPrefix;
    }
    const s = event.status.toLowerCase();
    if (s.includes('confirm') || s.includes('definite')) return 'definite';
    if (s.includes('tentative')) return 'tentative';
    if (s.includes('cancel')) return 'cancelled';
    return 'prospect';
  };

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
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="text-zinc-400 hover:text-white hover:bg-zinc-800 min-h-[44px] min-w-[44px]"
              >
                {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
              <img 
                src={soleiaLogo} 
                alt="Soleia" 
                className="h-10 w-auto object-contain"
              />
            </div>
            
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

      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setSidebarOpen(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
        </div>
      )}

      {/* Sidebar Drawer */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-[260px] bg-zinc-950 border-r border-zinc-800 transition-transform duration-300 ease-in-out flex flex-col ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-4 py-4 border-b border-zinc-800">
          <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Platforms</span>
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)} className="text-zinc-500 hover:text-white hover:bg-zinc-800 h-8 w-8">
            <X className="w-4 h-4" />
          </Button>
        </div>
        <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5">
          {portals.map((portal) => (
            <button
              key={portal.title}
              onClick={() => { handlePortalClick(portal); setSidebarOpen(false); }}
              className="group w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-all duration-150 hover:bg-zinc-800/80"
            >
              <div className="w-8 h-8 rounded-md bg-white/5 border border-zinc-700/50 flex items-center justify-center flex-shrink-0 group-hover:bg-white/10 transition-colors overflow-hidden">
                {portal.iconSrc ? (
                  <img src={portal.iconSrc} alt={portal.title} className="w-5 h-5 object-contain" />
                ) : portal.icon ? (
                  <div className="scale-75">{portal.icon}</div>
                ) : null}
              </div>
              <span className="text-sm font-medium text-zinc-300 group-hover:text-white transition-colors flex items-center gap-1.5">
                {portal.title}
                {portal.external && <ExternalLink className="w-3 h-3 text-zinc-500" />}
                {portal.title === 'User Management' && pendingCount > 0 && (
                  <Badge className="bg-amber-500 text-black text-[9px] font-bold px-1 py-0 rounded-full leading-none">
                    {pendingCount}
                  </Badge>
                )}
              </span>
            </button>
          ))}
        </nav>
        <div className="border-t border-zinc-800 px-4 py-3">
          <p className="text-[10px] text-zinc-600 text-center">Soleia Creative Management</p>
        </div>
      </aside>

      {/* Main Content — Full Width */}
      <main className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#c49a3c]" />
            <h1 className="text-xl sm:text-2xl font-bold text-white">This Week</h1>
            <span className="text-sm text-zinc-500 hidden sm:inline">
              {format(startOfWeek(new Date()), 'MMM d')} – {format(endOfWeek(new Date()), 'MMM d')}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/admin/calendar')}
            className="text-[#c49a3c] hover:text-[#d4aa4c] hover:bg-zinc-800 gap-1"
          >
            View Calendar
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </div>

        {/* Weekly Calendar Strip */}
        <div className="grid grid-cols-7 gap-1.5 mb-4">
          {eachDayOfInterval({
            start: startOfWeek(new Date()),
            end: endOfWeek(new Date()),
          }).map((day) => {
            const dayEvents = weekEvents.filter((e) => isSameDay(parseISO(e.dtstart), day));
            const today = isToday(day);
            return (
              <button
                key={day.toISOString()}
                onClick={() => {
                  const firstEvent = dayEvents[0];
                  if (firstEvent) {
                    navigate(`/admin/calendar?event=${encodeURIComponent(firstEvent.uid)}`);
                  } else {
                    navigate('/admin/calendar');
                  }
                }}
                className={`flex flex-col items-center py-2 px-1 rounded-lg border transition-all hover:scale-[1.03] ${
                  today
                    ? 'bg-[#c49a3c]/15 border-[#c49a3c]/40'
                    : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-600'
                }`}
              >
                <span className={`text-[10px] font-semibold uppercase tracking-wider ${today ? 'text-[#c49a3c]' : 'text-zinc-500'}`}>
                  {format(day, 'EEE')}
                </span>
                <span className={`text-lg font-bold leading-tight ${today ? 'text-[#c49a3c]' : 'text-white'}`}>
                  {format(day, 'd')}
                </span>
                {dayEvents.length > 0 && (
                  <div className="flex gap-0.5 mt-1">
                    {dayEvents.slice(0, 3).map((ev) => {
                      const status = getEventStatus(ev);
                      return (
                        <div
                          key={ev.uid}
                          className="w-1.5 h-1.5 rounded-full"
                          style={{
                            backgroundColor:
                              status === 'definite' ? '#7b8a3e' :
                              status === 'prospect' ? '#c49a3c' :
                              status === 'tentative' ? '#5a8fb4' :
                              status === 'cancelled' ? '#b05a5a' : '#8a7d6b'
                          }}
                        />
                      );
                    })}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {eventsLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-zinc-500" />
          </div>
        ) : weekEvents.length === 0 ? (
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-6 text-center">
            <p className="text-zinc-500 text-sm">No events this week</p>
          </div>
        ) : (
          <div className="space-y-2">
            {weekEvents.map((event) => {
              const status = getEventStatus(event);
              const statusColors = getStatusBarColor(status);
              const eventDate = parseISO(event.dtstart);
              const today = isToday(eventDate);

              return (
                <button
                  key={event.uid}
                  onClick={() => navigate(`/admin/calendar?event=${encodeURIComponent(event.uid)}`)}
                  className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl border transition-all text-left hover:scale-[1.01] touch-manipulation ${
                    today
                      ? 'bg-[#c49a3c]/10 border-[#c49a3c]/30 hover:border-[#c49a3c]/50'
                      : 'bg-zinc-900/80 border-zinc-800 hover:border-zinc-600'
                  }`}
                >
                  <div className={`flex-shrink-0 w-12 h-12 rounded-lg flex flex-col items-center justify-center ${
                    today ? 'bg-[#c49a3c]/20' : 'bg-zinc-800'
                  }`}>
                    <span className={`text-[10px] font-semibold uppercase tracking-wider ${today ? 'text-[#c49a3c]' : 'text-zinc-500'}`}>
                      {format(eventDate, 'EEE')}
                    </span>
                    <span className={`text-lg font-bold leading-none ${today ? 'text-[#c49a3c]' : 'text-white'}`}>
                      {format(eventDate, 'd')}
                    </span>
                  </div>
                  <div className="w-1 h-10 rounded-full flex-shrink-0"
                    style={{
                      backgroundColor:
                        status === 'definite' ? '#7b8a3e' :
                        status === 'prospect' ? '#c49a3c' :
                        status === 'tentative' ? '#5a8fb4' :
                        status === 'cancelled' ? '#b05a5a' : '#8a7d6b'
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{stripTripleseatPrefix(event.summary)}</p>
                    {event.location && (
                      <p className="text-xs text-zinc-500 flex items-center gap-1 mt-0.5 truncate">
                        <MapPin className="w-3 h-3 flex-shrink-0" />
                        {event.location}
                      </p>
                    )}
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <span className="text-xs text-zinc-400">
                      {format(eventDate, 'h:mm a')}
                    </span>
                    {today && (
                      <Badge className="ml-2 bg-[#c49a3c] text-black text-[9px] font-bold px-1.5 py-0">
                        TODAY
                      </Badge>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Client Templates Section */}
        <div className="mt-10 space-y-6">
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
