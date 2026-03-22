import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, ExternalLink, FolderOpen, Link2, Bell, AlertTriangle, Clock } from 'lucide-react';
import { differenceInCalendarDays, format } from 'date-fns';

interface LinkedSession {
  id: string;
  entity_type: string;
  entity_id: string;
  session?: {
    project_name: string;
    client_name: string;
    dropbox_url: string | null;
    token: string;
  };
  link?: {
    event_name: string;
    client_name: string;
    token: string;
  };
}

export function EventDelivery({ eventUid }: { eventUid: string }) {
  const [items, setItems] = useState<LinkedSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [deadlineInfo, setDeadlineInfo] = useState<{ content_deadline: string | null; reminder_days: number; deadline_notes: string | null } | null>(null);

  useEffect(() => {
    const fetch_ = async () => {
      // Fetch deadline info
      const { data: clientInfo } = await supabase
        .from('calendar_event_client_info')
        .select('content_deadline, reminder_days, deadline_notes')
        .eq('event_uid', eventUid)
        .maybeSingle();
      if (clientInfo) setDeadlineInfo(clientInfo as any);

      // Get associations for delivery-related types
      const { data: assocs } = await supabase
        .from('calendar_event_associations')
        .select('*')
        .eq('event_uid', eventUid)
        .in('entity_type', ['creative_session', 'client_link']);

      if (!assocs || assocs.length === 0) {
        setLoading(false);
        return;
      }

      const results: LinkedSession[] = [];

      for (const a of assocs as any[]) {
        if (a.entity_type === 'creative_session') {
          const { data: s } = await supabase
            .from('creative_sessions')
            .select('project_name, client_name, dropbox_url, token')
            .eq('id', a.entity_id)
            .maybeSingle();
          if (s) results.push({ ...a, session: s });
        } else if (a.entity_type === 'client_link') {
          const { data: l } = await supabase
            .from('client_links')
            .select('event_name, client_name, token')
            .eq('id', a.entity_id)
            .maybeSingle();
          if (l) results.push({ ...a, link: l });
        }
      }

      setItems(results);
      setLoading(false);
    };
    fetch_();
  }, [eventUid]);

  if (loading) return <div className="flex justify-center py-4"><Loader2 className="w-4 h-4 animate-spin text-[#c49a3c]" /></div>;

  if (items.length === 0) {
    return (
      <div className="text-center py-6">
        <FolderOpen className="w-8 h-8 text-[#d6cfc3] mx-auto mb-2" />
        <p className="text-xs text-[#b5ab9a]">No delivery guides or Dropbox links linked yet.</p>
        <p className="text-[10px] text-[#c4bba8] mt-1">Link sessions via the "Linked Items" tab to see them here.</p>
      </div>
    );
  }

  const daysUntilDeadline = deadlineInfo?.content_deadline
    ? differenceInCalendarDays(new Date(deadlineInfo.content_deadline), new Date())
    : null;
  const reminderDays = deadlineInfo?.reminder_days ?? 7;
  const showAlert = daysUntilDeadline !== null && daysUntilDeadline <= reminderDays;

  return (
    <div className="space-y-3">
      {/* Deadline Reminder Alert */}
      {showAlert && daysUntilDeadline !== null && (
        <div className={`flex items-start gap-2 p-3 rounded-lg border ${
          daysUntilDeadline <= 0 ? 'bg-red-50 border-red-300' : daysUntilDeadline <= 3 ? 'bg-red-50 border-red-200' : daysUntilDeadline <= 7 ? 'bg-amber-50 border-amber-200' : 'bg-[#fdf8eb] border-[#e8d9a8]'
        }`}>
          <div className="mt-0.5">
            {daysUntilDeadline <= 3 ? <AlertTriangle className="w-4 h-4 text-red-500" /> : <Bell className="w-4 h-4 text-[#c49a3c]" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-semibold ${daysUntilDeadline <= 0 ? 'text-red-700' : daysUntilDeadline <= 3 ? 'text-red-600' : 'text-[#8a6d2b]'}`}>
              {daysUntilDeadline < 0 ? `⚠️ Content ${Math.abs(daysUntilDeadline)} days overdue!` : daysUntilDeadline === 0 ? '🔴 Content deadline is TODAY!' : `📅 ${daysUntilDeadline} day${daysUntilDeadline !== 1 ? 's' : ''} until content deadline`}
            </p>
            <p className="text-xs text-[#8a7d6b] mt-0.5">
              Due: {format(new Date(deadlineInfo!.content_deadline!), 'EEEE, MMMM d, yyyy')}
            </p>
            {deadlineInfo?.deadline_notes && (
              <p className="text-xs text-[#5a4f3f] mt-1 italic">{deadlineInfo.deadline_notes}</p>
            )}
          </div>
        </div>
      )}

      {/* No deadline set hint */}
      {!deadlineInfo?.content_deadline && items.length > 0 && (
        <div className="flex items-center gap-2 p-2 rounded-lg bg-[#faf8f5] border border-dashed border-[#d6cfc3]">
          <Clock className="w-3.5 h-3.5 text-[#b5ab9a]" />
          <p className="text-[11px] text-[#b5ab9a]">Set a content deadline in the Client tab to get reminders here.</p>
        </div>
      )}
      {items.map((item) => (
        <div key={item.id} className="bg-[#faf8f5] border border-[#e8e2d8] rounded-lg p-3">
          {item.session && (
            <>
              <p className="text-sm font-medium text-[#3d3629]">{item.session.project_name}</p>
              <p className="text-[11px] text-[#8a7d6b]">{item.session.client_name}</p>
              <div className="flex flex-wrap gap-2 mt-2">
                <a href={`/delivery/${item.session.token}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-[#c49a3c] hover:underline">
                  <Link2 className="w-3 h-3" /> Delivery Guide
                </a>
                {item.session.dropbox_url && (
                  <a href={item.session.dropbox_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-[#5a8fb4] hover:underline">
                    <ExternalLink className="w-3 h-3" /> Dropbox Folder
                  </a>
                )}
              </div>
            </>
          )}
          {item.link && (
            <>
              <p className="text-sm font-medium text-[#3d3629]">{item.link.event_name}</p>
              <p className="text-[11px] text-[#8a7d6b]">{item.link.client_name}</p>
              <a href={`/session/${item.link.token}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-[#c49a3c] hover:underline mt-2">
                <Link2 className="w-3 h-3" /> Client Session
              </a>
            </>
          )}
        </div>
      ))}
    </div>
  );
}
