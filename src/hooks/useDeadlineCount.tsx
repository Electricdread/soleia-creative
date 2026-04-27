import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { differenceInCalendarDays } from 'date-fns';
import { isProposalClosed } from '@/lib/proposalStatus';

/**
 * Polls proposals + creative_sessions + client_links for items where
 * event_date is overdue or due today. Prefixes document.title with (N).
 */
export function useDeadlineCount() {
  useEffect(() => {
    const baseTitle = document.title.replace(/^\(\d+\)\s*/, '');

    const tick = async () => {
      try {
        const today = new Date();
        const todayStr = today.toISOString().slice(0, 10);

        const [proposals, sessions, links] = await Promise.all([
          supabase.from('proposals').select('event_date, status, signed_at').eq('is_active', true).not('event_date', 'is', null).lte('event_date', todayStr),
          supabase.from('creative_sessions').select('event_date').eq('is_active', true).not('event_date', 'is', null).lte('event_date', todayStr),
          supabase.from('client_links').select('event_date').eq('is_active', true).not('event_date', 'is', null).lte('event_date', todayStr),
        ]);

        const openProposals = (proposals.data || []).filter((p: any) => !isProposalClosed(p));

        const all = [
          ...openProposals,
          ...(sessions.data || []),
          ...(links.data || []),
        ];

        const count = all.filter((row: any) => {
          if (!row.event_date) return false;
          const d = new Date(row.event_date + 'T00:00:00');
          return differenceInCalendarDays(d, today) <= 0;
        }).length;

        document.title = count > 0 ? `(${count}) ${baseTitle}` : baseTitle;
      } catch (e) {
        console.error('useDeadlineCount error', e);
      }
    };

    tick();
    const id = setInterval(tick, 5 * 60 * 1000);
    return () => {
      clearInterval(id);
      document.title = baseTitle;
    };
  }, []);
}
