import { useEffect, useMemo, useState } from 'react';
import { Download, Printer, GripVertical, Loader2 } from 'lucide-react';
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

const IVORY = '#f7f2ea';
const GOLD = '#b1893f';
const GOLD_DEEP = '#9a6f2a';
const GOLD_TINT = '#f3e9d2';
const INK = '#3a332a';
const SOFT_INK = '#6e6455';

type Row = {
  id: string;
  title: string;
  description: string; // long_description from DB, falls back to ideal_for
  price: number;
  category: string | null;
  sort_order: number | null;
};

type Category = { name: string; intro: string | null; sort_order: number | null };

const PACKAGE_CATEGORY = 'Soleia Creative Package';
const ADDITIONAL = 'Additional Options';
const VIDEO_MAPPING = 'Video Mapping & Load Fees';

const TERMS = [
  'Work begins only after sign-off and receipt of all brand assets.',
  '14 days from kickoff to first review-cut delivery.',
  'Client review window: 3 days from delivery.',
  'One included revision round.',
  'Final revision requests due no later than 4 days before the event.',
  'Creative licensing covers the event duration only.',
];

const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(n);

function ServiceRow({
  row,
  isAdmin,
}: {
  row: Row;
  isAdmin: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: row.id, disabled: !isAdmin });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    background: isDragging ? `${GOLD_TINT}55` : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="rc-row py-3"
      // top border via inline style so it survives HMR
    >
      <div
        className="flex items-start gap-2 sm:gap-3"
        style={{ borderTop: `1px solid ${SOFT_INK}22`, paddingTop: 12 }}
      >
        {isAdmin && (
          <button
            type="button"
            className="no-print shrink-0 mt-0.5 p-1.5 rounded-sm cursor-grab active:cursor-grabbing tap-44"
            style={{ color: GOLD_DEEP, touchAction: 'none' }}
            aria-label={`Drag to reorder ${row.title}`}
            {...attributes}
            {...listeners}
          >
            <GripVertical className="w-4 h-4" />
          </button>
        )}
        <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-6">
          <div className="flex-1 min-w-0">
            <div
              className="rc-row-title font-display"
              style={{ fontSize: 15, color: INK, lineHeight: 1.3 }}
            >
              {row.title}
            </div>
            {row.description && (
              <p
                className="rc-row-desc mt-1 text-[11.5px] leading-snug break-words"
                style={{ color: SOFT_INK }}
              >
                {row.description}
              </p>
            )}
          </div>
          <div
            className="rc-row-price font-medium text-sm shrink-0 text-right pt-0.5"
            style={{ color: INK, minWidth: 60 }}
          >
            {fmt(row.price)}
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="rc-eyebrow-wrap flex items-center gap-3 mt-9 mb-1">
      <span className="text-[10px] tracking-[0.35em]" style={{ color: GOLD_DEEP }}>
        {children}
      </span>
      <span className="flex-1" style={{ height: 1, backgroundColor: `${GOLD}66` }} />
    </div>
  );
}

function CategorySection({
  label,
  items,
  isAdmin,
  onReorder,
}: {
  label: string;
  items: Row[];
  isAdmin: boolean;
  onReorder: (category: string, ids: string[]) => void;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
  );

  const ids = items.map((i) => i.id);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = ids.indexOf(String(active.id));
    const newIndex = ids.indexOf(String(over.id));
    if (oldIndex < 0 || newIndex < 0) return;
    const next = arrayMove(ids, oldIndex, newIndex);
    onReorder(label, next);
  };

  return (
    <>
      <SectionLabel>{label.toUpperCase()}</SectionLabel>
      <div>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={ids} strategy={verticalListSortingStrategy}>
            {items.map((r) => (
              <ServiceRow key={r.id} row={r} isAdmin={isAdmin} />
            ))}
          </SortableContext>
        </DndContext>
      </div>
    </>
  );
}

/**
 * Compact typography used for the printed sheet. The same rules are also applied
 * via `.rc-measuring` on screen so the fit calculation measures real print height.
 */
const compactDeclarations = (sheet: string, scope: string) => `
  ${sheet} {
    padding: 14px 18px !important;
    width: 768px !important;
    max-width: 768px !important;
    margin: 0 !important;
    page-break-inside: avoid;
    break-inside: avoid;
    transform-origin: top left;
  }
  ${sheet} * { page-break-inside: avoid; break-inside: avoid; }
  ${scope} .rc-eyebrow-wrap { margin-top: 8px !important; margin-bottom: 3px !important; }
  ${scope} .rc-package { padding: 10px 12px !important; }
  ${scope} .rc-package h3 { font-size: 13px !important; line-height: 1.2 !important; }
  ${scope} .rc-package p { font-size: 9.5px !important; margin-top: 4px !important; line-height: 1.3 !important; }
  ${scope} .rc-package .rc-price { font-size: 20px !important; }
  ${scope} .rc-venue { margin-top: 6px !important; padding: 6px 10px !important; }
  ${scope} .rc-venue .rc-venue-body { font-size: 10px !important; }
  ${scope} .rc-row { padding: 3px 0 !important; }
  ${scope} .rc-row .rc-row-title { font-size: 11px !important; line-height: 1.2 !important; }
  ${scope} .rc-row .rc-row-desc { font-size: 8.75px !important; margin-top: 1px !important; line-height: 1.22 !important; }
  ${scope} .rc-row .rc-row-price { font-size: 11px !important; }
  ${scope} .rc-process { margin-top: 6px !important; gap: 6px !important; }
  ${scope} .rc-process > div { padding: 8px 0 !important; }
  ${scope} .rc-process .rc-process-big { font-size: 14px !important; }
  ${scope} .rc-terms { margin-top: 6px !important; font-size: 9.5px !important; }
  ${scope} .rc-terms li { margin-top: 1px !important; }
  ${scope} .rc-footer { margin-top: 10px !important; }
`;

const COMPACT_RULES = (ivory: string) => `
  @media print {
    @page { size: letter; margin: 0.25in; }
    html, body { background: ${ivory} !important; }
    .no-print { display: none !important; }
    ${compactDeclarations('.rate-card-sheet', '')}
    .rate-card-sheet {
      transform: scale(var(--rc-print-scale, 1));
      height: var(--rc-print-height, auto);
      overflow: hidden;
    }
  }
  ${compactDeclarations('.rate-card-sheet.rc-measuring', '.rate-card-sheet.rc-measuring')}
`;


export default function RateCard() {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const [items, setItems] = useState<Row[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Scale the sheet down so it always prints on a single Letter page.
  useEffect(() => {
    const sheet = () => document.querySelector<HTMLElement>('.rate-card-sheet');
    const fit = () => {
      const el = sheet();
      if (!el) return;
      el.style.setProperty('--rc-print-scale', '1');
      // Measure with the print typography applied (Letter @96dpi minus 0.25in margins).
      const availH = 10.5 * 96;
      el.classList.add('rc-measuring');
      const h = el.scrollHeight;
      el.classList.remove('rc-measuring');
      const scale = Math.min(1, availH / h);
      el.style.setProperty('--rc-print-scale', String(scale));
      el.style.setProperty('--rc-print-height', `${Math.ceil(h * scale)}px`);
    };
    const reset = () => {
      const el = sheet();
      if (!el) return;
      el.style.removeProperty('--rc-print-scale');
      el.style.removeProperty('--rc-print-height');
    };
    window.addEventListener('beforeprint', fit);
    window.addEventListener('afterprint', reset);
    return () => {
      window.removeEventListener('beforeprint', fit);
      window.removeEventListener('afterprint', reset);
    };
  }, []);


  useEffect(() => {
    (async () => {
      setLoading(true);
      const [addonsRes, catsRes] = await Promise.all([
        supabase.rpc('get_rate_card_addons'),
        supabase.rpc('get_rate_card_categories'),
      ]);
      const rows: Row[] = ((addonsRes.data as any[]) || []).map((r) => ({
        id: r.id,
        title: r.title,
        description: r.long_description || r.ideal_for || '',
        price: Number(r.price) || 0,
        category: r.category,
        sort_order: r.sort_order,
      }));
      setItems(rows);
      setCategories(((catsRes.data as any[]) || []) as Category[]);
      setLoading(false);
    })();
  }, []);

  const grouped = useMemo(() => {
    const byCat = new Map<string, Row[]>();
    for (const r of items) {
      const key = r.category || 'Other';
      if (!byCat.has(key)) byCat.set(key, []);
      byCat.get(key)!.push(r);
    }
    for (const arr of byCat.values()) {
      arr.sort((a, b) => (a.sort_order ?? 999) - (b.sort_order ?? 999));
    }
    return byCat;
  }, [items]);

  const orderedCategoryNames = useMemo(() => {
    const seen = new Set<string>();
    const list: string[] = [];
    // preferred order from line_item_categories, then any remaining
    for (const c of categories) {
      if (c.name === PACKAGE_CATEGORY) continue;
      if (grouped.has(c.name)) {
        list.push(c.name);
        seen.add(c.name);
      }
    }
    for (const key of grouped.keys()) {
      if (key !== PACKAGE_CATEGORY && !seen.has(key)) list.push(key);
    }
    // Force Additional Options first, Video Mapping second, if both present
    return list.sort((a, b) => {
      const order = (x: string) =>
        x === ADDITIONAL ? 0 : x === VIDEO_MAPPING ? 1 : 2;
      return order(a) - order(b);
    });
  }, [categories, grouped]);

  const handleReorder = async (category: string, newIds: string[]) => {
    // optimistic update: rewrite sort_order within that category
    const nextItems = items.map((row) => {
      if (row.category !== category) return row;
      const idx = newIds.indexOf(row.id);
      return idx >= 0 ? { ...row, sort_order: idx + 1 } : row;
    });
    const prev = items;
    setItems(nextItems);

    const payload = newIds.map((id, idx) => ({ id, sort_order: idx + 1 }));
    const { error } = await supabase.rpc('admin_reorder_rate_card_items', {
      p_items: payload as any,
    });
    if (error) {
      setItems(prev);
      toast({
        title: 'Reorder failed',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({ title: 'Order saved' });
    }
  };

  return (
    <div
      className="min-h-screen w-full py-10 px-4 print:py-0 print:px-0"
      style={{ backgroundColor: IVORY, color: INK }}
    >
      <style>{`
        ${COMPACT_RULES(IVORY)}
      `}</style>

      {/* Action bar */}
      <div className="no-print max-w-[820px] mx-auto mb-6 flex justify-between items-center gap-2">
        <div className="text-[10px] tracking-[0.3em]" style={{ color: GOLD_DEEP }}>
          {isAdmin ? 'ADMIN · DRAG TO REORDER LINE ITEMS' : ''}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 text-xs tracking-[0.2em] uppercase border rounded-sm transition hover:bg-white"
            style={{ borderColor: GOLD, color: GOLD_DEEP }}
          >
            <Printer className="w-3.5 h-3.5" /> Print
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 text-xs tracking-[0.2em] uppercase rounded-sm transition"
            style={{ backgroundColor: GOLD, color: '#fff' }}
          >
            <Download className="w-3.5 h-3.5" /> PDF
          </button>
        </div>
      </div>

      {/* Framed sheet */}
      <div
        className="rate-card-sheet max-w-[820px] mx-auto relative bg-transparent p-5 sm:p-12"
        style={{ border: `1px solid ${GOLD}` }}
      >
        <div
          className="absolute inset-2 pointer-events-none hidden sm:block"
          style={{ border: `1px solid ${GOLD}`, opacity: 0.5 }}
        />

        {/* Section eyebrow */}
        <div className="rc-eyebrow-wrap flex items-center gap-3 mt-4 sm:mt-8 mb-3">
          <span className="text-[10px] tracking-[0.35em]" style={{ color: GOLD_DEEP }}>
            SOLEIA CREATIVE PACKAGE
          </span>
          <span className="flex-1" style={{ height: 1, backgroundColor: `${GOLD}66` }} />
        </div>

        {/* Featured package */}
        <section
          className="rc-package p-4 sm:p-6 rounded-sm relative"
          style={{ backgroundColor: GOLD_TINT, border: `1px solid ${GOLD}` }}
        >
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 sm:gap-6">
            <div className="flex-1 min-w-0">
              <h3 className="font-display leading-tight text-[17px] sm:text-[18px]" style={{ color: INK }}>
                Immersive LED Environments &amp; Branded Overlay Design
              </h3>
              <p className="mt-3 text-[12px] leading-relaxed break-words" style={{ color: SOFT_INK }}>
                We will animate your brand's visual assets and turn them into Soleia's immersive
                experience. Our team manages the entire video mapping workflow and delivers
                animations directly to our playback server for stable, optimized performance. You
                will supply brand assets, logos, graphics, and mood board references, and we will
                develop a storyboard for a memorable guest journey, including a dynamic elevator
                animation to greet guests upon arrival.
              </p>
              <p className="mt-2 text-[12px] leading-relaxed break-words" style={{ color: INK }}>
                <span className="font-medium" style={{ color: GOLD_DEEP }}>Includes:</span> 1–3 looks across all venue LED screens and elevator displays, plus a 3D previz to view your content on the screens before the event. Cabana &amp; bungalow TVs quoted separately based on asset delivery.
              </p>
            </div>
            <div className="flex items-end justify-between sm:block sm:text-right sm:shrink-0 gap-4">
              <div className="text-right">
                <div className="text-[10px] tracking-[0.3em]" style={{ color: GOLD_DEEP }}>
                  STARTING AT
                </div>
                <div className="rc-price font-display mt-1" style={{ fontSize: 30, color: INK, lineHeight: 1 }}>
                  $3,000<span style={{ color: GOLD_DEEP }}>*</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Venue contract callout */}
        <section
          className="rc-venue mt-5 p-4 rounded-sm relative"
          style={{ backgroundColor: GOLD_TINT + '80', border: `1px solid ${GOLD}`, borderLeft: `3px solid ${GOLD}` }}
        >
          <div className="text-[10px] tracking-[0.3em] mb-2" style={{ color: GOLD_DEEP }}>
            INCLUDED IN YOUR VENUE CONTRACT
          </div>
          <div className="rc-venue-body text-[12px] flex flex-wrap gap-x-6 gap-y-1" style={{ color: INK }}>
            <span>Up to 10 static logos — LED screens</span>
            <span className="hidden sm:inline" style={{ color: `${GOLD}` }}>·</span>
            <span>1 static logo — all TVs, Cabanas &amp; Bungalows</span>
          </div>
        </section>

        {/* DB-driven category sections */}
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-5 h-5 animate-spin" style={{ color: GOLD_DEEP }} />
          </div>
        ) : (
          orderedCategoryNames.map((name) => (
            <CategorySection
              key={name}
              label={name}
              items={grouped.get(name) || []}
              isAdmin={isAdmin}
              onReorder={handleReorder}
            />
          ))
        )}

        {/* The Process */}
        <SectionLabel>THE PROCESS</SectionLabel>
        <div className="rc-process grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
          {[
            { big: '14 Days', small: 'CONTENT CREATION' },
            { big: '3 Days', small: 'CLIENT REVIEW' },
            { big: '1 Round', small: 'REVISION & FINAL DELIVERY' },
          ].map((c, i) => (
            <div
              key={i}
              className="text-center py-4 sm:py-5 rounded-sm"
              style={{ backgroundColor: GOLD_TINT + '88', border: `1px solid ${GOLD}` }}
            >
              <div className="rc-process-big font-display" style={{ fontSize: 22, color: INK }}>
                {c.big}
              </div>
              <div className="mt-2 text-[9px] tracking-[0.3em]" style={{ color: GOLD_DEEP }}>
                {c.small}
              </div>
            </div>
          ))}
        </div>

        {/* Terms */}
        <SectionLabel>TERMS &amp; CONDITIONS</SectionLabel>
        <ul className="rc-terms mt-3 space-y-1.5 text-[11.5px]" style={{ color: INK }}>
          {TERMS.map((t, i) => (
            <li key={i} className="flex gap-3">
              <span style={{ color: GOLD_DEEP }}>•</span>
              <span>{t}</span>
            </li>
          ))}
        </ul>

        {/* Footer */}
        <footer className="rc-footer mt-10 text-center">
          <div className="text-[10px] tracking-[0.45em]" style={{ color: GOLD_DEEP }}>
            SOLEIA LAS VEGAS
          </div>
        </footer>
      </div>
    </div>
  );
}
