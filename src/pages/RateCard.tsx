import { useEffect, useState } from 'react';
import { Download, Printer } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { downloadRateCardPdf, type RateCardAddon } from '@/lib/rateCardPdf';

const IVORY = '#f7f2ea';
const GOLD = '#b1893f';
const GOLD_DEEP = '#9a6f2a';
const GOLD_TINT = '#f3e9d2';
const INK = '#3a332a';
const SOFT_INK = '#6e6455';

export default function RateCard() {
  const [addons, setAddons] = useState<RateCardAddon[]>([]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('line_item_templates')
        .select('title, price, sort_order')
        .order('sort_order', { ascending: true, nullsFirst: false })
        .order('title', { ascending: true })
        .limit(20);
      const filtered = (data || [])
        .filter((t: any) => !/immersive led environments/i.test(t.title || ''))
        .slice(0, 8)
        .map((t: any) => ({ title: t.title, price: Number(t.price) || 0 }));
      setAddons(filtered);
    })();
  }, []);

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(n);

  return (
    <div className="min-h-screen w-full py-10 px-4 print:py-0 print:px-0" style={{ backgroundColor: IVORY, color: INK }}>
      <style>{`
        @media print {
          @page { size: letter; margin: 0.4in; }
          .no-print { display: none !important; }
        }
      `}</style>

      {/* Action bar */}
      <div className="no-print max-w-[820px] mx-auto mb-6 flex justify-end gap-2">
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-4 py-2 text-xs tracking-[0.2em] uppercase border rounded-sm transition hover:bg-white"
          style={{ borderColor: GOLD, color: GOLD_DEEP }}
        >
          <Printer className="w-3.5 h-3.5" /> Print
        </button>
        <button
          onClick={() => downloadRateCardPdf(addons)}
          className="flex items-center gap-2 px-4 py-2 text-xs tracking-[0.2em] uppercase rounded-sm transition"
          style={{ backgroundColor: GOLD, color: '#fff' }}
        >
          <Download className="w-3.5 h-3.5" /> PDF
        </button>
      </div>

      {/* Framed sheet */}
      <div
        className="max-w-[820px] mx-auto relative bg-transparent p-8 sm:p-14"
        style={{ border: `1px solid ${GOLD}` }}
      >
        <div
          className="absolute inset-2 pointer-events-none"
          style={{ border: `1px solid ${GOLD}`, opacity: 0.5 }}
        />

        {/* Header */}
        <header className="text-center relative">
          <h1 className="font-display tracking-wide" style={{ fontSize: 42, color: INK, letterSpacing: '0.02em' }}>
            SOLEIA
          </h1>
          <div className="flex justify-center my-2">
            <span
              className="inline-block w-3 h-3 rounded-full"
              style={{ border: `1px solid ${GOLD}` }}
              aria-hidden
            />
          </div>
          <div className="text-[10px] tracking-[0.45em]" style={{ color: GOLD_DEEP }}>
            LAS VEGAS
          </div>
          <div className="mt-6 text-[10px] tracking-[0.35em]" style={{ color: SOFT_INK }}>
            CREATIVE SERVICES &amp; RATE CARD
          </div>
          <h2 className="font-display mt-6" style={{ fontSize: 30, color: INK }}>
            Soleia Creative <em style={{ color: GOLD_DEEP, fontStyle: 'italic' }}>&amp;</em> Immersive LED
          </h2>
          <div className="mt-3 text-[10px] tracking-[0.35em]" style={{ color: SOFT_INK }}>
            ENVIRONMENTS · BRANDED OVERLAYS · MAPPING
          </div>
          <div className="flex justify-center mt-6">
            <div style={{ width: 60, height: 1, backgroundColor: GOLD }} />
          </div>
        </header>

        {/* Section 1: Featured Package */}
        <section
          className="mt-10 p-8 rounded-sm relative"
          style={{ backgroundColor: GOLD_TINT, border: `1px solid ${GOLD}` }}
        >
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-6">
            <div className="flex-1">
              <h3 className="font-display leading-tight" style={{ fontSize: 22, color: INK }}>
                Immersive LED Environments &amp; Branded Overlay Design
              </h3>
              <p className="mt-4 text-sm leading-relaxed" style={{ color: SOFT_INK }}>
                We will animate your brand's visual assets and turn them into Soleia's immersive experience. Our team
                manages the entire video mapping workflow and delivers animations directly to our playback server for
                stable, optimized performance. You will supply brand assets, logos, graphics, and mood board
                references, and we will develop a storyboard for a memorable guest journey, including a dynamic
                elevator animation to greet guests upon arrival.
              </p>
              <div className="mt-6 flex items-center gap-3 text-xs" style={{ color: INK }}>
                <span className="tracking-[0.3em]" style={{ color: GOLD_DEEP }}>QTY</span>
                <span className="font-medium">1 × Unit</span>
              </div>
            </div>
            <div className="text-right sm:pl-6 sm:border-l shrink-0" style={{ borderColor: `${GOLD}55` }}>
              <div className="text-[10px] tracking-[0.3em]" style={{ color: GOLD_DEEP }}>
                STARTING AT
              </div>
              <div className="font-display mt-2" style={{ fontSize: 44, color: INK, lineHeight: 1 }}>
                $3,000
              </div>
            </div>
          </div>
        </section>

        {/* Callout: Venue Contract */}
        <section
          className="mt-6 p-5 rounded-sm relative"
          style={{ backgroundColor: '#fff', border: `1px solid ${GOLD}`, borderLeft: `3px solid ${GOLD}` }}
        >
          <div className="text-[10px] tracking-[0.3em] mb-2" style={{ color: GOLD_DEEP }}>
            INCLUDED IN YOUR VENUE CONTRACT
          </div>
          <ul className="text-sm space-y-1" style={{ color: INK }}>
            <li>• Up to 10 static logos — LED screens</li>
            <li>• 1 static logo — all TVs, Cabanas &amp; Bungalows</li>
          </ul>
        </section>

        {/* Section 2: Additional Services */}
        {addons.length > 0 && (
          <section className="mt-10">
            <div
              className="text-[10px] tracking-[0.35em] pb-2 mb-4"
              style={{ color: GOLD_DEEP, borderBottom: `1px solid ${GOLD}` }}
            >
              ADDITIONAL SERVICES
            </div>
            <ul className="space-y-3">
              {addons.map((item, i) => (
                <li key={i} className="flex items-baseline gap-3">
                  <span className="font-display" style={{ fontSize: 15, color: INK }}>
                    {item.title}
                  </span>
                  <span
                    className="flex-1 border-b border-dotted mx-1"
                    style={{ borderColor: `${SOFT_INK}55`, transform: 'translateY(-3px)' }}
                  />
                  <span className="text-sm font-medium" style={{ color: INK }}>
                    {fmt(item.price)}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Footer */}
        <footer className="mt-12 text-center">
          <div className="flex justify-center mb-4">
            <div style={{ width: 48, height: 1, backgroundColor: GOLD }} />
          </div>
          <p className="italic text-sm" style={{ color: SOFT_INK, fontFamily: 'Georgia, serif' }}>
            Pricing is a guide; final proposals are tailored to each engagement.
          </p>
          <p className="mt-3 text-[10px] tracking-[0.3em]" style={{ color: GOLD_DEEP }}>
            SOLEIACREATIVE.APP · LAS VEGAS
          </p>
        </footer>
      </div>
    </div>
  );
}
