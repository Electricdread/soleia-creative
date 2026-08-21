import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

// Routes that present a fixed palette regardless of preference. Offering a
// toggle there would appear broken, since nothing on screen would change.
const FIXED_THEME_ROUTES = ['/creative-guide/services'];

// The admin shell carries its own toggle in the rail footer. Floating a second
// one over it put three theme switches on the dashboard at once.
const SHELL_ROUTES = ['/admin', '/office'];

export function FloatingThemeToggle() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  if (FIXED_THEME_ROUTES.includes(pathname)) return null;
  if (pathname === '/' || SHELL_ROUTES.some((r) => pathname.startsWith(r))) return null;

  const current = theme === 'system' ? resolvedTheme : theme;
  const isDark = current === 'dark';

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      className="no-print print:hidden fixed bottom-4 right-4 z-[100] h-11 w-11 rounded-full border border-border bg-background/85 backdrop-blur-md shadow-lg flex items-center justify-center text-primary hover:bg-primary/10 hover:scale-105 transition-all touch-manipulation"
    >
      {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
    </button>
  );
}
