import showbloxLogo from '@/assets/showblox-logo.jpeg';

interface PoweredByShowBloxProps {
  className?: string;
}

export function PoweredByShowBlox({ className = '' }: PoweredByShowBloxProps) {
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
          src={showbloxLogo} 
          alt="ShowBlox" 
          className="h-5 w-auto object-contain rounded-sm dark:brightness-100 brightness-0"
        />
      </a>
    </div>
  );
}

export default PoweredByShowBlox;
