import showbloxIcon from '@/assets/showblox-icon.png';

interface PoweredByShowBloxProps {
  className?: string;
  variant?: 'footer' | 'header';
}

export function PoweredByShowBlox({ className = '', variant = 'footer' }: PoweredByShowBloxProps) {
  if (variant === 'header') {
    return (
      <a 
        href="https://showblox.com" 
        target="_blank" 
        rel="noopener noreferrer"
        className={`flex items-center gap-1.5 opacity-70 hover:opacity-100 transition-opacity duration-300 ${className}`}
      >
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider hidden sm:inline">Powered by</span>
        <img 
          src={showbloxIcon} 
          alt="ShowBlox" 
          className="h-5 sm:h-6 w-auto object-contain dark:invert"
        />
      </a>
    );
  }

  return (
    <div className={`flex items-center justify-center gap-2 py-4 ${className}`}>
      <span className="text-xs text-muted-foreground/60 uppercase tracking-widest">Powered by</span>
      <a 
        href="https://showblox.com" 
        target="_blank" 
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 opacity-60 hover:opacity-100 transition-opacity duration-300"
      >
        <img 
          src={showbloxIcon} 
          alt="ShowBlox" 
          className="h-6 w-auto object-contain dark:invert"
        />
      </a>
    </div>
  );
}

export default PoweredByShowBlox;
