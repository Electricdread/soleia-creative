import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { CalendarClock, ChevronRight, Video } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * Meetings the studio has to be at, on the dashboard.
 *
 * A meeting link saved on an event is only useful if it surfaces before the
 * meeting. This is the alert: anything in the next fortnight, soonest first,
 * with the join button on the row so nobody has to go and find the event to
 * get into a call that starts in four minutes.
 *
 * It renders nothing when there is nothing scheduled — an empty card is noise
 * on a dashboard that is meant to be scanned.
 */

interface UpcomingMeeting {
  id: string;
  event_uid: string;
  label: string;
  url: string;
  meeting_at: string;
  duration_minutes: number | null;
}

const MINUTE = 60 * 1000;
const WINDOW_DAYS = 14;

function urgency(meeting: UpcomingMeeting): { tone: 'live' | 'soon' | 'later'; text: string } {
  const start = parseISO(meeting.meeting_at).getTime();
  const end = start + (meeting.duration_minutes ?? 60) * MINUTE;
  const now = Date.now();
  if (now >= start && now <= end) return { tone: 'live', text: 'now' };
  const minutes = Math.round((start - now) / MINUTE);
  if (minutes <= 60) return { tone: 'soon', text: `${Math.max(minutes, 0)}m` };
  if (minutes <= 24 * 60) return { tone: 'soon', text: `${Math.round(minutes / 60)}h` };
  return { tone: 'later', text: `${Math.round(minutes / (24 * 60))}d` };
}

export function UpcomingMeetings() {
  const navigate = useNavigate();
  const [meetings, setMeetings] = useState<UpcomingMeeting[]>([]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      // An hour of slack at the near end keeps a call that is already running
      // on the list rather than dropping it the moment it starts.
      const from = new Date(Date.now() - 60 * MINUTE).toISOString();
      const until = new Date(Date.now() + WINDOW_DAYS * 24 * 60 * MINUTE).toISOString();
      const { data } = await supabase
        .from('calendar_event_meeting_links')
        .select('id, event_uid, label, url, meeting_at, duration_minutes')
        .not('meeting_at', 'is', null)
        .gte('meeting_at', from)
        .lte('meeting_at', until)
        .order('meeting_at')
        .limit(8);
      if (!cancelled) setMeetings((data as UpcomingMeeting[]) ?? []);
    };
    load();
    return () => { cancelled = true; };
  }, []);

  if (meetings.length === 0) return null;

  return (
    <div className="overflow-hidden rounded-xl border border-blue-500/30 bg-card">
      <div className="flex items-center gap-2 border-b border-border bg-blue-500/10 px-4 py-3">
        <CalendarClock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        <h2 className="text-sm font-semibold text-foreground">Meetings</h2>
        <span className="text-xs text-muted-foreground">
          {meetings.length} in the next {WINDOW_DAYS} days
        </span>
      </div>

      <div className="divide-y divide-border">
        {meetings.map((m) => {
          const state = urgency(m);
          return (
            <div key={m.id} className="flex items-center gap-2 px-4 py-2.5 transition-colors hover:bg-muted/40">
              <button
                onClick={() => navigate(`/admin/calendar?event=${encodeURIComponent(m.event_uid)}`)}
                className="min-w-0 flex-1 text-left"
              >
                <p className="truncate text-sm font-medium text-foreground">{m.label}</p>
                <p className="truncate text-[11px] text-muted-foreground">
                  {format(parseISO(m.meeting_at), 'EEE, MMM d')} · {format(parseISO(m.meeting_at), 'h:mm a')}
                </p>
              </button>

              <span className={cn(
                'flex-shrink-0 whitespace-nowrap rounded-full px-2 py-0.5 font-mono text-[10px] tabular-nums',
                state.tone === 'live' ? 'bg-blue-600 text-white'
                  : state.tone === 'soon' ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400'
                  : 'bg-muted text-muted-foreground',
              )}>
                {state.text}
              </span>

              <Button
                size="sm"
                onClick={() => window.open(m.url, '_blank', 'noopener,noreferrer')}
                className="h-7 flex-shrink-0 gap-1 bg-blue-600 px-2.5 text-[11px] text-white hover:bg-blue-700"
              >
                <Video className="h-3 w-3" /> Join
              </Button>

              <ChevronRight className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground/40" />
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default UpcomingMeetings;
