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

/**
 * Money off, either as a percentage of the selected scope or a flat amount.
 *
 * A discount is a decision about a client, so it is recorded on the proposal
 * rather than smuggled in as a negative line item — a negative line can be
 * ticked off, reordered, or quietly dropped from the accepted scope.
 */
export interface ProposalDiscount {
  type: 'percent' | 'amount';
  value: number | string;
  /** Why, in the client's words: "Repeat client", "Multi-event". */
  label?: string | null;
}

export interface ProposalTotalContext {
  /** True once the proposal has been signed by the client. */
  signed: boolean;
  /** IDs the client currently has checked (unsigned mode only). */
  selectedIds?: Set<string>;
  /** Client-side quantity overrides keyed by item id (unsigned, non-admin only). */
  qtyOverrides?: Record<string, number>;
  /** The proposal's discount, if it carries one. */
  discount?: ProposalDiscount | null;
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

/** The selected scope before any discount. */
export function calcSubtotal(items: ProposalLineItem[], ctx: ProposalTotalContext): number {
  return getActiveItems(items, ctx).reduce((sum, i) => sum + calcLineTotal(i, ctx.qtyOverrides), 0);
}

/**
 * What the discount takes off this subtotal, in dollars.
 *
 * Never more than the subtotal and never negative: a discount larger than the
 * work is a data-entry slip, and a proposal that owes the client money is not
 * a thing we would ever mean to print.
 */
export function calcDiscountAmount(subtotal: number, discount?: ProposalDiscount | null): number {
  if (!discount) return 0;
  const value = Number(discount.value);
  if (!Number.isFinite(value) || value <= 0) return 0;
  const off = discount.type === 'percent' ? subtotal * (Math.min(value, 100) / 100) : value;
  return Math.round(Math.min(off, subtotal) * 100) / 100;
}

/** What the client owes: the selected scope, less any discount. */
export function calcProposalTotal(items: ProposalLineItem[], ctx: ProposalTotalContext): number {
  const subtotal = calcSubtotal(items, ctx);
  return Math.round((subtotal - calcDiscountAmount(subtotal, ctx.discount)) * 100) / 100;
}
