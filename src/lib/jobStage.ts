/**
 * Where a job stands, worked out from what exists rather than from a status
 * somebody remembered to set.
 *
 * The grouping in ./jobs.ts inferred jobs from names before they had rows of
 * their own; that ran once and is kept for records created without a job. This
 * reads the stored job and whatever is attached to it.
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

/** Things a person should decide about, rather than the app deciding for them. */
export function flagsFor(j: JobWithMembers): string[] {
  const { job, proposals, packets, sessions, hasCreativePackage } = j;
  const out: string[] = [];

  if (!job.event_date) out.push('No event date — invisible to every deadline view');
  if (hasCreativePackage && sessions.length === 0) {
    out.push('Creative Package selected but no creative session exists');
  }

  const folders = new Set(
    [...proposals, ...packets].map((r) => r.drive_folder_id).filter(Boolean) as string[],
  );
  if (folders.size > 1) out.push(`${folders.size} separate Drive folders for one job`);

  if (job.track === 'creative' && packets.length === 0 && proposals.length === 0) {
    out.push('No packet and no proposal — is this in-house?');
  }
  if (proposals.length > 1) out.push(`${proposals.length} proposals on one job`);

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
