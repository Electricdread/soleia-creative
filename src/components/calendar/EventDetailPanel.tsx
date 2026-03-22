import { format, parseISO, differenceInCalendarDays } from 'date-fns';
import { X, MapPin, Clock, Calendar as CalendarIcon, FileText, User, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { EventNotes } from './EventNotes';
import { EventTasks } from './EventTasks';
import { EventAttachments } from './EventAttachments';
import { EventMeetingLinks } from './EventMeetingLinks';
import { EventCircleback } from './EventCircleback';
import { EventDelivery } from './EventDelivery';
import { EventClientInfo } from './EventClientInfo';
import { EventLinkedItems } from './EventLinkedItems';
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

interface ProposalStatusInfo {
  status: string;
  event_name: string;
  client_name: string;
}

interface EventDetailPanelProps {
  event: CalendarEvent;
  statusOverride?: EventStatus;
  onClose: () => void;
  onStatusChange: (uid: string, status: EventStatus) => void;
  proposalStatuses?: ProposalStatusInfo[];
  deadlineInfo?: { content_deadline: string; reminder_days: number } | null;
}

export function EventDetailPanel({ event, statusOverride, onClose, onStatusChange, proposalStatuses }: EventDetailPanelProps) {
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
    <div className="bg-white border border-[#d6cfc3] rounded-lg overflow-hidden flex flex-col max-h-[85vh]">
      {/* Header */}
      <div className="bg-[#faf8f5] border-b border-[#e0d8cc] p-4 shrink-0">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <EventStatusBadge status={displayStatus} />
              <select
                value={displayStatus}
                onChange={(e) => onStatusChange(event.uid, e.target.value as EventStatus)}
                className="border border-[#d6cfc3] rounded px-2 py-0.5 text-[10px] bg-white text-[#3d3629] focus:outline-none focus:ring-1 focus:ring-[#c49a3c]/40"
              >
                <option value="definite">Definite</option>
                <option value="prospect">Prospect</option>
                <option value="tentative">Tentative</option>
                <option value="cancelled">Cancelled</option>
                <option value="closed">Closed</option>
              </select>
            </div>
            <h2 className="text-lg font-semibold text-[#3d3629] truncate">{event.summary.replace(/^\[(D|T|P|C)\]\s*/i, '')}</h2>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-xs text-[#8a7d6b]">
              {dateFormatted && (
                <span className="flex items-center gap-1">
                  <CalendarIcon className="w-3 h-3" />
                  {dateFormatted}
                </span>
              )}
              {startFormatted && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {startFormatted}{endFormatted ? ` – ${endFormatted}` : ''}
                </span>
              )}
              {event.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {event.location}
                </span>
              )}
            </div>
            {proposalStatuses && proposalStatuses.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {proposalStatuses.map((p, i) => (
                  <span
                    key={i}
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      p.status === 'signed' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' :
                      p.status === 'sent' ? 'bg-blue-100 text-blue-700 border border-blue-200' :
                      'bg-zinc-100 text-zinc-500 border border-zinc-200'
                    }`}
                  >
                    <FileText className="w-3 h-3" />
                    {p.status === 'signed' ? '✓ Signed' : p.status === 'sent' ? 'Proposal Sent' : `Proposal: ${p.status}`}
                  </span>
                ))}
              </div>
            )}
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="text-[#8a7d6b] hover:text-[#3d3629] shrink-0 h-7 w-7">
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Linked Items & Client dropdown */}
        <div className="mt-3 pt-3 border-t border-[#e8e2d8] flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <EventLinkedItems eventUid={event.uid} />
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="shrink-0 h-7 gap-1 text-[10px] border-[#d6cfc3] text-[#5a4f3f] hover:bg-[#f0ece4]">
                <User className="w-3 h-3" />
                Client
                <ChevronDown className="w-3 h-3" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[340px] p-3 bg-white border-[#d6cfc3]" align="end" side="bottom">
              <ScrollArea className="max-h-[50vh]">
                <EventClientInfo eventUid={event.uid} />
              </ScrollArea>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="notes" className="flex-1 flex flex-col min-h-0">
        <div className="border-b border-[#e8e2d8] bg-[#faf8f5] shrink-0 px-1">
          <ScrollArea className="w-full">
            <TabsList className="inline-flex h-10 w-max gap-0 bg-transparent p-0">
              {[
                { value: 'notes', label: 'Notes' },
                { value: 'tasks', label: 'Tasks' },
                { value: 'meetings', label: 'Meetings' },
                { value: 'circleback', label: 'Call Notes' },
                { value: 'delivery', label: 'Delivery' },
                { value: 'docs', label: 'Docs' },
              ].map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#c49a3c] data-[state=active]:bg-transparent data-[state=active]:text-[#3d3629] text-[#8a7d6b] px-3 py-2 text-xs font-medium whitespace-nowrap min-h-0 h-auto"
                >
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
            <ScrollBar orientation="horizontal" className="h-1" />
          </ScrollArea>
        </div>

        <div className="flex-1 overflow-y-auto">
          <TabsContent value="notes" className="p-4 mt-0">
            <EventNotes eventUid={event.uid} />
          </TabsContent>
          <TabsContent value="tasks" className="p-4 mt-0">
            <EventTasks eventUid={event.uid} />
          </TabsContent>
          <TabsContent value="meetings" className="p-4 mt-0">
            <EventMeetingLinks eventUid={event.uid} />
          </TabsContent>
          <TabsContent value="circleback" className="p-4 mt-0">
            <EventCircleback eventUid={event.uid} />
          </TabsContent>
          <TabsContent value="delivery" className="p-4 mt-0">
            <EventDelivery eventUid={event.uid} />
          </TabsContent>
          <TabsContent value="docs" className="p-4 mt-0">
            <EventAttachments eventUid={event.uid} />
          </TabsContent>
        </div>
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
