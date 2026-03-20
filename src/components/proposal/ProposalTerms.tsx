export default function ProposalTerms() {
  return (
    <section className="mb-12">
      <h2 className="text-xl font-semibold text-[#2c3e50] mb-4 border-b border-[#ecf0f1] pb-2">Terms</h2>
      <div className="bg-white rounded-lg p-5 border border-[#ecf0f1] text-sm text-[#34495e] space-y-4">
        <div>
          <h4 className="font-semibold mb-1">New Assets</h4>
          <p className="text-[#7f8c8d]">New assets provided by the client will require a new estimate.</p>
        </div>
        <div>
          <h4 className="font-semibold mb-1">Scope Changes</h4>
          <ul className="text-[#7f8c8d] list-disc pl-5 space-y-1">
            <li>Items not explicitly defined in this proposal are outside the current scope.</li>
            <li>Additional requests will require a separate estimate and written approval.</li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-1">Revisions</h4>
          <ul className="text-[#7f8c8d] list-disc pl-5 space-y-1">
            <li>Includes <strong>one</strong> revision round within the approved creative direction and existing elements.</li>
            <li>Revision requests must be submitted in writing.</li>
            <li>Requests must be received no later than <strong>7 days prior to the event date</strong>.</li>
            <li>Changes affecting the concept, direction, or new components require a new quote.</li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-1">Third-Party Assets</h4>
          <ul className="text-[#7f8c8d] list-disc pl-5 space-y-1">
            <li>Fonts, stock media, music, plugins, or other licensed materials are not included unless stated.</li>
            <li>Required purchases will be billed to the client.</li>
            <li>Usage rights follow the original supplier's license terms.</li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-1">Usage Rights</h4>
          <p className="text-[#7f8c8d]">Upon full payment, the client receives the rights to use the final approved deliverables.</p>
        </div>
        <div>
          <h4 className="font-semibold mb-1">Promotional Use</h4>
          <ul className="text-[#7f8c8d] list-disc pl-5 space-y-1">
            <li>Photo or video documentation of the production may be used for portfolio, website, and social media.</li>
            <li>If usage is not permitted, written notice must be sent upon proposal approval.</li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-1">Cancellation</h4>
          <p className="text-[#7f8c8d]">If the project is canceled after work has started, time and work completed up to the cancellation date will be invoiced.</p>
        </div>
      </div>
    </section>
  );
}
