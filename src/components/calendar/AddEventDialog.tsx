/**
 * Raise an event the studio owns.
 *
 * The calendar has only ever mirrored the Triple Seat feed, so anything not
 * booked through Triple Seat — an internal hold, a site visit, a load-in day —
 * had nowhere to go. These live in calendar_local_events, beside the feed
 * rather than inside it, so a sync can never overwrite one.
 *
 * Times are stored in the feed's own naive shape ('YYYY-MM-DDTHH:MM:SS', no
 * zone) because every reader parses both kinds identically; a timestamptz here
 * would quietly shift a local event against the feed events beside it.
 */

import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Loader2, CalendarPlus } from 'lucide-react';
import { toast } from 'sonner';

export interface AddEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The day the calendar was showing, prefilled as a courtesy. */
  defaultDate?: string;
  /** Raised after a successful save so the month reloads. */
  onCreated?: () => void;
}

export function AddEventDialog({ open, onOpenChange, defaultDate, onCreated }: AddEventDialogProps) {
  const [summary, setSummary] = useState('');
  const [date, setDate] = useState(defaultDate ?? '');
  const [startTime, setStartTime] = useState('18:00');
  const [endTime, setEndTime] = useState('23:00');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setSummary(''); setDate(defaultDate ?? ''); setStartTime('18:00');
    setEndTime('23:00'); setLocation(''); setDescription('');
  };

  const save = async () => {
    if (!summary.trim() || !date) {
      toast.error('An event needs a name and a date');
      return;
    }
    if (endTime && endTime <= startTime) {
      toast.error('The end time is before the start');
      return;
    }
    setSaving(true);
    const { data: session } = await supabase.auth.getUser();
    // Cast until Lovable regenerates types.ts for the new table; remove then.
    const { error } = await (supabase as any).from('calendar_local_events').insert({
      summary: summary.trim(),
      description: description.trim() || null,
      location: location.trim() || null,
      dtstart: `${date}T${startTime}:00`,
      dtend: endTime ? `${date}T${endTime}:00` : null,
      created_by: session?.user?.id ?? null,
    });
    setSaving(false);
    if (error) {
      toast.error(`Could not add the event: ${error.message}`);
      return;
    }
    toast.success('Event added to the calendar');
    reset();
    onOpenChange(false);
    onCreated?.();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) reset(); onOpenChange(o); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarPlus className="h-4 w-4 text-primary" /> Add an event
          </DialogTitle>
          <DialogDescription>
            For anything not booked through Triple Seat. It sits beside the feed, so a sync
            will never overwrite it — and a job can be linked to it like any other event.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <Label htmlFor="ev-summary">Event name</Label>
            <Input
              id="ev-summary" value={summary} onChange={(e) => setSummary(e.target.value)}
              placeholder="Site visit — Roadster Shop" className="mt-1.5"
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-3 sm:col-span-1">
              <Label htmlFor="ev-date">Date</Label>
              <Input id="ev-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="ev-start">Starts</Label>
              <Input id="ev-start" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="ev-end">Ends</Label>
              <Input id="ev-end" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="mt-1.5" />
            </div>
          </div>

          <div>
            <Label htmlFor="ev-location">Location</Label>
            <Input
              id="ev-location" value={location} onChange={(e) => setLocation(e.target.value)}
              placeholder="Soleia rooftop" className="mt-1.5"
            />
          </div>

          <div>
            <Label htmlFor="ev-notes">Notes</Label>
            <Textarea
              id="ev-notes" value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder="What this is for, who is attending…" className="mt-1.5 min-h-[70px]"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save} disabled={saving} className="gap-2">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {saving ? 'Adding…' : 'Add event'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default AddEventDialog;
