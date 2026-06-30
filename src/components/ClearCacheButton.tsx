import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, Trash2 } from 'lucide-react';
import { clearAppCache } from '@/lib/clearAppCache';

interface ClearCacheButtonProps {
  variant?: 'default' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'default' | 'icon';
  label?: string;
  className?: string;
  onClear?: () => void;
}

export default function ClearCacheButton({
  variant = 'outline',
  size = 'sm',
  label = 'Clear cache & reload',
  className,
  onClear,
}: ClearCacheButtonProps) {
  const [clearing, setClearing] = useState(false);

  const handleClick = async () => {
    setClearing(true);
    try {
      await clearAppCache();
      onClear?.();
    } catch (e) {
      console.error('Cache clear failed', e);
    } finally {
      // Always reload so the user gets a fresh page even if cleanup partially fails
      window.location.reload();
    }
  };

  return (
    <Button
      variant={variant}
      size={size === 'icon' ? 'icon' : size}
      onClick={handleClick}
      disabled={clearing}
      className={className}
    >
      {clearing ? (
        <RefreshCw className="w-4 h-4 animate-spin" />
      ) : size === 'icon' ? (
        <Trash2 className="w-4 h-4" />
      ) : (
        <>
          <Trash2 className="w-4 h-4" />
          <span>{label}</span>
        </>
      )}
    </Button>
  );
}
