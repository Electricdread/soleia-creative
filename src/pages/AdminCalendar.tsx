import { useEffect, useState } from 'react';
import { AdminShell } from '@/components/admin/AdminShell';
import { AddEventDialog } from '@/components/calendar/AddEventDialog';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Loader2, ArrowLeft, ChevronLeft, ChevronRight, Settings2, CalendarPlus, Save, Search, Clock, AlertTriangle, Video } from 'lucide-react';
import { toast } from 'sonner';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, parseISO, startOfWeek, endOfWeek, differenceInCalendarDays } from 'date-fns';
import { EventDetailPanel } from '@/components/calendar/EventDetailPanel';
import { EventStatusBadge, getStatusBarColor, type EventStatus } from '@/components/calendar/EventStatusBadge';
import { getIndigloBarColor } from '@/lib/eventColors';
import { eventDisplayName } from '@/lib/eventName';
import { loadEventLinks } from '@/lib/eventJobs';

interface CalendarEvent {
  uid: string;
  summary: string;
  description: string;
  location: string;
  dtstart: string;
  dtend: string;
  status: string;
}

interface ProposalInfo {
  status: string;
  event_name: string;
  client_name: string;
}

/**
 * A meeting drawn on the grid. These are not Triple Seat bookings — they are
 * the calls the studio arranges around one, so they are blue where a booking
 * carries its status colour, and they sit under the booking on its day.
 */
interface MeetingOnCalendar {
  id: string;
  event_uid: string;
  label: string;
  url: string;
  meeting_at: string;
  duration_minutes: number | null;
  attendees: string[] | null;
}

export default function AdminCalendar() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isAdmin, isLoading: authLoading } = useAuth();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [icalUrl, setIcalUrl] = useState('');
  const [savingUrl, setSavingUrl] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusOverrides, setStatusOverrides] = useState<Record<string, EventStatus>>({});
  const [proposalsByEvent, setProposalsByEvent] = useState<Record<string, ProposalInfo[]>>({});
  const [deadlinesByEvent, setDeadlinesByEvent] = useState<Record<string, { content_deadline: string; reminder_days: number }>>({});
  const [meetingsByDate, setMeetingsByDate] = useState<Record<string, MeetingOnCalendar[]>>({});
  const [openMeetingCard, setOpenMeetingCard] = useState<MeetingOnCalendar | null>(null);
  const [jobTitlesByEvent, setJobTitlesByEvent] = useState<Record<string, string[]>>({});
  const [tripleseatDateByEvent, setTripleseatDateByEvent] = useState<Record<string, string>>({});
  const [deployedPacketEvents, setDeployedPacketEvents] = useState<Record<string, true>>({});

  useEffect(() => {
    if (!authLoading && !user) navigate('/admin/login');
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!authLoading && isAdmin) {
      supabase.from('site_settings').select('value').eq('key', 'tripleseat_ical_url').maybeSingle().then(({ data }) => {
        if (data?.value) setIcalUrl(data.value);
      });
    }
  }, [authLoading, isAdmin]);

  useEffect(() => {
    if (!authLoading && isAdmin) {
      fetchEvents();
      fetchMetadata();
      fetchProposalAssociations();
      fetchDeadlines();
      fetchMeetings();
      fetchEventNaming();
    }
  }, [authLoading, isAdmin]);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const res = await fetch(`https://${projectId}.supabase.co/functions/v1/fetch-ical`, {
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await res.json();
      const { data: local, error: localErr } = await supabase
        .from('calendar_local_events')
        .select('uid, summary, description, location, dtstart, dtend, status');
      if (localErr) console.error('Could not load studio events:', localErr.message);
      const mine: CalendarEvent[] = (local ?? []).map((e: any) => ({
        uid: e.uid,
        summary: e.summary,
        description: e.description ?? '',
        location: e.location ?? '',
        dtstart: e.dtstart,
        dtend: e.dtend ?? e.dtstart,
        status: e.status ?? 'CONFIRMED',
      }));
      if (data.events || mine.length) {
        const merged = [...(data.events ?? []), ...mine];
        setEvents(merged);
        const eventUid = searchParams.get('event');
        if (eventUid) {
          const match = merged.find((e: CalendarEvent) => e.uid === eventUid);
          if (match) {
            setSelectedEvent(match);
            setCurrentMonth(parseISO(match.dtstart));
          }
        }
      }
      if (data.error && data.events?.length === 0) setShowSettings(true);
    } catch (e) {
      console.error('Failed to fetch events:', e);
    }
    setLoading(false);
  };

  const fetchMeetings = async () => {
    const { data } = await supabase
      .from('calendar_event_meeting_links')
      .select('id, event_uid, label, url, meeting_at, duration_minutes, attendees')
      .not('meeting_at', 'is', null)
      .order('meeting_at');
    if (!data) return;
    const map: Record<string, MeetingOnCalendar[]> = {};
    for (const m of data as MeetingOnCalendar[]) {
      const key = format(parseISO(m.meeting_at), 'yyyy-MM-dd');
      (map[key] ??= []).push(m);
    }
    setMeetingsByDate(map);
  };

  const fetchMetadata = async () => {
    const { data } = await supabase.from('calendar_event_metadata').select('event_uid, status_override');
    if (data) {
      const map: Record<string, EventStatus> = {};
      data.forEach((m) => { if (m.status_override) map[m.event_uid] = m.status_override as EventStatus; });
      setStatusOverrides(map);
    }
  };

  const fetchProposalAssociations = async () => {
    const { data: assocs } = await supabase
      .from('calendar_event_associations')
      .select('event_uid, entity_id')
      .eq('entity_type', 'proposal');
    if (!assocs || assocs.length === 0) return;

    const proposalIds = [...new Set(assocs.map((a) => a.entity_id))];
    const { data: proposals } = await supabase
      .from('proposals')
      .select('id, status, event_name, client_name')
      .in('id', proposalIds);

    if (!proposals) return;
    const proposalMap = new Map(proposals.map((p) => [p.id, p]));
    const result: Record<string, ProposalInfo[]> = {};
    for (const a of assocs) {
      const p = proposalMap.get(a.entity_id);
      if (p) {
        if (!result[a.event_uid]) result[a.event_uid] = [];
        result[a.event_uid].push({ status: p.status, event_name: p.event_name, client_name: p.client_name });
      }
    }
    setProposalsByEvent(result);
  };

  const fetchDeadlines = async () => {
    const { data } = await supabase
      .from('calendar_event_client_info')
      .select('event_uid, content_deadline, reminder_days')
      .not('content_deadline', 'is', null);
    if (data) {
      const map: Record<string, { content_deadline: string; reminder_days: number }> = {};
      (data as any[]).forEach((d) => {
        if (d.content_deadline) map[d.event_uid] = { content_deadline: d.content_deadline, reminder_days: d.reminder_days ?? 7 };
      });
      setDeadlinesByEvent(map);
    }
  };

  // What a confirmed booking is called (owner, 2026-09-14): "MM.DD.YY Client - Event" -- its job's
  // name on the day of the event, taken from Tripleseat's event details when they have been read and
  // from the booking's own start otherwise. Never the day Tripleseat added it to the feed.
  // The same links decide the indiglo colour: a job assigned or a packet deployed.
  const fetchEventNaming = async () => {
    const [links, details] = await Promise.all([
      loadEventLinks(),
      supabase.from('calendar_event_tripleseat_cache').select('event_uid, scraped_data'),
    ]);
    const titles: Record<string, string[]> = {};
    links.jobs.forEach((list, uid) => { titles[uid] = list.map((job) => job.title); });
    setJobTitlesByEvent(titles);
    setDeployedPacketEvents(Object.fromEntries([...links.deployedPacket].map((uid) => [uid, true as const])));
    const days: Record<string, string> = {};
    (details.data ?? []).forEach((row) => {
      const day = (row.scraped_data as unknown as { event_date?: string } | null)?.event_date;
      if (day) days[row.event_uid] = day;
    });
    setTripleseatDateByEvent(days);
  };

  const datedName = (event: CalendarEvent) => eventDisplayName({
    summary: event.summary,
    dtstart: event.dtstart,
    tripleseatDate: tripleseatDateByEvent[event.uid],
    jobTitles: jobTitlesByEvent[event.uid],
  });

  // "7:30pm – 11pm": when a booking starts and ends, as the feed gives them.
  const timeRange = (event: CalendarEvent): string => {
    try {
      const clock = (d: Date) => format(d, d.getMinutes() ? 'h:mma' : 'ha').toLowerCase();
      const start = parseISO(event.dtstart);
      const end = event.dtend ? parseISO(event.dtend) : null;
      return end && end > start ? `${clock(start)} – ${clock(end)}` : clock(start);
    } catch {
      return '';
    }
  };

  // What the grid can say about a booking besides its name: the room when it is
  // not the main floor, and the head count Tripleseat writes into the booking
  // ("[Guests: 650 expected / 650 guaranteed]"), guaranteed first.
  const bookingFacts = (event: CalendarEvent): string[] => {
    const facts: string[] = [];
    const room = (event.location || '').replace(/^\[[^\]]*\]\s*/, '').trim();
    if (room && room.toLowerCase() !== 'soleia') facts.push(room);
    const guests = /\[Guests:\s*([\d,]+)\s*expected(?:\s*\/\s*([\d,]+)\s*guaranteed)?\]/i.exec(event.description || '');
    if (guests) facts.push(`${guests[2] ?? guests[1]} guests`);
    return facts;
  };

  const handleStatusChange = async (uid: string, status: EventStatus) => {
    setStatusOverrides((prev) => ({ ...prev, [uid]: status }));
    const { error } = await supabase.from('calendar_event_metadata').upsert(
      { event_uid: uid, status_override: status },
      { onConflict: 'event_uid' }
    );
    if (error) toast.error('Failed to update status');
  };

  const saveIcalUrl = async () => {
    setSavingUrl(true);
    const { error } = await supabase.from('site_settings').upsert({ key: 'tripleseat_ical_url', value: icalUrl }, { onConflict: 'key' });
    if (error) toast.error('Failed to save iCal URL');
    else { toast.success('iCal URL saved'); setShowSettings(false); fetchEvents(); }
    setSavingUrl(false);
  };

  const stripTripleseatPrefix = (summary: string): string => {
    return summary.replace(/^\[(D|T|P|C)\]\s*/i, '');
  };

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

  const getEventStatus = (event: CalendarEvent): EventStatus => {
    if (statusOverrides[event.uid]) return statusOverrides[event.uid];
    const fromPrefix = detectStatusFromPrefix(event.summary);
    if (fromPrefix) return fromPrefix;
    const s = event.status.toLowerCase();
    if (s.includes('confirm') || s.includes('definite')) return 'definite';
    if (s.includes('tentative')) return 'tentative';
    if (s.includes('cancel')) return 'cancelled';
    return 'prospect';
  };

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const getEventsForDate = (date: Date) =>
    events.filter((e) => { try { return isSameDay(parseISO(e.dtstart), date); } catch { return false; } });

  const goToToday = () => { setCurrentMonth(new Date()); };

  // A meeting is not the booking. Clicking one shows the call — when it is,
  // who is on it, and the button that joins it — rather than opening the
  // event's whole working panel underneath.
  const openMeeting = (meeting: MeetingOnCalendar) => setOpenMeetingCard(meeting);

  const openMeetingsBooking = (meeting: MeetingOnCalendar) => {
    const parent = events.find((e) => e.uid === meeting.event_uid);
    setOpenMeetingCard(null);
    if (parent) setSelectedEvent(parent);
  };

  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const currentYear = currentMonth.getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  if (authLoading) return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>;
  if (!user || !isAdmin) return null;

  return (
    <AdminShell
      title="Calendar"
      subtitle="Events synced from Triple Seat"
      actions={
        <div className="flex items-center gap-1.5">
        <Button
          size="sm"
          onClick={() => setShowAddEvent(true)}
          className="min-h-[44px] gap-1.5"
        >
          <CalendarPlus className="h-4 w-4" /> <span className="hidden sm:inline">Add event</span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowSettings(!showSettings)}
          className="min-h-[44px] text-muted-foreground hover:bg-muted hover:text-foreground active:scale-95 transition-transform"
        >
          <Settings2 className="mr-1 h-4 w-4 sm:mr-2" /> <span className="hidden sm:inline">Feed settings</span>
        </Button>
        </div>
      }
    >
      <AddEventDialog
        open={showAddEvent}
        onOpenChange={setShowAddEvent}
        defaultDate={format(currentMonth, 'yyyy-MM-dd')}
        onCreated={fetchEvents}
      />

      <div className="safe-area-bottom">
        {showSettings && (
          <Card className="mb-6 bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground text-lg font-semibold">Triple Seat iCal Feed</CardTitle>
              <CardDescription className="text-muted-foreground">Paste your Triple Seat calendar export URL to sync events</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col sm:flex-row gap-3">
              <Input value={icalUrl} onChange={(e) => setIcalUrl(e.target.value)} placeholder="https://app.tripleseat.com/calendar/feed/..." className="bg-muted border-border text-foreground placeholder:text-muted-foreground/60 flex-1 min-h-[44px]" />
              <Button onClick={saveIcalUrl} disabled={savingUrl} className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground min-h-[44px] active:scale-95 transition-transform">
                {savingUrl ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save
              </Button>
            </CardContent>
          </Card>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
            {/* Calendar Column */}
            <div className="flex-1 flex flex-col gap-3 sm:gap-4 min-w-0">
              {/* Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <Button size="sm" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} variant="outline" className="border-border text-foreground hover:bg-muted text-sm min-h-[44px] min-w-[44px] active:scale-95 transition-transform">
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <select value={currentMonth.getMonth()} onChange={(e) => setCurrentMonth(new Date(currentMonth.getFullYear(), parseInt(e.target.value), 1))} className="border border-border rounded-md px-2 sm:px-3 py-1.5 text-sm text-foreground bg-card focus:outline-none focus:ring-2 focus:ring-ring/30 min-h-[44px]">
                    {months.map((m, i) => <option key={m} value={i}>{m}</option>)}
                  </select>
                  <select value={currentMonth.getFullYear()} onChange={(e) => setCurrentMonth(new Date(parseInt(e.target.value), currentMonth.getMonth(), 1))} className="border border-border rounded-md px-2 sm:px-3 py-1.5 text-sm text-foreground bg-card focus:outline-none focus:ring-2 focus:ring-ring/30 min-h-[44px]">
                    {years.map((y) => <option key={y} value={y}>{y}</option>)}
                  </select>
                  <Button size="sm" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} variant="outline" className="border-border text-foreground hover:bg-muted text-sm min-h-[44px] min-w-[44px] active:scale-95 transition-transform">
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                  <Button size="sm" onClick={goToToday} className="bg-primary hover:bg-primary/90 text-primary-foreground text-sm px-3 sm:px-4 min-h-[44px] active:scale-95 transition-transform">Today</Button>
                </div>
                <div className="relative w-full sm:max-w-xs">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                  <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search events..." className="pl-9 bg-card border-border text-foreground placeholder:text-muted-foreground/60 text-sm min-h-[44px]" />
                </div>
              </div>

              {/* Status Legend */}
              <div className="flex flex-wrap gap-2 sm:gap-3 text-[11px]">
                {(['definite','prospect','tentative','cancelled','closed'] as EventStatus[]).map((s) => (
                  <div key={s} className="flex items-center gap-1.5">
                    <EventStatusBadge status={s} size="sm" />
                  </div>
                ))}
                <div className="flex items-center gap-1.5">
                  <span
                    title="Indiglo: a job is assigned or a packet is deployed"
                    className="inline-flex items-center rounded bg-[#5aa9ff] px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-[#06213d] shadow-[0_0_10px_rgba(90,169,255,0.35)]"
                  >
                    Job assigned · packet deployed
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="inline-flex items-center gap-1 rounded-full border border-blue-500/40 bg-blue-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-blue-600 dark:text-blue-400">
                    <Video className="h-2.5 w-2.5" /> Meeting
                  </span>
                </div>
              </div>

              {/* Calendar Grid */}
              {/* The month fills the window on a desktop, so each day has room to
                  show every booking in full rather than one and a count. */}
              <div className="bg-card border border-border rounded-lg overflow-x-auto scroll-touch-x">
                <div className="min-w-[560px] flex flex-col lg:min-h-[calc(100vh-15rem)]">
                  <div className="grid grid-cols-7 border-b border-border">
                    {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((d) => (
                      <div key={d} className="text-center text-xs sm:text-sm font-semibold text-foreground/80 py-2 sm:py-2.5 border-r border-border/60 last:border-r-0 bg-muted/50">{d}</div>
                    ))}
                  </div>
                  <div className="grid flex-1 grid-cols-7 [grid-auto-rows:minmax(8.5rem,1fr)]">
                    {calendarDays.map((day, idx) => {
                      const dayEvents = getEventsForDate(day).filter(
                        (e) => !searchQuery || `${e.summary} ${datedName(e)}`.toLowerCase().includes(searchQuery.toLowerCase())
                      ).sort((a, b) => a.dtstart.localeCompare(b.dtstart));
                      const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
                      const isToday = isSameDay(day, new Date());
                      const row = Math.floor(idx / 7);
                      const isLastRow = row === Math.floor((calendarDays.length - 1) / 7);

                        return (
                         <div
                           key={day.toISOString()}
                           className={`min-h-[80px] sm:min-h-[8.5rem] border-r border-b border-border/60 text-left flex flex-col
                             ${isLastRow ? 'border-b-0' : ''} ${idx % 7 === 6 ? 'border-r-0' : ''}
                             ${!isCurrentMonth ? 'bg-muted/30' : 'bg-card'}
                             ${dayEvents.length > 0 ? 'cursor-pointer hover:bg-muted/40 transition-colors' : ''}`}
                           onClick={() => { if (dayEvents.length === 1) setSelectedEvent(dayEvents[0]); }}
                         >
                           <div className="flex items-center justify-end w-full px-1.5 pt-1">
                             <span className={`text-xs sm:text-sm font-medium ${isToday ? 'bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center' : !isCurrentMonth ? 'text-muted-foreground/40' : 'text-foreground/80'}`}>
                               {format(day, 'd')}
                             </span>
                           </div>
                           {dayEvents.map((event) => {
                              const status = getEventStatus(event);
                              // Indiglo (owner, 2026-09-14): a job assigned or a packet deployed means the work on
                              // this booking is live, and it glows in DreamlinkX OS's accent. Everything else keeps
                              // its status colour, and a cancellation stays red so it never reads as live work.
                              const live = status !== 'cancelled'
                                && ((jobTitlesByEvent[event.uid]?.length ?? 0) > 0 || Boolean(deployedPacketEvents[event.uid]));
                              const colors = live ? getIndigloBarColor() : getStatusBarColor(status);
                              const proposals = proposalsByEvent[event.uid];
                              const deadline = deadlinesByEvent[event.uid];
                              const daysUntilDeadline = deadline ? differenceInCalendarDays(new Date(deadline.content_deadline), new Date()) : null;
                              const facts = bookingFacts(event);
                              return (
                                <div
                                  key={event.uid}
                                  className={`${dayEvents.length === 1 ? 'flex-1' : ''} mx-1 mb-1 mt-0.5 rounded-md px-1.5 py-1 border-l-[3px] ${colors.border} bg-gradient-to-r ${colors.bg} to-transparent flex flex-col justify-between gap-1 ${colors.glow ?? ''}`}
                                  onClick={(e) => { e.stopPropagation(); setSelectedEvent(event); }}
                                >
                                  <div className="flex flex-col gap-0.5 min-w-0">
                                    <span className={`text-[10px] ${colors.text} opacity-75 font-medium tabular-nums`}>{timeRange(event)}</span>
                                    <span className={`text-[11px] sm:text-xs font-semibold ${colors.text} leading-snug break-words`}>
                                      {status === 'definite' ? datedName(event) : stripTripleseatPrefix(event.summary)}
                                    </span>
                                    {facts.length > 0 && (
                                      <span className={`text-[10px] ${colors.text} opacity-70 leading-snug`}>{facts.join(' · ')}</span>
                                    )}
                                  </div>
                                  <div className="flex gap-1 mt-1 flex-wrap">
                                    {proposals && proposals.length > 0 && proposals.map((p, i) => (
                                      <span
                                        key={i}
                                        className={`inline-flex items-center rounded-full px-1.5 py-0 text-[8px] font-semibold leading-tight ${
                                          p.status === 'signed' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800' :
                                          p.status === 'sent' ? 'bg-blue-100 text-blue-700 border border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800' :
                                          'bg-muted text-muted-foreground border border-border'
                                        }`}
                                      >
                                        {p.status === 'signed' ? '✓ Signed' : p.status === 'sent' ? '📩 Sent' : p.status}
                                      </span>
                                    ))}
                                    {daysUntilDeadline !== null && (
                                      <span className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0 text-[8px] font-semibold leading-tight ${
                                        daysUntilDeadline < 0 ? 'bg-red-100 text-red-700 border border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800' :
                                        daysUntilDeadline <= 3 ? 'bg-red-50 text-red-600 border border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800' :
                                        daysUntilDeadline <= 7 ? 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800' :
                                        'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800'
                                      }`}>
                                        {daysUntilDeadline < 0 ? '⚠️' : '📅'} {daysUntilDeadline < 0 ? `${Math.abs(daysUntilDeadline)}d overdue` : daysUntilDeadline === 0 ? 'Due today' : `${daysUntilDeadline}d left`}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                           {(meetingsByDate[format(day, 'yyyy-MM-dd')] ?? []).map((m) => (
                             <button
                               key={m.id}
                               title={`${m.label} — ${format(parseISO(m.meeting_at), 'h:mm a')}`}
                               onClick={(e) => { e.stopPropagation(); openMeeting(m); }}
                               className="mx-1 mb-1 flex min-w-0 items-start gap-1 rounded-md border-l-[3px] border-blue-500 bg-blue-500/10 px-1.5 py-0.5 text-left hover:bg-blue-500/20"
                             >
                               <Video className="mt-0.5 h-2.5 w-2.5 shrink-0 text-blue-600 dark:text-blue-400" />
                               <span className="shrink-0 text-[9px] font-semibold leading-snug text-blue-600 dark:text-blue-400">
                                 {format(parseISO(m.meeting_at), 'h:mma').toLowerCase()}
                               </span>
                               <span className="min-w-0 break-words text-[10px] leading-snug text-blue-700 dark:text-blue-300">{m.label}</span>
                             </button>
                           ))}
                         </div>
                       );
                     })}
                   </div>
                </div>
              </div>
            </div>

            <Dialog open={!!openMeetingCard} onOpenChange={(o) => !o && setOpenMeetingCard(null)}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-base">
                    <Video className="h-4 w-4 text-blue-500" />
                    {openMeetingCard?.label}
                  </DialogTitle>
                </DialogHeader>
                {openMeetingCard && (
                  <div className="space-y-3">
                    <div className="rounded-lg border border-blue-500/30 bg-blue-500/5 p-3">
                      <p className="text-sm font-medium text-foreground">
                        {format(parseISO(openMeetingCard.meeting_at), 'EEEE, MMMM d, yyyy')}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {format(parseISO(openMeetingCard.meeting_at), 'h:mm a')}
                        {openMeetingCard.duration_minutes ? ` · ${openMeetingCard.duration_minutes} minutes` : ''}
                      </p>
                    </div>

                    <div>
                      <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Attendees
                      </p>
                      {openMeetingCard.attendees?.length ? (
                        <ul className="space-y-1">
                          {openMeetingCard.attendees.map((person) => (
                            <li key={person}>
                              <a href={`mailto:${person}`} className="text-xs text-primary hover:underline">
                                {person}
                              </a>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-xs text-muted-foreground/60">
                          None listed — paste the invite with its addresses, or add them on the event.
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <Button
                        onClick={() => window.open(openMeetingCard.url, '_blank', 'noopener,noreferrer')}
                        className="gap-1.5 bg-blue-600 text-white hover:bg-blue-700"
                      >
                        <Video className="h-4 w-4" /> Join the meeting
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => openMeetingsBooking(openMeetingCard)}
                        className="text-xs"
                      >
                        Open the booking
                      </Button>
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>

            {/* Detail Panel */}
            {selectedEvent && (
              <div className="lg:w-[420px] shrink-0">
                <div className="lg:sticky lg:top-6">
                  <EventDetailPanel
                    key={selectedEvent.uid}
                    event={selectedEvent}
                    statusOverride={getEventStatus(selectedEvent)}
                    onClose={() => setSelectedEvent(null)}
                    onStatusChange={handleStatusChange}
                    proposalStatuses={proposalsByEvent[selectedEvent.uid]}
                    deadlineInfo={deadlinesByEvent[selectedEvent.uid] || null}
                    onMeetingsChanged={fetchMeetings}
                    datedName={datedName(selectedEvent)}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </AdminShell>
  );
}
