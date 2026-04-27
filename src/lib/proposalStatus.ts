/**
 * Shared helper to determine if a proposal is "closed" (signed/won/invoiced).
 * Used to suppress overdue countdowns and deadline alerts for completed deals.
 */
const CLOSED_STATUSES = new Set(['signed', 'accepted', 'closed', 'won', 'invoiced']);

export function isProposalClosed(p: { signed_at?: string | null; status?: string | null }): boolean {
  if (!p) return false;
  if (p.signed_at) return true;
  if (p.status && CLOSED_STATUSES.has(p.status.toLowerCase())) return true;
  return false;
}
