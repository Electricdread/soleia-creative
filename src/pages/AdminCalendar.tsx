import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Loader2, ArrowLeft, ChevronLeft, ChevronRight, Settings2, Save, Search } from 'lucide-react';
import { toast } from 'sonner';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, parseISO, startOfWeek, endOfWeek } from 'date-fns';
import soleiaLogo from '@/assets/soleia-wide-logo.png';
import { EventDetailPanel } from '@/components/calendar/EventDetailPanel';
import { EventStatusBadge, getStatusBarColor, type EventStatus } from '@/components/calendar/EventStatusBadge';

interface CalendarEvent {
  uid: string;
  summary: string;
  description: string;
  location: string;
  dtstart: string;
  dtend: string;
  status: string;
}

export default function AdminCalendar() {
  const navigate = useNavigate();
  const { user, isAdmin, isLoading: authLoading } = useAuth();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [icalUrl, setIcalUrl] = useState('');
  const [savingUrl, setSavingUrl] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusOverrides, setStatusOverrides] = useState<Record<string, EventStatus>>({});

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
      if (data.events) setEvents(data.events);
      if (data.error && data.events?.length === 0) setShowSettings(true);
    } catch (e) {
      console.error('Failed to fetch events:', e);
    }
    setLoading(false);
  };

  const fetchMetadata = async () => {
    const { data } = await supabase.from('calendar_event_metadata').select('event_uid, status_override');
    if (data) {
      const map: Record<string, EventStatus> = {};
      data.forEach((m) => { if (m.status_override) map[m.event_uid] = m.status_override as EventStatus; });
      setStatusOverrides(map);
    }
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

  const getEventStatus = (event: CalendarEvent): EventStatus => {
    if (statusOverrides[event.uid]) return statusOverrides[event.uid];
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

  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const currentYear = currentMonth.getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  if (authLoading) return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>;
  if (!user || !isAdmin) return null;

  return (
    <div className="min-h-screen bg-[#f9f7f4] font-sans">
      {/* Header */}
      <header className="border-b border-[#e0d8cc] bg-white">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => navigate('/admin')} className="text-[#8a7d6b] hover:text-[#5a4f3f] hover:bg-[#f0ebe3]">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back
              </Button>
              <div className="h-5 w-px bg-[#d6cfc3]" />
              <img src={soleiaLogo} alt="Soleia" className="h-7 w-auto object-contain hidden sm:block" />
            </div>
            <Button variant="ghost" size="sm" onClick={() => setShowSettings(!showSettings)} className="text-[#8a7d6b] hover:text-[#5a4f3f] hover:bg-[#f0ebe3]">
              <Settings2 className="w-4 h-4 mr-2" /> Settings
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {showSettings && (
          <Card className="mb-6 bg-white border-[#e0d8cc]">
            <CardHeader>
              <CardTitle className="text-[#3d3629] text-lg font-semibold">Triple Seat iCal Feed</CardTitle>
              <CardDescription className="text-[#8a7d6b]">Paste your Triple Seat calendar export URL to sync events</CardDescription>
            </CardHeader>
            <CardContent className="flex gap-3">
              <Input value={icalUrl} onChange={(e) => setIcalUrl(e.target.value)} placeholder="https://app.tripleseat.com/calendar/feed/..." className="bg-[#faf8f5] border-[#d6cfc3] text-[#3d3629] placeholder:text-[#b5ab9a] flex-1" />
              <Button onClick={saveIcalUrl} disabled={savingUrl} className="gap-2 bg-[#c49a3c] hover:bg-[#b08a30] text-white">
                {savingUrl ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save
              </Button>
            </CardContent>
          </Card>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-[#c49a3c]" /></div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Calendar Column */}
            <div className="flex-1 flex flex-col gap-4">
              {/* Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Button size="sm" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} variant="outline" className="border-[#d6cfc3] text-[#5a4f3f] hover:bg-[#f0ebe3] text-sm">
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <select value={currentMonth.getMonth()} onChange={(e) => setCurrentMonth(new Date(currentMonth.getFullYear(), parseInt(e.target.value), 1))} className="border border-[#d6cfc3] rounded-md px-3 py-1.5 text-sm text-[#3d3629] bg-white focus:outline-none focus:ring-2 focus:ring-[#c49a3c]/30">
                    {months.map((m, i) => <option key={m} value={i}>{m}</option>)}
                  </select>
                  <select value={currentMonth.getFullYear()} onChange={(e) => setCurrentMonth(new Date(parseInt(e.target.value), currentMonth.getMonth(), 1))} className="border border-[#d6cfc3] rounded-md px-3 py-1.5 text-sm text-[#3d3629] bg-white focus:outline-none focus:ring-2 focus:ring-[#c49a3c]/30">
                    {years.map((y) => <option key={y} value={y}>{y}</option>)}
                  </select>
                  <Button size="sm" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} variant="outline" className="border-[#d6cfc3] text-[#5a4f3f] hover:bg-[#f0ebe3] text-sm">
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                  <Button size="sm" onClick={goToToday} className="bg-[#c49a3c] hover:bg-[#b08a30] text-white text-sm px-4">Today</Button>
                </div>
                <div className="relative max-w-xs">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#b5ab9a]" />
                  <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search events..." className="pl-9 bg-white border-[#d6cfc3] text-[#3d3629] placeholder:text-[#b5ab9a] text-sm" />
                </div>
              </div>

              {/* Status Legend */}
              <div className="flex flex-wrap gap-3 text-[11px]">
                {(['definite','prospect','tentative','cancelled','closed'] as EventStatus[]).map((s) => (
                  <div key={s} className="flex items-center gap-1.5">
                    <EventStatusBadge status={s} size="sm" />
                  </div>
                ))}
              </div>

              {/* Calendar Grid */}
              <div className="bg-white border border-[#d6cfc3] rounded-lg overflow-hidden">
                <div className="grid grid-cols-7 border-b border-[#d6cfc3]">
                  {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((d) => (
                    <div key={d} className="text-center text-sm font-semibold text-[#5a4f3f] py-2.5 border-r border-[#e8e2d8] last:border-r-0 bg-[#faf8f5]">{d}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7">
                  {calendarDays.map((day, idx) => {
                    const dayEvents = getEventsForDate(day).filter(
                      (e) => !searchQuery || e.summary.toLowerCase().includes(searchQuery.toLowerCase())
                    );
                    const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
                    const isToday = isSameDay(day, new Date());
                    const row = Math.floor(idx / 7);
                    const isLastRow = row === Math.floor((calendarDays.length - 1) / 7);

                    return (
                      <div
                        key={day.toISOString()}
                        className={`min-h-[100px] border-r border-b border-[#e8e2d8] p-1.5 text-left flex flex-col
                          ${isLastRow ? 'border-b-0' : ''} ${idx % 7 === 6 ? 'border-r-0' : ''}
                          ${!isCurrentMonth ? 'bg-[#faf8f5]' : 'bg-white'}`}
                      >
                        <div className="flex items-center justify-end w-full mb-1">
                          <span className={`text-sm font-medium ${isToday ? 'bg-[#c49a3c] text-white w-6 h-6 rounded-full flex items-center justify-center' : !isCurrentMonth ? 'text-[#c4bba8]' : 'text-[#5a4f3f]'}`}>
                            {format(day, 'd')}
                          </span>
                        </div>
                        <div className="flex flex-col gap-0.5 w-full overflow-hidden flex-1">
                          {dayEvents.slice(0, 3).map((event) => {
                            const status = getEventStatus(event);
                            const colors = getStatusBarColor(status);
                            return (
                              <button
                                key={event.uid}
                                onClick={() => setSelectedEvent(event)}
                                className={`${colors.bg} border ${colors.border} rounded px-1.5 py-0.5 truncate text-left hover:opacity-80 transition-opacity`}
                                title={event.summary}
                              >
                                <span className={`text-[11px] font-medium ${colors.text} leading-tight`}>
                                  {(() => { try { return format(parseISO(event.dtstart), 'h:mma').toLowerCase(); } catch { return ''; } })()}{' '}
                                  {event.summary}
                                </span>
                              </button>
                            );
                          })}
                          {dayEvents.length > 3 && (
                            <span className="text-[10px] text-[#8a7d6b] pl-1">+{dayEvents.length - 3} more</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Detail Panel */}
            {selectedEvent && (
              <div className="lg:w-[420px] shrink-0">
                <div className="lg:sticky lg:top-6">
                  <EventDetailPanel
                    event={selectedEvent}
                    statusOverride={statusOverrides[selectedEvent.uid]}
                    onClose={() => setSelectedEvent(null)}
                    onStatusChange={handleStatusChange}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
