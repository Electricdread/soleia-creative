import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Check, X, Users, ArrowLeft, RefreshCw, Shield, Clock, Mail } from 'lucide-react';
import { toast } from 'sonner';

interface PendingUser {
  user_id: string;
  email: string;
  created_at: string;
  has_admin_role: boolean;
}

export default function AdminUsers() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAdmin, isLoading: authLoading } = useAuth();
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingUser, setProcessingUser] = useState<string | null>(null);

  // Check for approval action from email link
  const actionUserId = searchParams.get('userId');
  const action = searchParams.get('action');

  useEffect(() => {
    if (!authLoading && isAdmin) {
      fetchPendingUsers();
      
      // If coming from email link, process the action
      if (actionUserId && action) {
        if (action === 'approve') {
          handleApprove(actionUserId);
        } else if (action === 'deny') {
          handleDeny(actionUserId);
        }
      }
    }
  }, [authLoading, isAdmin, actionUserId, action]);

  const fetchPendingUsers = async () => {
    try {
      setIsLoading(true);
      
      // Get all profiles (users who signed up)
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, email, created_at')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Get all admin roles
      const { data: adminRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'admin');

      if (rolesError) throw rolesError;

      const adminUserIds = new Set(adminRoles?.map(r => r.user_id) || []);

      // Combine data - show users without admin role as pending
      const usersWithStatus = (profiles || []).map(profile => ({
        user_id: profile.user_id,
        email: profile.email || 'Unknown',
        created_at: profile.created_at,
        has_admin_role: adminUserIds.has(profile.user_id)
      }));

      setPendingUsers(usersWithStatus);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to fetch users');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (userId: string) => {
    setProcessingUser(userId);
    try {
      const { error } = await supabase.functions.invoke('approve-user', {
        body: { userId, action: 'approve' }
      });

      if (error) throw error;

      toast.success('User approved successfully!');
      fetchPendingUsers();
    } catch (error) {
      console.error('Error approving user:', error);
      toast.error('Failed to approve user');
    } finally {
      setProcessingUser(null);
    }
  };

  const handleDeny = async (userId: string) => {
    setProcessingUser(userId);
    try {
      const { error } = await supabase.functions.invoke('approve-user', {
        body: { userId, action: 'deny' }
      });

      if (error) throw error;

      toast.success('User denied and removed');
      fetchPendingUsers();
    } catch (error) {
      console.error('Error denying user:', error);
      toast.error('Failed to deny user');
    } finally {
      setProcessingUser(null);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-foreground" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="bg-muted border-border max-w-md">
          <CardContent className="p-8 text-center">
            <Shield className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="font-display text-xl text-foreground mb-2">Access Denied</h2>
            <p className="text-muted-foreground">You need admin privileges to access this page.</p>
            <Button 
              onClick={() => navigate('/admin/login')} 
              className="mt-4"
              variant="outline"
            >
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const pendingCount = pendingUsers.filter(u => !u.has_admin_role).length;
  const approvedCount = pendingUsers.filter(u => u.has_admin_role).length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-zinc-900 to-black">
      {/* Grid pattern overlay */}
      <div 
        className="fixed inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.1) 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }}
      />

      <div className="relative z-10 container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/admin')}
              className="text-muted-foreground hover:text-foreground hover:bg-muted"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="font-display text-2xl text-foreground tracking-tight flex items-center gap-3">
                <Users className="w-6 h-6 text-muted-foreground" />
                User Management
              </h1>
              <p className="text-muted-foreground text-sm mt-1">Approve or deny access requests</p>
            </div>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={fetchPendingUsers}
            disabled={isLoading}
            className="border-border text-muted-foreground hover:bg-muted"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <Card className="bg-muted/50 border-border">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
                <Clock className="w-6 h-6 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{pendingCount}</p>
                <p className="text-sm text-muted-foreground">Pending Approval</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-muted/50 border-border">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                <Check className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{approvedCount}</p>
                <p className="text-sm text-muted-foreground">Approved Admins</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Users List */}
        <Card className="bg-muted/50 border-border">
          <CardHeader>
            <CardTitle className="text-foreground text-lg">Access Requests</CardTitle>
            <CardDescription>Users waiting for admin approval</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : pendingUsers.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Mail className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No users found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingUsers.map((user) => (
                  <div 
                    key={user.user_id}
                    className={`flex items-center justify-between p-4 rounded-xl border transition-colors ${
                      user.has_admin_role 
                        ? 'bg-green-500/5 border-green-500/20' 
                        : 'bg-muted/50 border-border/50 hover:bg-muted'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        user.has_admin_role ? 'bg-green-500/20' : 'bg-border'
                      }`}>
                        <span className="text-sm font-medium text-foreground">
                          {user.email.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="text-foreground font-medium">{user.email}</p>
                        <p className="text-xs text-muted-foreground">
                          Signed up {new Date(user.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {user.has_admin_role ? (
                        <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/30">
                          <Check className="w-3 h-3 mr-1" />
                          Approved
                        </Badge>
                      ) : (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeny(user.user_id)}
                            disabled={processingUser === user.user_id}
                            className="border-red-500/30 text-red-400 hover:bg-red-500/20 hover:text-red-300"
                          >
                            {processingUser === user.user_id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <>
                                <X className="w-4 h-4 mr-1" />
                                Deny
                              </>
                            )}
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleApprove(user.user_id)}
                            disabled={processingUser === user.user_id}
                            className="bg-green-600 hover:bg-green-700 text-foreground"
                          >
                            {processingUser === user.user_id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <>
                                <Check className="w-4 h-4 mr-1" />
                                Approve
                              </>
                            )}
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
