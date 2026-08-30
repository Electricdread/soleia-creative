/**
 * Deno copy of `src/lib/proposalTotals.ts`.
 *
 * Edge functions cannot import from `src/`, so the arithmetic lives twice.
 * `src/lib/proposalTotals.deno.test.ts` reads this file and fails unless
 * everything from the first `export` is byte-identical to the browser copy.
 * Byte-identical, not merely similar: this is money, and a copy where someone
 * changed `>` to `>=` would pass a looser check.
 *
 * Change one, change both.
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
