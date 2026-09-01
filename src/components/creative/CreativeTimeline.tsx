/**
 * The creative timeline, from kickoff to show day.
 *
 * The dates here are the ones in the proposal terms — the count starts from a
 * signed proposal plus brand assets in hand, due 21 business days before the
 * event (the client-facing name for what the terms call kickoff), then 14 days
 * to the first review cut, a 3-day review window and one included revision
 * round. See
 * src/components/proposal/ProposalTerms.tsx; if those terms change, this
 * changes with them.
 *
 * The one deliberate divergence is the final cut-off: the terms set the
 * contractual floor at 4 days before the event, and this asks for 7 business
 * days. It is the earlier of the two on purpose — do not "correct" it back.
 *
 * What it adds is the part a client cannot see from a contract: the work
 * inside those 14 days. Saying that we spend the front of that window
 * studying the brand is what makes the asset deadline read as necessary
 * rather than arbitrary.
 */

import { format, parseISO } from 'date-fns';
import { assetDeadlineFor } from '@/lib/businessDays';

type Owner = 'You' | 'Soleia';

interface TimelineStep {
  when: string;
  title: string;
  what: string;
  detail?: string[];
  who: Owner;
}

export const CREATIVE_TIMELINE: TimelineStep[] = [
  {
    // The owner's wording (2026-09-01): the deadline is named for what it is,
    // not for the internal "kickoff" concept a client has no reason to know.
    when: '21 business days prior to the event',
    title: 'Signed proposal and brand assets in hand',
    what:
      'Production starts when both are with us — not before. Logos in vector, fonts, palette, key ' +
      'artwork, brand guidelines, and any content you would like on the screens.',
    who: 'You',
  },
  {
    when: 'Days 1 – 14',
    title: 'We study the brand, then build',
    what: 'The whole of this window is ours. It runs in three passes:',
    detail: [
      'We study your brand — guidelines, palette, past events and this brief, read together. We pull the palette apart and test how your marks hold at architectural scale.',
      'We set the creative direction — how the room should feel on arrival, through the programme, and late in the night, and which surfaces carry each moment.',
      'We build the looks on the real venue geometry rather than a flat mockup, so what you review is what the room will actually show.',
    ],
    who: 'Soleia',
  },
  {
    when: 'Day 14',
    title: 'First review cut delivered',
    what: 'Your first look at the content running on the real screens.',
    who: 'Soleia',
  },
  {
    when: 'Within 3 days',
    title: 'Your consolidated notes',
    what:
      'One written set of notes from everyone reviewing on your side. Gathering them into a single ' +
      'pass is what lets the revision round land cleanly.',
    who: 'You',
  },
  {
    when: 'One round',
    title: 'Revisions applied',
    what:
      'One revision round is included, within the agreed scope and the existing elements. Changes to ' +
      'the concept, the direction, or new components take a fresh quote.',
    who: 'Soleia',
  },
  {
    when: '7 business days before the show',
    title: 'Final cut-off',
    what:
      'The last point final revision requests can reach us and still be applied, rendered and ' +
      'delivered in time. Anything later cannot be guaranteed.',
    who: 'You',
  },
  {
    when: 'Show day',
    title: 'Run live',
    what: 'Content loaded, checked against the run of show, and operated by our team throughout the night.',
    who: 'Soleia',
  },
];

const OWNER_STYLE: Record<Owner, string> = {
  You: 'border-primary/40 text-primary',
  Soleia: 'border-border text-muted-foreground',
};

export interface CreativeTimelineProps {
  /** Heading above the steps. */
  title?: string;
  /**
   * The event's date (ISO yyyy-MM-dd). When known, the first step also names
   * the actual calendar date the 21-business-day count lands on.
   */
  eventDate?: string | null;
  className?: string;
}

export function CreativeTimeline({ title = 'What happens from here.', eventDate, className = '' }: CreativeTimelineProps) {
  let kickoffDate: Date | null = null;
  if (eventDate) {
    try {
      const parsed = parseISO(eventDate);
      if (!isNaN(parsed.getTime())) kickoffDate = assetDeadlineFor(parsed);
    } catch {
      kickoffDate = null;
    }
  }

  return (
    <div className={className}>
      <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-primary">Creative Timeline</span>
      <h3 className="mt-2 font-display text-xl text-foreground">{title}</h3>

      <ol className="mt-6 space-y-6">
        {CREATIVE_TIMELINE.map((step, index) => (
          <li key={step.when} className="grid gap-1.5 sm:grid-cols-[190px_1fr] sm:gap-6">
            <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-primary sm:pt-1">
              {step.when}
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[15px] font-medium text-foreground">{step.title}</span>
                <span
                  className={`rounded-full border px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.12em] ${OWNER_STYLE[step.who]}`}
                >
                  {step.who}
                </span>
              </div>
              <p className="mt-1 text-[14px] leading-relaxed text-muted-foreground">{step.what}</p>
              {index === 0 && kickoffDate && (
                <p className="mt-1.5 text-[14px] font-medium text-primary">
                  For your event, that is {format(kickoffDate, 'EEEE, MMMM d, yyyy')}.
                </p>
              )}
              {step.detail && (
                <ol className="mt-3 space-y-2.5 border-l border-primary/20 pl-4">
                  {step.detail.map((d, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="mt-[3px] font-mono text-[10px] leading-none text-primary">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <span className="text-[13.5px] leading-relaxed text-muted-foreground">{d}</span>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

export default CreativeTimeline;
