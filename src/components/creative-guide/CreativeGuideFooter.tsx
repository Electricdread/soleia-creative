import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Printer } from 'lucide-react';
import { PoweredByShowBlox } from '@/components/PoweredByShowBlox';
import soleiaWideLogo from '@/assets/soleia-wide-logo.png';

/**
 * The guide's footer, shared by every page in the Creative Guide.
 *
 * It was previously inline in CreativeGuideView only, which left Services — the
 * page the pre-call packet actually links to — ending on a table with no way
 * back into the guide and no sense of having finished.
 */
export function CreativeGuideFooter() {
  const navigate = useNavigate();

  return (
    <footer className="border-t border-primary/15 pb-9 pt-14">
      <div className="container mx-auto max-w-5xl px-6">
        <div className="flex flex-wrap justify-between gap-9">
          <div className="max-w-sm">
            <img src={soleiaWideLogo} alt="Soleia Las Vegas" className="h-12 w-auto" />
            <p className="mt-4 max-w-xs font-sans text-[13.5px] font-light leading-relaxed text-muted-foreground">
              Sophistication, innovation, and authenticity — at the fifty yard line of the Las Vegas Strip.
            </p>
          </div>
          <div className="flex flex-wrap gap-12">
            {/* The landing page these columns used to anchor into is retired
                (2026-08-26); what remains are the guide's real pages. */}
            <div>
              <h4 className="mb-3.5 text-[10.5px] uppercase tracking-[0.2em] text-primary">Guide</h4>
              <button
                onClick={() => navigate('/creative-guide/services')}
                className="mb-2 block text-left text-[13px] text-muted-foreground transition-colors hover:text-primary"
              >
                Services
              </button>
              <button
                onClick={() => navigate('/creative-guide/content-delivery')}
                className="mb-2 block text-left text-[13px] text-muted-foreground transition-colors hover:text-primary"
              >
                Content Delivery
              </button>
            </div>
            <div>
              <h4 className="mb-3.5 text-[10.5px] uppercase tracking-[0.2em] text-primary">Display Specs</h4>
              {(
                [
                  ['/creative-guide/tv', 'TV Network'],
                  ['/creative-guide/elevator', 'Elevator'],
                  ['/creative-guide/ticker', 'Ticker'],
                ] as const
              ).map(([to, label]) => (
                <button
                  key={to}
                  onClick={() => navigate(to)}
                  className="mb-2 block text-left text-[13px] text-muted-foreground transition-colors hover:text-primary"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-11 flex flex-wrap items-center justify-between gap-3 border-t border-primary/15 pt-5">
          <span className="text-[11px] text-muted-foreground/60">
            © 2026 SOLEIA Las Vegas. All rights reserved.
          </span>
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/creative-guide/print')}
              className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground/60 transition-colors hover:text-primary"
            >
              <Printer className="h-3.5 w-3.5" /> Print Guide
            </button>
            <PoweredByShowBlox variant="header" />
          </div>
        </div>
      </div>
    </footer>
  );
}

export default CreativeGuideFooter;
