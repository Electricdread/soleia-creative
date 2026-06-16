interface ProposalTimelineProps {
  timeline: any[];
}

export default function ProposalTimeline({ timeline }: ProposalTimelineProps) {
  if (timeline.length === 0) return null;

  return (
    <section className="mb-12">
      <h2 className="text-xl font-semibold text-foreground mb-4 border-b border-border pb-2">Project Timeline</h2>
      <div className="bg-background rounded-lg border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-background border-b border-border">
              <th className="text-left p-3 font-semibold text-muted-foreground">Phase</th>
              <th className="text-left p-3 font-semibold text-muted-foreground">Duration</th>
              <th className="text-left p-3 font-semibold text-muted-foreground">Details</th>
            </tr>
          </thead>
          <tbody>
            {timeline.map(phase => (
              <tr key={phase.id} className="border-b border-border last:border-0">
                <td className="p-3 font-medium text-foreground">{phase.phase}</td>
                <td className="p-3 text-muted-foreground">{phase.duration}</td>
                <td className="p-3 text-muted-foreground">{phase.details}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
