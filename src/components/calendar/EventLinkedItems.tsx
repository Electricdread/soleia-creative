import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Plus, Trash2, Palette, FileText, Link2, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';

interface Association {
  id: string;
  entity_type: string;
  entity_id: string;
  label?: string;
  href?: string;
}

export function EventLinkedItems({ eventUid }: { eventUid: string }) {
  const [associations, setAssociations] = useState<Association[]>([]);
  const [loading, setLoading] = useState(true);
  const [entityType, setEntityType] = useState('creative_session');
  const [options, setOptions] = useState<{ id: string; label: string }[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchAssociations = async () => {
    const { data } = await supabase
      .from('calendar_event_associations')
      .select('*')
      .eq('event_uid', eventUid)
      .order('created_at');

    if (!data) { setLoading(false); return; }

    const resolved: Association[] = [];
    for (const a of data as any[]) {
      let label = a.entity_id;
      let href = '';
      if (a.entity_type === 'creative_session') {
        const { data: s } = await supabase.from('creative_sessions').select('project_name, client_name, token').eq('id', a.entity_id).maybeSingle();
        if (s) { label = `${s.project_name} – ${s.client_name}`; href = `/creative/${s.token}`; }
      } else if (a.entity_type === 'proposal') {
        const { data: p } = await supabase.from('proposals').select('event_name, client_name, token').eq('id', a.entity_id).maybeSingle();
        if (p) { label = `${p.event_name} – ${p.client_name}`; href = `/proposal/${p.token}`; }
      } else if (a.entity_type === 'client_link') {
        const { data: l } = await supabase.from('client_links').select('event_name, client_name, token').eq('id', a.entity_id).maybeSingle();
        if (l) { label = `${l.event_name} – ${l.client_name}`; href = `/session/${l.token}`; }
      }
      resolved.push({ ...a, label, href });
    }
    setAssociations(resolved);
    setLoading(false);
  };

  const fetchOptions = async (type: string) => {
    let opts: { id: string; label: string }[] = [];
    if (type === 'creative_session') {
      const { data } = await supabase.from('creative_sessions').select('id, project_name, client_name').eq('is_active', true).order('created_at', { ascending: false });
      opts = (data || []).map((s) => ({ id: s.id, label: `${s.project_name} – ${s.client_name}` }));
    } else if (type === 'proposal') {
      const { data } = await supabase.from('proposals').select('id, event_name, client_name').eq('is_active', true).order('created_at', { ascending: false });
      opts = (data || []).map((p) => ({ id: p.id, label: `${p.event_name} – ${p.client_name}` }));
    } else if (type === 'client_link') {
      const { data } = await supabase.from('client_links').select('id, event_name, client_name').eq('is_active', true).order('created_at', { ascending: false });
      opts = (data || []).map((l) => ({ id: l.id, label: `${l.event_name} – ${l.client_name}` }));
    }
    setOptions(opts);
    setSelectedId('');
  };

  useEffect(() => { fetchAssociations(); }, [eventUid]);
  useEffect(() => { fetchOptions(entityType); }, [entityType]);

  const addAssociation = async () => {
    if (!selectedId) return;
    setSaving(true);
    const { error } = await supabase.from('calendar_event_associations').insert({
      event_uid: eventUid,
      entity_type: entityType,
      entity_id: selectedId,
    } as any);
    if (error) {
      if (error.code === '23505') toast.info('Already linked');
      else toast.error('Failed to link');
    } else fetchAssociations();
    setSaving(false);
    setSelectedId('');
  };

  const removeAssociation = async (id: string) => {
    await supabase.from('calendar_event_associations').delete().eq('id', id);
    fetchAssociations();
  };

  const typeIcon = (t: string) => {
    if (t === 'creative_session') return <Palette className="w-3.5 h-3.5 text-primary" />;
    if (t === 'proposal') return <FileText className="w-3.5 h-3.5 text-[#5a8fb4]" />;
    return <Link2 className="w-3.5 h-3.5 text-[#7b8a3e]" />;
  };

  const typeLabel = (t: string) => {
    if (t === 'creative_session') return 'Creative Session';
    if (t === 'proposal') return 'Proposal';
    return 'Client Session';
  };

  if (loading) return <div className="flex justify-center py-4"><Loader2 className="w-4 h-4 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <div className="flex gap-2">
          <Select value={entityType} onValueChange={setEntityType}>
            <SelectTrigger className="bg-muted/50 border-border text-foreground text-sm w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="creative_session">Creative Session</SelectItem>
              <SelectItem value="proposal">Proposal</SelectItem>
              <SelectItem value="client_link">Client Session</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedId} onValueChange={setSelectedId}>
            <SelectTrigger className="bg-muted/50 border-border text-foreground text-sm flex-1">
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent>
              {options.map((o) => (
                <SelectItem key={o.id} value={o.id}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="sm" onClick={addAssociation} disabled={saving || !selectedId} className="bg-primary hover:bg-primary/90 text-primary-foreground shrink-0">
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
          </Button>
        </div>
      </div>

      {associations.length === 0 && <p className="text-xs text-muted-foreground/60 italic">No items linked to this event yet</p>}

      <div className="space-y-1.5">
        {associations.map((a) => (
          <div key={a.id} className="flex items-center gap-2.5 bg-muted/50 border border-border rounded-lg px-3 py-2 group">
            {typeIcon(a.entity_type)}
            <div className="flex-1 min-w-0">
              {a.href ? (
                <a href={a.href} target="_blank" rel="noopener noreferrer" className="text-sm text-foreground hover:text-primary hover:underline truncate block">
                  {a.label}
                </a>
              ) : (
                <p className="text-sm text-foreground truncate">{a.label}</p>
              )}
              <p className="text-[10px] text-muted-foreground/60">{typeLabel(a.entity_type)}</p>
            </div>
            {a.href && (
              <a href={a.href} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80 shrink-0">
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
            <DeleteConfirmDialog
              trigger={
                <button className="opacity-0 group-hover:opacity-100 text-muted-foreground/60 hover:text-destructive transition-opacity">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              }
              title="Unlink item?"
              description={`This will unlink "${a.label}" from this event. The item itself will not be deleted.`}
              onConfirm={() => removeAssociation(a.id)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
