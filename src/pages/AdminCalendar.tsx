import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader2, ArrowLeft, Calendar as CalendarIcon, MapPin, Clock, Save, ChevronLeft, ChevronRight, Settings2 } from 'lucide-react';
import { toast } from 'sonner';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, getDay, parseISO } from 'date-fns';
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

  useEffect(() => {
    if (!authLoading && !user) navigate('/admin/login');
  }, [user, authLoading, navigate]);

  // Load saved iCal URL
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

  // Fetch events
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
      if (data.error && data.events?.length === 0) {
        setShowSettings(true);
      }
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

  // Calendar grid helpers
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDayOfWeek = getDay(monthStart); // 0=Sun

  const getEventsForDate = (date: Date) =>
    events.filter((e) => {
      try {
        return isSameDay(parseISO(e.dtstart), date);
      } catch {
        return false;
      }
    });

  const selectedEvents = selectedDate ? getEventsForDate(selectedDate) : [];

  if (authLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-white" />
      </div>
    );
  }

  if (!user || !isAdmin) return null;

  return (
    <div className="relative min-h-screen bg-black">
      <div className="fixed inset-0 bg-gradient-to-br from-black via-zinc-900 to-black z-0" />
      <div
        className="fixed inset-0 z-[1] opacity-5 pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '50px 50px',
        }}
      />

      {/* Header */}
      <header className="relative z-10 border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => navigate('/admin')} className="text-zinc-400 hover:text-white">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back
              </Button>
              <img src={soleiaLogo} alt="Soleia" className="h-8 w-auto object-contain hidden sm:block" />
            </div>
            <Button variant="ghost" size="sm" onClick={() => setShowSettings(!showSettings)} className="text-zinc-400 hover:text-white">
              <Settings2 className="w-4 h-4 mr-2" /> Settings
            </Button>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-6 flex items-center gap-3">
          <CalendarIcon className="w-7 h-7 text-amber-400" />
          Event Calendar
        </h1>

        {/* Settings Panel */}
        {showSettings && (
          <Card className="mb-6 bg-zinc-900/80 border-zinc-700">
            <CardHeader>
              <CardTitle className="text-white text-lg">Triple Seat iCal Feed</CardTitle>
              <CardDescription className="text-zinc-400">
                Paste your Triple Seat calendar export URL to sync events
              </CardDescription>
            </CardHeader>
            <CardContent className="flex gap-3">
              <Input
                value={icalUrl}
                onChange={(e) => setIcalUrl(e.target.value)}
                placeholder="https://app.tripleseat.com/calendar/feed/..."
                className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 flex-1"
              />
              <Button onClick={saveIcalUrl} disabled={savingUrl} className="gap-2">
                {savingUrl ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save
              </Button>
            </CardContent>
          </Card>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Calendar Grid */}
            <div className="lg:col-span-2">
              <Card className="bg-zinc-900/80 border-zinc-700">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <Button variant="ghost" size="sm" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="text-zinc-400 hover:text-white">
                      <ChevronLeft className="w-5 h-5" />
                    </Button>
                    <h2 className="text-lg font-semibold text-white">
                      {format(currentMonth, 'MMMM yyyy')}
                    </h2>
                    <Button variant="ghost" size="sm" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="text-zinc-400 hover:text-white">
                      <ChevronRight className="w-5 h-5" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Day headers */}
                  <div className="grid grid-cols-7 gap-1 mb-2">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                      <div key={d} className="text-center text-xs font-medium text-zinc-500 py-2">{d}</div>
                    ))}
                  </div>

                  {/* Day cells */}
                  <div className="grid grid-cols-7 gap-1">
                    {/* Empty cells for offset */}
                    {Array.from({ length: startDayOfWeek }).map((_, i) => (
                      <div key={`empty-${i}`} className="aspect-square" />
                    ))}
                    {daysInMonth.map((day) => {
                      const dayEvents = getEventsForDate(day);
                      const isToday = isSameDay(day, new Date());
                      const isSelected = selectedDate && isSameDay(day, selectedDate);

                      return (
                        <button
                          key={day.toISOString()}
                          onClick={() => setSelectedDate(day)}
                          className={`aspect-square rounded-lg p-1 text-sm flex flex-col items-center justify-start transition-colors relative
                            ${isToday ? 'ring-1 ring-amber-500/50' : ''}
                            ${isSelected ? 'bg-amber-500/20 border border-amber-500/40' : 'hover:bg-zinc-800/60'}
                          `}
                        >
                          <span className={`text-xs font-medium ${isToday ? 'text-amber-400' : 'text-zinc-300'}`}>
                            {format(day, 'd')}
                          </span>
                          {dayEvents.length > 0 && (
                            <div className="flex gap-0.5 mt-1 flex-wrap justify-center">
                              {dayEvents.slice(0, 3).map((_, i) => (
                                <div key={i} className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                              ))}
                              {dayEvents.length > 3 && (
                                <span className="text-[10px] text-amber-400">+{dayEvents.length - 3}</span>
                              )}
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Event Detail Sidebar */}
            <div className="space-y-4">
              <Card className="bg-zinc-900/80 border-zinc-700">
                <CardHeader className="pb-3">
                  <CardTitle className="text-white text-base">
                    {selectedDate ? format(selectedDate, 'EEEE, MMMM d, yyyy') : 'Select a date'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {!selectedDate && (
                    <p className="text-zinc-500 text-sm">Click a date to see events</p>
                  )}
                  {selectedDate && selectedEvents.length === 0 && (
                    <p className="text-zinc-500 text-sm">No events on this day</p>
                  )}
                  {selectedEvents.map((event) => (
                    <div key={event.uid} className="bg-zinc-800/60 border border-zinc-700 rounded-lg p-4 space-y-2">
                      <h3 className="text-white font-medium text-sm">{event.summary}</h3>
                      {event.location && (
                        <div className="flex items-center gap-2 text-zinc-400 text-xs">
                          <MapPin className="w-3.5 h-3.5 shrink-0" />
                          <span>{event.location}</span>
                        </div>
                      )}
                      {event.dtstart && (
                        <div className="flex items-center gap-2 text-zinc-400 text-xs">
                          <Clock className="w-3.5 h-3.5 shrink-0" />
                          <span>
                            {(() => {
                              try {
                                const start = parseISO(event.dtstart);
                                const end = event.dtend ? parseISO(event.dtend) : null;
                                return `${format(start, 'h:mm a')}${end ? ` – ${format(end, 'h:mm a')}` : ''}`;
                              } catch {
                                return event.dtstart;
                              }
                            })()}
                          </span>
                        </div>
                      )}
                      {event.status && (
                        <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-xs">
                          {event.status}
                        </Badge>
                      )}
                      {event.description && (
                        <p className="text-zinc-500 text-xs whitespace-pre-line line-clamp-4 mt-1">
                          {event.description}
                        </p>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Upcoming Events */}
              <Card className="bg-zinc-900/80 border-zinc-700">
                <CardHeader className="pb-3">
                  <CardTitle className="text-white text-base">Upcoming Events</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {events
                    .filter((e) => {
                      try { return parseISO(e.dtstart) >= new Date(); } catch { return false; }
                    })
                    .slice(0, 5)
                    .map((event) => (
                      <button
                        key={event.uid}
                        onClick={() => {
                          try {
                            const d = parseISO(event.dtstart);
                            setCurrentMonth(d);
                            setSelectedDate(d);
                          } catch {}
                        }}
                        className="w-full text-left bg-zinc-800/40 hover:bg-zinc-800/80 rounded-lg p-3 transition-colors"
                      >
                        <p className="text-white text-sm font-medium truncate">{event.summary}</p>
                        <p className="text-zinc-500 text-xs mt-0.5">
                          {(() => {
                            try { return format(parseISO(event.dtstart), 'MMM d, h:mm a'); } catch { return event.dtstart; }
                          })()}
                        </p>
                      </button>
                    ))}
                  {events.filter((e) => {
                    try { return parseISO(e.dtstart) >= new Date(); } catch { return false; }
                  }).length === 0 && (
                    <p className="text-zinc-500 text-sm">No upcoming events</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
