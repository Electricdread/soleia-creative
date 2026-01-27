import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import showbloxIcon from '@/assets/showblox-icon.png';

interface PoweredByShowBloxProps {
  className?: string;
  variant?: 'footer' | 'header';
}

export function PoweredByShowBlox({ className = '', variant = 'footer' }: PoweredByShowBloxProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    if (mounted) {
      setTheme(theme === 'dark' ? 'light' : 'dark');
    }
  };

  if (variant === 'header') {
    return (
      <button
        onClick={toggleTheme}
        className={`flex items-center gap-1.5 opacity-70 hover:opacity-100 transition-opacity cursor-pointer group ${className}`}
        aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      >
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider hidden sm:inline group-hover:text-primary transition-colors">
          {mounted && theme === 'dark' ? 'Light mode' : 'Dark mode'}
        </span>
        <img 
          src={showbloxIcon} 
          alt="ShowBlox - Toggle Theme" 
          className="h-5 sm:h-6 w-auto object-contain dark:invert transition-transform group-hover:scale-110"
        />
      </button>
    );
  }

  return (
    <button
      onClick={toggleTheme}
      className={`flex items-center justify-center gap-2 py-4 cursor-pointer group hover:opacity-100 transition-opacity ${className}`}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      <span className="text-xs text-muted-foreground/60 uppercase tracking-widest group-hover:text-muted-foreground transition-colors">
        {mounted && theme === 'dark' ? 'Switch to Light' : 'Switch to Dark'}
      </span>
      <div className="flex items-center gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
        <img 
          src={showbloxIcon} 
          alt="ShowBlox - Toggle Theme" 
          className="h-6 w-auto object-contain dark:invert transition-transform group-hover:scale-110"
        />
      </div>
    </button>
  );
}

export default PoweredByShowBlox;
