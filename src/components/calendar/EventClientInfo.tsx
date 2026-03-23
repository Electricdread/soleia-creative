import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Save, Clock, AlertTriangle, Bell } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { differenceInCalendarDays, format } from 'date-fns';

interface ClientInfo {
  client_contact_name: string;
  client_contact_email: string;
  client_contact_phone: string;
  loading_fee_notes: string;
  content_deadline: string;
  deadline_notes: string;
  reminder_days: number;
}

const empty: ClientInfo = {
  client_contact_name: '',
  client_contact_email: '',
  client_contact_phone: '',
  loading_fee_notes: '',
  content_deadline: '',
  deadline_notes: '',
  reminder_days: 7,
};

export function EventClientInfo({ eventUid }: { eventUid: string }) {
  const [info, setInfo] = useState<ClientInfo>(empty);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [linkedProposals, setLinkedProposals] = useState<any[]>([]);

  useEffect(() => {
    const fetch_ = async () => {
      const { data } = await supabase
        .from('calendar_event_client_info')
        .select('*')
        .eq('event_uid', eventUid)
        .maybeSingle();
      if (data) {
        setInfo({
          client_contact_name: (data as any).client_contact_name || '',
          client_contact_email: (data as any).client_contact_email || '',
          client_contact_phone: (data as any).client_contact_phone || '',
          loading_fee_notes: (data as any).loading_fee_notes || '',
          content_deadline: (data as any).content_deadline ? (data as any).content_deadline.slice(0, 10) : '',
          deadline_notes: (data as any).deadline_notes || '',
          reminder_days: (data as any).reminder_days ?? 7,
        });
      }

      const { data: assocs } = await supabase
        .from('calendar_event_associations')
        .select('entity_id')
        .eq('event_uid', eventUid)
        .eq('entity_type', 'proposal');
      if (assocs && assocs.length > 0) {
        const ids = (assocs as any[]).map((a) => a.entity_id);
        const { data: props } = await supabase.from('proposals').select('id, event_name, client_name, status, token').in('id', ids);
        setLinkedProposals(props || []);
      }
      setLoading(false);
    };
    fetch_();
  }, [eventUid]);

  const save = async () => {
    setSaving(true);
    const payload: any = {
      event_uid: eventUid,
      client_contact_name: info.client_contact_name || null,
      client_contact_email: info.client_contact_email || null,
      client_contact_phone: info.client_contact_phone || null,
      loading_fee_notes: info.loading_fee_notes || null,
      content_deadline: info.content_deadline || null,
      deadline_notes: info.deadline_notes || null,
      reminder_days: info.reminder_days,
    };
    const { error } = await supabase.from('calendar_event_client_info').upsert(payload, { onConflict: 'event_uid' });
    if (error) toast.error('Failed to save client info');
    else toast.success('Client info saved');
    setSaving(false);
  };

  if (loading) return <div className="flex justify-center py-4"><Loader2 className="w-4 h-4 animate-spin text-primary" /></div>;

  const daysUntilDeadline = info.content_deadline
    ? differenceInCalendarDays(new Date(info.content_deadline), new Date())
    : null;

  return (
    <div className="space-y-4">
      {daysUntilDeadline !== null && (
        <div className={`flex items-center gap-2 p-3 rounded-lg border ${
          daysUntilDeadline <= 3 ? 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800' : daysUntilDeadline <= 7 ? 'bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800' : 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800'
        }`}>
          {daysUntilDeadline <= 3 ? <AlertTriangle className="w-4 h-4 text-red-500" /> : <Clock className="w-4 h-4 text-[#7b8a3e]" />}
          <span className={`text-sm font-medium ${daysUntilDeadline <= 3 ? 'text-red-700 dark:text-red-400' : daysUntilDeadline <= 7 ? 'text-amber-700 dark:text-amber-400' : 'text-emerald-700 dark:text-emerald-400'}`}>
            {daysUntilDeadline < 0 ? `${Math.abs(daysUntilDeadline)} days overdue` : daysUntilDeadline === 0 ? 'Due today!' : `${daysUntilDeadline} days until deadline`}
          </span>
          <span className="text-xs text-muted-foreground ml-auto">{format(new Date(info.content_deadline), 'MMM d, yyyy')}</span>
        </div>
      )}

      <div className="space-y-2">
        <h4 className="text-xs font-semibold text-foreground/70 uppercase tracking-wider">Client Contact</h4>
        <Input value={info.client_contact_name} onChange={(e) => setInfo({ ...info, client_contact_name: e.target.value })} placeholder="Contact name" className="bg-muted/50 border-border text-foreground text-sm placeholder:text-muted-foreground/60" />
        <div className="grid grid-cols-2 gap-2">
          <Input value={info.client_contact_email} onChange={(e) => setInfo({ ...info, client_contact_email: e.target.value })} placeholder="Email" className="bg-muted/50 border-border text-foreground text-sm placeholder:text-muted-foreground/60" />
          <Input value={info.client_contact_phone} onChange={(e) => setInfo({ ...info, client_contact_phone: e.target.value })} placeholder="Phone" className="bg-muted/50 border-border text-foreground text-sm placeholder:text-muted-foreground/60" />
        </div>
      </div>

      <div className="space-y-2">
        <h4 className="text-xs font-semibold text-foreground/70 uppercase tracking-wider">Content Deadline</h4>
        <Input type="date" value={info.content_deadline} onChange={(e) => setInfo({ ...info, content_deadline: e.target.value })} className="bg-muted/50 border-border text-foreground text-sm" />
        <Input value={info.deadline_notes} onChange={(e) => setInfo({ ...info, deadline_notes: e.target.value })} placeholder="Deadline notes" className="bg-muted/50 border-border text-foreground text-sm placeholder:text-muted-foreground/60" />
        
        <div className="flex items-center gap-2">
          <Bell className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs text-foreground/70">Remind me</span>
          <Select value={String(info.reminder_days)} onValueChange={(v) => setInfo({ ...info, reminder_days: Number(v) })}>
            <SelectTrigger className="w-[100px] h-7 bg-muted/50 border-border text-foreground text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1 day</SelectItem>
              <SelectItem value="3">3 days</SelectItem>
              <SelectItem value="5">5 days</SelectItem>
              <SelectItem value="7">7 days</SelectItem>
              <SelectItem value="10">10 days</SelectItem>
              <SelectItem value="14">14 days</SelectItem>
              <SelectItem value="21">21 days</SelectItem>
              <SelectItem value="30">30 days</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-xs text-foreground/70">before deadline</span>
        </div>
      </div>

      <div className="space-y-2">
        <h4 className="text-xs font-semibold text-foreground/70 uppercase tracking-wider">Loading Fee & Proposal Notes</h4>
        <Textarea value={info.loading_fee_notes} onChange={(e) => setInfo({ ...info, loading_fee_notes: e.target.value })} placeholder="Loading fees, proposal details..." className="bg-muted/50 border-border text-foreground text-sm min-h-[60px] placeholder:text-muted-foreground/60" />
      </div>

      {linkedProposals.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-foreground/70 uppercase tracking-wider">Linked Proposals</h4>
          {linkedProposals.map((p) => (
            <a key={p.id} href={`/proposal/${p.token}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between bg-muted/50 border border-border rounded-lg p-3 hover:border-primary transition-colors">
              <div>
                <p className="text-sm font-medium text-foreground">{p.event_name}</p>
                <p className="text-[11px] text-muted-foreground">{p.client_name}</p>
              </div>
              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${p.status === 'signed' ? 'bg-[#7b8a3e]/10 text-[#7b8a3e]' : p.status === 'sent' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                {p.status}
              </span>
            </a>
          ))}
        </div>
      )}

      <Button onClick={save} disabled={saving} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-sm gap-2">
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Client Info
      </Button>
    </div>
  );
}
