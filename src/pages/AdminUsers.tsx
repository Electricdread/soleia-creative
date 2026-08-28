import { useState, useEffect } from 'react';
import { AdminShell } from '@/components/admin/AdminShell';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Check, X, Users, ArrowLeft, RefreshCw, Shield, Clock, Mail, UserRound } from 'lucide-react';
import { toast } from 'sonner';

/**
 * Somebody who has signed up, and what they may do.
 *
 * Two independent roles rather than one ladder: `admin` is the portal and every
 * has_role policy behind it, `pm` only means they can be put on a job and
 * mailed about it. Holding neither is what waiting to be let in looks like —
 * which is why a PM must not be read as a pending signup.
 */
interface PersonRow {
  user_id: string;
  email: string;
  created_at: string;
  has_admin_role: boolean;
  has_pm_role: boolean;
}

export default function AdminUsers() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAdmin, isLoading: authLoading } = useAuth();
  const [people, setPeople] = useState<PersonRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingUser, setProcessingUser] = useState<string | null>(null);

  // Check for approval action from email link
  const actionUserId = searchParams.get('userId');
  const action = searchParams.get('action');

  useEffect(() => {
    if (authLoading || !isAdmin) return;

    // The approval mail links straight here with an action already chosen. Deny
    // deletes the account, so the list is loaded first and the link is checked
    // against it: a link written before somebody was made a PM must not still
    // delete them months later.
    (async () => {
      const rows = await fetchPeople();
      if (!actionUserId || !action) return;

      if (action === 'approve') {
        handleApprove(actionUserId);
        return;
      }
      if (action !== 'deny') return;

      const target = rows.find((r) => r.user_id === actionUserId);
      if (target?.has_admin_role || target?.has_pm_role) {
        toast.error(
          `${target.email} holds a role and was not removed. Take the role away first if you really mean to delete the account.`,
        );
        return;
      }
      handleDeny(actionUserId);
    })();
  }, [authLoading, isAdmin, actionUserId, action]);

  const fetchPeople = async (): Promise<PersonRow[]> => {
    try {
      setIsLoading(true);
      
      // Get all profiles (users who signed up)
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, email, created_at')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Both roles in one read. Telling a PM from a pending signup is the
      // difference between a badge and a button that deletes the account.
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .in('role', ['admin', 'pm']);

      if (rolesError) throw rolesError;

      const withRole = (name: string) =>
        new Set((roles ?? []).filter(r => r.role === name).map(r => r.user_id));
      const adminUserIds = withRole('admin');
      const pmUserIds = withRole('pm');

      const rows: PersonRow[] = (profiles || []).map(profile => ({
        user_id: profile.user_id,
        email: profile.email || 'Unknown',
        created_at: profile.created_at,
        has_admin_role: adminUserIds.has(profile.user_id),
        has_pm_role: pmUserIds.has(profile.user_id),
      }));

      setPeople(rows);
      return rows;
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to fetch users');
      return [];
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
      fetchPeople();
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
      fetchPeople();
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

  const pendingCount = people.filter(u => !u.has_admin_role && !u.has_pm_role).length;
  const pmCount = people.filter(u => u.has_pm_role && !u.has_admin_role).length;
  const adminCount = people.filter(u => u.has_admin_role).length;

  return (
    <AdminShell
      title="People"
      subtitle="Who has access, and who is asking for it"
      actions={
        <Button variant="outline" size="sm" onClick={fetchPeople} disabled={isLoading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      }
    >
      <div className="mx-auto max-w-4xl">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
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
              <div className="w-12 h-12 rounded-xl bg-sky-500/20 flex items-center justify-center">
                <UserRound className="w-6 h-6 text-sky-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{pmCount}</p>
                <p className="text-sm text-muted-foreground">PMs</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-muted/50 border-border">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                <Check className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{adminCount}</p>
                <p className="text-sm text-muted-foreground">Admins</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Users List */}
        <Card className="bg-muted/50 border-border">
          <CardHeader>
            <CardTitle className="text-foreground text-lg">People</CardTitle>
            <CardDescription>
              Everyone who has signed up. PMs can be assigned to jobs and mailed about
              them without holding admin access.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : people.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Mail className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No users found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {people.map((user) => {
                  // An admin who is also a PM reads as an admin: it is the wider
                  // of the two, and the row has room for one answer.
                  const isPm = user.has_pm_role && !user.has_admin_role;
                  const isWaiting = !user.has_admin_role && !user.has_pm_role;

                  return (
                  <div 
                    key={user.user_id}
                    className={`flex items-center justify-between p-4 rounded-xl border transition-colors ${
                      user.has_admin_role 
                        ? 'bg-green-500/5 border-green-500/20' 
                        : isPm
                          ? 'bg-sky-500/5 border-sky-500/20'
                          : 'bg-muted/50 border-border/50 hover:bg-muted'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        user.has_admin_role ? 'bg-green-500/20' : isPm ? 'bg-sky-500/20' : 'bg-border'
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
                      {user.has_admin_role && (
                        <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/30">
                          <Check className="w-3 h-3 mr-1" />
                          Admin
                        </Badge>
                      )}

                      {/* A PM is already on the team, so there is nothing here to
                          approve and nothing to deny. Making one an admin is a
                          deliberate promotion, not the disposal of a request. */}
                      {isPm && (
                        <>
                          <Badge variant="outline" className="bg-sky-500/10 text-sky-400 border-sky-500/30">
                            <UserRound className="w-3 h-3 mr-1" />
                            PM
                          </Badge>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleApprove(user.user_id)}
                            disabled={processingUser === user.user_id}
                            title="Give this PM admin access as well"
                          >
                            {processingUser === user.user_id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <>
                                <Shield className="w-4 h-4 mr-1" />
                                Make admin
                              </>
                            )}
                          </Button>
                        </>
                      )}

                      {isWaiting && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeny(user.user_id)}
                            disabled={processingUser === user.user_id}
                            title="Delete this account. It cannot be undone."
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
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  );
}
