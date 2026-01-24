import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/useAuth';
import { AuthModal } from './AuthModal';
import { User, LogOut, Shield, LogIn } from 'lucide-react';

export function UserMenu() {
  const { user, isAdmin, signOut, isLoading } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

  if (isLoading) {
    return (
      <Button variant="ghost" size="sm" disabled>
        <User className="h-4 w-4 animate-pulse" />
      </Button>
    );
  }

  if (!user) {
    return (
      <>
        <Button variant="outline" size="sm" onClick={() => setShowAuthModal(true)} className="gap-2">
          <LogIn className="h-4 w-4" />
          Sign In
        </Button>
        <AuthModal open={showAuthModal} onOpenChange={setShowAuthModal} />
      </>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          {isAdmin && <Shield className="h-4 w-4 text-primary" />}
          <User className="h-4 w-4" />
          <span className="hidden sm:inline max-w-[120px] truncate">
            {user.email?.split('@')[0]}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col">
            <span className="truncate">{user.email}</span>
            {isAdmin && (
              <span className="text-xs text-primary font-normal flex items-center gap-1 mt-1">
                <Shield className="h-3 w-3" />
                Admin
              </span>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={signOut} className="text-destructive focus:text-destructive">
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
