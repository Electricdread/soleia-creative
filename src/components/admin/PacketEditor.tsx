import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Trash2, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

export type PacketKind = 'pre_call' | 'creative_pre_call';

export interface PacketInclusion {
  heading: string;
  body: string;
}

export interface PacketRecord {
  id?: string;
  title: string;
  client_name: string | null;
  event_date: string | null;
  intro: string | null;
  inclusions: PacketInclusion[];
  scope: string | null;
  notes: string | null;
  creative_guide_url?: string | null;
  drive_folder_url?: string | null;
  drive_folder_id?: string | null;
  kind?: PacketKind;
  is_active?: boolean;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: PacketRecord | null;
  kind?: PacketKind;
  onSaved: () => void;
}

const DEFAULT_GUIDE_URL = 'https://soleiacreative.app/creative-guide';

const fullDefault = (): PacketRecord => ({
  title: 'Soleia Pre-Call Packet',
  client_name: '',
  event_date: '',
  intro:
    'Welcome — this packet prepares us for your creative pre-call with the Soleia team. ' +
    'Please review the Creative Guide ahead of our meeting and use the shared Google Drive ' +
    'folder (created on save) to drop logos, brand assets, references, and any inspiration. ' +
    'Final creative is delivered no later than 21 business days before your event.',
  inclusions: [
    { heading: 'Soleia Creative Guide', body: 'Our living technical & creative reference covering the venue, LED canvas, motion graphics standards and delivery specs. Open the Creative Guide link above to explore.' },
    { heading: 'Pixel Map', body: 'The master LED pixel map for the venue lives in the "02_Pixel Map" folder of your shared Drive, alongside the SOLEIA Content Delivery Guide.' },
    { heading: 'Client Asset Collect', body: 'Upload logos (vector preferred), brand colors, fonts, photography and any reference films to the "03_Client Asset Collect" folder in your shared Drive.' },
  ],
  scope:
    'Soleia delivers custom motion graphics and venue mapping for your event. Creative direction, asset preparation, encoding and on-site QC are included. Final assets due 21 business days before show date.',
  notes: '',
  creative_guide_url: DEFAULT_GUIDE_URL,
  kind: 'pre_call',
});

const creativeDefault = (): PacketRecord => ({
  title: 'Soleia Pre-Call Creative Packet',
  client_name: '',
  event_date: '',
  intro:
    'Before our creative pre-call, please review the Soleia Creative Guide using the button ' +
    'below. Then drop your logos, brand assets, references and inspiration into the shared ' +
    'Client Asset Collect folder (created on save). Final assets are due 21 business days ' +
    'before your event.',
  inclusions: [
    { heading: 'Client Asset Collect', body: 'Upload logos (vector preferred), brand colors, fonts, photography and any reference films. The shared folder is automatically created when this packet is saved.' },
  ],
  scope: 'Creative pre-call review. Final assets due 21 business days before show date.',
  notes: '',
  creative_guide_url: DEFAULT_GUIDE_URL,
  kind: 'creative_pre_call',
});

const defaultFor = (k: PacketKind) => (k === 'creative_pre_call' ? creativeDefault() : fullDefault());

export function PacketEditor({ open, onOpenChange, initial, kind = 'pre_call', onSaved }: Props) {
  const { user } = useAuth();
  const [form, setForm] = useState<PacketRecord>(defaultFor(kind));
  const [saving, setSaving] = useState(false);
  const effectiveKind: PacketKind = initial?.kind ?? kind;

  useEffect(() => {
    if (open) {
      // Clear any stale pointer-events lock left by a parent Radix menu
      if (typeof document !== 'undefined' && document.body.style.pointerEvents === 'none') {
        document.body.style.pointerEvents = '';
      }
      setForm(
        initial
          ? {
              ...initial,
              creative_guide_url: initial.creative_guide_url || DEFAULT_GUIDE_URL,
              inclusions: initial.inclusions?.length ? initial.inclusions : defaultFor(initial.kind ?? kind).inclusions,
              kind: initial.kind ?? kind,
            }
          : defaultFor(kind),
      );
    }
  }, [open, initial, kind]);

  const updateInclusion = (idx: number, field: keyof PacketInclusion, value: string) => {
    setForm((f) => ({
      ...f,
      inclusions: f.inclusions.map((inc, i) => (i === idx ? { ...inc, [field]: value } : inc)),
    }));
  };

  const addInclusion = () => setForm((f) => ({ ...f, inclusions: [...f.inclusions, { heading: '', body: '' }] }));
  const removeInclusion = (idx: number) => setForm((f) => ({ ...f, inclusions: f.inclusions.filter((_, i) => i !== idx) }));

  const handleSave = async () => {
    if (!form.title.trim()) {
      toast.error('Title is required');
      return;
    }
    setSaving(true);
    const payload = {
      title: form.title.trim(),
      client_name: form.client_name?.trim() || null,
      event_date: form.event_date || null,
      intro: form.intro?.trim() || null,
      inclusions: form.inclusions.filter((i) => i.heading.trim() || i.body.trim()),
      scope: form.scope?.trim() || null,
      notes: form.notes?.trim() || null,
      creative_guide_url: form.creative_guide_url?.trim() || DEFAULT_GUIDE_URL,
      kind: effectiveKind,
    };

    const dbPayload: any = { ...payload, inclusions: payload.inclusions as any };
    const { data: saved, error } = initial?.id
      ? await supabase.from('pre_call_packets').update(dbPayload).eq('id', initial.id).select('id, client_name, drive_folder_url, kind').maybeSingle()
      : await supabase.from('pre_call_packets').insert({ ...dbPayload, created_by: user?.id }).select('id, client_name, drive_folder_url, kind').maybeSingle();

    if (error) {
      setSaving(false);
      toast.error(error.message);
      return;
    }

    if (saved?.id && saved?.client_name && !saved?.drive_folder_url) {
      try {
        const folderMode = saved.kind === 'creative_pre_call' ? 'asset_only' : 'full';
        const { data: fnData, error: fnErr } = await supabase.functions.invoke('create-client-drive-folder', {
          body: { packet_id: saved.id, folder_mode: folderMode },
        });
        if (fnErr) throw fnErr;
        if (fnData?.folderUrl) toast.success('Drive folder ready');
      } catch (e: any) {
        toast.warning(`Saved, but Drive folder failed: ${e?.message ?? 'unknown error'}`);
      }
    }

    setSaving(false);
    toast.success(initial?.id ? 'Packet updated' : 'Packet created');
    onSaved();
    onOpenChange(false);
  };

  const titleLabel = effectiveKind === 'creative_pre_call' ? 'Pre-Call Creative Packet' : 'Pre-Call Packet';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">{initial?.id ? `Edit ${titleLabel}` : `New ${titleLabel}`}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input id="title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="client">Client name</Label>
              <Input id="client" value={form.client_name ?? ''} onChange={(e) => setForm({ ...form, client_name: e.target.value })} />
            </div>
          </div>

          <div>
            <Label htmlFor="event_date">Event date</Label>
            <Input id="event_date" type="date" value={form.event_date ?? ''} onChange={(e) => setForm({ ...form, event_date: e.target.value })} />
          </div>

          <div>
            <Label htmlFor="guide">Creative Guide URL</Label>
            <Input
              id="guide"
              type="url"
              value={form.creative_guide_url ?? ''}
              onChange={(e) => setForm({ ...form, creative_guide_url: e.target.value })}
              placeholder={DEFAULT_GUIDE_URL}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {effectiveKind === 'creative_pre_call'
                ? 'Saving with a client name auto-creates a shared Drive folder with just a Client Asset Collect subfolder.'
                : 'Saving with a client name auto-creates a shared Drive folder with Creative Guide, Pixel Map, and Client Asset Collect subfolders.'}
            </p>
          </div>

          <div>
            <Label htmlFor="intro">Intro</Label>
            <Textarea id="intro" rows={3} value={form.intro ?? ''} onChange={(e) => setForm({ ...form, intro: e.target.value })} />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Inclusions</Label>
              <Button type="button" variant="ghost" size="sm" onClick={addInclusion}>
                <Plus className="w-4 h-4 mr-1" /> Add
              </Button>
            </div>
            <div className="space-y-3">
              {form.inclusions.map((inc, i) => (
                <div key={i} className="card-elevated bg-card border border-border rounded-lg p-3 space-y-2">
                  <div className="flex gap-2">
                    <Input placeholder="Heading" value={inc.heading} onChange={(e) => updateInclusion(i, 'heading', e.target.value)} />
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeInclusion(i)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <Textarea placeholder="Description" rows={2} value={inc.body} onChange={(e) => updateInclusion(i, 'body', e.target.value)} />
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="scope">Scope of work</Label>
            <Textarea id="scope" rows={4} value={form.scope ?? ''} onChange={(e) => setForm({ ...form, scope: e.target.value })} />
          </div>

          <div>
            <Label htmlFor="notes">Internal notes</Label>
            <Textarea id="notes" rows={2} value={form.notes ?? ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
