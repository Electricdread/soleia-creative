import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { ExternalLink, Save, Loader2 } from 'lucide-react';

export function DropboxLinkManager() {
  const [soleiaUrl, setSoleiaUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('site_settings')
        .select('key, value')
        .eq('key', 'soleia_dropbox_url');
      if (data) {
        for (const row of data) {
          if (row.key === 'soleia_dropbox_url') setSoleiaUrl(row.value || '');
        }
      }
      setLoading(false);
    };
    load();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('site_settings')
        .update({ value: soleiaUrl || null, updated_at: new Date().toISOString() })
        .eq('key', 'soleia_dropbox_url');
      if (error) throw error;
      toast.success('Dropbox link saved');
    } catch (err) {
      console.error(err);
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return null;

  return (
    <div className="bg-zinc-900/80 border border-zinc-800 rounded-lg p-6 space-y-5">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 rounded-lg bg-blue-500/20">
          <ExternalLink className="w-5 h-5 text-blue-400" />
        </div>
        <div>
          <h3 className="text-white font-semibold">Dropbox File Request Link</h3>
          <p className="text-xs text-zinc-400">Paste Dropbox file request URL for the delivery guide. Clients will see an upload button.</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="text-zinc-300 text-sm">Soleia Delivery Guide</Label>
          <Input
            value={soleiaUrl}
            onChange={e => setSoleiaUrl(e.target.value)}
            placeholder="https://www.dropbox.com/request/..."
            className="bg-black/50 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-blue-500"
          />
        </div>
      </div>

      <Button
        onClick={handleSave}
        disabled={saving}
        className="bg-white text-black hover:bg-zinc-200 font-medium"
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
        Save Link
      </Button>
    </div>
  );
}
