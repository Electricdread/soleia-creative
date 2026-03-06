import { useState, useEffect, useCallback } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';
import { PendingApproval } from './PendingApproval';
import { AccessGranted } from './AccessGranted';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const location = useLocation();
  const { user, isAdmin, isLoading, refreshAuth } = useAuth();
  const [showAccessGranted, setShowAccessGranted] = useState(false);
  const [wasMarkedPending, setWasMarkedPending] = useState(false);

  // Check if user was approved (transitioned from pending to admin)
  useEffect(() => {
    if (user && !isLoading) {
      const pendingKey = `soleia_pending_${user.id}`;
      const wasPending = localStorage.getItem(pendingKey) === 'true';
      
      if (!isAdmin && requireAdmin) {
        // User is pending - mark them in localStorage
        localStorage.setItem(pendingKey, 'true');
        setWasMarkedPending(true);
      } else if (isAdmin && wasPending) {
        // User was pending but now is admin - they just got approved!
        localStorage.removeItem(pendingKey);
        setShowAccessGranted(true);
      }
    }
  }, [user, isAdmin, isLoading, requireAdmin]);

  // Poll for approval status when user is pending
  useEffect(() => {
    if (!user || isLoading || isAdmin || !requireAdmin || !wasMarkedPending) return;
    
    // Poll every 5 seconds to check if user was approved
    const pollInterval = setInterval(() => {
      refreshAuth?.();
    }, 5000);
    
    return () => clearInterval(pollInterval);
  }, [user, isLoading, isAdmin, requireAdmin, wasMarkedPending, refreshAuth]);

  // Show loading spinner while checking auth state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-white" />
      </div>
    );
  }

  // Not authenticated - redirect to login and preserve destination in both state + query param
  if (!user) {
    const destination = `${location.pathname}${location.search}`;
    return (
      <Navigate
        to={`/admin/login?redirect=${encodeURIComponent(destination)}`}
        state={{ from: location }}
        replace
      />
    );
  }

  // Show Access Granted celebration page
  if (showAccessGranted) {
    return <AccessGranted onEnterPortal={() => setShowAccessGranted(false)} />;
  }

  // Authenticated but not admin when admin is required - show pending approval
  if (requireAdmin && !isAdmin) {
    return <PendingApproval />;
  }

  // Authenticated (and admin if required) - render children
  return <>{children}</>;
}
