/**
 * Client-side draft of an unsigned proposal.
 *
 * Selections and quantities used to live only in React state, so a client who
 * ticked line items and closed the tab to think it over came back to a blank
 * sheet. This keeps their working set on the device between visits.
 *
 * Scope note: this is deliberately local-only. Persisting a draft server-side
 * needs a token-scoped RPC (the existing sign_proposal_by_token also sets the
 * signature, so it cannot be reused for an unsigned draft). When that lands,
 * the server becomes the source of truth and `clear` is called on adoption.
 */

const PREFIX = 'soleia:proposal-draft:';
const MAX_AGE_MS = 60 * 24 * 60 * 60 * 1000; // 60 days

export interface ProposalDraft {
  selectedIds: string[];
  quantities: Record<string, number>;
  savedAt: number;
}

const keyFor = (token: string) => `${PREFIX}${token}`;

export function loadDraft(token: string): ProposalDraft | null {
  if (typeof window === 'undefined' || !token) return null;
  try {
    const raw = window.localStorage.getItem(keyFor(token));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ProposalDraft;
    if (!parsed || !Array.isArray(parsed.selectedIds)) return null;
    // A stale draft is worse than none — the proposal may have been revised.
    if (typeof parsed.savedAt !== 'number' || Date.now() - parsed.savedAt > MAX_AGE_MS) {
      window.localStorage.removeItem(keyFor(token));
      return null;
    }
    return parsed;
  } catch {
    // Private mode, quota, or corrupt JSON — behave as if there were no draft.
    return null;
  }
}

export function saveDraft(
  token: string,
  selectedIds: Set<string> | string[],
  quantities: Record<string, number>,
): void {
  if (typeof window === 'undefined' || !token) return;
  try {
    const draft: ProposalDraft = {
      selectedIds: Array.from(selectedIds),
      quantities,
      savedAt: Date.now(),
    };
    window.localStorage.setItem(keyFor(token), JSON.stringify(draft));
  } catch {
    // Storage unavailable or full; the session still works, it just won't resume.
  }
}

export function clearDraft(token: string): void {
  if (typeof window === 'undefined' || !token) return;
  try {
    window.localStorage.removeItem(keyFor(token));
  } catch {
    /* nothing to do */
  }
}

/**
 * Keep only ids that still exist on the proposal, so a draft cannot resurrect
 * a line item the admin has since removed.
 */
export function reconcileDraft(
  draft: ProposalDraft,
  validIds: Set<string>,
): { selectedIds: string[]; quantities: Record<string, number> } {
  const selectedIds = draft.selectedIds.filter((id) => validIds.has(id));
  const quantities: Record<string, number> = {};
  for (const [id, qty] of Object.entries(draft.quantities || {})) {
    if (validIds.has(id) && Number.isFinite(qty) && qty > 0) quantities[id] = qty;
  }
  return { selectedIds, quantities };
}
