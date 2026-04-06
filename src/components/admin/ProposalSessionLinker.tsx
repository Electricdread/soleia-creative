import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Link2Off, Check, Loader2 } from 'lucide-react';

interface ProposalSessionLinkerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  proposalId: string;
  currentSessionId: string | null;
  onLinked: () => void;
}

export default function ProposalSessionLinker({ open, onOpenChange, proposalId, currentSessionId, onLinked }: ProposalSessionLinkerProps) {
  const { toast } = useToast();
  const [sessions, setSessions] = useState<{ id: string; project_name: string; client_name: string; cover_images: any }[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    supabase.from('creative_sessions').select('id, project_name, client_name, cover_images').eq('is_active', true).order('created_at', { ascending: false })
      .then(({ data }) => { setSessions(data || []); setLoading(false); });
  }, [open]);

  const linkSession = async (sessionId: string | null) => {
    setSaving(true);
    const { error } = await supabase.from('proposals').update({ session_id: sessionId } as any).eq('id', proposalId);
    if (error) {
      setSaving(false);
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return;
    }

    // Auto-pull cover image when linking
    if (sessionId) {
      const session = sessions.find(s => s.id === sessionId);
      const coverImages = session?.cover_images as any[] | null;
      if (coverImages?.length) {
        const coverUrl = coverImages[0]?.url || coverImages[0];
        if (typeof coverUrl === 'string' && coverUrl.startsWith('http')) {
          const { data: existing } = await supabase
            .from('proposal_gallery')
            .select('id')
            .eq('proposal_id', proposalId)
            .eq('image_url', coverUrl)
            .maybeSingle();
          if (!existing) {
            await supabase.from('proposal_gallery').insert({
              proposal_id: proposalId,
              image_url: coverUrl,
              caption: 'Session Cover',
              sort_order: 0,
            });
          }
        }
      }
    }

    setSaving(false);
    toast({ title: sessionId ? 'Session linked (cover image added)' : 'Session unlinked' });
    onLinked();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Link Creative Session</DialogTitle>
        </DialogHeader>

        {currentSessionId && (
          <div className="flex items-center justify-between bg-muted/50 rounded-lg p-3 mb-2">
            <span className="text-sm text-muted-foreground">
              Currently linked: <strong className="text-foreground">{sessions.find(s => s.id === currentSessionId)?.project_name || 'Session'}</strong>
            </span>
            <Button variant="ghost" size="sm" onClick={() => linkSession(null)} disabled={saving} className="text-destructive hover:text-destructive">
              <Link2Off className="w-3.5 h-3.5 mr-1" /> Unlink
            </Button>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
        ) : (
          <div className="space-y-1 max-h-64 overflow-y-auto">
            {sessions.map(s => (
              <button
                key={s.id}
                onClick={() => linkSession(s.id)}
                disabled={saving || s.id === currentSessionId}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  s.id === currentSessionId ? 'bg-primary/10 text-primary' : 'hover:bg-muted'
                }`}
              >
                <span className="font-medium">{s.project_name}</span>
                <span className="text-muted-foreground ml-2">({s.client_name})</span>
                {s.id === currentSessionId && <Check className="w-3.5 h-3.5 inline ml-2 text-primary" />}
              </button>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
