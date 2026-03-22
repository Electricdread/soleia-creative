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

  return (
    <div className="space-y-2">
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
