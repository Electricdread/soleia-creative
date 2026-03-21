import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Loader2, ArrowLeft, ChevronLeft, ChevronRight, Settings2, Save, MapPin, Clock, Search } from 'lucide-react';
import { toast } from 'sonner';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, getDay, parseISO, startOfWeek, endOfWeek } from 'date-fns';
import soleiaLogo from '@/assets/soleia-wide-logo.png';

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
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!authLoading && !user) navigate('/admin/login');
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!authLoading && isAdmin) {
      supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'tripleseat_ical_url')
        .maybeSingle()
        .then(({ data }) => {
          if (data?.value) setIcalUrl(data.value);
        });
    }
  }, [authLoading, isAdmin]);

  useEffect(() => {
    if (!authLoading && isAdmin) fetchEvents();
  }, [authLoading, isAdmin]);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/fetch-ical`,
        {
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );
      const data = await res.json();
      if (data.events) setEvents(data.events);
      if (data.error && data.events?.length === 0) setShowSettings(true);
    } catch (e) {
      console.error('Failed to fetch events:', e);
    }
    setLoading(false);
  };

  const saveIcalUrl = async () => {
    setSavingUrl(true);
    const { error } = await supabase
      .from('site_settings')
      .upsert({ key: 'tripleseat_ical_url', value: icalUrl }, { onConflict: 'key' });
    if (error) {
      toast.error('Failed to save iCal URL');
    } else {
      toast.success('iCal URL saved');
      setShowSettings(false);
      fetchEvents();
    }
    setSavingUrl(false);
  };

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const getEventsForDate = (date: Date) =>
    events.filter((e) => {
      try { return isSameDay(parseISO(e.dtstart), date); } catch { return false; }
    });

  const selectedEvents = selectedDate ? getEventsForDate(selectedDate) : [];

  const goToToday = () => {
    setCurrentMonth(new Date());
    setSelectedDate(new Date());
  };

  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const currentYear = currentMonth.getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

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
        {/* Settings Panel */}
        {showSettings && (
          <Card className="mb-6 bg-white border-[#e0d8cc]">
            <CardHeader>
              <CardTitle className="text-[#3d3629] text-lg font-semibold">Triple Seat iCal Feed</CardTitle>
              <CardDescription className="text-[#8a7d6b]">Paste your Triple Seat calendar export URL to sync events</CardDescription>
            </CardHeader>
            <CardContent className="flex gap-3">
              <Input
                value={icalUrl}
                onChange={(e) => setIcalUrl(e.target.value)}
                placeholder="https://app.tripleseat.com/calendar/feed/..."
                className="bg-[#faf8f5] border-[#d6cfc3] text-[#3d3629] placeholder:text-[#b5ab9a] flex-1"
              />
              <Button onClick={saveIcalUrl} disabled={savingUrl} className="gap-2 bg-[#c49a3c] hover:bg-[#b08a30] text-white">
                {savingUrl ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save
              </Button>
            </CardContent>
          </Card>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-[#c49a3c]" />
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Button size="sm" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} variant="outline" className="border-[#d6cfc3] text-[#5a4f3f] hover:bg-[#f0ebe3] text-sm">
                  <ChevronLeft className="w-4 h-4 mr-1" /> Previous Month
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={currentMonth.getMonth()}
                  onChange={(e) => setCurrentMonth(new Date(currentMonth.getFullYear(), parseInt(e.target.value), 1))}
                  className="border border-[#d6cfc3] rounded-md px-3 py-1.5 text-sm text-[#3d3629] bg-white focus:outline-none focus:ring-2 focus:ring-[#c49a3c]/30"
                >
                  {months.map((m, i) => <option key={m} value={i}>{m}</option>)}
                </select>
                <select
                  value={currentMonth.getFullYear()}
                  onChange={(e) => setCurrentMonth(new Date(parseInt(e.target.value), currentMonth.getMonth(), 1))}
                  className="border border-[#d6cfc3] rounded-md px-3 py-1.5 text-sm text-[#3d3629] bg-white focus:outline-none focus:ring-2 focus:ring-[#c49a3c]/30"
                >
                  {years.map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
                <Button size="sm" onClick={goToToday} className="bg-[#c49a3c] hover:bg-[#b08a30] text-white text-sm px-4">
                  Today
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Button size="sm" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} variant="outline" className="border-[#d6cfc3] text-[#5a4f3f] hover:bg-[#f0ebe3] text-sm">
                  Next Month <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>

            {/* Search */}
            <div className="flex items-center gap-3">
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#b5ab9a]" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by Name..."
                  className="pl-9 bg-white border-[#d6cfc3] text-[#3d3629] placeholder:text-[#b5ab9a] text-sm"
                />
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="bg-white border border-[#d6cfc3] rounded-lg overflow-hidden">
              {/* Day headers */}
              <div className="grid grid-cols-7 border-b border-[#d6cfc3]">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                  <div key={d} className="text-center text-sm font-semibold text-[#5a4f3f] py-2.5 border-r border-[#e8e2d8] last:border-r-0 bg-[#faf8f5]">
                    {d}
                  </div>
                ))}
              </div>

              {/* Day cells */}
              <div className="grid grid-cols-7">
                {calendarDays.map((day, idx) => {
                  const dayEvents = getEventsForDate(day).filter(
                    (e) => !searchQuery || e.summary.toLowerCase().includes(searchQuery.toLowerCase())
                  );
                  const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
                  const isToday = isSameDay(day, new Date());
                  const isSelected = selectedDate && isSameDay(day, selectedDate);
                  const row = Math.floor(idx / 7);
                  const isLastRow = row === Math.floor((calendarDays.length - 1) / 7);

                  return (
                    <button
                      key={day.toISOString()}
                      onClick={() => setSelectedDate(day)}
                      className={`min-h-[100px] border-r border-b border-[#e8e2d8] last:border-r-0 p-1.5 text-left transition-colors flex flex-col
                        ${isLastRow ? 'border-b-0' : ''}
                        ${idx % 7 === 6 ? 'border-r-0' : ''}
                        ${!isCurrentMonth ? 'bg-[#faf8f5]' : 'bg-white'}
                        ${isSelected ? 'bg-[#f5efe5] ring-1 ring-inset ring-[#c49a3c]/40' : 'hover:bg-[#faf8f5]'}
                      `}
                    >
                      {/* Date number + dot */}
                      <div className="flex items-center justify-between w-full mb-1">
                        <div className={`w-2 h-2 rounded-full ${dayEvents.length > 0 ? 'bg-[#d4a843]' : 'bg-[#d6cfc3]/60'}`} />
                        <span className={`text-sm font-medium ${isToday ? 'bg-[#c49a3c] text-white w-6 h-6 rounded-full flex items-center justify-center' : !isCurrentMonth ? 'text-[#c4bba8]' : 'text-[#5a4f3f]'}`}>
                          {format(day, 'd')}
                        </span>
                      </div>

                      {/* Event bars */}
                      <div className="flex flex-col gap-0.5 w-full overflow-hidden flex-1">
                        {dayEvents.slice(0, 3).map((event) => (
                          <div
                            key={event.uid}
                            className="bg-[#d5d6a8]/60 border border-[#c4c590]/50 rounded px-1.5 py-0.5 truncate"
                            title={event.summary}
                          >
                            <span className="text-[11px] font-medium text-[#4a4b2e] leading-tight">
                              {(() => {
                                try { return format(parseISO(event.dtstart), 'h:mma').toLowerCase(); } catch { return ''; }
                              })()}{' '}
                              {event.summary}
                            </span>
                          </div>
                        ))}
                        {dayEvents.length > 3 && (
                          <span className="text-[10px] text-[#8a7d6b] pl-1">+{dayEvents.length - 3} more</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selected date detail */}
            {selectedDate && selectedEvents.length > 0 && (
              <Card className="bg-white border-[#e0d8cc]">
                <CardHeader className="pb-3">
                  <CardTitle className="text-[#3d3629] text-base font-semibold">
                    {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {selectedEvents.map((event) => (
                    <div key={event.uid} className="bg-[#faf8f5] border border-[#e8e2d8] rounded-lg p-4 space-y-2">
                      <h3 className="text-[#3d3629] font-semibold text-sm">{event.summary}</h3>
                      {event.location && (
                        <div className="flex items-center gap-2 text-[#8a7d6b] text-xs">
                          <MapPin className="w-3.5 h-3.5 shrink-0" />
                          <span>{event.location}</span>
                        </div>
                      )}
                      {event.dtstart && (
                        <div className="flex items-center gap-2 text-[#8a7d6b] text-xs">
                          <Clock className="w-3.5 h-3.5 shrink-0" />
                          <span>
                            {(() => {
                              try {
                                const start = parseISO(event.dtstart);
                                const end = event.dtend ? parseISO(event.dtend) : null;
                                return `${format(start, 'h:mm a')}${end ? ` – ${format(end, 'h:mm a')}` : ''}`;
                              } catch { return event.dtstart; }
                            })()}
                          </span>
                        </div>
                      )}
                      {event.description && (
                        <p className="text-[#8a7d6b] text-xs whitespace-pre-line line-clamp-4 mt-1">{event.description}</p>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
