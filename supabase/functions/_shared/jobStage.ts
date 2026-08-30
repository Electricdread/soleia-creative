/**
 * Deno copy of `src/lib/jobStage.ts`.
 *
 * Edge functions cannot import from `src/`, so the pipeline rules live twice.
 * `src/lib/jobStage.deno.test.ts` reads this file and fails unless everything
 * from the first `export` is byte-identical to the browser copy.
 *
 * If these drift, Studio OS and Soleia's own Jobs screen will show different
 * stages for the same job, which is worse than Studio OS showing no stage.
 *
 * Change one, change both.
 */

export type JobTrack = 'creative' | 'in_house';

export type Stage =
  | 'booked'
  | 'packet_sent'
  | 'call_held'
  | 'proposal_out'
  | 'awaiting_assets'
  | 'in_production';

/** The full creative pipeline, in the order the owner described it. */
export const CREATIVE_STAGES: Stage[] = [
  'booked', 'packet_sent', 'call_held', 'proposal_out', 'awaiting_assets', 'in_production',
];

/** An in-house booking buys no creative services, so most of it never applies. */
export const IN_HOUSE_STAGES: Stage[] = ['booked', 'in_production'];

export const STAGE_LABEL: Record<Stage, string> = {
  booked: 'Booked',
  packet_sent: 'Packet sent',
  call_held: 'Creative call',
  proposal_out: 'Proposal out',
  awaiting_assets: 'Awaiting assets',
  in_production: 'In production',
};

export interface JobRecord {
  id: string;
  title: string;
  client_name: string;
  event_date: string | null;
  track: JobTrack;
  call_held_on: string | null;
  drive_folder_id: string | null;
  drive_folder_url: string | null;
  notes: string | null;
  is_active: boolean;
}

export interface AttachedProposal {
  id: string; token: string | null; event_name: string; status: string | null;
  signed_at: string | null; is_active: boolean; signoff_due_on: string | null;
  drive_folder_id: string | null;
}
export interface AttachedPacket {
  id: string; token: string | null; title: string; kind: string | null;
  is_active: boolean; drive_folder_id: string | null;
}
export interface AttachedSession {
  id: string; token: string | null; project_name: string; is_active: boolean;
}

export interface JobWithMembers {
  job: JobRecord;
  proposals: AttachedProposal[];
  packets: AttachedPacket[];
  sessions: AttachedSession[];
  /** Files seen in the job's Drive folder — the kickoff signal. */
  assetCount: number;
  /** The client ticked a Soleia Creative Package line item. */
  hasCreativePackage: boolean;
}

export interface StageResult {
  stage: Stage;
  /** Why it sits there, phrased for a person. */
  reason: string;
  /** Stages already behind it, for the tracker. */
  done: Stage[];
}

export function stageFor(j: JobWithMembers): StageResult {
  const { job, proposals, packets, sessions, assetCount } = j;
  const signed = proposals.find((p) => !!p.signed_at);
  const sent = proposals.find((p) => !p.signed_at && p.status === 'sent');

  if (job.track === 'in_house') {
    return sessions.length > 0
      ? { stage: 'in_production', reason: 'In-house booking — reviewed through its creative session', done: ['booked'] }
      : { stage: 'booked', reason: 'In-house booking — no creative session yet', done: [] };
  }

  const done: Stage[] = ['booked'];
  if (packets.length > 0) done.push('packet_sent');
  if (job.call_held_on) done.push('call_held');
  if (sent || signed) done.push('proposal_out');
  if (signed) done.push('awaiting_assets');

  if (signed && assetCount > 0) {
    return {
      stage: 'in_production',
      reason: `Signed, ${assetCount} file${assetCount === 1 ? '' : 's'} in the Drive folder`,
      done,
    };
  }
  if (signed) {
    return {
      stage: 'awaiting_assets',
      reason: 'Signed — waiting on brand assets to reach the Drive folder',
      done: done.filter((s) => s !== 'awaiting_assets'),
    };
  }
  if (sent) {
    return {
      stage: 'proposal_out',
      reason: sent.signoff_due_on
        ? `Proposal sent — due to be signed by ${sent.signoff_due_on}`
        : 'Proposal sent, not yet signed',
      done: done.filter((s) => s !== 'proposal_out'),
    };
  }
  if (job.call_held_on) {
    return { stage: 'call_held', reason: 'Call held — no proposal raised yet', done: done.filter((s) => s !== 'call_held') };
  }
  if (packets.length > 0) {
    return { stage: 'packet_sent', reason: 'Packet out — no creative call recorded yet', done: ['booked'] };
  }
  return { stage: 'booked', reason: 'Nothing raised against this booking yet', done: [] };
}

export interface Blocker {
  label: string;
  /** Present when there is somewhere to go and fix it. */
  verb?: string;
  href?: string;
}

/**
 * What is standing in this job's way, with the verb that clears it where one
 * exists. A flag that only states a problem makes you go and find the screen
 * yourself; the point of naming it is to shorten that.
 */
export function flagsFor(j: JobWithMembers): Blocker[] {
  const { job, proposals, packets, sessions, hasCreativePackage } = j;
  const out: Blocker[] = [];

  if (hasCreativePackage && sessions.length === 0) {
    out.push({
      label: 'Creative Package selected — no session created',
      verb: 'Create', href: '/admin/creative',
    });
  }
  if (!job.event_date) {
    out.push({ label: 'No event date — job has no deadline', verb: 'Set', href: `/admin/jobs/${job.id}` });
  }
  if (job.track === 'creative' && !job.call_held_on && packets.length > 0 && proposals.length === 0) {
    out.push({ label: 'Packet out — no creative call recorded', verb: 'Log', href: `/admin/jobs/${job.id}` });
  }

  const folders = new Set(
    [...proposals, ...packets].map((r) => r.drive_folder_id).filter(Boolean) as string[],
  );
  // Nothing to click: consolidating these means moving files in Drive.
  if (folders.size > 1) out.push({ label: `${folders.size} separate Drive folders for one job` });

  if (job.track === 'creative' && packets.length === 0 && proposals.length === 0) {
    out.push({ label: 'No packet and no proposal — is this in-house?', verb: 'Set track', href: `/admin/jobs/${job.id}` });
  }
  if (proposals.length > 1) out.push({ label: `${proposals.length} proposals on one job` });

  return out;
}

/** Days until the event; negative once it has passed. */
export function daysUntil(eventDate: string | null): number | null {
  if (!eventDate) return null;
  const then = new Date(`${eventDate}T00:00:00`);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.round((then.getTime() - now.getTime()) / 86_400_000);
}

export type ActionKind = 'session' | 'assets' | 'sign' | 'quote' | 'call' | 'date';

/**
 * Grouping order for the triage list's "by action" view: the pipeline order, so
 * that batching one verb at a time reads like working down the funnel.
 * Housekeeping — a job nobody has given a date — sits at the end.
 */
export const ACTION_KIND_ORDER: ActionKind[] = ['call', 'quote', 'sign', 'session', 'assets', 'date'];

export interface NextAction {
  /** What is waiting, in the owner's words. */
  label: string;
  /** The verb on the button. */
  verb: string;
  /** Where the verb takes you. */
  href: string;
  /** Sorts the triage list: 0 is most urgent. */
  weight: number;
  /** What kind of work it is, so the list can group like with like. */
  kind: ActionKind;
}

/**
 * The one thing this job is waiting on, and where to go and do it.
 *
 * The old dashboard could only say "unsigned, 11 days" because age was all it
 * knew. A stage knows what comes next.
 */
export function nextAction(j: JobWithMembers): NextAction | null {
  const { job, proposals, sessions, assetCount, hasCreativePackage } = j;
  const days = daysUntil(job.event_date);
  const soon = days !== null && days <= 21;
  const imminent = days !== null && days <= 7;

  // An in-house booking owes nobody a proposal. Never chase it.
  if (job.track === 'in_house') {
    if (sessions.length === 0) {
      return { label: 'In-house, no creative session yet', verb: 'Create', href: '/admin/creative', weight: 60, kind: 'session' };
    }
    return null;
  }

  const signed = proposals.find((p) => !!p.signed_at);
  const sent = proposals.find((p) => !p.signed_at && p.status === 'sent');

  if (signed && hasCreativePackage && sessions.length === 0) {
    return { label: 'Creative Package selected — no session created', verb: 'Create', href: '/admin/creative', weight: 0, kind: 'session' };
  }
  if (signed && assetCount === 0) {
    return { label: 'Signed — no brand assets in the Drive folder', verb: 'Nudge', href: `/admin/jobs/${job.id}`, weight: imminent ? 1 : 10, kind: 'assets' };
  }
  if (sent) {
    return { label: 'Proposal sent, not signed', verb: 'Chase', href: '/admin/proposals', weight: imminent ? 2 : soon ? 11 : 30, kind: 'sign' };
  }
  if (proposals.length === 0 && job.call_held_on) {
    return { label: 'Call held — no proposal raised', verb: 'Quote', href: '/admin/proposals', weight: imminent ? 3 : soon ? 12 : 31, kind: 'quote' };
  }
  if (proposals.length === 0 && j.packets.length > 0) {
    return { label: 'Packet out — no creative call recorded', verb: 'Log call', href: `/admin/jobs/${job.id}`, weight: imminent ? 4 : soon ? 13 : 40, kind: 'call' };
  }
  if (!job.event_date) {
    return { label: 'No event date — no deadline anywhere', verb: 'Set', href: `/admin/jobs/${job.id}`, weight: 50, kind: 'date' };
  }
  return null;
}
