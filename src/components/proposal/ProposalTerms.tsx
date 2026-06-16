export default function ProposalTerms() {
  return (
    <section className="mb-12">
      <h2 className="text-xl font-semibold text-foreground mb-4 border-b border-border pb-2">Terms</h2>
      <div className="bg-card rounded-lg p-5 border border-border shadow-md hover:shadow-lg transition-shadow text-sm text-foreground/90 space-y-4">
        <div>
          <h4 className="font-semibold mb-1">Production Workflow & Timeline</h4>
          <ul className="text-muted-foreground list-disc pl-5 space-y-1">
            <li>Production does <strong>not begin</strong> until the proposal has been signed off <strong>and</strong> all client brand assets have been received. Both must be in hand before the clock starts.</li>
            <li>Once both conditions are met, our team has <strong>14 days</strong> to create and deliver the first review cut.</li>
            <li>The client then has <strong>3 days</strong> from delivery to submit consolidated review notes.</li>
            <li>Final revision requests must reach us <strong>no later than 4 days before the event date</strong> so we can apply, render, and deliver in time.</li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-1">New Assets</h4>
          <p className="text-muted-foreground">New assets provided by the client will require a new estimate.</p>
        </div>
        <div>
          <h4 className="font-semibold mb-1">Scope Changes</h4>
          <ul className="text-muted-foreground list-disc pl-5 space-y-1">
            <li>Items not explicitly defined in this proposal are outside the current scope.</li>
            <li>Additional requests will require a separate estimate and written approval.</li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-1">Revisions</h4>
          <ul className="text-muted-foreground list-disc pl-5 space-y-1">
            <li>Includes <strong>one</strong> revision round within the agreed scope and existing elements.</li>
            <li>Notes must be submitted in writing within the <strong>3-day review window</strong> after delivery.</li>
            <li>Requests received later than <strong>4 days before the event date</strong> cannot be guaranteed.</li>
            <li>Changes affecting the concept, direction, or new components require a new quote.</li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-1">Cancellation</h4>
          <p className="text-muted-foreground">If the project is canceled after work has started, time and work completed up to the cancellation date will be invoiced.</p>
        </div>
        <div>
          <h4 className="font-semibold mb-1">Creative Ownership & Licensing</h4>
          <p className="text-muted-foreground">The client is granted a limited, non-exclusive license to use these visual scenes for the duration and scope of the agreed-upon project or event. Ownership of the underlying creative files, content structures, and mapped configurations remains with Soleia Creative Team. Any additional usage, replication, or modification beyond the agreed project requires prior written approval or a separate licensing agreement.</p>
        </div>
        <div>
          <h4 className="font-semibold mb-1">Logo Animation Rights</h4>
          <p className="text-muted-foreground">The transparent logo animation is a custom element designed and rendered by Soleia Creative Team using the client's logo and brand assets. Because this animation integrates the client's proprietary branding, the finalized rendered animation may be retained and used by the client for internal display or promotional purposes.</p>
        </div>
      </div>
    </section>
  );
}
