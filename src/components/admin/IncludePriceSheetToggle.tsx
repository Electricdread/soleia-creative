import { FileSignature, ExternalLink } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { getPublicOrigin } from '@/lib/ogShare';

/**
 * The services & pricing reference sent with a packet.
 *
 * This goes out before a client proposal exists, so the client can see what we
 * offer and what it costs and come back with a direction. The live rate card is
 * used rather than a stored PDF so pricing can never go out stale; that page
 * carries its own download and print controls for anyone who wants a copy.
 */
export const PRICE_SHEET_PATH = '/rate-card';

export function priceSheetUrl(): string {
  return `${getPublicOrigin()}${PRICE_SHEET_PATH}`;
}

interface Props {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

export function IncludePriceSheetToggle({ checked, onCheckedChange }: Props) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-lg border border-border p-3">
      <div className="flex min-w-0 items-start gap-3">
        <FileSignature className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
        <div className="min-w-0">
          <Label htmlFor="include-price-sheet" className="cursor-pointer text-sm text-foreground">
            Include price sheet
          </Label>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Adds a “View Services &amp; Pricing” button so the client has a reference before
            their proposal is drawn up.
          </p>
          {checked && (
            <a
              href={priceSheetUrl()}
              target="_blank"
              rel="noreferrer"
              className="mt-1.5 inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              Preview the price sheet <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      </div>
      <Switch id="include-price-sheet" checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}

export default IncludePriceSheetToggle;
