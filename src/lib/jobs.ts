/**
 * Jobs, derived from the records that already exist.
 *
 * A job — a client who landed a booking — has never had a row of its own. It
 * lives as two to four rows across proposals, pre_call_packets and
 * creative_sessions, each carrying a hand-typed client name and event date and
 * only one foreign key between them. So the same job goes by several names:
 * Ascend is also MRI, Interstate15 is also G2E, MOC&CO x ZAXBYS is also 525
 * Productions.
 *
 * This infers the grouping so it can be reviewed before anything is written to
 * the database. Nothing here mutates.
 */

export type JobTrack = 'creative' | 'in_house';

export type JobStage =
  | 'booked'
  | 'packet_sent'
  | 'proposal_out'
  | 'awaiting_assets'
  | 'in_production';

export const STAGE_ORDER: JobStage[] = [
  'booked', 'packet_sent', 'proposal_out', 'awaiting_assets', 'in_production',
];

export const STAGE_LABEL: Record<JobStage, string> = {
  booked: 'Booked',
  packet_sent: 'Packet sent',
  proposal_out: 'Proposal out',
  awaiting_assets: 'Awaiting assets',
  in_production: 'In production',
};

export interface ProposalInput {
  id: string; token: string | null; client_name: string; event_name: string;
  event_date: string | null; status: string | null; signed_at: string | null;
  is_active: boolean; drive_folder_id: string | null;
}
export interface PacketInput {
  id: string; token: string | null; client_name: string | null; title: string;
  event_date: string | null; kind: string | null; is_active: boolean;
  drive_folder_id: string | null;
}
export interface SessionInput {
  id: string; token: string | null; client_name: string; project_name: string;
  event_date: string | null; is_active: boolean; proposal_id: string | null;
}

export interface JobMember {
  kind: 'proposal' | 'packet' | 'session';
  id: string;
  label: string;
  token: string | null;
}

export interface DerivedJob {
  /** Stable across reloads for the same grouping, so it can key a list. */
  key: string;
  title: string;
  client: string;
  /** Every distinct name this job is filed under. */
  aliases: string[];
  eventDate: string | null;
  track: JobTrack;
  /** True when the track was guessed rather than recorded. */
  trackInferred: boolean;
  stage: JobStage;
  /** Why it sits at that stage, in the owner's language. */
  stageReason: string;
  members: JobMember[];
  assetCount: number;
  hasCreativePackage: boolean;
  /** Things that look wrong and are worth a human deciding about. */
  flags: string[];
}

const STOPWORDS = new Set([
  'the', 'and', 'event', 'events', 'soleia', 'las', 'vegas', 'llc', 'inc',
  'creative', 'package', 'pre', 'post', 'call', 'packet', 'digital', 'branding',
]);

/** Comparable form: lowercase, punctuation to spaces, leading zeros dropped. */
export const normalise = (value: string): string =>
  value.toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\b0+(\d)/g, '$1')
    .trim()
    .replace(/\s+/g, ' ');

/**
 * Tokens worth matching on. Dates, single letters and words that appear on
 * most records tell two jobs apart no better than nothing does.
 */
function significantTokens(value: string, tooCommon: Set<string>): Set<string> {
  const out = new Set<string>();
  for (const token of normalise(value).split(' ')) {
    if (token.length < 3) continue;
    if (/^\d+$/.test(token)) continue;
    if (STOPWORDS.has(token)) continue;
    if (tooCommon.has(token)) continue;
    out.add(token);
  }
  return out;
}

/** Two records can be the same job only if their dates do not contradict. */
const datesCompatible = (a: string | null, b: string | null) => !a || !b || a === b;

interface Node {
  kind: JobMember['kind'];
  id: string;
  names: string[];
  date: string | null;
}

export interface DeriveInput {
  proposals: ProposalInput[];
  packets: PacketInput[];
  sessions: SessionInput[];
  /** How many Drive files have been seen against each proposal id. */
  assetsByProposal: Record<string, number>;
  /** Proposal ids where the client selected a Soleia Creative Package item. */
  creativePackageProposalIds: Set<string>;
}

export function deriveJobs(input: DeriveInput): DerivedJob[] {
  const { proposals, packets, sessions, assetsByProposal, creativePackageProposalIds } = input;

  const nodes: Node[] = [
    ...proposals.map<Node>((p) => ({
      kind: 'proposal', id: p.id, date: p.event_date,
      names: [p.client_name, p.event_name].filter(Boolean) as string[],
    })),
    ...packets.map<Node>((p) => ({
      kind: 'packet', id: p.id, date: p.event_date,
      names: [p.client_name, p.title].filter(Boolean) as string[],
    })),
    ...sessions.map<Node>((s) => ({
      kind: 'session', id: s.id, date: s.event_date,
      names: [s.client_name, s.project_name].filter(Boolean) as string[],
    })),
  ];

  // A token on most records is a category, not an identity.
  const frequency = new Map<string, number>();
  nodes.forEach((n) => {
    const seen = new Set<string>();
    n.names.forEach((name) => normalise(name).split(' ').forEach((t) => seen.add(t)));
    seen.forEach((t) => frequency.set(t, (frequency.get(t) ?? 0) + 1));
  });
  const ceiling = Math.max(2, Math.floor(nodes.length * 0.34));
  const tooCommon = new Set([...frequency.entries()].filter(([, c]) => c > ceiling).map(([t]) => t));

  const tokens = nodes.map((n) =>
    n.names.reduce<Set<string>>((acc, name) => {
      significantTokens(name, tooCommon).forEach((t) => acc.add(t));
      return acc;
    }, new Set()),
  );

  // Union-find over "shares a distinguishing name and does not contradict on date".
  const parent = nodes.map((_, i) => i);
  const find = (i: number): number => (parent[i] === i ? i : (parent[i] = find(parent[i])));
  const union = (a: number, b: number) => { parent[find(a)] = find(b); };

  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      if (!datesCompatible(nodes[i].date, nodes[j].date)) continue;
      let shares = false;
      for (const t of tokens[i]) if (tokens[j].has(t)) { shares = true; break; }
      if (shares) union(i, j);
    }
  }

  // creative_sessions.proposal_id is the one real link in the schema. Where it
  // is set it beats any name guess.
  sessions.forEach((s) => {
    if (!s.proposal_id) return;
    const si = nodes.findIndex((n) => n.kind === 'session' && n.id === s.id);
    const pi = nodes.findIndex((n) => n.kind === 'proposal' && n.id === s.proposal_id);
    if (si >= 0 && pi >= 0) union(si, pi);
  });

  const groups = new Map<number, number[]>();
  nodes.forEach((_, i) => {
    const root = find(i);
    if (!groups.has(root)) groups.set(root, []);
    groups.get(root)!.push(i);
  });

  const proposalById = new Map(proposals.map((p) => [p.id, p]));
  const packetById = new Map(packets.map((p) => [p.id, p]));
  const sessionById = new Map(sessions.map((s) => [s.id, s]));

  const jobs: DerivedJob[] = [];

  for (const indices of groups.values()) {
    const members: JobMember[] = [];
    const aliases = new Set<string>();
    let eventDate: string | null = null;
    const conflictingDates = new Set<string>();

    const groupProposals: ProposalInput[] = [];
    const groupPackets: PacketInput[] = [];
    const groupSessions: SessionInput[] = [];

    for (const i of indices) {
      const n = nodes[i];
      n.names.forEach((x) => aliases.add(x.trim()));
      if (n.date) {
        if (eventDate && n.date !== eventDate) conflictingDates.add(n.date);
        eventDate = eventDate ?? n.date;
      }
      if (n.kind === 'proposal') {
        const p = proposalById.get(n.id)!;
        groupProposals.push(p);
        members.push({ kind: 'proposal', id: p.id, label: p.event_name, token: p.token });
      } else if (n.kind === 'packet') {
        const p = packetById.get(n.id)!;
        groupPackets.push(p);
        members.push({ kind: 'packet', id: p.id, label: p.title, token: p.token });
      } else {
        const s = sessionById.get(n.id)!;
        groupSessions.push(s);
        members.push({ kind: 'session', id: s.id, label: s.project_name, token: s.token });
      }
    }

    const signed = groupProposals.find((p) => !!p.signed_at);
    const sent = groupProposals.find((p) => !p.signed_at && p.status === 'sent');
    const assetCount = groupProposals.reduce((sum, p) => sum + (assetsByProposal[p.id] ?? 0), 0);
    const hasCreativePackage = groupProposals.some((p) => creativePackageProposalIds.has(p.id));

    // A booking with a session but no packet and no proposal bought no Soleia
    // creative services — that is the venue in-house track.
    const track: JobTrack =
      groupProposals.length === 0 && groupPackets.length === 0 && groupSessions.length > 0
        ? 'in_house'
        : 'creative';

    let stage: JobStage;
    let stageReason: string;
    if (track === 'in_house') {
      stage = 'in_production';
      stageReason = 'In-house booking — reviewed through its creative session';
    } else if (signed && assetCount > 0) {
      stage = 'in_production';
      stageReason = `Signed, ${assetCount} file${assetCount === 1 ? '' : 's'} in the Drive folder`;
    } else if (signed) {
      stage = 'awaiting_assets';
      stageReason = 'Signed — waiting on brand assets to reach the Drive folder';
    } else if (sent) {
      stage = 'proposal_out';
      stageReason = 'Proposal sent, not yet signed';
    } else if (groupPackets.length > 0) {
      stage = 'packet_sent';
      stageReason = 'Packet out — no proposal raised yet';
    } else {
      stage = 'booked';
      stageReason = 'Nothing raised against this booking yet';
    }

    const flags: string[] = [];
    if (conflictingDates.size > 0) {
      flags.push(`Records disagree on the date: ${[eventDate, ...conflictingDates].filter(Boolean).join(' vs ')}`);
    }
    if (!eventDate) flags.push('No event date on any record — invisible to every deadline view');
    if (hasCreativePackage && groupSessions.length === 0) {
      flags.push('Creative Package selected but no creative session exists');
    }
    if (groupProposals.length > 1) flags.push(`${groupProposals.length} proposals grouped together`);
    if (groupPackets.length > 1) flags.push(`${groupPackets.length} packets grouped together`);
    const folders = new Set(
      [...groupProposals, ...groupPackets].map((r) => r.drive_folder_id).filter(Boolean) as string[],
    );
    if (folders.size > 1) flags.push(`${folders.size} separate Drive folders for one job`);

    // Prefer the shortest real name. The long ones are the same name with a
    // date bolted on — "09.23.26 WHATNOT" is just Whatnot, and the job the
    // owner calls MRI is filed under "Ascend" too.
    const aliasList = [...aliases].filter(Boolean);
    const title =
      aliasList
        .filter((a) => normalise(a).replace(/[\d ]/g, '').length >= 2)
        .slice()
        .sort((a, b) => a.length - b.length || a.localeCompare(b))[0]
      ?? aliasList[0]
      ?? 'Untitled job';
    const client =
      groupProposals[0]?.client_name ??
      groupPackets[0]?.client_name ??
      groupSessions[0]?.client_name ??
      title;

    jobs.push({
      key: members.map((m) => `${m.kind}:${m.id}`).sort().join('|'),
      title,
      client,
      aliases: aliasList,
      eventDate,
      track,
      trackInferred: true,
      stage,
      stageReason,
      members,
      assetCount,
      hasCreativePackage,
      flags,
    });
  }

  // Two jobs on one date are often one job that never got linked — HLTH and
  // HLTH26 both sit on 17 Nov. Worth a human deciding rather than a guess.
  const byDate = new Map<string, DerivedJob[]>();
  jobs.forEach((j) => {
    if (!j.eventDate) return;
    if (!byDate.has(j.eventDate)) byDate.set(j.eventDate, []);
    byDate.get(j.eventDate)!.push(j);
  });
  byDate.forEach((sameDay) => {
    if (sameDay.length < 2) return;
    sameDay.forEach((j) => {
      const others = sameDay.filter((o) => o !== j).map((o) => o.title).join(', ');
      j.flags.push(`Shares its date with ${others} — the same job, or genuinely two?`);
    });
  });

  // Soonest first, undated last.
  return jobs.sort((a, b) => {
    if (a.eventDate && b.eventDate) return a.eventDate.localeCompare(b.eventDate);
    if (a.eventDate) return -1;
    if (b.eventDate) return 1;
    return a.title.localeCompare(b.title);
  });
}
