import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { Copy, Trash2, ExternalLink, Plus, Palette, Calendar, Users } from 'lucide-react';
import { format } from 'date-fns';

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
      setSessions(data || []);
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2 text-white">
            <Palette className="h-5 w-5 text-zinc-400" />
            Creative Sessions
          </h3>
          <p className="text-sm text-zinc-400">
            Internal mood boards for creative collaboration
          </p>
        </div>
        <Button 
          onClick={() => setShowForm(!showForm)} 
          size="sm" 
          className="gap-2 bg-white text-black hover:bg-zinc-200"
        >
          <Plus className="h-4 w-4" />
          New Session
        </Button>
      </div>

      {/* Create Form */}
      {showForm && (
        <Card className="border-zinc-700 bg-zinc-800/50">
          <CardHeader className="pb-4">
            <CardTitle className="text-base text-white">Create Creative Session</CardTitle>
            <CardDescription className="text-zinc-400">Set up a new internal mood board with call notes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="projectName" className="text-zinc-300">Project Name *</Label>
                <Input
                  id="projectName"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="e.g., Soleia Grand Opening"
                  className="bg-black/50 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-white focus:ring-white/20"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="clientName" className="text-zinc-300">Client Name *</Label>
                <Input
                  id="clientName"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="e.g., Acme Corp"
                  className="bg-black/50 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-white focus:ring-white/20"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="circlebackUrl" className="text-zinc-300">Circleback Call URL</Label>
              <Input
                id="circlebackUrl"
                value={circlebackUrl}
                onChange={(e) => setCirclebackUrl(e.target.value)}
                placeholder="https://app.circleback.ai/view/..."
                className="bg-black/50 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-white focus:ring-white/20"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="circlebackSummary" className="text-zinc-300">Call Summary</Label>
              <Textarea
                id="circlebackSummary"
                value={circlebackSummary}
                onChange={(e) => setCirclebackSummary(e.target.value)}
                placeholder="Paste the AI-generated call summary here..."
                rows={3}
                className="bg-black/50 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-white focus:ring-white/20"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="technicalNotes" className="text-zinc-300">Technical Notes</Label>
                <Textarea
                  id="technicalNotes"
                  value={technicalNotes}
                  onChange={(e) => setTechnicalNotes(e.target.value)}
                  placeholder="Resolution requirements, file formats, deadlines..."
                  rows={3}
                  className="bg-black/50 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-white focus:ring-white/20"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="creativeNotes" className="text-zinc-300">Creative Notes</Label>
                <Textarea
                  id="creativeNotes"
                  value={creativeNotes}
                  onChange={(e) => setCreativeNotes(e.target.value)}
                  placeholder="Brand colors, mood, style direction..."
                  rows={3}
                  className="bg-black/50 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-white focus:ring-white/20"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button 
                onClick={createSession} 
                disabled={creating}
                className="bg-white text-black hover:bg-zinc-200"
              >
                {creating ? 'Creating...' : 'Create Session'}
              </Button>
              <Button 
                variant="outline" 
                onClick={resetForm}
                className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white"
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sessions List */}
      <ScrollArea className="h-[400px]">
        <div className="space-y-3">
          {loading ? (
            <div className="text-center py-8 text-zinc-400">Loading sessions...</div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-8 text-zinc-400">
              No creative sessions yet. Create one to get started!
            </div>
          ) : (
            sessions.map((session) => (
              <Card key={session.id} className="group border-zinc-700 bg-zinc-800/50 hover:border-zinc-600 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium truncate text-white">{session.project_name}</h4>
                        <Badge variant="secondary" className="shrink-0 bg-zinc-700 text-zinc-300 border-zinc-600">
                          <Users className="h-3 w-3 mr-1" />
                          {session.client_name}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-zinc-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(session.created_at), 'MMM d, yyyy')}
                        </span>
                        {session.circleback_url && (
                          <a
                            href={session.circleback_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-zinc-400 hover:text-white hover:underline flex items-center gap-1"
                          >
                            <ExternalLink className="h-3 w-3" />
                            Call Recording
                          </a>
                        )}
                      </div>
                      {session.circleback_summary && (
                        <p className="text-xs text-zinc-500 mt-2 line-clamp-2">
                          {session.circleback_summary}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openSession(session.token)}
                        title="Open session"
                        className="text-zinc-400 hover:text-white hover:bg-zinc-700"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => copyLink(session.token)}
                        title="Copy link"
                        className="text-zinc-400 hover:text-white hover:bg-zinc-700"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteSession(session.id)}
                        title="Delete session"
                        className="text-red-400 hover:text-red-300 hover:bg-zinc-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
