import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import solIcon from '@/assets/sol-icon.png';

/**
 * The Creative Guide's navigation, shared by every page in the guide.
 *
 * Services is the guide (owner, 2026-08-26). The older landing page it used to
 * sit beside — Venue, Layout, Branding, Specs and the 360° tour — is retired
 * with its route, and /creative-guide now lands on Services, so this holds the
 * one page a client is deciding on. Entries written as full paths
 * ("/creative-guide/services#where") work identically from any sub-page, with
 * ScrollToTop handling the scroll, should sections ever return here.
 *
 * Video Mapping stays out: Services already walks a client through mapping,
 * and a second route saying the same thing split the story. Its page and
 * route are intact.
 */
const NAV_LINKS: { label: string; to: string }[] = [
  { to: '/creative-guide/services', label: 'Services' },
];

export interface CreativeGuideHeaderProps {
  /** Transparent until scrolled — used by the landing page's full-bleed hero. */
  transparentAtTop?: boolean;
}

export function CreativeGuideHeader({ transparentAtTop = false }: CreativeGuideHeaderProps) {
  const navigate = useNavigate();
  const { pathname, hash } = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!transparentAtTop) return;
    const onScroll = () => setScrolled(window.scrollY > 30);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [transparentAtTop]);

  // Close the drawer whenever the route changes, so tapping a link never
  // leaves the overlay covering the page it navigated to.
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname, hash]);

  const solid = !transparentAtTop || scrolled;

  const go = (to: string) => {
    // Re-navigating to the same anchor still needs to scroll, so push the
    // location rather than short-circuiting on an identical path.
    navigate(to);
  };

  const isCurrent = (to: string) => !to.includes('#') && pathname === to;

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 flex items-center justify-between px-5 transition-all duration-300 sm:px-8 ${
          solid ? 'glass border-b border-primary/15 py-3' : 'border-b border-transparent py-5'
        }`}
      >
        <button onClick={() => go('/creative-guide/services')} className="flex items-center" aria-label="Creative Guide home">
          <img src={solIcon} alt="Soleia" className="h-9 w-auto object-contain sm:h-10" />
        </button>

        <nav className="hidden items-center gap-7 lg:flex">
          {NAV_LINKS.map((link) => (
            <button
              key={link.label}
              onClick={() => go(link.to)}
              aria-current={isCurrent(link.to) ? 'page' : undefined}
              className={`text-[11px] uppercase tracking-[0.16em] transition-colors hover:text-primary ${
                isCurrent(link.to) ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              {link.label}
            </button>
          ))}
        </nav>

        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={() => setMenuOpen(true)}
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </header>

      {menuOpen && (
        <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center gap-6 bg-background/97 backdrop-blur-sm lg:hidden">
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-5 top-5"
            onClick={() => setMenuOpen(false)}
            aria-label="Close menu"
          >
            <X className="h-7 w-7 text-primary" />
          </Button>
          {NAV_LINKS.map((link) => (
            <button
              key={link.label}
              onClick={() => go(link.to)}
              className={`font-display text-2xl ${isCurrent(link.to) ? 'text-primary' : 'text-foreground'}`}
            >
              {link.label}
            </button>
          ))}
        </div>
      )}
    </>
  );
}

export default CreativeGuideHeader;
