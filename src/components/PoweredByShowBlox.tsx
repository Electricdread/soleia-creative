import showbloxIcon from '@/assets/showblox-icon.png';

interface PoweredByShowBloxProps {
  className?: string;
  variant?: 'footer' | 'header';
}

export function PoweredByShowBlox({ className = '', variant = 'footer' }: PoweredByShowBloxProps) {
  if (variant === 'header') {
    return (
      <div className={`flex items-center gap-1.5 opacity-70 ${className}`}>
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider hidden sm:inline">Powered by</span>
        <img 
          src={showbloxIcon} 
          alt="ShowBlox" 
          className="h-5 sm:h-6 w-auto object-contain dark:invert"
        />
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-center gap-2 py-4 ${className}`}>
      <span className="text-xs text-muted-foreground/60 uppercase tracking-widest">Powered by</span>
      <div className="flex items-center gap-1.5 opacity-60">
        <img 
          src={showbloxIcon} 
          alt="ShowBlox" 
          className="h-6 w-auto object-contain dark:invert"
        />
      </div>
    </div>
  );
}

export default PoweredByShowBlox;
