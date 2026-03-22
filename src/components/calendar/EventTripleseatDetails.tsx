import { useState, useEffect } from 'react';
import { Building2, Users, Hash, Tag, UserCircle, CalendarClock, ExternalLink, Mail, Phone, Briefcase, Save, Pencil, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';

interface FieldDef {
  key: string;
  label: string;
  icon: typeof Building2;
}

const fields: FieldDef[] = [
  { key: 'Event Name', label: 'Event Name', icon: Tag },
  { key: 'Event ID', label: 'Event ID', icon: Hash },
  { key: 'Status', label: 'Status', icon: Tag },
  { key: 'Event Date', label: 'Event Date', icon: CalendarClock },
  { key: 'Event Time', label: 'Event Time', icon: CalendarClock },
  { key: 'Event Type', label: 'Event Type', icon: Tag },
  { key: 'Area', label: 'Area(s)', icon: Building2 },
  { key: 'Expected Guests', label: 'Expected Guests', icon: Users },
  { key: 'Guaranteed Guests', label: 'Guaranteed Guests', icon: Users },
  { key: 'Contact', label: 'Contact', icon: UserCircle },
  { key: 'Company', label: 'Company', icon: Briefcase },
  { key: 'Email', label: 'Email', icon: Mail },
  { key: 'Phone', label: 'Phone', icon: Phone },
  { key: 'Owner', label: 'Owner', icon: UserCircle },
  { key: 'Manager', label: 'Manager', icon: UserCircle },
  { key: 'Booking', label: 'Booking', icon: CalendarClock },
  { key: 'Lead Source', label: 'Lead Source', icon: Tag },
  { key: 'Meal Periods', label: 'Meal Periods', icon: Tag },
];

function extractTripleseatUrl(description: string): string | null {
  if (!description) return null;
  const match = description.match(/https?:\/\/[^\s]*tripleseat\.com[^\s]*/i);
  return match ? match[0] : null;
}

type FieldData = Record<string, string>;

export function EventTripleseatDetails({ description, eventUid }: { description: string; eventUid: string }) {
  const tripleseatUrl = extractTripleseatUrl(description);
  const [data, setData] = useState<FieldData>({});
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<FieldData>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!eventUid) return;
    loadCachedData();
  }, [eventUid]);

  async function loadCachedData() {
    const { data: cached } = await supabase
      .from('calendar_event_tripleseat_cache')
      .select('scraped_data')
      .eq('event_uid', eventUid)
      .maybeSingle();

    if (cached?.scraped_data) {
      const d = cached.scraped_data as unknown as FieldData;
      setData(d);
      setDraft(d);
    }
  }

  function startEditing() {
    setDraft({ ...data });
    setEditing(true);
  }

  function cancelEditing() {
    setDraft({ ...data });
    setEditing(false);
  }

  async function handleSave() {
    setSaving(true);
    // Filter out empty values
    const cleaned: FieldData = {};
    for (const [k, v] of Object.entries(draft)) {
      if (v && v.trim()) cleaned[k] = v.trim();
    }

    const { error } = await supabase
      .from('calendar_event_tripleseat_cache')
      .upsert({
        event_uid: eventUid,
        tripleseat_url: tripleseatUrl || '',
        scraped_data: cleaned as any,
        scraped_at: new Date().toISOString(),
      }, { onConflict: 'event_uid' });

    if (!error) {
      setData(cleaned);
      setEditing(false);
    }
    setSaving(false);
  }

  const hasData = Object.values(data).some(v => v && v.trim());

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold text-[#5a4f3f] uppercase tracking-wider flex items-center gap-1.5">
          <Building2 className="w-3.5 h-3.5 text-[#c49a3c]" />
          Triple Seat Details
        </h4>
        <div className="flex items-center gap-1.5">
          {!editing ? (
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-[10px] gap-1 border-[#d6cfc3] text-[#5a4f3f] hover:bg-[#f0ece4]"
              onClick={startEditing}
            >
              <Pencil className="w-3 h-3" />
              {hasData ? 'Edit' : 'Add Details'}
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-[10px] gap-1 border-[#d6cfc3] text-[#5a4f3f] hover:bg-[#f0ece4]"
                onClick={cancelEditing}
                disabled={saving}
              >
                <X className="w-3 h-3" />
                Cancel
              </Button>
              <Button
                size="sm"
                className="h-7 text-[10px] gap-1 bg-[#c49a3c] hover:bg-[#b38a2c] text-white"
                onClick={handleSave}
                disabled={saving}
              >
                <Save className="w-3 h-3" />
                Save
              </Button>
            </>
          )}
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
      </div>

      {editing ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
          {fields.map((field) => {
            const Icon = field.icon;
            return (
              <div key={field.key} className="flex items-center gap-2 py-1">
                <Icon className="w-3.5 h-3.5 text-[#8a7d6b] shrink-0" />
                <div className="flex-1 min-w-0">
                  <label className="text-[10px] text-[#8a7d6b] uppercase tracking-wide font-medium block mb-0.5">{field.label}</label>
                  <Input
                    value={draft[field.key] || ''}
                    onChange={(e) => setDraft(prev => ({ ...prev, [field.key]: e.target.value }))}
                    className="h-7 text-xs border-[#d6cfc3] bg-white"
                    placeholder={`Enter ${field.label.toLowerCase()}`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      ) : hasData ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
          {fields
            .filter((f) => data[f.key] && data[f.key].trim())
            .map((field) => {
              const Icon = field.icon;
              return (
                <div key={field.key} className="flex items-start gap-2 py-1 border-b border-[#f0ebe3] last:border-b-0">
                  <Icon className="w-3.5 h-3.5 text-[#8a7d6b] mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <span className="text-[10px] text-[#8a7d6b] uppercase tracking-wide font-medium block">{field.label}</span>
                    <span className="text-xs text-[#3d3629] font-medium break-words">{data[field.key]}</span>
                  </div>
                </div>
              );
            })}
        </div>
      ) : (
        <p className="text-xs text-[#8a7d6b] italic">
          {tripleseatUrl
            ? 'No details entered yet. Click "Add Details" to enter event info from Triple Seat.'
            : 'No Triple Seat link found. Click "Add Details" to manually enter event info.'}
        </p>
      )}
    </div>
  );
}
