import { useNavigate } from 'react-router-dom';
import { Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface HomeButtonProps {
  /** "light" for light backgrounds, "dark" for dark backgrounds, "floating" for an absolute-positioned overlay. */
  variant?: 'light' | 'dark' | 'floating';
  className?: string;
  to?: string;
  label?: string;
}

/**
 * Site-wide "Return Home" button.
 *
 * Defaults to the public Creative Guide. Most of the pages this appears on are
 * client-facing token pages, and "/" is the admin portal behind a login — so
 * the default used to send clients to a sign-in screen.
 */
export function HomeButton({
  variant = 'light',
  className,
  to = '/creative-guide',
  label = 'Home',
}: HomeButtonProps) {
  const navigate = useNavigate();

  const base =
    'gap-2 touch-manipulation min-h-[44px] sm:min-h-0';

  const palette =
    variant === 'dark'
      ? 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
      : variant === 'floating'
        ? 'fixed top-4 left-4 z-50 backdrop-blur-md bg-black/30 hover:bg-black/50 text-white/80 hover:text-white border border-white/10'
        : 'text-muted-foreground hover:text-foreground';

  return (
    <Button
      variant={variant === 'floating' ? 'outline' : 'ghost'}
      size="sm"
      onClick={() => navigate(to)}
      className={cn(base, palette, className)}
      aria-label="Return home"
    >
      <Home className="w-4 h-4" />
      <span className="hidden sm:inline">{label}</span>
    </Button>
  );
}

export default HomeButton;
