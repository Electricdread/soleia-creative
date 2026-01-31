import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { Plus, Zap, Layers } from 'lucide-react';
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
  circleback_url: string | null;
  circleback_summary: string | null;
  technical_notes: string | null;
  creative_notes: string | null;
  created_at: string;
  is_active: boolean;
  is_public?: boolean;
  cover_images?: CoverImage[] | null;
  cover_themes?: string[] | null;
  cover_generated_at?: string | null;
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
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-700/50 pb-5">
        <div>
          <h3 className="text-2xl font-tech font-bold uppercase tracking-wider text-white flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Zap className="h-5 w-5 text-white" />
            </div>
            Creative Sessions
          </h3>
          <p className="text-xs text-zinc-500 mt-1.5 font-tech uppercase tracking-widest">
            Internal Mood Boards • 21-Day Creative Collaboration
          </p>
        </div>
        {!showForm && (
          <Button 
            onClick={() => setShowForm(true)} 
            size="sm" 
            className="gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-400 hover:to-blue-500 font-tech uppercase tracking-wider shadow-lg shadow-cyan-500/20 h-10 touch-manipulation"
          >
            <Plus className="h-4 w-4" />
            New Session
          </Button>
        )}
      </div>

      {/* New Session Form - Always at top when visible */}
      {showForm && (
        <NewSessionForm
          onSessionCreated={handleSessionCreated}
          onCancel={() => setShowForm(false)}
        />
      )}

      {/* Sessions List */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-zinc-500">
          <Layers className="h-4 w-4" />
          <span className="text-xs font-tech uppercase tracking-widest">
            Existing Sessions ({sessions.length})
          </span>
        </div>
        
        <ScrollArea className="h-[500px] pr-2">
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-flex items-center gap-3 text-zinc-500">
                  <div className="w-5 h-5 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
                  <span className="font-tech uppercase tracking-wider">Loading Sessions...</span>
                </div>
              </div>
            ) : sessions.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-zinc-700 rounded-xl">
                <Zap className="h-10 w-10 text-zinc-600 mx-auto mb-3" />
                <p className="text-zinc-500 font-tech uppercase tracking-wider">No Sessions Created</p>
                <p className="text-xs text-zinc-600 mt-1 font-tech">Create your first creative session to get started</p>
              </div>
            ) : (
              sessions.map((session, index) => (
                <CreativeSessionCard
                  key={session.id}
                  session={session}
                  index={index}
                  onCopyLink={copyLink}
                  onDelete={deleteSession}
                  onOpen={openSession}
                  onSessionUpdate={fetchSessions}
                />
              ))
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
