import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowRight } from 'lucide-react';
import {
  format, parseISO, startOfWeek, endOfWeek, eachDayOfInterval,
  isWithinInterval, isSameDay, isToday,
} from 'date-fns';

import { AdminShell } from '@/components/admin/AdminShell';
import { PendingApproval } from '@/components/auth/PendingApproval';
import { UpcomingDeadlines } from '@/components/admin/UpcomingDeadlines';
import { DashboardStatusGrid } from '@/components/admin/DashboardStatusGrid';
import { PendingActionsPanel } from '@/components/admin/PendingActionsPanel';
import { RecentActivityFeed } from '@/components/admin/RecentActivityFeed';
import { useDeadlineCount } from '@/hooks/useDeadlineCount';
import { type EventStatus } from '@/components/calendar/EventStatusBadge';

interface WeekEvent {
  uid: string;
  summary: string;
  dtstart: string;
  dtend: string;
  location: string;
  status: string;
}

const STATUS_DOT: Record<EventStatus, string> = {
  definite: '#7b8a3e',
  prospect: '#c49a3c',
  tentative: '#5a8fb4',
  cancelled: '#b05a5a',
  closed: '#8a7d6b',
};

export default function AdminPortal() {
  const navigate = useNavigate();
  const { user, isAdmin, isLoading } = useAuth();
  const [weekEvents, setWeekEvents] = useState<WeekEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [statusOverrides, setStatusOverrides] = useState<Record<string, EventStatus>>({});

  useDeadlineCount();

  useEffect(() => {
    if (!isLoading && !user) navigate('/admin/login');
  }, [user, isLoading, navigate]);

  useEffect(() => {
    if (isLoading || !isAdmin) return;
    let cancelled = false;

    const fetchWeekEvents = async () => {
      setEventsLoading(true);
      try {
        const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
        const res = await fetch(`https://${projectId}.supabase.co/functions/v1/fetch-ical`, {
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            'Content-Type': 'application/json',
          },
        });
        const data = await res.json();
        if (!cancelled && data.events) {
          const weekStart = startOfWeek(new Date());
          const weekEnd = endOfWeek(new Date());
          const thisWeek = (data.events as WeekEvent[])
            .filter((e) => {
              try {
                return isWithinInterval(parseISO(e.dtstart), { start: weekStart, end: weekEnd });
              } catch {
                return false;
              }
            })
            .sort((a, b) => new Date(a.dtstart).getTime() - new Date(b.dtstart).getTime());
          setWeekEvents(thisWeek);
        }

        const { data: meta } = await supabase
          .from('calendar_event_metadata')
          .select('event_uid, status_override');
        if (!cancelled && meta) {
          const map: Record<string, EventStatus> = {};
          meta.forEach((m) => {
            if (m.status_override) map[m.event_uid] = m.status_override as EventStatus;
          });
          setStatusOverrides(map);
        }
      } catch (e) {
        console.error('Failed to fetch week events:', e);
      }
      if (!cancelled) setEventsLoading(false);
    };

    fetchWeekEvents();
    return () => { cancelled = true; };
  }, [isLoading, isAdmin]);

  // Triple Seat prefixes the summary with a status code — [D]efinite, [T]entative,
  // [P]rospect, [C]ancelled — unless someone has overridden it here.
  const detectStatusFromPrefix = (summary: string): EventStatus | null => {
    const match = summary.match(/^\[(D|T|P|C)\]/i);
    if (!match) return null;
    const code = match[1].toUpperCase();
    if (code === 'D') return 'definite';
    if (code === 'T') return 'tentative';
    if (code === 'P') return 'prospect';
    if (code === 'C') return 'cancelled';
    return null;
  };

  const getEventStatus = (event: WeekEvent): EventStatus => {
    if (statusOverrides[event.uid]) return statusOverrides[event.uid];
    if (event.summary) {
      const fromPrefix = detectStatusFromPrefix(event.summary);
      if (fromPrefix) return fromPrefix;
    }
    const s = event.status.toLowerCase();
    if (s.includes('confirm') || s.includes('definite')) return 'definite';
    if (s.includes('tentative')) return 'tentative';
    if (s.includes('cancel')) return 'cancelled';
    return 'prospect';
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;
  if (!isAdmin) return <PendingApproval />;

  const weekStart = startOfWeek(new Date());
  const weekEnd = endOfWeek(new Date());

  return (
    <AdminShell
      title="Dashboard"
      subtitle={`This week · ${format(weekStart, 'MMM d')} – ${format(weekEnd, 'MMM d')}`}
      actions={
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/admin/calendar')}
          className="gap-1 text-primary hover:bg-primary/10 hover:text-primary"
        >
          View calendar
          <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      }
    >
      <div className="grid grid-cols-7 gap-1.5">
        {eachDayOfInterval({ start: weekStart, end: weekEnd }).map((day) => {
          const dayEvents = weekEvents.filter((e) => isSameDay(parseISO(e.dtstart), day));
          const today = isToday(day);
          return (
            <button
              key={day.toISOString()}
              onClick={() => {
                const firstEvent = dayEvents[0];
                navigate(firstEvent
                  ? `/admin/calendar?event=${encodeURIComponent(firstEvent.uid)}`
                  : '/admin/calendar');
              }}
              className={`flex flex-col items-center rounded-lg border px-1 py-2 transition-all hover:scale-[1.03] ${
                today ? 'border-primary/40 bg-primary/15' : 'border-border bg-card hover:border-muted-foreground/30'
              }`}
            >
              <span className={`text-[10px] font-semibold uppercase tracking-wider ${today ? 'text-primary' : 'text-muted-foreground'}`}>
                {format(day, 'EEE')}
              </span>
              <span className={`text-lg font-bold leading-tight ${today ? 'text-primary' : 'text-foreground'}`}>
                {format(day, 'd')}
              </span>
              <div className="mt-1 flex h-1.5 gap-0.5">
                {dayEvents.slice(0, 3).map((ev) => (
                  <span
                    key={ev.uid}
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: STATUS_DOT[getEventStatus(ev)] ?? '#8a7d6b' }}
                  />
                ))}
              </div>
            </button>
          );
        })}
      </div>

      {eventsLoading && weekEvents.length === 0 && (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      )}

      <div className="mt-8">
        <UpcomingDeadlines />
      </div>

      <DashboardStatusGrid />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <PendingActionsPanel />
        <RecentActivityFeed />
      </div>
    </AdminShell>
  );
}
