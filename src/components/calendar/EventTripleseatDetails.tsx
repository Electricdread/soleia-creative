import { Building2, Users, Hash, Tag, UserCircle, CalendarClock, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ParsedDetails {
  [key: string]: string;
}

function extractTripleseatUrl(description: string): string | null {
  if (!description) return null;
  const match = description.match(/https?:\/\/[^\s]*tripleseat\.com[^\s]*/i);
  return match ? match[0] : null;
}

function parseDescription(description: string): ParsedDetails {
  const details: ParsedDetails = {};
  if (!description) return details;

  const lines = description.split(/\n/).map(l => l.trim()).filter(Boolean);

  for (const line of lines) {
    // Skip lines that are just URLs
    if (/^https?:\/\//i.test(line)) continue;
    
    const kvMatch = line.match(/^([A-Za-z# ]+?)\s*[:]\s*(.+)$/);
    if (kvMatch) {
      const key = kvMatch[1].trim();
      const value = kvMatch[2].trim();
      // Skip if key is "https" or "http" (URL fragments)
      if (key.toLowerCase() === 'https' || key.toLowerCase() === 'http') continue;
      if (key && value) {
        details[key] = value;
      }
    }
  }

  return details;
}

const fieldConfig: Record<string, { label: string; icon: typeof Building2; priority: number }> = {
  'Event Id': { label: 'Event ID', icon: Hash, priority: 1 },
  'Event Name': { label: 'Event Name', icon: Tag, priority: 2 },
  'Area': { label: 'Area(s)', icon: Building2, priority: 3 },
  'Areas': { label: 'Area(s)', icon: Building2, priority: 3 },
  'Area(s)': { label: 'Area(s)', icon: Building2, priority: 3 },
  'Event Style': { label: 'Event Style', icon: Tag, priority: 4 },
  'Event Type': { label: 'Event Type', icon: Tag, priority: 4 },
  'Booking': { label: 'Booking', icon: CalendarClock, priority: 5 },
  '# Expected Guests': { label: 'Expected Guests', icon: Users, priority: 6 },
  'Expected Guests': { label: 'Expected Guests', icon: Users, priority: 6 },
  '# Guaranteed Guests': { label: 'Guaranteed Guests', icon: Users, priority: 7 },
  'Guaranteed Guests': { label: 'Guaranteed Guests', icon: Users, priority: 7 },
  'Owner': { label: 'Owner', icon: UserCircle, priority: 8 },
  'Managers': { label: 'Managers', icon: UserCircle, priority: 9 },
  'Manager': { label: 'Manager', icon: UserCircle, priority: 9 },
  'Lead Source': { label: 'Lead Source', icon: Tag, priority: 10 },
  'Meal Periods': { label: 'Meal Periods', icon: Tag, priority: 11 },
  'Created On': { label: 'Created', icon: CalendarClock, priority: 12 },
  'Updated At': { label: 'Updated', icon: CalendarClock, priority: 13 },
};

export function EventTripleseatDetails({ description }: { description: string }) {
  const parsed = parseDescription(description);
  const entries = Object.entries(parsed);
  const tripleseatUrl = extractTripleseatUrl(description);

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
        {tripleseatUrl && (
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-[10px] gap-1 border-[#d6cfc3] text-[#5a4f3f] hover:bg-[#f0ece4]"
            onClick={() => window.open(tripleseatUrl, '_blank')}
          >
            <ExternalLink className="w-3 h-3" />
            Open in Triple Seat
          </Button>
        )}
      </div>

      {sorted.length > 0 ? (
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
                  <span className="text-xs text-[#3d3629] font-medium">{value}</span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-xs text-[#8a7d6b] italic">
          {tripleseatUrl
            ? 'No additional details parsed from the feed. Click "Open in Triple Seat" to view full event info.'
            : 'No event details available.'}
        </p>
      )}
    </div>
  );
}