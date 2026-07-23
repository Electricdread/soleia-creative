import { type MouseEvent } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Minus, Plus } from 'lucide-react';

// Rate-card palette — kept local so ProposalView can share these constants too.
export const RC_IVORY = '#f7f2ea';
export const RC_GOLD = '#b1893f';
export const RC_GOLD_DEEP = '#9a6f2a';
export const RC_GOLD_TINT = '#f3e9d2';
export const RC_INK = '#3a332a';
export const RC_SOFT_INK = '#6e6455';

const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(n);

interface Props {
  item: any;
  lineTotal: number;
  qty: number;
  selected: boolean;
  signed: boolean;
  isAdmin?: boolean;
  clientEditable: boolean;
  onToggle: (id: string) => void;
  onAdjustQty: (id: string, delta: number) => void;
  onRowClick: (event: MouseEvent<HTMLElement>, id: string) => void;
}

export default function ProposalServiceRow({
  item,
  lineTotal,
  qty,
  selected,
  signed,
  isAdmin,
  clientEditable,
  onToggle,
  onAdjustQty,
  onRowClick,
}: Props) {
  const isFlatFee = !!item.is_flat_fee;
  const showCheckbox = !signed && !isAdmin;
  const stop = (e: MouseEvent<HTMLElement>) => e.stopPropagation();

  return (
    <div
      role={showCheckbox ? 'button' : undefined}
      onClick={(e) => onRowClick(e, item.id)}
      className="group py-4 transition-colors"
      style={{
        borderTop: `1px solid ${RC_SOFT_INK}22`,
        cursor: showCheckbox ? 'pointer' : 'default',
        backgroundColor: selected ? `${RC_GOLD_TINT}55` : 'transparent',
      }}
    >
      <div className="flex items-start gap-3 sm:gap-4">
        {showCheckbox && (
          <div className="pt-1 shrink-0" onClick={stop}>
            <Checkbox
              checked={selected}
              aria-label={`Select ${item.title}`}
              onCheckedChange={(v) => onToggle(item.id)}
              onPointerDown={stop}
              className="w-5 h-5 border-2 rounded-full"
              style={{ borderColor: RC_GOLD }}
            />
          </div>
        )}

        <div className="flex-1 min-w-0">
          {/* Title + right-side price strip */}
          <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1 sm:gap-6">
            <h3
              className="font-display leading-tight"
              style={{ fontSize: 16, color: RC_INK }}
            >
              {item.title}
            </h3>
            <div
              className="font-medium shrink-0 text-left sm:text-right"
              style={{ color: RC_INK, fontSize: 15, minWidth: 80 }}
            >
              {fmt(lineTotal)}
            </div>
          </div>

          {/* Full-width description */}
          {item.description && (
            <p
              className="mt-1.5 whitespace-pre-line"
              style={{
                color: RC_SOFT_INK,
                fontSize: 12.5,
                lineHeight: 1.55,
                maxWidth: '62ch',
              }}
            >
              {item.description}
            </p>
          )}

          {/* Meta row: qty stepper / unit / rate */}
          <div
            className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-3 text-[11.5px] tracking-wide"
            style={{ color: RC_SOFT_INK }}
            onClick={stop}
          >
            {!isFlatFee && (
              <>
                {clientEditable ? (
                  <div className="inline-flex items-center gap-2">
                    <span className="uppercase tracking-[0.18em] text-[10px]" style={{ color: RC_GOLD_DEEP }}>
                      Qty
                    </span>
                    <button
                      type="button"
                      onClick={() => onAdjustQty(item.id, -1)}
                      disabled={qty <= 1}
                      aria-label="Decrease quantity"
                      className="w-7 h-7 inline-flex items-center justify-center rounded-full transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      style={{ border: `1px solid ${RC_GOLD}`, color: RC_INK, backgroundColor: '#fff' }}
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span
                      className="min-w-[1.5rem] text-center font-semibold tabular-nums"
                      style={{ color: RC_INK, fontSize: 13 }}
                    >
                      {qty}
                    </span>
                    <button
                      type="button"
                      onClick={() => onAdjustQty(item.id, 1)}
                      aria-label="Increase quantity"
                      className="w-7 h-7 inline-flex items-center justify-center rounded-full transition-colors"
                      style={{ border: `1px solid ${RC_GOLD}`, color: RC_INK, backgroundColor: '#fff' }}
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <span>
                    <span className="uppercase tracking-[0.18em] text-[10px] mr-1.5" style={{ color: RC_GOLD_DEEP }}>Qty</span>
                    <span style={{ color: RC_INK }} className="font-semibold">{qty}</span>
                  </span>
                )}

                {item.unit && (
                  <span>
                    <span className="uppercase tracking-[0.18em] text-[10px] mr-1.5" style={{ color: RC_GOLD_DEEP }}>Unit</span>
                    <span style={{ color: RC_INK }}>{item.unit}</span>
                  </span>
                )}

                <span>
                  <span className="uppercase tracking-[0.18em] text-[10px] mr-1.5" style={{ color: RC_GOLD_DEEP }}>Rate</span>
                  <span style={{ color: RC_INK }}>{fmt(Number(item.price))}</span>
                </span>
              </>
            )}
            {isFlatFee && (
              <span className="uppercase tracking-[0.2em] text-[10px]" style={{ color: RC_GOLD_DEEP }}>
                Flat Fee
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
