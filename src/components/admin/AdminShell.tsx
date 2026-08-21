import { useEffect, useState, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from 'next-themes';
import {
  Calendar, FileText, BookOpen, Palette, Map, Send,
  HardDrive, Users, Mail, LayoutDashboard, Command, LogOut, Menu, X,
  Sun, Moon, PanelLeftClose, PanelLeft, ExternalLink, Search,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { CommandPalette } from '@/components/admin/CommandPalette';
import { cn } from '@/lib/utils';
import soleiaLogo from '@/assets/soleia-wide-logo.png';
import soleiaIcon from '@/assets/sol-icon.png';

const OPERATOR_EMAIL = 'luisdreams@me.com';
const COLLAPSE_KEY = 'soleia.rail.collapsed';

interface NavItem {
  label: string;
  href: string;
  icon: typeof Calendar;
  /** Leaves the admin area — shown with an outbound marker. */
  external?: boolean;
  /** Only rendered for the studio operator. */
  operatorOnly?: boolean;
  /** Renders the pending-access count when there is one. */
  badge?: 'pendingUsers';
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

/**
 * Grouped by when you reach for it, not by which table it reads.
 *
 * Every label here is the same word used in the page title and the URL. The
 * admin used to call one thing three names — "Pre-Call Packets" in the menu,
 * "Creative Packets" as the title, /admin/packets in the bar.
 */
const NAV: NavGroup[] = [
  {
    label: 'Today',
    items: [
      { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
      { label: 'Calendar', href: '/admin/calendar', icon: Calendar },
    ],
  },
  {
    label: 'Client work',
    items: [
      { label: 'Packets', href: '/admin/packets', icon: BookOpen },
      { label: 'Proposals', href: '/admin/proposals', icon: FileText },
      { label: 'Creative sessions', href: '/admin/creative', icon: Palette },
    ],
  },
  {
    // The Look Book and the previz movie uploader sit with the parked previz
    // work, so they are out of the navigation. Their routes still resolve for
    // anyone holding a link.
    label: 'Reference',
    items: [
      { label: 'Creative Guide', href: '/creative-guide', icon: Map, external: true },
      { label: 'Delivery guide', href: '/creative-guide/content-delivery', icon: Send, external: true },
    ],
  },
  {
    label: 'Studio',
    items: [
      { label: 'Storage', href: '/admin/storage', icon: HardDrive },
      { label: 'People', href: '/admin/users', icon: Users, badge: 'pendingUsers' },
      { label: 'Email previews', href: '/admin/email-previews', icon: Mail },
      { label: 'Operator Console', href: '/office', icon: Command, operatorOnly: true },
    ],
  },
];

export interface AdminShellProps {
  /** Page name, shown in the top bar and used as the document title. */
  title: string;
  /** Optional one-line context under the title. */
  subtitle?: string;
  /** Page-specific controls, rendered on the right of the top bar. */
  actions?: ReactNode;
  /** Opt out of the centred content column for pages that manage their own width. */
  fullBleed?: boolean;
  children: ReactNode;
}

/**
 * The frame every admin page sits in.
 *
 * Before this each page built its own header with its own back button, its own
 * logo placement and its own max width — seven different widths across ten
 * pages, and five different words for "return to the dashboard". The rail is
 * the back button now, so no page is a dead end.
 */
export function AdminShell({ title, subtitle, actions, fullBleed, children }: AdminShellProps) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { user, signOut } = useAuth();
  const { theme, resolvedTheme, setTheme } = useTheme();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(COLLAPSE_KEY) === '1';
    } catch {
      return false;
    }
  });
  const [pendingUsers, setPendingUsers] = useState(0);
  const [paletteOpen, setPaletteOpen] = useState(false);

  const isOperator = user?.email?.toLowerCase() === OPERATOR_EMAIL.toLowerCase();
  const isDark = (theme === 'system' ? resolvedTheme : theme) === 'dark';

  useEffect(() => {
    document.title = `${title} · Soleia`;
  }, [title]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Close the drawer on navigation, so tapping a link never leaves the overlay
  // covering the page it just opened.
  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  useEffect(() => {
    try {
      localStorage.setItem(COLLAPSE_KEY, collapsed ? '1' : '0');
    } catch {
      /* private mode — the rail just opens expanded next time */
    }
  }, [collapsed]);

  // Signing up creates a profile; approval grants the admin role. Anyone
  // without it is still waiting.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [{ data: profiles }, { data: admins }] = await Promise.all([
          supabase.from('profiles').select('user_id'),
          supabase.from('user_roles').select('user_id').eq('role', 'admin'),
        ]);
        if (cancelled) return;
        const approved = new Set((admins ?? []).map((r) => r.user_id));
        setPendingUsers((profiles ?? []).filter((p) => !approved.has(p.user_id)).length);
      } catch (e) {
        console.error('AdminShell pending-user count failed', e);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const isCurrent = (item: NavItem) =>
    item.href === '/admin' ? pathname === '/admin' || pathname === '/' : pathname.startsWith(item.href);

  const handleSignOut = async () => {
    await signOut();
    navigate('/admin/login');
  };

  const railWidth = collapsed ? 'lg:w-[64px]' : 'lg:w-[212px]';

  const rail = (
    <div className="flex h-full flex-col bg-card">
      <div className={cn('flex items-center gap-2 border-b border-border px-3 py-3', collapsed && 'lg:justify-center lg:px-0')}>
        <button
          onClick={() => navigate('/admin')}
          className="flex min-w-0 items-center gap-2 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Soleia dashboard"
        >
          {/* The wide logo carries its own sun, so the icon only stands in when
              the rail is collapsed and there is no room for the wordmark. */}
          <img src={soleiaIcon} alt="Soleia" className={cn('hidden h-7 w-7 flex-shrink-0 object-contain', collapsed && 'lg:block')} />
          <img src={soleiaLogo} alt="Soleia" className={cn('h-7 w-auto object-contain', collapsed && 'lg:hidden')} />
        </button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setDrawerOpen(false)}
          className="ml-auto h-9 w-9 text-muted-foreground lg:hidden"
          aria-label="Close menu"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <nav className="flex-1 space-y-4 overflow-y-auto px-2 py-3" aria-label="Admin sections">
        {NAV.map((group) => {
          const items = group.items.filter((i) => !i.operatorOnly || isOperator);
          if (items.length === 0) return null;
          return (
            <div key={group.label}>
              <p className={cn(
                'px-2 pb-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground/70',
                collapsed && 'lg:sr-only',
              )}>
                {group.label}
              </p>
              <ul className="space-y-0.5">
                {items.map((item) => {
                  const Icon = item.icon;
                  const current = isCurrent(item);
                  const count = item.badge === 'pendingUsers' ? pendingUsers : 0;
                  return (
                    <li key={item.href}>
                      <button
                        onClick={() => navigate(item.href)}
                        aria-current={current ? 'page' : undefined}
                        title={collapsed ? item.label : undefined}
                        className={cn(
                          'group flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-left text-sm transition-colors',
                          'min-h-[40px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                          current
                            ? 'bg-primary/10 font-semibold text-primary'
                            : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                          collapsed && 'lg:justify-center lg:px-0',
                        )}
                      >
                        <Icon className={cn('h-4 w-4 flex-shrink-0', current ? 'text-primary' : 'text-muted-foreground')} />
                        <span className={cn('min-w-0 flex-1 truncate', collapsed && 'lg:hidden')}>{item.label}</span>
                        {item.external && (
                          <ExternalLink className={cn('h-3 w-3 flex-shrink-0 text-muted-foreground/50', collapsed && 'lg:hidden')} />
                        )}
                        {count > 0 && (
                          <span className={cn(
                            'flex-shrink-0 rounded-full bg-primary px-1.5 text-[10px] font-bold leading-4 text-primary-foreground',
                            collapsed && 'lg:hidden',
                          )}>
                            {count}
                          </span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>

      <div className="border-t border-border px-2 py-2">
        <div className={cn('flex items-center gap-1', collapsed && 'lg:flex-col')}>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            className="h-9 w-9 flex-shrink-0 text-muted-foreground hover:text-foreground"
            aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSignOut}
            className="h-9 w-9 flex-shrink-0 text-muted-foreground hover:text-foreground"
            aria-label="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed((c) => !c)}
            className="ml-auto hidden h-9 w-9 flex-shrink-0 text-muted-foreground hover:text-foreground lg:inline-flex"
            aria-label={collapsed ? 'Expand navigation' : 'Collapse navigation'}
          >
            {collapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </Button>
        </div>
        <p className={cn('truncate px-2 pb-1 pt-1 text-[11px] text-muted-foreground/70', collapsed && 'lg:hidden')}>
          {user?.email}
        </p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
      {/* Rail — fixed on desktop, drawer on small screens */}
      <aside className={cn('fixed inset-y-0 left-0 z-40 hidden border-r border-border lg:block', railWidth)}>
        {rail}
      </aside>

      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-background/70 backdrop-blur-sm"
            onClick={() => setDrawerOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute inset-y-0 left-0 w-[248px] border-r border-border shadow-xl">{rail}</div>
        </div>
      )}

      <div className={cn('flex min-h-screen flex-col', collapsed ? 'lg:pl-[64px]' : 'lg:pl-[212px]')}>
        <header className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
          <div className="flex min-h-[56px] items-center gap-3 px-3 py-2 sm:px-6">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setDrawerOpen(true)}
              className="h-10 w-10 flex-shrink-0 text-muted-foreground lg:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="min-w-0 flex-1">
              <h1 className="truncate font-display text-lg text-foreground sm:text-xl">{title}</h1>
              {subtitle && <p className="truncate text-xs text-muted-foreground">{subtitle}</p>}
            </div>

            <button
              onClick={() => setPaletteOpen(true)}
              className="hidden min-w-[210px] items-center gap-2 rounded-md border border-border bg-background px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:border-muted-foreground/40 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:flex"
            >
              <Search className="h-3.5 w-3.5" />
              <span className="flex-1 text-left">Search jobs, clients, events</span>
              <kbd className="rounded border border-border px-1 font-mono text-[10px]">⌘K</kbd>
            </button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setPaletteOpen(true)}
              className="h-10 w-10 flex-shrink-0 text-muted-foreground md:hidden"
              aria-label="Search"
            >
              <Search className="h-5 w-5" />
            </Button>

            {actions && <div className="flex flex-shrink-0 flex-wrap items-center justify-end gap-2">{actions}</div>}
          </div>
        </header>

        <main className="flex-1">
          {fullBleed ? children : (
            <div className="mx-auto w-full max-w-[1280px] px-4 py-6 sm:px-6 lg:px-8 sm:py-8">{children}</div>
          )}
        </main>

        <footer className="border-t border-border">
          <div className="mx-auto w-full max-w-[1280px] px-4 py-4 sm:px-6 lg:px-8">
            <p className="text-center text-xs text-muted-foreground/60">
              © {new Date().getFullYear()} Soleia Creative Management System
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default AdminShell;
