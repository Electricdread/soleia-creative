interface ProposalTimelineProps {
  timeline: any[];
}

export default function ProposalTimeline({ timeline }: ProposalTimelineProps) {
  if (timeline.length === 0) return null;

  return (
    <section className="mb-12">
      <h2 className="text-xl font-semibold text-[#2c3e50] mb-4 border-b border-[#ecf0f1] pb-2">Project Timeline</h2>
      <div className="bg-background rounded-lg border border-[#ecf0f1] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#f8f9fa] border-b border-[#ecf0f1]">
              <th className="text-left p-3 font-semibold text-[#7f8c8d]">Phase</th>
              <th className="text-left p-3 font-semibold text-[#7f8c8d]">Duration</th>
              <th className="text-left p-3 font-semibold text-[#7f8c8d]">Details</th>
            </tr>
          </thead>
          <tbody>
            {timeline.map(phase => (
              <tr key={phase.id} className="border-b border-[#ecf0f1] last:border-0">
                <td className="p-3 font-medium text-[#2c3e50]">{phase.phase}</td>
                <td className="p-3 text-[#7f8c8d]">{phase.duration}</td>
                <td className="p-3 text-[#7f8c8d]">{phase.details}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
