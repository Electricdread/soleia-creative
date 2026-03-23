import { format, parseISO, differenceInCalendarDays } from 'date-fns';
import { X, MapPin, Clock, Calendar as CalendarIcon, FileText, User, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { EventNotes } from './EventNotes';
import { EventTripleseatDetails } from './EventTripleseatDetails';
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

export function EventDetailPanel({ event, statusOverride, onClose, onStatusChange, proposalStatuses, deadlineInfo }: EventDetailPanelProps) {
  const displayStatus = statusOverride || mapIcalStatus(event.status);
  const daysUntilDeadline = deadlineInfo ? differenceInCalendarDays(new Date(deadlineInfo.content_deadline), new Date()) : null;

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
    <div className="bg-card border border-border rounded-lg overflow-hidden flex flex-col max-h-[85vh]">
      {/* Header */}
      <div className="bg-muted/50 border-b border-border p-4 shrink-0">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <EventStatusBadge status={displayStatus} />
              <select
                value={displayStatus}
                onChange={(e) => onStatusChange(event.uid, e.target.value as EventStatus)}
                className="border border-border rounded px-2 py-0.5 text-[10px] bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-ring/40"
              >
                <option value="definite">Definite</option>
                <option value="prospect">Prospect</option>
                <option value="tentative">Tentative</option>
                <option value="cancelled">Cancelled</option>
                <option value="closed">Closed</option>
              </select>
            </div>
            <h2 className="text-lg font-semibold text-foreground truncate">{event.summary.replace(/^\[(D|T|P|C)\]\s*/i, '')}</h2>
            {daysUntilDeadline !== null && (
              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold mt-1 w-fit ${
                daysUntilDeadline < 0 ? 'bg-red-100 text-red-700 border border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800' :
                daysUntilDeadline <= 3 ? 'bg-red-50 text-red-600 border border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800' :
                daysUntilDeadline <= 7 ? 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800' :
                'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800'
              }`}>
                {daysUntilDeadline < 0 ? '⚠️' : '📅'} Content deadline: {daysUntilDeadline < 0 ? `${Math.abs(daysUntilDeadline)}d overdue` : daysUntilDeadline === 0 ? 'Due today' : `${daysUntilDeadline}d left`}
              </span>
            )}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-xs text-muted-foreground">
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
                      p.status === 'signed' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800' :
                      p.status === 'sent' ? 'bg-blue-100 text-blue-700 border border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800' :
                      'bg-muted text-muted-foreground border border-border'
                    }`}
                  >
                    <FileText className="w-3 h-3" />
                    {p.status === 'signed' ? '✓ Signed' : p.status === 'sent' ? 'Proposal Sent' : `Proposal: ${p.status}`}
                  </span>
                ))}
              </div>
            )}
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="text-muted-foreground hover:text-foreground shrink-0 h-7 w-7">
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Linked Items & Client dropdown */}
        <div className="mt-3 pt-3 border-t border-border flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <EventLinkedItems eventUid={event.uid} />
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="shrink-0 h-7 gap-1 text-[10px] border-border text-foreground/70 hover:bg-muted">
                <User className="w-3 h-3" />
                Client
                <ChevronDown className="w-3 h-3" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[340px] p-3 bg-card border-border" align="end" side="bottom">
              <ScrollArea className="max-h-[50vh]">
                <EventClientInfo eventUid={event.uid} />
              </ScrollArea>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="details" className="flex-1 flex flex-col min-h-0">
        <div className="border-b border-border bg-muted/50 shrink-0 px-1">
          <ScrollArea className="w-full">
            <TabsList className="inline-flex h-10 w-max gap-0 bg-transparent p-0">
              {[
                { value: 'details', label: 'Details' },
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
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground text-muted-foreground px-3 py-2 text-xs font-medium whitespace-nowrap min-h-0 h-auto"
                >
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
            <ScrollBar orientation="horizontal" className="h-1" />
          </ScrollArea>
        </div>

        <div className="flex-1 overflow-y-auto">
          <TabsContent value="details" className="p-4 mt-0">
            <EventTripleseatDetails description={event.description} eventUid={event.uid} />
          </TabsContent>
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
