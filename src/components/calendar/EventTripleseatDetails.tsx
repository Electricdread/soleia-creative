import { useState, useEffect } from 'react';
import { Building2, Users, Hash, Tag, UserCircle, CalendarClock, ExternalLink, RefreshCw, Mail, Phone, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';

interface ScrapedData {
  [key: string]: string;
}

function extractTripleseatUrl(description: string): string | null {
  if (!description) return null;
  const match = description.match(/https?:\/\/[^\s]*tripleseat\.com[^\s]*/i);
  return match ? match[0] : null;
}

const fieldConfig: Record<string, { label: string; icon: typeof Building2; priority: number }> = {
  'page_title': { label: 'Page Title', icon: Tag, priority: 0 },
  'Event Name': { label: 'Event Name', icon: Tag, priority: 1 },
  'Event ID': { label: 'Event ID', icon: Hash, priority: 2 },
  'Status': { label: 'Status', icon: Tag, priority: 3 },
  'Event Date': { label: 'Event Date', icon: CalendarClock, priority: 4 },
  'Event Time': { label: 'Event Time', icon: CalendarClock, priority: 5 },
  'Event Type': { label: 'Event Type', icon: Tag, priority: 6 },
  'Area': { label: 'Area(s)', icon: Building2, priority: 7 },
  'Areas': { label: 'Area(s)', icon: Building2, priority: 7 },
  'Booking': { label: 'Booking', icon: CalendarClock, priority: 8 },
  'Expected Guests': { label: 'Expected Guests', icon: Users, priority: 9 },
  'Guaranteed Guests': { label: 'Guaranteed Guests', icon: Users, priority: 10 },
  'Contact': { label: 'Contact', icon: UserCircle, priority: 11 },
  'Company': { label: 'Company', icon: Briefcase, priority: 12 },
  'Email': { label: 'Email', icon: Mail, priority: 13 },
  'Phone': { label: 'Phone', icon: Phone, priority: 14 },
  'Owner': { label: 'Owner', icon: UserCircle, priority: 15 },
  'Manager': { label: 'Manager', icon: UserCircle, priority: 16 },
  'Managers': { label: 'Managers', icon: UserCircle, priority: 16 },
  'Lead Source': { label: 'Lead Source', icon: Tag, priority: 17 },
  'Meal Periods': { label: 'Meal Periods', icon: Tag, priority: 18 },
  'Created On': { label: 'Created', icon: CalendarClock, priority: 19 },
  'Updated At': { label: 'Updated', icon: CalendarClock, priority: 20 },
};

export function EventTripleseatDetails({ description, eventUid }: { description: string; eventUid: string }) {
  const tripleseatUrl = extractTripleseatUrl(description);
  const [scrapedData, setScrapedData] = useState<ScrapedData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load cached data on mount
  useEffect(() => {
    if (!eventUid) return;
    loadCachedData();
  }, [eventUid]);

  async function loadCachedData() {
    const { data } = await supabase
      .from('calendar_event_tripleseat_cache')
      .select('scraped_data')
      .eq('event_uid', eventUid)
      .maybeSingle();

    if (data?.scraped_data) {
      setScrapedData(data.scraped_data as unknown as ScrapedData);
    }
  }

  async function handleScrape() {
    if (!tripleseatUrl) return;
    setLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('scrape-tripleseat', {
        body: { event_uid: eventUid, tripleseat_url: tripleseatUrl },
      });

      if (fnError) throw new Error(fnError.message);
      if (!data?.success) throw new Error(data?.error || 'Scrape failed');

      setScrapedData(data.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const entries = scrapedData
    ? Object.entries(scrapedData).filter(([, v]) => v && v.trim().length > 0)
    : [];

  const sorted = entries.sort(([a], [b]) => {
    const pa = fieldConfig[a]?.priority ?? 99;
    const pb = fieldConfig[b]?.priority ?? 99;
    return pa - pb;
  });

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold text-[#5a4f3f] uppercase tracking-wider flex items-center gap-1.5">
          <Building2 className="w-3.5 h-3.5 text-[#c49a3c]" />
          Triple Seat Details
        </h4>
        <div className="flex items-center gap-1.5">
          {tripleseatUrl && (
            <>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-[10px] gap-1 border-[#d6cfc3] text-[#5a4f3f] hover:bg-[#f0ece4]"
                onClick={handleScrape}
                disabled={loading}
              >
                <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                {scrapedData ? 'Refresh' : 'Fetch Details'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-[10px] gap-1 border-[#d6cfc3] text-[#5a4f3f] hover:bg-[#f0ece4]"
                onClick={() => window.open(tripleseatUrl, '_blank')}
              >
                <ExternalLink className="w-3 h-3" />
                Open in Triple Seat
              </Button>
            </>
          )}
        </div>
      </div>

      {loading && (
        <div className="space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      )}

      {error && (
        <p className="text-xs text-red-600 bg-red-50 rounded p-2 border border-red-200">
          {error}
        </p>
      )}

      {!loading && sorted.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
          {sorted.map(([key, value]) => {
            const config = fieldConfig[key];
            const Icon = config?.icon || Tag;
            const label = config?.label || key;
            return (
              <div key={key} className="flex items-start gap-2 py-1 border-b border-[#f0ebe3] last:border-b-0">
                <Icon className="w-3.5 h-3.5 text-[#8a7d6b] mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <span className="text-[10px] text-[#8a7d6b] uppercase tracking-wide font-medium block">{label}</span>
                  <span className="text-xs text-[#3d3629] font-medium break-words">{value}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!loading && sorted.length === 0 && !error && (
        <p className="text-xs text-[#8a7d6b] italic">
          {tripleseatUrl
            ? 'Click "Fetch Details" to pull event info from Triple Seat.'
            : 'No Triple Seat link found in this event.'}
        </p>
      )}
    </div>
  );
}
