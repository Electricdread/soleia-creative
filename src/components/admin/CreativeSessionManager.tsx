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
    <div className="space-y-8">
      {/* Header - Technical Specs Style */}
      <div className="flex items-center justify-between border-b border-zinc-700/50 pb-6">
        <div>
          <h3 className="text-2xl font-logo uppercase tracking-wider text-white flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
              <Palette className="h-5 w-5 text-white" />
            </div>
            Creative Sessions
          </h3>
          <p className="text-sm text-zinc-500 mt-1 font-medium tracking-wide">
            INTERNAL MOOD BOARDS • CREATIVE COLLABORATION
          </p>
        </div>
        <Button 
          onClick={() => setShowForm(!showForm)} 
          size="sm" 
          className="gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-400 hover:to-blue-500 font-logo uppercase tracking-wider shadow-lg shadow-cyan-500/20"
        >
          <Plus className="h-4 w-4" />
          New Session
        </Button>
      </div>

      {/* Create Form - Technical Specs Style */}
      {showForm && (
        <Card className="border-cyan-500/30 bg-gradient-to-br from-zinc-900 to-zinc-800 shadow-xl shadow-cyan-500/5">
          <CardHeader className="pb-4 border-b border-zinc-700/50">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded bg-cyan-500/20 flex items-center justify-center">
                <Plus className="h-4 w-4 text-cyan-400" />
              </div>
              <div>
                <CardTitle className="text-lg font-logo uppercase tracking-wider text-white">Create Session</CardTitle>
                <CardDescription className="text-zinc-500 text-xs tracking-wide">CONFIGURE NEW INTERNAL MOOD BOARD</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-5 pt-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="projectName" className="text-xs font-logo uppercase tracking-widest text-cyan-400">Project Name *</Label>
                <Input
                  id="projectName"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="e.g., Soleia Grand Opening"
                  className="bg-black/50 border-zinc-700 text-white placeholder:text-zinc-600 focus:border-cyan-500 focus:ring-cyan-500/20 font-medium"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="clientName" className="text-xs font-logo uppercase tracking-widest text-purple-400">Client Name *</Label>
                <Input
                  id="clientName"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="e.g., Acme Corp"
                  className="bg-black/50 border-zinc-700 text-white placeholder:text-zinc-600 focus:border-purple-500 focus:ring-purple-500/20 font-medium"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="circlebackUrl" className="text-xs font-logo uppercase tracking-widest text-emerald-400">Circleback Call URL</Label>
              <Input
                id="circlebackUrl"
                value={circlebackUrl}
                onChange={(e) => setCirclebackUrl(e.target.value)}
                placeholder="https://app.circleback.ai/view/..."
                className="bg-black/50 border-zinc-700 text-white placeholder:text-zinc-600 focus:border-emerald-500 focus:ring-emerald-500/20 font-mono text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="circlebackSummary" className="text-xs font-logo uppercase tracking-widest text-amber-400">Call Summary</Label>
              <Textarea
                id="circlebackSummary"
                value={circlebackSummary}
                onChange={(e) => setCirclebackSummary(e.target.value)}
                placeholder="Paste the AI-generated call summary here..."
                rows={3}
                className="bg-black/50 border-zinc-700 text-white placeholder:text-zinc-600 focus:border-amber-500 focus:ring-amber-500/20"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="technicalNotes" className="text-xs font-logo uppercase tracking-widest text-blue-400 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  Technical Notes
                </Label>
                <Textarea
                  id="technicalNotes"
                  value={technicalNotes}
                  onChange={(e) => setTechnicalNotes(e.target.value)}
                  placeholder="Resolution requirements, file formats, deadlines..."
                  rows={3}
                  className="bg-blue-950/20 border-blue-500/30 text-white placeholder:text-zinc-600 focus:border-blue-500 focus:ring-blue-500/20"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="creativeNotes" className="text-xs font-logo uppercase tracking-widest text-pink-400 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-pink-500" />
                  Creative Notes
                </Label>
                <Textarea
                  id="creativeNotes"
                  value={creativeNotes}
                  onChange={(e) => setCreativeNotes(e.target.value)}
                  placeholder="Brand colors, mood, style direction..."
                  rows={3}
                  className="bg-pink-950/20 border-pink-500/30 text-white placeholder:text-zinc-600 focus:border-pink-500 focus:ring-pink-500/20"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-3 border-t border-zinc-700/50">
              <Button 
                onClick={createSession} 
                disabled={creating}
                className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-400 hover:to-blue-500 font-logo uppercase tracking-wider"
              >
                {creating ? 'Creating...' : 'Create Session'}
              </Button>
              <Button 
                variant="outline" 
                onClick={resetForm}
                className="border-zinc-600 text-zinc-400 hover:bg-zinc-800 hover:text-white font-logo uppercase tracking-wider"
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sessions List - Technical Cards */}
      <ScrollArea className="h-[450px] pr-4">
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-flex items-center gap-3 text-zinc-500">
                <div className="w-5 h-5 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
                <span className="font-logo uppercase tracking-wider">Loading Sessions...</span>
              </div>
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-zinc-700 rounded-xl">
              <Palette className="h-10 w-10 text-zinc-600 mx-auto mb-3" />
              <p className="text-zinc-500 font-logo uppercase tracking-wider">No Sessions Created</p>
              <p className="text-xs text-zinc-600 mt-1">Create your first creative session to get started</p>
            </div>
          ) : (
            sessions.map((session, index) => (
              <Card 
                key={session.id} 
                className="group border-zinc-700/50 bg-gradient-to-r from-zinc-900 via-zinc-800/50 to-zinc-900 hover:border-cyan-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/5 overflow-hidden"
              >
                {/* Accent bar */}
                <div className="h-1 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 opacity-60 group-hover:opacity-100 transition-opacity" />
                
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      {/* Project header */}
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500/20 to-purple-500/20 flex items-center justify-center text-cyan-400 font-logo text-sm">
                          {String(index + 1).padStart(2, '0')}
                        </div>
                        <h4 className="font-logo text-lg uppercase tracking-wide text-white truncate">{session.project_name}</h4>
                      </div>
                      
                      {/* Meta badges */}
                      <div className="flex items-center gap-2 flex-wrap mb-3">
                        <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 font-logo uppercase text-[10px] tracking-wider">
                          <Users className="h-3 w-3 mr-1" />
                          {session.client_name}
                        </Badge>
                        <Badge variant="outline" className="border-zinc-600 text-zinc-400 text-[10px] font-mono">
                          <Calendar className="h-3 w-3 mr-1" />
                          {format(new Date(session.created_at), 'MMM d, yyyy')}
                        </Badge>
                        {session.circleback_url && (
                          <a
                            href={session.circleback_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[10px] text-emerald-400 hover:text-emerald-300 font-logo uppercase tracking-wider"
                          >
                            <ExternalLink className="h-3 w-3" />
                            Call Recording
                          </a>
                        )}
                      </div>
                      
                      {/* Summary preview */}
                      {session.circleback_summary && (
                        <p className="text-xs text-zinc-500 line-clamp-2 bg-zinc-800/50 rounded-lg p-2 border-l-2 border-amber-500/50">
                          {session.circleback_summary}
                        </p>
                      )}
                      
                      {/* Notes indicators */}
                      <div className="flex items-center gap-3 mt-3">
                        {session.technical_notes && (
                          <span className="inline-flex items-center gap-1.5 text-[10px] text-blue-400 font-logo uppercase tracking-wider">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                            Tech Notes
                          </span>
                        )}
                        {session.creative_notes && (
                          <span className="inline-flex items-center gap-1.5 text-[10px] text-pink-400 font-logo uppercase tracking-wider">
                            <div className="w-1.5 h-1.5 rounded-full bg-pink-500" />
                            Creative Notes
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* Action buttons */}
                    <div className="flex flex-col gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openSession(session.token)}
                        title="Open session"
                        className="text-zinc-500 hover:text-cyan-400 hover:bg-cyan-500/10 h-8 w-8"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => copyLink(session.token)}
                        title="Copy link"
                        className="text-zinc-500 hover:text-emerald-400 hover:bg-emerald-500/10 h-8 w-8"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteSession(session.id)}
                        title="Delete session"
                        className="text-zinc-500 hover:text-red-400 hover:bg-red-500/10 h-8 w-8"
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
