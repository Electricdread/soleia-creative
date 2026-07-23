import { RC_GOLD, RC_GOLD_DEEP, RC_INK, RC_SOFT_INK } from './ProposalServiceRow';

const SECTIONS: { title: string; body?: string; items?: string[] }[] = [
  {
    title: 'Production Workflow & Timeline',
    items: [
      'Production does not begin until the proposal has been signed off and all client brand assets have been received. Both must be in hand before the clock starts.',
      'Once both conditions are met, our team has 14 days to create and deliver the first review cut.',
      'The client then has 3 days from delivery to submit consolidated review notes.',
      'Final revision requests must reach us no later than 4 days before the event date so we can apply, render, and deliver in time.',
    ],
  },
  { title: 'New Assets', body: 'New assets provided by the client will require a new estimate.' },
  {
    title: 'Scope Changes',
    items: [
      'Items not explicitly defined in this proposal are outside the current scope.',
      'Additional requests will require a separate estimate and written approval.',
    ],
  },
  {
    title: 'Revisions',
    items: [
      'Includes one revision round within the agreed scope and existing elements.',
      'Notes must be submitted in writing within the 3-day review window after delivery.',
      'Requests received later than 4 days before the event date cannot be guaranteed.',
      'Changes affecting the concept, direction, or new components require a new quote.',
    ],
  },
  {
    title: 'Cancellation',
    body: 'If the project is canceled after work has started, time and work completed up to the cancellation date will be invoiced.',
  },
  {
    title: 'Creative Ownership & Licensing',
    body: "The client is granted a limited, non-exclusive license to use these visual scenes for the duration and scope of the agreed-upon project or event. Ownership of the underlying creative files, content structures, and mapped configurations remains with Soleia Creative Team. Any additional usage, replication, or modification beyond the agreed project requires prior written approval or a separate licensing agreement.",
  },
  {
    title: 'Logo Animation Rights',
    body: "The transparent logo animation is a custom element designed and rendered by Soleia Creative Team using the client's logo and brand assets. Because this animation integrates the client's proprietary branding, the finalized rendered animation may be retained and used by the client for internal display or promotional purposes.",
  },
];

export default function ProposalTerms() {
  return (
    <section className="mb-12">
      <div className="flex items-center gap-3 mt-10 mb-4">
        <span className="text-[10px] tracking-[0.35em] uppercase" style={{ color: RC_GOLD_DEEP }}>
          Terms
        </span>
        <span className="flex-1" style={{ height: 1, backgroundColor: `${RC_GOLD}55` }} />
      </div>
      <div className="space-y-5">
        {SECTIONS.map((sec) => (
          <div key={sec.title}>
            <h4 className="font-display mb-1.5" style={{ color: RC_INK, fontSize: 14 }}>{sec.title}</h4>
            {sec.body && (
              <p className="text-[12.5px] leading-relaxed" style={{ color: RC_SOFT_INK }}>{sec.body}</p>
            )}
            {sec.items && (
              <ul className="text-[12.5px] leading-relaxed space-y-1" style={{ color: RC_SOFT_INK }}>
                {sec.items.map((it, i) => (
                  <li key={i} className="flex gap-2">
                    <span style={{ color: RC_GOLD_DEEP }}>•</span>
                    <span>{it}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
