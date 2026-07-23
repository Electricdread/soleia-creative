import { RC_GOLD, RC_GOLD_DEEP, RC_INK, RC_SOFT_INK, RC_GOLD_TINT } from './ProposalServiceRow';

interface ProposalTimelineProps {
  timeline: any[];
}

export default function ProposalTimeline({ timeline }: ProposalTimelineProps) {
  if (timeline.length === 0) return null;

  return (
    <section className="mb-12">
      <div className="flex items-center gap-3 mt-10 mb-4">
        <span className="text-[10px] tracking-[0.35em] uppercase" style={{ color: RC_GOLD_DEEP }}>
          Project Timeline
        </span>
        <span className="flex-1" style={{ height: 1, backgroundColor: `${RC_GOLD}55` }} />
      </div>
      <div className="rounded-sm overflow-hidden" style={{ border: `1px solid ${RC_GOLD}55`, backgroundColor: '#fff' }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ backgroundColor: `${RC_GOLD_TINT}66` }}>
              <th className="text-left p-3 text-[10px] tracking-[0.2em] uppercase font-semibold" style={{ color: RC_GOLD_DEEP }}>Phase</th>
              <th className="text-left p-3 text-[10px] tracking-[0.2em] uppercase font-semibold" style={{ color: RC_GOLD_DEEP }}>Duration</th>
              <th className="text-left p-3 text-[10px] tracking-[0.2em] uppercase font-semibold" style={{ color: RC_GOLD_DEEP }}>Details</th>
            </tr>
          </thead>
          <tbody>
            {timeline.map((phase, i) => (
              <tr key={phase.id} style={{ borderTop: i === 0 ? 'none' : `1px solid ${RC_SOFT_INK}22` }}>
                <td className="p-3 font-medium" style={{ color: RC_INK }}>{phase.phase}</td>
                <td className="p-3" style={{ color: RC_SOFT_INK }}>{phase.duration}</td>
                <td className="p-3" style={{ color: RC_SOFT_INK }}>{phase.details}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
