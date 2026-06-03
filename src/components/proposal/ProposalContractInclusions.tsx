import { CheckCircle2 } from 'lucide-react';

/**
 * Always-on banner describing what the venue contract already covers.
 * Rendered above the line-items table on every proposal so clients understand
 * which items are standard inclusions vs. paid add-on services from Soleia.
 *
 * Copy lives here on purpose — easy to edit if venue terms ever change.
 */
export default function ProposalContractInclusions() {
  return (
    <div className="bg-[#faf8f4] border-l-4 border-[#c49a3c] rounded-r-lg p-5 mb-6">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-md bg-white border border-[#ecf0f1] flex items-center justify-center flex-shrink-0">
          <CheckCircle2 className="w-4 h-4 text-[#c49a3c]" />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] tracking-[0.2em] uppercase text-[#c49a3c] font-semibold mb-1">
            Included in Your Venue Contract
          </p>
          <ul className="text-[#34495e] text-sm leading-relaxed space-y-1 mt-2">
            <li>
              <strong>Up to 10 static logos</strong> &mdash; LED screens
            </li>
            <li>
              <strong>1 static logo</strong> &mdash; all TVs, Cabanas &amp; Bungalows
            </li>
          </ul>
          <p className="text-[11px] text-[#95a5a6] mt-3 italic">
            Standard inclusions &mdash; no charge. Anything listed below under
            <span className="text-[#7f8c8d] font-medium"> Additional Services </span>
            is on top of these.
          </p>
        </div>
      </div>
    </div>
  );
}
