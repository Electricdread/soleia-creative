import { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';
import { PendingApproval } from './PendingApproval';
import { AccessGranted } from './AccessGranted';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

const JUST_APPROVED_KEY = 'showblox_just_approved';

export function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const location = useLocation();
  const { user, isAdmin, isLoading } = useAuth();
  const [showAccessGranted, setShowAccessGranted] = useState(false);
  const [previouslyPending, setPreviouslyPending] = useState(false);

  // Track if user was previously pending (not admin)
  useEffect(() => {
    if (user && !isLoading) {
      const wasPending = sessionStorage.getItem(`pending_${user.id}`);
      
      if (!isAdmin && requireAdmin) {
        // User is pending - mark them
        sessionStorage.setItem(`pending_${user.id}`, 'true');
        setPreviouslyPending(true);
      } else if (isAdmin && wasPending) {
        // User was pending but now is admin - they just got approved!
        sessionStorage.removeItem(`pending_${user.id}`);
        setShowAccessGranted(true);
        
        // Auto-dismiss after 5 seconds
        const timer = setTimeout(() => {
          setShowAccessGranted(false);
        }, 5000);
        
        return () => clearTimeout(timer);
      }
    }
  }, [user, isAdmin, isLoading, requireAdmin]);

  // Show loading spinner while checking auth state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-white" />
      </div>
    );
  }

  // Not authenticated - redirect to login
  if (!user) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  // Show Access Granted celebration page
  if (showAccessGranted) {
    return <AccessGranted />;
  }

  // Authenticated but not admin when admin is required - show pending approval
  if (requireAdmin && !isAdmin) {
    return <PendingApproval />;
  }

  // Authenticated (and admin if required) - render children
  return <>{children}</>;
}
