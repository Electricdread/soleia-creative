import { format, parseISO } from 'date-fns';
import { X, MapPin, Clock, Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EventNotes } from './EventNotes';
import { EventTasks } from './EventTasks';
import { EventAttachments } from './EventAttachments';
import { EventStatusBadge, type EventStatus } from './EventStatusBadge';

interface CalendarEvent {
  uid: string;
  summary: string;
  description: string;
  location: string;
  dtstart: string;
  dtend: string;
  status: string;
}

interface EventDetailPanelProps {
  event: CalendarEvent;
  statusOverride?: EventStatus;
  onClose: () => void;
  onStatusChange: (uid: string, status: EventStatus) => void;
}

export function EventDetailPanel({ event, statusOverride, onClose, onStatusChange }: EventDetailPanelProps) {
  const displayStatus = statusOverride || mapIcalStatus(event.status);

  let startFormatted = '';
  let endFormatted = '';
  let dateFormatted = '';
  try {
    const start = parseISO(event.dtstart);
    startFormatted = format(start, 'h:mm a');
    dateFormatted = format(start, 'EEE, MMM d, yyyy');
    if (event.dtend) {
      endFormatted = format(parseISO(event.dtend), 'h:mm a');
    }
  } catch { /* fallback */ }

  return (
    <div className="bg-white border border-[#d6cfc3] rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-[#faf8f5] border-b border-[#e0d8cc] p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <EventStatusBadge status={displayStatus} />
            </div>
            <h2 className="text-xl font-semibold text-[#3d3629] truncate">{event.summary}</h2>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-[#8a7d6b]">
              {dateFormatted && (
                <span className="flex items-center gap-1.5">
                  <CalendarIcon className="w-3.5 h-3.5" />
                  {dateFormatted}
                </span>
              )}
              {startFormatted && (
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  {startFormatted}{endFormatted ? ` – ${endFormatted}` : ''}
                </span>
              )}
              {event.location && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" />
                  {event.location}
                </span>
              )}
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="text-[#8a7d6b] hover:text-[#3d3629] shrink-0">
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Event Info Table */}
      <div className="p-5 border-b border-[#e8e2d8]">
        <div className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2.5 text-sm">
          <span className="font-semibold text-[#5a4f3f] text-right">Event Name</span>
          <span className="text-[#3d3629]">{event.summary}</span>

          {event.location && (
            <>
              <span className="font-semibold text-[#5a4f3f] text-right">Location</span>
              <span className="text-[#3d3629]">{event.location}</span>
            </>
          )}

          <span className="font-semibold text-[#5a4f3f] text-right">When</span>
          <span className="text-[#3d3629]">
            {dateFormatted}
            {startFormatted && <><br />{startFormatted}{endFormatted ? ` to ${endFormatted}` : ''}</>}
          </span>

          <span className="font-semibold text-[#5a4f3f] text-right">Status</span>
          <div className="flex items-center gap-2">
            <select
              value={displayStatus}
              onChange={(e) => onStatusChange(event.uid, e.target.value as EventStatus)}
              className="border border-[#d6cfc3] rounded px-2 py-1 text-xs bg-white text-[#3d3629] focus:outline-none focus:ring-1 focus:ring-[#c49a3c]/40"
            >
              <option value="definite">Definite</option>
              <option value="prospect">Prospect</option>
              <option value="tentative">Tentative</option>
              <option value="cancelled">Cancelled</option>
              <option value="closed">Closed</option>
            </select>
          </div>

          {event.description && (
            <>
              <span className="font-semibold text-[#5a4f3f] text-right">Details</span>
              <span className="text-[#3d3629] whitespace-pre-line text-xs line-clamp-6">{event.description}</span>
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="notes" className="w-full">
        <TabsList className="w-full justify-start rounded-none border-b border-[#e8e2d8] bg-[#faf8f5] h-auto p-0">
          <TabsTrigger value="notes" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#c49a3c] data-[state=active]:bg-transparent data-[state=active]:text-[#3d3629] text-[#8a7d6b] px-4 py-2.5 text-sm font-medium">
            Notes
          </TabsTrigger>
          <TabsTrigger value="tasks" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#c49a3c] data-[state=active]:bg-transparent data-[state=active]:text-[#3d3629] text-[#8a7d6b] px-4 py-2.5 text-sm font-medium">
            Tasks
          </TabsTrigger>
          <TabsTrigger value="docs" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#c49a3c] data-[state=active]:bg-transparent data-[state=active]:text-[#3d3629] text-[#8a7d6b] px-4 py-2.5 text-sm font-medium">
            Docs
          </TabsTrigger>
        </TabsList>
        <TabsContent value="notes" className="p-4 mt-0">
          <EventNotes eventUid={event.uid} />
        </TabsContent>
        <TabsContent value="tasks" className="p-4 mt-0">
          <EventTasks eventUid={event.uid} />
        </TabsContent>
        <TabsContent value="docs" className="p-4 mt-0">
          <EventAttachments eventUid={event.uid} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function mapIcalStatus(status: string): EventStatus {
  const s = status.toLowerCase();
  if (s.includes('confirm') || s.includes('definite')) return 'definite';
  if (s.includes('tentative')) return 'tentative';
  if (s.includes('cancel')) return 'cancelled';
  return 'prospect';
}
