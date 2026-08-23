import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Plus, Trash2, Video, Copy, ClipboardPaste, CalendarClock, AlertTriangle, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { EventCircleback } from './EventCircleback';
import { labelForUrl, parseInvite } from '@/lib/meetingInvite';
import { cn } from '@/lib/utils';

/**
 * Meetings on an event.
 *
 * A meeting link on its own is a dead end: it cannot be drawn on the calendar
 * and it cannot warn anyone that it starts in ten minutes. So a link is stored
 * with when it happens, and the fastest way to supply that is to paste the
 * invite the client sent and let it be read out.
 *
 * Call notes live here too — the call and the notes it produced are the same
 * piece of work, and they were a tab apart.
 */

interface MeetingLink {
  id: string;
  label: string;
  url: string;
  link_type: string;
  meeting_at: string | null;
  duration_minutes: number | null;
  created_at: string;
}

const MINUTE = 60 * 1000;

/** How a meeting reads right now: the thing the PM actually scans for. */
function meetingState(link: MeetingLink): { tone: 'live' | 'soon' | 'upcoming' | 'past'; text: string } | null {
  if (!link.meeting_at) return null;
  const start = new Date(link.meeting_at).getTime();
  const end = start + (link.duration_minutes ?? 60) * MINUTE;
  const now = Date.now();

  if (now >= start && now <= end) return { tone: 'live', text: 'happening now' };
  if (now > end) {
    const days = Math.round((now - end) / (24 * 60 * MINUTE));
    return { tone: 'past', text: days <= 0 ? 'ended' : `${days}d ago` };
  }
  const minutes = Math.round((start - now) / MINUTE);
  if (minutes <= 60) return { tone: 'soon', text: `starts in ${minutes}m` };
  if (minutes <= 24 * 60) return { tone: 'soon', text: `in ${Math.round(minutes / 60)}h` };
  return { tone: 'upcoming', text: `in ${Math.round(minutes / (24 * 60))}d` };
}

interface EventMeetingLinksProps {
  eventUid: string;
  /** The booking's own start, used to offer its date to a meeting with none. */
  eventStart?: string;
  /** Fired whenever the set of timed meetings changes, so the grid can redraw. */
  onChanged?: () => void;
}

export function EventMeetingLinks({ eventUid, eventStart, onChanged }: EventMeetingLinksProps) {
  const [links, setLinks] = useState<MeetingLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [paste, setPaste] = useState('');
  const [label, setLabel] = useState('');
  const [url, setUrl] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [duration, setDuration] = useState('60');
  const [zoneLabel, setZoneLabel] = useState<string | null>(null);

  // A meeting saved without a time draws nothing on the calendar, and a link
  // pasted on its own carries no time to find — so it has to be possible to
  // give one to a meeting that is already saved.
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDate, setEditDate] = useState('');
  const [editTime, setEditTime] = useState('');
  const [editDuration, setEditDuration] = useState('60');
  const [savingTime, setSavingTime] = useState(false);

  const eventDay = (() => {
    if (!eventStart) return '';
    try { return format(parseISO(eventStart), 'yyyy-MM-dd'); } catch { return ''; }
  })();

  const fetchLinks = async () => {
    const { data } = await supabase
      .from('calendar_event_meeting_links')
      .select('*')
      .eq('event_uid', eventUid)
      .order('created_at', { ascending: false });
    setLinks((data as MeetingLink[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchLinks(); }, [eventUid]);

  // Upcoming first, then anything undated, then what has already happened.
  const ordered = useMemo(() => {
    const rank = (l: MeetingLink) => {
      // Undated first: it is the one that is not on the calendar and the one
      // somebody has to finish.
      if (!l.meeting_at) return 0;
      return new Date(l.meeting_at).getTime() >= Date.now() ? 1 : 2;
    };
    return [...links].sort((a, b) => {
      const byRank = rank(a) - rank(b);
      if (byRank !== 0) return byRank;
      if (a.meeting_at && b.meeting_at) {
        return new Date(a.meeting_at).getTime() - new Date(b.meeting_at).getTime();
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [links]);

  /**
   * Take whatever was pasted and fill in what it contains. Anything it misses
   * stays editable, so a miss costs a correction rather than a wrong entry.
   */
  const absorb = (text: string, complainWhenEmpty: boolean) => {
    const parsed = parseInvite(text);
    if (parsed.url) setUrl(parsed.url);
    if (parsed.startsAt) {
      setDate(format(parsed.startsAt, 'yyyy-MM-dd'));
      setTime(format(parsed.startsAt, 'HH:mm'));
    }
    if (parsed.durationMinutes) setDuration(String(parsed.durationMinutes));
    setZoneLabel(parsed.timeZoneLabel);
    if (complainWhenEmpty && !parsed.url && !parsed.startsAt) {
      toast.info('No link or time found in that paste — fill the fields below');
    }
  };

  const readPaste = (text: string) => {
    setPaste(text);
    if (text.trim()) absorb(text, true);
  };

  /**
   * The link box takes a whole invite too. Pasting the Zoom block straight into
   * the field marked "Link" is the obvious thing to do, and it used to save the
   * paragraph as the URL and pull no date at all.
   */
  const readLinkField = (text: string) => {
    if (/\s/.test(text.trim())) {
      absorb(text, false);
      return;
    }
    setUrl(text);
  };

  const addLink = async () => {
    if (!url.trim()) return;
    setSaving(true);
    const meetingAt = date && time ? new Date(`${date}T${time}`) : null;
    // An unlabelled meeting is named after where it is held rather than being
    // refused: the link and the time are the parts that matter.
    const { error } = await supabase.from('calendar_event_meeting_links').insert({
      event_uid: eventUid,
      label: label.trim() || labelForUrl(url.trim()),
      url: url.trim(),
      link_type: 'meeting',
      meeting_at: meetingAt ? meetingAt.toISOString() : null,
      duration_minutes: meetingAt ? Number(duration) || 60 : null,
    });
    setSaving(false);
    if (error) {
      toast.error('Failed to save link');
      return;
    }
    setPaste(''); setLabel(''); setUrl(''); setDate(''); setTime(''); setDuration('60'); setZoneLabel(null);
    toast.success(
      meetingAt
        ? 'Meeting saved — it is on the calendar'
        : 'Link saved. Give it a date and time to put it on the calendar.',
    );
    fetchLinks();
    onChanged?.();
  };

  const startEditing = (link: MeetingLink) => {
    setEditingId(link.id);
    if (link.meeting_at) {
      const at = parseISO(link.meeting_at);
      setEditDate(format(at, 'yyyy-MM-dd'));
      setEditTime(format(at, 'HH:mm'));
    } else {
      // Most meetings about an event are not on the day of the event, so the
      // date is offered rather than assumed, and the time is left blank.
      setEditDate(eventDay);
      setEditTime('');
    }
    setEditDuration(String(link.duration_minutes ?? 60));
  };

  const saveTime = async () => {
    if (!editingId || !editDate || !editTime) return;
    setSavingTime(true);
    const at = new Date(`${editDate}T${editTime}`);
    const { error } = await supabase
      .from('calendar_event_meeting_links')
      .update({ meeting_at: at.toISOString(), duration_minutes: Number(editDuration) || 60 })
      .eq('id', editingId);
    setSavingTime(false);
    if (error) {
      toast.error('Could not save the time');
      return;
    }
    setEditingId(null);
    toast.success('Meeting time set — it is on the calendar now');
    fetchLinks();
    onChanged?.();
  };

  const deleteLink = async (id: string) => {
    await supabase.from('calendar_event_meeting_links').delete().eq('id', id);
    fetchLinks();
    onChanged?.();
  };

  const copyUrl = (value: string) => {
    navigator.clipboard.writeText(value);
    toast.success('Link copied');
  };

  if (loading) {
    return <div className="flex justify-center py-4"><Loader2 className="h-4 w-4 animate-spin text-primary" /></div>;
  }

  const timeEditor = (link: MeetingLink) => (
    <div className="mt-2 flex flex-wrap items-end gap-2 border-t border-border/40 pt-2">
      <div>
        <Label className="mb-1 block text-[10px] uppercase tracking-wider text-muted-foreground">Date</Label>
        <Input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} className="h-8 w-auto text-xs" />
      </div>
      <div>
        <Label className="mb-1 block text-[10px] uppercase tracking-wider text-muted-foreground">Time</Label>
        <Input type="time" value={editTime} onChange={(e) => setEditTime(e.target.value)} className="h-8 w-auto text-xs" />
      </div>
      <div className="w-20">
        <Label className="mb-1 block text-[10px] uppercase tracking-wider text-muted-foreground">Mins</Label>
        <Input type="number" min={5} step={5} value={editDuration} onChange={(e) => setEditDuration(e.target.value)} className="h-8 text-xs" />
      </div>
      <Button
        size="sm"
        onClick={saveTime}
        disabled={savingTime || !editDate || !editTime}
        className="h-8 gap-1 px-2 text-[11px]"
      >
        {savingTime ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />} Save
      </Button>
      <Button
        size="sm"
        variant="ghost"
        onClick={() => setEditingId(null)}
        className="h-8 gap-1 px-2 text-[11px] text-muted-foreground"
      >
        <X className="h-3 w-3" /> Cancel
      </Button>
      {!link.meeting_at && eventDay && (
        <button
          type="button"
          onClick={() => setEditDate(eventDay)}
          className="h-8 self-end rounded-md border border-border px-2 text-[10px] text-muted-foreground hover:text-foreground"
        >
          Use the event date
        </button>
      )}
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="space-y-2.5 rounded-lg border border-border bg-muted/30 p-3">
        <div className="flex items-center gap-1.5">
          <ClipboardPaste className="h-3.5 w-3.5 text-primary" />
          <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground/70">Add a meeting</span>
        </div>
        <Textarea
          value={paste}
          onChange={(e) => readPaste(e.target.value)}
          rows={2}
          placeholder="Paste the invite here — the link, date and time are read out of it"
          className="text-xs"
        />
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label className="mb-1 block text-[10px] uppercase tracking-wider text-muted-foreground">Label</Label>
            <Input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder={url ? labelForUrl(url) : 'Creative call #1'}
              className="h-8 text-xs"
            />
          </div>
          <div className="sm:col-span-2">
            <Label className="mb-1 block text-[10px] uppercase tracking-wider text-muted-foreground">Link</Label>
            <Input value={url} onChange={(e) => readLinkField(e.target.value)} placeholder="https://zoom.us/j/... or paste the whole invite" className="h-8 text-xs" />
          </div>
          <div>
            <Label className="mb-1 block text-[10px] uppercase tracking-wider text-muted-foreground">Date</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-8 text-xs" />
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <Label className="mb-1 block text-[10px] uppercase tracking-wider text-muted-foreground">Time</Label>
              <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="h-8 text-xs" />
            </div>
            <div className="w-20">
              <Label className="mb-1 block text-[10px] uppercase tracking-wider text-muted-foreground">Mins</Label>
              <Input type="number" min={5} step={5} value={duration} onChange={(e) => setDuration(e.target.value)} className="h-8 text-xs" />
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between gap-2">
          {date && time ? (
            <p className="text-[10px] text-muted-foreground/70">
              Shows on the calendar in blue and warns the dashboard when it is close.
              {zoneLabel ? ` Read as ${zoneLabel} time and shown in yours.` : ''}
            </p>
          ) : (
            <p className="flex flex-wrap items-center gap-1.5 text-[10px] text-amber-500">
              <AlertTriangle className="h-3 w-3 shrink-0" />
              A Teams or Zoom link on its own carries no time — without one this will not appear on the calendar.
              {eventDay && (
                <button
                  type="button"
                  onClick={() => setDate(eventDay)}
                  className="rounded-full border border-amber-500/40 px-1.5 py-0.5 text-amber-500 hover:bg-amber-500/10"
                >
                  Use the event date
                </button>
              )}
            </p>
          )}
          <Button size="sm" onClick={addLink} disabled={saving || !url.trim()} className="h-7 gap-1 px-2 text-[10px]">
            {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />} Add
          </Button>
        </div>
      </div>

      {ordered.length === 0 && <p className="text-xs italic text-muted-foreground/60">No meetings yet</p>}

      <div className="space-y-2">
        {ordered.map((link) => {
          const state = meetingState(link);
          return (
            <div key={link.id}>
            <div
              className={cn(
                'group flex items-center gap-3 rounded-lg border border-l-[3px] border-border bg-muted/30 p-3',
                state?.tone === 'live' ? 'border-l-blue-500 bg-blue-500/5'
                  : state?.tone === 'soon' ? 'border-l-blue-500'
                  : state?.tone === 'past' ? 'border-l-border opacity-60'
                  : 'border-l-blue-500/50',
              )}
            >
              <Video className="h-4 w-4 shrink-0 text-blue-500" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <p className="truncate text-sm font-medium text-foreground">{link.label}</p>
                  {state && (
                    <span className={cn(
                      'rounded-full px-1.5 py-0.5 text-[10px]',
                      state.tone === 'live' ? 'bg-blue-500 text-white'
                        : state.tone === 'soon' ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400'
                        : 'bg-muted text-muted-foreground',
                    )}>
                      {state.text}
                    </span>
                  )}
                </div>
                {link.meeting_at ? (
                  <button
                    type="button"
                    onClick={() => startEditing(link)}
                    className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"
                  >
                    <CalendarClock className="h-3 w-3" />
                    {format(parseISO(link.meeting_at), 'EEE, MMM d')} · {format(parseISO(link.meeting_at), 'h:mm a')}
                    {link.duration_minutes ? ` · ${link.duration_minutes}m` : ''}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => startEditing(link)}
                    className="flex items-center gap-1 text-[11px] text-amber-500 hover:underline"
                  >
                    <AlertTriangle className="h-3 w-3" />
                    No time yet — not on the calendar. Set one.
                  </button>
                )}
              </div>

              <Button
                size="sm"
                onClick={() => window.open(link.url, '_blank', 'noopener,noreferrer')}
                className="h-7 gap-1 bg-blue-600 px-2.5 text-[11px] text-white hover:bg-blue-700"
              >
                <Video className="h-3 w-3" /> Join
              </Button>
              <button onClick={() => copyUrl(link.url)} className="text-muted-foreground hover:text-foreground" title="Copy link">
                <Copy className="h-3.5 w-3.5" />
              </button>
              <DeleteConfirmDialog
                trigger={
                  <button className="text-muted-foreground/50 opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                }
                title="Delete meeting?"
                description={`This will permanently remove "${link.label}". This action cannot be undone.`}
                onConfirm={() => deleteLink(link.id)}
              />
            </div>
            {editingId === link.id && timeEditor(link)}
            </div>
          );
        })}
      </div>

      <div className="border-t border-border pt-4">
        <EventCircleback eventUid={eventUid} />
      </div>
    </div>
  );
}
