import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import { Plus, Users, Loader2 } from 'lucide-react';
import { CreativeSessionCard } from './CreativeSessionCard';
import { NewSessionForm } from './NewSessionForm';

interface CoverImage {
  url: string;
  theme: string;
  prompt: string;
}

interface CreativeSession {
  id: string;
  token: string;
  project_name: string;
  client_name: string;
  created_at: string;
  is_active: boolean;
  is_public?: boolean;
  cover_images?: CoverImage[] | null;
}

export function CreativeSessionManager() {
  const [sessions, setSessions] = useState<CreativeSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('creative_sessions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Failed to load creative sessions');
      console.error(error);
    } else {
      const typedSessions = (data || []).map(session => ({
        ...session,
        cover_images: session.cover_images as unknown as CoverImage[] | null,
      })) as CreativeSession[];
      setSessions(typedSessions);
    }
    setLoading(false);
  };

  const copyLink = (token: string) => {
    const url = `${window.location.origin}/creative/${token}`;
    navigator.clipboard.writeText(url);
    toast.success('Link copied to clipboard!');
  };

  const deleteSession = async (id: string) => {
    const { error } = await supabase
      .from('creative_sessions')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to delete session');
    } else {
      toast.success('Session deleted');
      fetchSessions();
    }
  };

  const openSession = (token: string) => {
    window.open(`/creative/${token}`, '_blank');
  };

  const handleSessionCreated = () => {
    setShowForm(false);
    fetchSessions();
  };

  return (
    <div className="space-y-6">
      {/* Create form or button */}
      {showForm ? (
        <NewSessionForm
          onSessionCreated={handleSessionCreated}
          onCancel={() => setShowForm(false)}
        />
      ) : (
        <Card className="border-primary/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Plus className="w-5 h-5 text-primary" />
                  Create Creative Session
                </CardTitle>
                <CardDescription>
                  Generate a mood board workspace for client collaboration
                </CardDescription>
              </div>
              <Button onClick={() => setShowForm(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                New Session
              </Button>
            </div>
          </CardHeader>
        </Card>
      )}

      {/* Existing Sessions */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="w-5 h-5 text-primary" />
            Active Sessions
          </CardTitle>
          <CardDescription>
            Manage your creative collaboration sessions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No active sessions. Create one above to get started.
            </div>
          ) : (
            <div className="space-y-3">
              {sessions.map((session, index) => (
                <CreativeSessionCard
                  key={session.id}
                  session={session}
                  index={index}
                  onCopyLink={copyLink}
                  onDelete={deleteSession}
                  onOpen={openSession}
                  onSessionUpdate={fetchSessions}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
