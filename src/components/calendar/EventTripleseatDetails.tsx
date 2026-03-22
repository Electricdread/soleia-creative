import { Building2, Users, Hash, Tag, UserCircle, CalendarClock } from 'lucide-react';

interface ParsedDetails {
  [key: string]: string;
}

function parseDescription(description: string): ParsedDetails {
  const details: ParsedDetails = {};
  if (!description) return details;

  // Triple Seat iCal descriptions often contain key-value pairs
  // Try line-by-line parsing for "Key: Value" or "Key - Value" patterns
  const lines = description.split(/\n/).map(l => l.trim()).filter(Boolean);

  for (const line of lines) {
    // Match patterns like "Event Id: 39783199" or "Expected Guests: 700"
    const kvMatch = line.match(/^([A-Za-z# ]+?)\s*[:]\s*(.+)$/);
    if (kvMatch) {
      const key = kvMatch[1].trim();
      const value = kvMatch[2].trim();
      if (key && value) {
        details[key] = value;
      }
    }
  }

  return details;
}

// Map of known Triple Seat fields to icons and display labels
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

  if (entries.length === 0) {
    return (
      <p className="text-xs text-[#8a7d6b] italic">No additional event details available from Triple Seat.</p>
    );
  }

  // Sort by known priority, unknowns at end
  const sorted = entries.sort(([a], [b]) => {
    const pa = fieldConfig[a]?.priority ?? 99;
    const pb = fieldConfig[b]?.priority ?? 99;
    return pa - pb;
  });

  return (
    <div className="space-y-3">
      <h4 className="text-xs font-semibold text-[#5a4f3f] uppercase tracking-wider flex items-center gap-1.5">
        <Building2 className="w-3.5 h-3.5 text-[#c49a3c]" />
        Triple Seat Details
      </h4>
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

      {/* Show raw description if there's content that wasn't parsed into key-value pairs */}
      {description && entries.length === 0 && (
        <div className="mt-2 p-2 bg-[#faf8f5] rounded text-xs text-[#5a4f3f] whitespace-pre-wrap">{description}</div>
      )}
    </div>
  );
}
