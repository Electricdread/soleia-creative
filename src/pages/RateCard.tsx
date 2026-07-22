import { Download, Printer } from 'lucide-react';

const IVORY = '#f7f2ea';
const GOLD = '#b1893f';
const GOLD_DEEP = '#9a6f2a';
const GOLD_TINT = '#f3e9d2';
const INK = '#3a332a';
const SOFT_INK = '#6e6455';

type Row = { title: string; description: string; price: number };

const ADDITIONAL_OPTIONS: Row[] = [
  {
    title: 'Static Logo',
    description: 'Individual static brand logo, content to spec provided by client.',
    price: 200,
  },
  {
    title: 'Transparent Logo Animation',
    description: 'Individual transparent logo animation.',
    price: 750,
  },
  {
    title: 'Elevator Dynamic Animation',
    description:
      'Dynamic elevator branding with directional content (3): static image for stationary position, animated video for ride up, and animated video for ride down.',
    price: 750,
  },
  {
    title: 'Elevator Created by Client',
    description:
      'Client-created elevator animation delivered to spec (static + up + down). Soleia handles load and playback setup only.',
    price: 500,
  },
  {
    title: 'Elevator Static Logo',
    description: 'Content to spec provided by client.',
    price: 350,
  },
  {
    title: 'Individual Cabana / Bungalow Logo',
    description: 'Individual logo in a dedicated cabana or bungalow, up to 24.',
    price: 300,
  },
  {
    title: '3D Previz',
    description:
      "We provide a 3D previsualization walk-through of your content mapped onto our venue's LED screens, shown in ultra-photorealistic detail. This allows you to review how your brand assets, motion graphics, and ambient visuals will look and feel in the space before production, ensuring alignment with your creative and technical goals.",
    price: 350,
  },
];


const VIDEO_MAPPING: Row[] = [
  {
    title: 'Mapped by Soleia Creative Team',
    description:
      'Mapping of client logo and brand animations, max 50 GB. Revisions to content after delivery (new files, edits, or re-export) will incur additional fees.',

    price: 1500,
  },
  {
    title: 'Mapped to Spec by Client',
    description:
      'Client maps content to spec and provides to Soleia (no edits needed by Soleia Creative Team), max 50 GB. Revisions after delivery will incur additional fees.',
    price: 1000,
  },
  {
    title: 'Outside Arch Specific Video',
    description: 'Content to spec provided by client.',
    price: 500,
  },
  {
    title: 'Performing Artist — Mapped by Soleia Creative Team',
    description: '',
    price: 950,
  },
];

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

function ServiceRow({ row }: { row: Row }) {
  return (
    <div className="rc-row py-3" style={{ borderTop: `1px solid ${SOFT_INK}22` }}>
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-6">
        <div className="flex-1 min-w-0">
          <div className="rc-row-title font-display" style={{ fontSize: 15, color: INK, lineHeight: 1.3 }}>
            {row.title}
          </div>
          {row.description && (
            <p className="rc-row-desc mt-1 text-[11.5px] leading-snug break-words" style={{ color: SOFT_INK }}>
              {row.description}
            </p>
          )}
        </div>
        <div className="flex items-center justify-between sm:justify-end gap-6 sm:gap-6 sm:contents">
          <div className="text-[10px] tracking-[0.25em] shrink-0 pt-1" style={{ color: SOFT_INK }}>
            1 × Unit
          </div>
          <div className="rc-row-price font-medium text-sm shrink-0 text-right pt-0.5" style={{ color: INK, minWidth: 60 }}>
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

export default function RateCard() {
  return (
    <div
      className="min-h-screen w-full py-10 px-4 print:py-0 print:px-0"
      style={{ backgroundColor: IVORY, color: INK }}
    >
      <style>{`
        @media print {
          @page { size: letter; margin: 0.25in; }
          html, body { background: ${IVORY} !important; }
          .no-print { display: none !important; }
          .rate-card-sheet {
            padding: 14px 18px !important;
            max-width: 100% !important;
            page-break-inside: avoid;
            break-inside: avoid;
            transform-origin: top left;
          }
          .rate-card-sheet * { page-break-inside: avoid; break-inside: avoid; }
          .rc-eyebrow-wrap { margin-top: 8px !important; margin-bottom: 3px !important; }
          .rc-package { padding: 10px 12px !important; }
          .rc-package h3 { font-size: 13px !important; line-height: 1.2 !important; }
          .rc-package p { font-size: 9.5px !important; margin-top: 4px !important; line-height: 1.3 !important; }
          .rc-package .rc-price { font-size: 20px !important; }
          .rc-venue { margin-top: 6px !important; padding: 6px 10px !important; }
          .rc-venue .rc-venue-body { font-size: 10px !important; }
          .rc-row { padding: 3px 0 !important; }
          .rc-row .rc-row-title { font-size: 11px !important; line-height: 1.2 !important; }
          .rc-row .rc-row-desc { font-size: 8.75px !important; margin-top: 1px !important; line-height: 1.22 !important; }
          .rc-row .rc-row-price { font-size: 11px !important; }
          .rc-process { margin-top: 6px !important; gap: 6px !important; }
          .rc-process > div { padding: 8px 0 !important; }
          .rc-process .rc-process-big { font-size: 14px !important; }
          .rc-terms { margin-top: 6px !important; font-size: 9.5px !important; }
          .rc-terms li { margin-top: 1px !important; }
          .rc-footer { margin-top: 10px !important; }
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
          onClick={() => window.print()}
          className="flex items-center gap-2 px-4 py-2 text-xs tracking-[0.2em] uppercase rounded-sm transition"
          style={{ backgroundColor: GOLD, color: '#fff' }}
        >
          <Download className="w-3.5 h-3.5" /> PDF
        </button>
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
                <span className="font-medium" style={{ color: GOLD_DEEP }}>Includes:</span> 1–3 looks across all venue LED screens and elevator displays. Cabana &amp; bungalow TVs quoted separately based on asset delivery.
              </p>

            </div>
            <div className="flex items-end justify-between sm:block sm:text-right sm:shrink-0 gap-4">
              <div className="text-[10px] tracking-[0.25em] pt-1" style={{ color: SOFT_INK }}>
                1 × Unit
              </div>
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

        {/* Additional Options */}
        <SectionLabel>ADDITIONAL OPTIONS</SectionLabel>
        <div>
          {ADDITIONAL_OPTIONS.map((r, i) => (
            <ServiceRow key={i} row={r} />
          ))}
        </div>

        {/* Video Mapping & Load Fees */}
        <SectionLabel>VIDEO MAPPING &amp; LOAD FEES</SectionLabel>
        <div>
          {VIDEO_MAPPING.map((r, i) => (
            <ServiceRow key={i} row={r} />
          ))}
        </div>

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
