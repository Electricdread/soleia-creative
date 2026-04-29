import { useEffect, useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Loader2, Copy, Trash2, ExternalLink, Eye, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { getPublicOrigin } from '@/lib/ogShare';
import { format } from 'date-fns';

interface Share {
  id: string;
  token: string;
  title: string;
  category_id: string | null;
  clip_ids: string[] | null;
  is_active: boolean;
  expires_at: string | null;
  view_count: number;
  created_at: string;
}

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}

export function ManageLookBookSharesDialog({ open, onOpenChange }: Props) {
  const { toast } = useToast();
  const [shares, setShares] = useState<Share[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('lookbook_shares')
      .select('*')
      .order('created_at', { ascending: false });
    setShares((data || []) as Share[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (open) load();
  }, [open, load]);

  const toggleActive = async (s: Share) => {
    const { error } = await supabase
      .from('lookbook_shares')
      .update({ is_active: !s.is_active } as any)
      .eq('id', s.id);
    if (error) {
      toast({ title: 'Could not update', description: error.message, variant: 'destructive' });
      return;
    }
    setShares((prev) => prev.map((x) => (x.id === s.id ? { ...x, is_active: !s.is_active } : x)));
  };

  const remove = async (s: Share) => {
    if (!confirm(`Delete share "${s.title}"? The link will stop working.`)) return;
    const { error } = await supabase.from('lookbook_shares').delete().eq('id', s.id);
    if (error) {
      toast({ title: 'Could not delete', description: error.message, variant: 'destructive' });
      return;
    }
    setShares((prev) => prev.filter((x) => x.id !== s.id));
  };

  const copy = async (s: Share) => {
    const url = `${getPublicOrigin()}/looks/${s.token}`;
    await navigator.clipboard.writeText(url);
    setCopiedId(s.id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl bg-zinc-950 border-zinc-800 text-zinc-100 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[#c49a3c]" style={{ fontFamily: 'DM Serif Display, serif' }}>
            Manage Shared Look Books
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="py-12 flex justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-[#c49a3c]" />
          </div>
        ) : shares.length === 0 ? (
          <p className="py-12 text-center text-sm text-zinc-500">No shared Look Books yet.</p>
        ) : (
          <div className="space-y-2">
            {shares.map((s) => {
              const url = `${getPublicOrigin()}/looks/${s.token}`;
              const expired = s.expires_at && new Date(s.expires_at).getTime() < Date.now();
              return (
                <div
                  key={s.id}
                  className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm text-zinc-100 truncate">{s.title}</h4>
                      {!s.is_active && (
                        <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-zinc-800 text-zinc-400">Inactive</span>
                      )}
                      {expired && (
                        <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-red-900/40 text-red-300">Expired</span>
                      )}
                    </div>
                    <div className="mt-1 flex items-center gap-3 text-[11px] text-zinc-500" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                      <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {s.view_count}</span>
                      <span>{format(new Date(s.created_at), 'MMM d, yyyy')}</span>
                      {s.expires_at && <span>· exp {format(new Date(s.expires_at), 'MMM d')}</span>}
                    </div>
                    <code className="mt-1 block text-[11px] text-zinc-500 truncate">{url}</code>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <div className="flex items-center gap-1 px-2">
                      <Switch checked={s.is_active} onCheckedChange={() => toggleActive(s)} />
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => copy(s)}
                      className="h-9 w-9 text-zinc-300 hover:text-[#c49a3c] hover:bg-zinc-800"
                      title="Copy link"
                    >
                      {copiedId === s.id ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => window.open(url, '_blank')}
                      className="h-9 w-9 text-zinc-300 hover:text-[#c49a3c] hover:bg-zinc-800"
                      title="Open"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => remove(s)}
                      className="h-9 w-9 text-zinc-300 hover:text-red-400 hover:bg-zinc-800"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
