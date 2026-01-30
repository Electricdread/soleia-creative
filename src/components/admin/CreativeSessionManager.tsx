import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { Plus, Zap } from 'lucide-react';
import { CreativeSessionCard } from './CreativeSessionCard';

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
  cover_images?: CoverImage[] | null;
  cover_themes?: string[] | null;
  cover_generated_at?: string | null;
}

export function CreativeSessionManager() {
  const [sessions, setSessions] = useState<CreativeSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  
  // Form state
  const [projectName, setProjectName] = useState('');
  const [clientName, setClientName] = useState('');
  const [circlebackUrl, setCirclebackUrl] = useState('');
  const [circlebackSummary, setCirclebackSummary] = useState('');
  const [technicalNotes, setTechnicalNotes] = useState('');
  const [creativeNotes, setCreativeNotes] = useState('');

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
      // Cast the JSON fields properly
      const typedSessions = (data || []).map(session => ({
        ...session,
        cover_images: session.cover_images as unknown as CoverImage[] | null,
      })) as CreativeSession[];
      setSessions(typedSessions);
    }
    setLoading(false);
  };

  const generateToken = () => {
    return `creative-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 8)}`;
  };

  const createSession = async () => {
    if (!projectName.trim() || !clientName.trim()) {
      toast.error('Project name and client name are required');
      return;
    }

    setCreating(true);
    const token = generateToken();

    const { error } = await supabase.from('creative_sessions').insert({
      token,
      project_name: projectName.trim(),
      client_name: clientName.trim(),
      circleback_url: circlebackUrl.trim() || null,
      circleback_summary: circlebackSummary.trim() || null,
      technical_notes: technicalNotes.trim() || null,
      creative_notes: creativeNotes.trim() || null,
    });

    if (error) {
      toast.error('Failed to create session');
      console.error(error);
    } else {
      toast.success('Creative session created!');
      resetForm();
      fetchSessions();
    }
    setCreating(false);
  };

  const resetForm = () => {
    setProjectName('');
    setClientName('');
    setCirclebackUrl('');
    setCirclebackSummary('');
    setTechnicalNotes('');
    setCreativeNotes('');
    setShowForm(false);
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

  return (
    <div className="space-y-6">
      {/* Header - ShowBLOX Style */}
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
        <Button 
          onClick={() => setShowForm(!showForm)} 
          size="sm" 
          className="gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-400 hover:to-blue-500 font-tech uppercase tracking-wider shadow-lg shadow-cyan-500/20 h-10 touch-manipulation"
        >
          <Plus className="h-4 w-4" />
          New Session
        </Button>
      </div>

      {/* Create Form - ShowBLOX Style */}
      {showForm && (
        <Card className="border-cyan-500/30 bg-zinc-900/90 shadow-xl shadow-cyan-500/5">
          <CardHeader className="pb-4 border-b border-zinc-700/50">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded bg-cyan-500/20 flex items-center justify-center">
                <Plus className="h-4 w-4 text-cyan-400" />
              </div>
              <div>
                <CardTitle className="text-lg font-tech font-bold uppercase tracking-wider text-white">Create Session</CardTitle>
                <CardDescription className="text-zinc-500 text-xs font-tech tracking-widest uppercase">Configure New Creative Workspace</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-5 pt-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="projectName" className="text-xs font-tech uppercase tracking-widest text-cyan-400">Project Name *</Label>
                <Input
                  id="projectName"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="e.g., Soleia Grand Opening"
                  className="bg-black/50 border-zinc-700 text-white placeholder:text-zinc-600 focus:border-cyan-500 focus:ring-cyan-500/20 font-tech h-12"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="clientName" className="text-xs font-tech uppercase tracking-widest text-purple-400">Client Name *</Label>
                <Input
                  id="clientName"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="e.g., Acme Corp"
                  className="bg-black/50 border-zinc-700 text-white placeholder:text-zinc-600 focus:border-purple-500 focus:ring-purple-500/20 font-tech h-12"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="circlebackUrl" className="text-xs font-tech uppercase tracking-widest text-emerald-400">Circleback Call URL</Label>
              <Input
                id="circlebackUrl"
                value={circlebackUrl}
                onChange={(e) => setCirclebackUrl(e.target.value)}
                placeholder="https://app.circleback.ai/view/..."
                className="bg-black/50 border-zinc-700 text-white placeholder:text-zinc-600 focus:border-emerald-500 focus:ring-emerald-500/20 font-tech text-sm h-12"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="circlebackSummary" className="text-xs font-tech uppercase tracking-widest text-amber-400">Call Transcript / Summary</Label>
              <Textarea
                id="circlebackSummary"
                value={circlebackSummary}
                onChange={(e) => setCirclebackSummary(e.target.value)}
                placeholder="Paste the call transcript or AI summary. Key points will be auto-highlighted..."
                rows={4}
                className="bg-black/50 border-zinc-700 text-white placeholder:text-zinc-600 focus:border-amber-500 focus:ring-amber-500/20 font-tech"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="technicalNotes" className="text-xs font-tech uppercase tracking-widest text-blue-400 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  Technical Notes
                </Label>
                <Textarea
                  id="technicalNotes"
                  value={technicalNotes}
                  onChange={(e) => setTechnicalNotes(e.target.value)}
                  placeholder="Resolution requirements, file formats, deadlines..."
                  rows={3}
                  className="bg-blue-950/20 border-blue-500/30 text-white placeholder:text-zinc-600 focus:border-blue-500 focus:ring-blue-500/20 font-tech"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="creativeNotes" className="text-xs font-tech uppercase tracking-widest text-pink-400 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-pink-500" />
                  Creative Notes
                </Label>
                <Textarea
                  id="creativeNotes"
                  value={creativeNotes}
                  onChange={(e) => setCreativeNotes(e.target.value)}
                  placeholder="Brand colors, mood, style direction..."
                  rows={3}
                  className="bg-pink-950/20 border-pink-500/30 text-white placeholder:text-zinc-600 focus:border-pink-500 focus:ring-pink-500/20 font-tech"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-3 border-t border-zinc-700/50">
              <Button 
                onClick={createSession} 
                disabled={creating}
                className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-400 hover:to-blue-500 font-tech uppercase tracking-wider h-11 touch-manipulation"
              >
                {creating ? 'Creating...' : 'Create Session'}
              </Button>
              <Button 
                variant="outline" 
                onClick={resetForm}
                className="border-zinc-600 text-zinc-400 hover:bg-zinc-800 hover:text-white font-tech uppercase tracking-wider h-11 touch-manipulation"
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sessions List */}
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
  );
}
