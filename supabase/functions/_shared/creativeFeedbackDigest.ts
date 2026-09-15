// Client feedback on creative sessions, gathered into one email (owner, 2026-09-15: "when approving or declining,
// commenting is not registering"). Clients approve, decline and comment on each mood board item and confirm their
// approvals with their name; none of it reached anyone at Soleia. creative-feedback-digest runs every 15 minutes and
// sends one email holding everything new since the last one that went out.
//
// Plain TypeScript with no Deno APIs, so src/lib/creativeFeedbackDigest.test.ts can run it under vitest.

export type FeedbackKind = 'approved' | 'declined' | 'comment' | 'signoff';

export interface FeedbackEvent {
  kind: FeedbackKind;
  /** ISO time the client did it. */
  at: string;
  who: string;
  sessionId: string;
  itemTitle?: string | null;
  /** A comment's text. */
  text?: string | null;
  /** How many items a sign-off confirmed. */
  itemCount?: number;
}

export interface FeedbackSession {
  id: string;
  projectName: string;
  clientName: string;
  token: string;
  eventDate: string | null;
}

export interface FeedbackDigest {
  subject: string;
  html: string;
  counts: Record<FeedbackKind, number>;
}

const GOLD = '#c49a3c';
const COMMENT_LIMIT = 600;

/** Clients write the names and comments, so every one is escaped before it goes into the email. */
export function escapeHtml(value: unknown): string {
  return String(value ?? '').replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' } as Record<string, string>
  )[c]);
}

/** The two reactions the session page offers. The retired fire, question and star types are not reported. */
export function reactionKind(type: string): FeedbackKind | null {
  if (type === 'love') return 'approved';
  if (type === 'decline') return 'declined';
  return null;
}

/** Times as Las Vegas reads them. */
export function venueTime(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    timeZone: 'America/Los_Angeles',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function describe(event: FeedbackEvent): { label: string; colour: string; body: string } {
  const who = `<strong style="color:#ffffff;">${escapeHtml(event.who.trim() || 'Someone')}</strong>`;
  const item = `<em style="color:#e5e7eb;">${escapeHtml(event.itemTitle?.trim() || 'an untitled item')}</em>`;
  if (event.kind === 'approved') return { label: 'Approved', colour: '#10b981', body: `${who} approved ${item}` };
  if (event.kind === 'declined') return { label: 'Declined', colour: '#ef4444', body: `${who} declined ${item}` };
  if (event.kind === 'signoff') {
    const n = event.itemCount ?? 0;
    return { label: 'Confirmed', colour: GOLD, body: `${who} confirmed their approval of ${n} item${n === 1 ? '' : 's'}` };
  }
  const raw = String(event.text ?? '').trim();
  const text = raw.length > COMMENT_LIMIT ? `${raw.slice(0, COMMENT_LIMIT)}…` : raw;
  return {
    label: 'Comment',
    colour: '#60a5fa',
    body: `${who} on ${item}<div style="margin-top:6px;padding:8px 10px;border-left:2px solid #60a5fa;color:#cbd5e1;white-space:pre-wrap;">${escapeHtml(text)}</div>`,
  };
}

/**
 * One email for everything new, grouped by session, the session with the latest activity first and each session's
 * events in the order they happened. Null when there is nothing to send.
 */
export function buildFeedbackDigest(
  events: FeedbackEvent[],
  sessions: FeedbackSession[],
  origin: string,
): FeedbackDigest | null {
  const known = new Map(sessions.map((s) => [s.id, s]));
  const kept = events.filter((e) => known.has(e.sessionId));
  if (!kept.length) return null;

  const counts: Record<FeedbackKind, number> = { approved: 0, declined: 0, comment: 0, signoff: 0 };
  const bySession = new Map<string, FeedbackEvent[]>();
  for (const event of kept) {
    counts[event.kind] += 1;
    bySession.set(event.sessionId, [...(bySession.get(event.sessionId) ?? []), event]);
  }
  const latest = (list: FeedbackEvent[]) => Math.max(...list.map((e) => Date.parse(e.at)));
  const ordered = [...bySession.entries()].sort((a, b) => latest(b[1]) - latest(a[1]));

  const blocks = ordered.map(([id, list]) => {
    const session = known.get(id)!;
    const rows = [...list]
      .sort((a, b) => Date.parse(a.at) - Date.parse(b.at))
      .map((event) => {
        const d = describe(event);
        return `
          <tr>
            <td style="padding:12px 16px;border-bottom:1px solid #2a2a2a;vertical-align:top;">
              <span style="display:inline-block;padding:3px 9px;border-radius:999px;background:${d.colour}22;color:${d.colour};font-size:11px;font-weight:700;border:1px solid ${d.colour}55;">${d.label}</span>
              <div style="margin-top:6px;font-size:14px;color:#cbd5e1;line-height:1.5;">${d.body}</div>
            </td>
            <td align="right" style="padding:12px 16px;border-bottom:1px solid #2a2a2a;vertical-align:top;white-space:nowrap;font-size:12px;color:#9ca3af;">${escapeHtml(venueTime(event.at))}</td>
          </tr>`;
      })
      .join('');
    return `
      <tr><td style="padding:24px 24px 8px;">
        <div style="font-size:16px;color:#ffffff;font-weight:700;">${escapeHtml(session.projectName)}</div>
        <div style="font-size:13px;color:#9ca3af;margin-top:2px;">${escapeHtml(session.clientName)} · <a href="${origin}/creative/${encodeURIComponent(session.token)}" style="color:${GOLD};">Open the client's session</a></div>
      </td></tr>
      <tr><td style="padding:0 24px 8px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;background:#1a1a1a;border-radius:8px;overflow:hidden;">${rows}</table>
      </td></tr>`;
  });

  const parts = [
    counts.approved && `${counts.approved} approved`,
    counts.declined && `${counts.declined} declined`,
    counts.comment && `${counts.comment} comment${counts.comment === 1 ? '' : 's'}`,
    counts.signoff && `${counts.signoff} confirmed`,
  ].filter(Boolean).join(', ');
  const subject = ordered.length === 1
    ? `Soleia · ${known.get(ordered[0][0])!.projectName} · ${parts}`
    : `Soleia · client feedback on ${ordered.length} sessions · ${parts}`;

  const html = `<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#0f0f0f;border-radius:16px;overflow:hidden;border:1px solid #2a2a2a;">
        <tr><td style="padding:32px 24px 24px;border-bottom:2px solid ${GOLD};">
          <div style="font-size:11px;color:${GOLD};text-transform:uppercase;letter-spacing:2px;font-weight:700;">Soleia Creative</div>
          <h1 style="margin:8px 0 4px;font-size:24px;color:#ffffff;font-weight:700;">Client feedback</h1>
          <div style="font-size:13px;color:#9ca3af;">${escapeHtml(parts)}</div>
        </td></tr>
        ${blocks.join('')}
        <tr><td style="padding:24px;text-align:center;border-top:1px solid #2a2a2a;">
          <a href="${origin}/admin/creative" style="display:inline-block;padding:12px 24px;background:${GOLD};color:#0a0a0a;text-decoration:none;border-radius:8px;font-weight:700;font-size:14px;">Open Creative Sessions</a>
        </td></tr>
        <tr><td style="padding:16px 24px;text-align:center;background:#0a0a0a;">
          <div style="font-size:11px;color:#6b7280;">Soleia Creative · sent within 15 minutes of client activity</div>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

  return { subject, html, counts };
}
