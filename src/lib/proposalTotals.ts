/**
 * SINGLE SOURCE OF TRUTH for proposal line-item totals.
 *
 * All proposal pricing (live view, signed view, PDF, admin display, emails) MUST
 * go through these functions. Do NOT compute totals inline anywhere else — that
 * is how we ended up with multiple drifted code paths showing wrong totals
 * (e.g. the recurring $10,000 default-selection bug).
 *
 * Rules:
 *   - Unsigned proposal: total = sum of items the client has CURRENTLY checked
 *     (via `selectedIds`). With nothing checked, total is $0. The stored
 *     `proposal.total_amount` is ignored on the client side — it is a stale
 *     snapshot that only reflects whatever defaults existed at creation time.
 *   - Signed proposal: total = sum of items with `client_selected === true`,
 *     i.e. the scope the client actually accepted when they signed.
 *   - Quantity: when the client is interacting (unsigned, non-admin) they may
 *     override quantities; pass those via `qtyOverrides`. Otherwise we use the
 *     persisted `item.quantity`. `is_flat_fee` items ignore quantity entirely.
 */

export interface ProposalLineItem {
  id?: string;
  price: number | string;
  quantity?: number | string | null;
  is_flat_fee?: boolean | null;
  client_selected?: boolean | null;
}

export interface ProposalTotalContext {
  /** True once the proposal has been signed by the client. */
  signed: boolean;
  /** IDs the client currently has checked (unsigned mode only). */
  selectedIds?: Set<string>;
  /** Client-side quantity overrides keyed by item id (unsigned, non-admin only). */
  qtyOverrides?: Record<string, number>;
}

export function getEffectiveQty(item: ProposalLineItem, qtyOverrides?: Record<string, number>): number {
  const override = item.id != null ? qtyOverrides?.[item.id] : undefined;
  const raw = override ?? Number(item.quantity);
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

export function calcLineTotal(item: ProposalLineItem, qtyOverrides?: Record<string, number>): number {
  const price = Number(item.price) || 0;
  if (item.is_flat_fee) return price;
  return price * getEffectiveQty(item, qtyOverrides);
}

/** Items in the accepted/active scope, per the rules above. */
export function getActiveItems<T extends ProposalLineItem>(items: T[], ctx: ProposalTotalContext): T[] {
  if (ctx.signed) {
    return items.filter(i => i.client_selected === true);
  }
  const sel = ctx.selectedIds;
  if (!sel) return [];
  return items.filter(i => i.id != null && sel.has(String(i.id)));
}

export function calcProposalTotal(items: ProposalLineItem[], ctx: ProposalTotalContext): number {
  return getActiveItems(items, ctx).reduce((sum, i) => sum + calcLineTotal(i, ctx.qtyOverrides), 0);
}
