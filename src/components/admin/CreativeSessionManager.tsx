import { useState, useEffect } from 'react';
import { useFocusRow } from '@/hooks/useFocusRow';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import { Plus, Users, Loader2 } from 'lucide-react';
import { CreativeSessionCard } from './CreativeSessionCard';
import { NewSessionForm } from './NewSessionForm';
import { getPublicOrigin } from '@/lib/ogShare';

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
  creative_notes?: string | null;
  technical_notes?: string | null;
  event_date?: string | null;
  show_previz?: boolean | null;
  brief_enabled?: boolean | null;
}

export function CreativeSessionManager() {
  const [sessions, setSessions] = useState<CreativeSession[]>([]);
  const [loading, setLoading] = useState(true);
  useFocusRow(!loading);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('creative_sessions')
      .select('*')
      .order('is_active', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Failed to load creative sessions');
      console.error(error);
    } else {
      const typedSessions = (data || []).map(session => ({
        ...session,
        cover_images: session.cover_images as unknown as CoverImage[] | null,
      })) as CreativeSession[];

      // A brief nobody has read outranks recency. Position is the strongest
      // signal on the page — a marked card still has to be found if it is
      // eleventh. One query for the whole list rather than one per card.
      const { data: unreadRows } = await supabase
        .from('creative_briefs')
        .select('creative_session_id')
        .not('submitted_at', 'is', null)
        .is('reviewed_at', null);
      const unread = new Set((unreadRows ?? []).map((r) => r.creative_session_id));

      // Order, strongest signal first:
      //   1. an unread brief — work waiting on someone here;
      //   2. a live link before a retired one;
      //   3. the show that is coming up, soonest first. A session with no date
      //      sits under those and above the ones already played, because an
      //      undated session might still be ahead of us and a past one is not.
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const day = (value: string | null | undefined) => {
        if (!value) return null;
        const t = new Date(`${value}T00:00:00`).getTime();
        return Number.isNaN(t) ? null : t;
      };
      const bucket = (session: CreativeSession) => {
        const at = day(session.event_date);
        if (at === null) return 1;               // undated
        return at >= today.getTime() ? 0 : 2;    // upcoming, then past
      };

      typedSessions.sort((a, b) => {
        const au = unread.has(a.id) ? 1 : 0;
        const bu = unread.has(b.id) ? 1 : 0;
        if (au !== bu) return bu - au;

        const aActive = a.is_active ? 1 : 0;
        const bActive = b.is_active ? 1 : 0;
        if (aActive !== bActive) return bActive - aActive;

        const ab = bucket(a); const bb = bucket(b);
        if (ab !== bb) return ab - bb;

        const ad = day(a.event_date); const bd = day(b.event_date);
        if (ad !== null && bd !== null && ad !== bd) {
          // Soonest first for what is ahead; most recent first for what is behind.
          return ab === 0 ? ad - bd : bd - ad;
        }
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });

      setSessions(typedSessions);
    }
    setLoading(false);
  };

  const copyLink = (token: string) => {
    const url = `${getPublicOrigin()}/creative/${token}`;
    navigator.clipboard.writeText(url);
    toast.success('Link copied to clipboard!');
  };

  const deleteSession = async (id: string) => {
    // 1. Get all mood board items with file URLs to clean up storage
    const { data: items } = await supabase
      .from('mood_board_items')
      .select('file_url, thumbnail_url')
      .eq('session_id', id);

    // 2. Collect storage paths to delete
    const filesToDelete: string[] = [];
    if (items) {
      for (const item of items) {
        for (const url of [item.file_url, item.thumbnail_url]) {
          if (url && url.includes('/creative-uploads/')) {
            const path = url.split('/creative-uploads/').pop();
            if (path) filesToDelete.push(decodeURIComponent(path));
          }
        }
      }
    }

    // 3. Delete files from storage bucket
    if (filesToDelete.length > 0) {
      const { error: storageError } = await supabase.storage
        .from('creative-uploads')
        .remove(filesToDelete);
      if (storageError) {
        console.error('Storage cleanup error:', storageError);
      }
    }

    // 4. Delete the session (cascades to mood_board_items, session_scenes)
    const { error } = await supabase
      .from('creative_sessions')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to delete session');
    } else {
      toast.success('Session deleted (files cleaned up)');
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
                <div key={session.id} data-focus-id={session.id}>
                <CreativeSessionCard
                  session={session}
                  index={index}
                  onCopyLink={copyLink}
                  onDelete={deleteSession}
                  onOpen={openSession}
                  onSessionUpdate={fetchSessions}
                />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
