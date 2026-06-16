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
  is_active?: boolean;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: PacketRecord | null;
  onSaved: () => void;
}

const empty: PacketRecord = {
  title: '',
  client_name: '',
  event_date: '',
  intro: '',
  inclusions: [{ heading: '', body: '' }],
  scope: '',
  notes: '',
};

export function PacketEditor({ open, onOpenChange, initial, onSaved }: Props) {
  const { user } = useAuth();
  const [form, setForm] = useState<PacketRecord>(empty);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(
        initial
          ? { ...initial, inclusions: initial.inclusions?.length ? initial.inclusions : [{ heading: '', body: '' }] }
          : empty,
      );
    }
  }, [open, initial]);

  const updateInclusion = (idx: number, field: keyof PacketInclusion, value: string) => {
    setForm((f) => ({
      ...f,
      inclusions: f.inclusions.map((inc, i) => (i === idx ? { ...inc, [field]: value } : inc)),
    }));
  };

  const addInclusion = () =>
    setForm((f) => ({ ...f, inclusions: [...f.inclusions, { heading: '', body: '' }] }));
  const removeInclusion = (idx: number) =>
    setForm((f) => ({ ...f, inclusions: f.inclusions.filter((_, i) => i !== idx) }));

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
    };

    const dbPayload: any = { ...payload, inclusions: payload.inclusions as any };
    const { error } = initial?.id
      ? await supabase.from('pre_call_packets').update(dbPayload).eq('id', initial.id)
      : await supabase.from('pre_call_packets').insert({ ...dbPayload, created_by: user?.id });

    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(initial?.id ? 'Packet updated' : 'Packet created');
    onSaved();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto card-elevated">
        <DialogHeader>
          <DialogTitle className="font-display">{initial?.id ? 'Edit Packet' : 'New Pre-Call Packet'}</DialogTitle>
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
                    <Input
                      placeholder="Heading"
                      value={inc.heading}
                      onChange={(e) => updateInclusion(i, 'heading', e.target.value)}
                    />
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeInclusion(i)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <Textarea
                    placeholder="Description"
                    rows={2}
                    value={inc.body}
                    onChange={(e) => updateInclusion(i, 'body', e.target.value)}
                  />
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
