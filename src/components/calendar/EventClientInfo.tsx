import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Save, Clock, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { differenceInCalendarDays, format } from 'date-fns';

interface ClientInfo {
  client_contact_name: string;
  client_contact_email: string;
  client_contact_phone: string;
  loading_fee_notes: string;
  content_deadline: string;
  deadline_notes: string;
}

const empty: ClientInfo = {
  client_contact_name: '',
  client_contact_email: '',
  client_contact_phone: '',
  loading_fee_notes: '',
  content_deadline: '',
  deadline_notes: '',
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
        });
      }

      // Fetch linked proposals
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
    };
    const { error } = await supabase.from('calendar_event_client_info').upsert(payload, { onConflict: 'event_uid' });
    if (error) toast.error('Failed to save client info');
    else toast.success('Client info saved');
    setSaving(false);
  };

  if (loading) return <div className="flex justify-center py-4"><Loader2 className="w-4 h-4 animate-spin text-[#c49a3c]" /></div>;

  const daysUntilDeadline = info.content_deadline
    ? differenceInCalendarDays(new Date(info.content_deadline), new Date())
    : null;

  return (
    <div className="space-y-4">
      {/* Deadline Countdown */}
      {daysUntilDeadline !== null && (
        <div className={`flex items-center gap-2 p-3 rounded-lg border ${
          daysUntilDeadline <= 3 ? 'bg-red-50 border-red-200' : daysUntilDeadline <= 7 ? 'bg-amber-50 border-amber-200' : 'bg-[#f0f5e8] border-[#c8d8a8]'
        }`}>
          {daysUntilDeadline <= 3 ? <AlertTriangle className="w-4 h-4 text-red-500" /> : <Clock className="w-4 h-4 text-[#7b8a3e]" />}
          <span className={`text-sm font-medium ${daysUntilDeadline <= 3 ? 'text-red-700' : daysUntilDeadline <= 7 ? 'text-amber-700' : 'text-[#5a6b30]'}`}>
            {daysUntilDeadline < 0 ? `${Math.abs(daysUntilDeadline)} days overdue` : daysUntilDeadline === 0 ? 'Due today!' : `${daysUntilDeadline} days until deadline`}
          </span>
          <span className="text-xs text-[#8a7d6b] ml-auto">{format(new Date(info.content_deadline), 'MMM d, yyyy')}</span>
        </div>
      )}

      {/* Contact Info */}
      <div className="space-y-2">
        <h4 className="text-xs font-semibold text-[#5a4f3f] uppercase tracking-wider">Client Contact</h4>
        <Input value={info.client_contact_name} onChange={(e) => setInfo({ ...info, client_contact_name: e.target.value })} placeholder="Contact name" className="bg-[#faf8f5] border-[#d6cfc3] text-[#3d3629] text-sm placeholder:text-[#b5ab9a]" />
        <div className="grid grid-cols-2 gap-2">
          <Input value={info.client_contact_email} onChange={(e) => setInfo({ ...info, client_contact_email: e.target.value })} placeholder="Email" className="bg-[#faf8f5] border-[#d6cfc3] text-[#3d3629] text-sm placeholder:text-[#b5ab9a]" />
          <Input value={info.client_contact_phone} onChange={(e) => setInfo({ ...info, client_contact_phone: e.target.value })} placeholder="Phone" className="bg-[#faf8f5] border-[#d6cfc3] text-[#3d3629] text-sm placeholder:text-[#b5ab9a]" />
        </div>
      </div>

      {/* Deadline */}
      <div className="space-y-2">
        <h4 className="text-xs font-semibold text-[#5a4f3f] uppercase tracking-wider">Content Deadline</h4>
        <Input type="date" value={info.content_deadline} onChange={(e) => setInfo({ ...info, content_deadline: e.target.value })} className="bg-[#faf8f5] border-[#d6cfc3] text-[#3d3629] text-sm" />
        <Input value={info.deadline_notes} onChange={(e) => setInfo({ ...info, deadline_notes: e.target.value })} placeholder="Deadline notes" className="bg-[#faf8f5] border-[#d6cfc3] text-[#3d3629] text-sm placeholder:text-[#b5ab9a]" />
      </div>

      {/* Loading Fee */}
      <div className="space-y-2">
        <h4 className="text-xs font-semibold text-[#5a4f3f] uppercase tracking-wider">Loading Fee & Proposal Notes</h4>
        <Textarea value={info.loading_fee_notes} onChange={(e) => setInfo({ ...info, loading_fee_notes: e.target.value })} placeholder="Loading fees, proposal details..." className="bg-[#faf8f5] border-[#d6cfc3] text-[#3d3629] text-sm min-h-[60px] placeholder:text-[#b5ab9a]" />
      </div>

      {/* Linked Proposals */}
      {linkedProposals.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-[#5a4f3f] uppercase tracking-wider">Linked Proposals</h4>
          {linkedProposals.map((p) => (
            <a key={p.id} href={`/proposal/${p.token}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between bg-[#faf8f5] border border-[#e8e2d8] rounded-lg p-3 hover:border-[#c49a3c] transition-colors">
              <div>
                <p className="text-sm font-medium text-[#3d3629]">{p.event_name}</p>
                <p className="text-[11px] text-[#8a7d6b]">{p.client_name}</p>
              </div>
              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${p.status === 'signed' ? 'bg-[#7b8a3e]/10 text-[#7b8a3e]' : p.status === 'sent' ? 'bg-[#c49a3c]/10 text-[#c49a3c]' : 'bg-[#8a7d6b]/10 text-[#8a7d6b]'}`}>
                {p.status}
              </span>
            </a>
          ))}
        </div>
      )}

      <Button onClick={save} disabled={saving} className="w-full bg-[#c49a3c] hover:bg-[#b08a30] text-white text-sm gap-2">
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Client Info
      </Button>
    </div>
  );
}
