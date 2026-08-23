import { useEffect, useMemo, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { Copy, Loader2, RotateCcw, Save, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { assetDeadlineFor } from '@/lib/businessDays';

/**
 * The brief a PM writes when a job lands.
 *
 * It is the same seven answers every time, and six of them are already known —
 * the calendar feed has the group, the date, the time and the room, the Triple
 * Seat scrape has the headcount, and the asset deadline is 21 business days
 * back from show day. So they are filled in, and the PM writes the part no
 * system knows: the notes.
 *
 * Every field stays editable, because the feed is often approximate: "5:00 pm"
 * in iCal is "5:00 pm - 8:00 pm" in the brief, and a negotiated deadline has to
 * survive being different from the computed one.
 */

interface BriefRow {
  group_name: string;
  event_date_text: string;
  event_time_text: string;
  guest_count: string;
  location: string;
  deadline_on: string | null;
  additional_notes: string;
}

const EMPTY: BriefRow = {
  group_name: '',
  event_date_text: '',
  event_time_text: '',
  guest_count: '',
  location: '',
  deadline_on: null,
  additional_notes: '',
};

interface EventBriefProps {
  eventUid: string;
  summary: string;
  dtstart: string;
  dtend?: string;
  location?: string;
}

/** Strip the [D]/[T]/[P]/[C] status prefix Triple Seat puts on event titles. */
const cleanTitle = (s: string) => s.replace(/^\[(D|T|P|C)\]\s*/i, '').trim();

const longDate = (value: string | Date) => {
  try {
    const d = typeof value === 'string' ? parseISO(value) : value;
    return format(d, 'EEEE, MMMM d, yyyy');
  } catch {
    return '';
  }
};

const clockTime = (value?: string) => {
  if (!value) return '';
  try {
    return format(parseISO(value), 'h:mm a').toLowerCase();
  } catch {
    return '';
  }
};

function buildFromEvent({
  summary,
  dtstart,
  dtend,
  location,
  guests,
}: {
  summary: string;
  dtstart: string;
  dtend?: string;
  location?: string;
  guests: string;
}): BriefRow {
  const start = clockTime(dtstart);
  const end = clockTime(dtend);
  let deadline: string | null = null;
  try {
    deadline = format(assetDeadlineFor(parseISO(dtstart)), 'yyyy-MM-dd');
  } catch { /* an event with no parsable date leaves the deadline to the PM */ }
  return {
    group_name: cleanTitle(summary),
    event_date_text: longDate(dtstart),
    event_time_text: start ? (end ? `${start} - ${end}` : start) : '',
    guest_count: guests,
    location: location?.trim() || 'Soleia',
    deadline_on: deadline,
    additional_notes: '',
  };
}

export function EventBrief({ eventUid, summary, dtstart, dtend, location }: EventBriefProps) {
  const [row, setRow] = useState<BriefRow>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  // What the event itself says, used to fill a blank brief and to offer a
  // "re-read the event" reset once the feed has been corrected.
  const [scrapedGuests, setScrapedGuests] = useState('');
  const fromEvent = useMemo<BriefRow>(
    () => buildFromEvent({ summary, dtstart, dtend, location, guests: scrapedGuests }),
    [summary, dtstart, dtend, location, scrapedGuests],
  );

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      const [{ data: brief }, { data: cache }] = await Promise.all([
        supabase.from('calendar_event_brief').select('*').eq('event_uid', eventUid).maybeSingle(),
        supabase
          .from('calendar_event_tripleseat_cache')
          .select('scraped_data')
          .eq('event_uid', eventUid)
          .maybeSingle(),
      ]);
      if (cancelled) return;

      const scraped = cache?.scraped_data as { guaranteed_guests?: string; expected_guests?: string } | null;
      const guests = scraped?.guaranteed_guests || scraped?.expected_guests || '';
      setScrapedGuests(guests);

      if (brief) {
        setRow({
          group_name: brief.group_name ?? '',
          event_date_text: brief.event_date_text ?? '',
          event_time_text: brief.event_time_text ?? '',
          guest_count: brief.guest_count ?? '',
          location: brief.location ?? '',
          deadline_on: brief.deadline_on,
          additional_notes: brief.additional_notes ?? '',
        });
      } else {
        // A blank brief starts from the event rather than from nothing. Built
        // here, where the scraped headcount has just been read, so the first
        // render is already filled in.
        setRow(buildFromEvent({ summary, dtstart, dtend, location, guests }));
      }
      setDirty(false);
      setLoading(false);
    };

    load();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventUid]);

  const set = <K extends keyof BriefRow>(field: K, value: BriefRow[K]) => {
    setRow((r) => ({ ...r, [field]: value }));
    setDirty(true);
  };

  const asText = () => {
    const lines = [
      `Group Name: ${row.group_name}`,
      `Event Date: ${row.event_date_text}`,
      `Event Time: ${row.event_time_text}`,
      `# of guests: ${row.guest_count}`,
      `Location: ${row.location}`,
      `21-Business Day Deadline: ${row.deadline_on ? longDate(`${row.deadline_on}T00:00:00`) : ''}`,
      'Additional Notes:',
      row.additional_notes,
    ];
    return lines.join('\n');
  };

  const save = async () => {
    setSaving(true);
    const { error } = await supabase
      .from('calendar_event_brief')
      .upsert({ event_uid: eventUid, ...row, updated_at: new Date().toISOString() }, { onConflict: 'event_uid' });
    setSaving(false);
    if (error) {
      toast.error('Could not save the brief');
      return;
    }
    setDirty(false);
    toast.success('Brief saved');
  };

  const copy = async () => {
    await navigator.clipboard.writeText(asText());
    toast.success('Brief copied');
  };

  const resetFromEvent = () => {
    setRow((r) => ({ ...fromEvent, additional_notes: r.additional_notes }));
    setDirty(true);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-6">
        <Loader2 className="h-4 w-4 animate-spin text-primary" />
      </div>
    );
  }

  const computedDeadline = fromEvent.deadline_on;
  const deadlineIsComputed = row.deadline_on === computedDeadline;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h4 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-foreground/70">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          Brief
        </h4>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={resetFromEvent}
            className="h-7 gap-1 px-2 text-[10px] text-muted-foreground hover:text-foreground"
            title="Refill the fields above from the calendar event"
          >
            <RotateCcw className="h-3 w-3" /> Refill
          </Button>
          <Button variant="outline" size="sm" onClick={copy} className="h-7 gap-1 px-2 text-[10px]">
            <Copy className="h-3 w-3" /> Copy
          </Button>
          <Button size="sm" onClick={save} disabled={saving || !dirty} className="h-7 gap-1 px-2 text-[10px]">
            {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
            {dirty ? 'Save' : 'Saved'}
          </Button>
        </div>
      </div>

      <div className="grid gap-2.5 sm:grid-cols-2">
        <Field label="Group Name" className="sm:col-span-2">
          <Input value={row.group_name} onChange={(e) => set('group_name', e.target.value)} className="h-8 text-xs" placeholder="NCAN *National College Attainment Network" />
        </Field>
        <Field label="Event Date">
          <Input value={row.event_date_text} onChange={(e) => set('event_date_text', e.target.value)} className="h-8 text-xs" placeholder="Monday, October 5, 2026" />
        </Field>
        <Field label="Event Time">
          <Input value={row.event_time_text} onChange={(e) => set('event_time_text', e.target.value)} className="h-8 text-xs" placeholder="5:00 pm - 8:00 pm" />
        </Field>
        <Field label="# of guests">
          <Input value={row.guest_count} onChange={(e) => set('guest_count', e.target.value)} className="h-8 text-xs" placeholder="700" />
        </Field>
        <Field label="Location">
          <Input value={row.location} onChange={(e) => set('location', e.target.value)} className="h-8 text-xs" placeholder="Soleia" />
        </Field>
        <Field
          label="21-Business Day Deadline"
          className="sm:col-span-2"
          hint={
            row.deadline_on
              ? deadlineIsComputed
                ? `${longDate(`${row.deadline_on}T00:00:00`)} — 21 business days back, holidays skipped`
                : `${longDate(`${row.deadline_on}T00:00:00`)} — set by hand`
              : undefined
          }
        >
          <div className="flex items-center gap-2">
            <Input
              type="date"
              value={row.deadline_on ?? ''}
              onChange={(e) => set('deadline_on', e.target.value || null)}
              className="h-8 w-auto text-xs"
            />
            {computedDeadline && !deadlineIsComputed && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => set('deadline_on', computedDeadline)}
                className="h-7 px-2 text-[10px] text-muted-foreground hover:text-foreground"
              >
                Use {format(parseISO(`${computedDeadline}T00:00:00`), 'MMM d')}
              </Button>
            )}
          </div>
        </Field>
      </div>

      <Field label="Additional Notes">
        <Textarea
          value={row.additional_notes}
          onChange={(e) => set('additional_notes', e.target.value)}
          rows={7}
          className="text-xs leading-relaxed"
          placeholder={'3pm public pool closure\nNCAN is a non-profit that works with high school and college kids.\nNo theme — keep to the conference logos and organization colours.'}
        />
      </Field>
    </div>
  );
}

function Field({
  label,
  hint,
  className,
  children,
}: {
  label: string;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <Label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </Label>
      {children}
      {hint && <p className="mt-1 text-[10px] text-muted-foreground/70">{hint}</p>}
    </div>
  );
}
