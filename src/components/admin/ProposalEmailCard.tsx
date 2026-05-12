import { useState, useEffect } from 'react';
import { Copy, Check, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { getPublicOrigin } from '@/lib/ogShare';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ProposalOption {
  id: string;
  token: string;
  event_name: string;
  client_name: string;
  venue_name: string | null;
  event_date: string | null;
  status: string;
  creative_call_url: string | null;
}

function buildProposalEmailHtml(
  eventName: string,
  clientName: string,
  venueName: string | null,
  eventDate: string | null,
  proposalLink: string,
  creativeCallUrl: string | null
) {
  const logoUrl = 'https://rszawchsbpsmtrtvljta.supabase.co/storage/v1/object/public/email-assets/soleia-logo-color.png';
  const formattedDate = eventDate
    ? new Date(eventDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : null;

  return `<table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="width:100%;min-width:100%;border-collapse:collapse;background-color:#ffffff;font-family:'Helvetica Neue',Arial,sans-serif;">
  <tr>
    <td align="center" style="padding:0;background-color:#ffffff;">
      <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="width:100%;border-collapse:collapse;background-color:#ffffff;border:1px solid #e5e5e5;">
        <tr>
          <td style="background-color:#faf8f4;padding:48px 24px 32px;text-align:center;border-bottom:1px solid #e8dfc9;">
            <img src="${logoUrl}" alt="Soleia Las Vegas" width="180" style="display:block;height:60px;width:auto;margin:0 auto 12px;border:0;outline:none;text-decoration:none;" />
            <p style="margin:0;font-size:11px;color:#B8860B;letter-spacing:2px;text-transform:uppercase;font-weight:600;">Creative Team</p>
          </td>
        </tr>

        <tr>
          <td style="padding:32px 28px;background-color:#ffffff;">
            <h2 style="font-size:22px;font-weight:700;color:#1a1a1a;margin:0 0 6px;">Your Project Proposal</h2>
            ${formattedDate ? `<p style="font-size:13px;color:#B8860B;margin:0 0 20px;letter-spacing:0.5px;font-weight:600;">${formattedDate}</p>` : '<div style="height:14px;"></div>'}

            <p style="font-size:15px;line-height:1.7;color:#333333;margin:0 0 20px;">
              Dear ${clientName || 'Valued Client'},
            </p>

            <p style="font-size:15px;line-height:1.7;color:#333333;margin:0 0 16px;">
              Thank you for your interest in <strong style="color:#B8860B;">${eventName || '[Event Name]'}</strong>${venueName ? ` at <strong>${venueName}</strong>` : ''}. We've prepared a detailed proposal outlining the scope of work, timeline, and pricing for your review.
            </p>

            ${venueName || formattedDate ? `<table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="width:100%;border-collapse:collapse;margin:0 0 20px;">
              <tr>
                <td style="background-color:#fdfbf6;border-left:3px solid #B8860B;padding:16px 20px;">
                  <p style="font-size:14px;font-weight:700;color:#1a1a1a;margin:0 0 8px;">Event Details</p>
                  <table role="presentation" border="0" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
                    <tr>
                      <td style="padding:3px 0;font-size:14px;color:#666666;width:90px;">Event:</td>
                      <td style="padding:3px 0;font-size:14px;color:#333333;font-weight:600;">${eventName}</td>
                    </tr>
                    ${venueName ? `<tr>
                      <td style="padding:3px 0;font-size:14px;color:#666666;width:90px;">Venue:</td>
                      <td style="padding:3px 0;font-size:14px;color:#333333;font-weight:600;">${venueName}</td>
                    </tr>` : ''}
                    ${formattedDate ? `<tr>
                      <td style="padding:3px 0;font-size:14px;color:#666666;width:90px;">Date:</td>
                      <td style="padding:3px 0;font-size:14px;color:#333333;font-weight:600;">${formattedDate}</td>
                    </tr>` : ''}
                  </table>
                </td>
              </tr>
            </table>` : ''}

            <p style="font-size:15px;line-height:1.7;color:#333333;margin:0 0 16px;">
              Our team specializes in immersive visual experiences — from large-format LED installations and motion graphics to curated ambient content that transforms any space. Every project is tailored to your event's unique vision and venue requirements.
            </p>

            <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="width:100%;border-collapse:collapse;margin:0 0 24px;">
              <tr>
                <td style="background-color:#f9f9f9;padding:20px 24px;">
                  <p style="font-size:14px;font-weight:700;color:#1a1a1a;margin:0 0 12px;">What You'll Find Inside:</p>
                  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="width:100%;border-collapse:collapse;">
                    <tr>
                      <td width="36" style="padding:6px 12px 6px 0;vertical-align:top;font-size:20px;">&#128196;</td>
                      <td style="padding:6px 0;font-size:14px;line-height:1.6;color:#555555;">
                        <strong>Scope of Work</strong> — Detailed breakdown of services and deliverables
                      </td>
                    </tr>
                    <tr>
                      <td width="36" style="padding:6px 12px 6px 0;vertical-align:top;font-size:20px;">&#128197;</td>
                      <td style="padding:6px 0;font-size:14px;line-height:1.6;color:#555555;">
                        <strong>Timeline</strong> — after sign-off + assets: 14 days to deliver, 3 days to review, 1 revision, final notes due 4 days before the event
                      </td>
                    </tr>
                    <tr>
                      <td width="36" style="padding:6px 12px 6px 0;vertical-align:top;font-size:20px;">&#128176;</td>
                      <td style="padding:6px 0;font-size:14px;line-height:1.6;color:#555555;">
                        <strong>Pricing</strong> — Transparent cost breakdown with selectable line items
                      </td>
                    </tr>
                    <tr>
                      <td width="36" style="padding:6px 12px 6px 0;vertical-align:top;font-size:20px;">&#9997;&#65039;</td>
                      <td style="padding:6px 0;font-size:14px;line-height:1.6;color:#555555;">
                        <strong>Digital Signature</strong> — Available on the proposal page when you're ready
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="width:100%;border-collapse:collapse;">
              <tr>
                <td align="center" style="padding:28px 0;">
                  <table role="presentation" border="0" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
                    <tr>
                      <td style="background-color:#B8860B;border-radius:8px;padding:14px 36px;text-align:center;">
                        <a href="${proposalLink}" target="_blank" style="display:inline-block;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;letter-spacing:0.5px;">Open Proposal &amp; Menu &#8594;</a>
                      </td>
                    </tr>
                   </table>
                </td>
              </tr>
            </table>
            ${creativeCallUrl ? `<table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="width:100%;border-collapse:collapse;">
              <tr><td align="center" style="padding:0 0 12px;">
                <table role="presentation" border="0" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
                  <tr><td style="background-color:#ffffff;border:1.5px solid #B8860B;border-radius:8px;padding:12px 32px;text-align:center;">
                    <a href="${creativeCallUrl}" target="_blank" style="display:inline-block;color:#B8860B;font-size:14px;font-weight:600;text-decoration:none;letter-spacing:0.5px;">Schedule Our Creative Call &#8594;</a>
                  </td></tr>
                </table>
              </td></tr>
            </table>` : `<p style="font-size:13px;line-height:1.6;color:#888888;font-style:italic;text-align:center;margin:0 0 12px;">We'll reach out separately to schedule the creative call.</p>`}

            <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="width:100%;border-collapse:collapse;">
              <tr>
                <td style="padding:0 0 24px;text-align:center;">
                  <p style="font-size:11px;color:#999999;margin:0 0 4px;">If the button above doesn't work, copy and paste this link into your browser:</p>
                  <p style="font-size:11px;color:#B8860B;margin:0;word-break:break-all;">
                    <a href="${proposalLink}" style="color:#B8860B;text-decoration:underline;">${proposalLink}</a>
                  </p>
                </td>
              </tr>
            </table>

            <p style="font-size:15px;line-height:1.7;color:#333333;margin:0 0 16px;">
              Please review the proposal at your earliest convenience. If you have any questions or would like to discuss adjustments, we're happy to accommodate.
            </p>

            <p style="font-size:15px;line-height:1.7;color:#333333;margin:0;">
              We look forward to working together to make your event unforgettable.
            </p>
          </td>
        </tr>

        <tr>
          <td style="background-color:#111111;padding:24px;text-align:center;">
            <img src="${logoUrl}" alt="Soleia" width="84" style="display:block;height:28px;width:auto;margin:0 auto 8px;border:0;opacity:0.85;outline:none;text-decoration:none;" />
            <p style="margin:0 0 4px;font-size:12px;color:#DAA520;letter-spacing:1px;">Creative Team</p>
            <p style="margin:0;font-size:12px;color:#888888;">
              <a href="mailto:luisdreamslv@gmail.com" style="color:#888888;text-decoration:none;">luisdreamslv@gmail.com</a>
            </p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>`;
}

export function ProposalEmailCard() {
  const [proposals, setProposals] = useState<ProposalOption[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const fetchProposals = async () => {
      const { data } = await supabase
        .from('proposals')
        .select('id, token, event_name, client_name, venue_name, event_date, status, creative_call_url')
        .eq('is_active', true)
        .order('event_date', { ascending: true, nullsFirst: false });
      if (data) setProposals(data);
    };
    fetchProposals();
  }, []);

  const selected = proposals.find((p) => p.id === selectedId);
  const proposalLink = selected
    ? `${getPublicOrigin()}/proposal/${selected.token}`
    : '';

  const htmlContent = selected
    ? buildProposalEmailHtml(
        selected.event_name,
        selected.client_name,
        selected.venue_name,
        selected.event_date,
        proposalLink,
        selected.creative_call_url
      )
    : '';

  const handleCopy = async () => {
    if (!selected) {
      toast.error('Please select a proposal first');
      return;
    }
    try {
      const htmlBlob = new Blob([htmlContent], { type: 'text/html' });
      const textBlob = new Blob(
        [`Your proposal for ${selected.event_name} is ready for review. View it here: ${proposalLink}`],
        { type: 'text/plain' }
      );
      await navigator.clipboard.write([
        new ClipboardItem({ 'text/html': htmlBlob, 'text/plain': textBlob }),
      ]);
      setCopied(true);
      toast.success('Email copied — paste into your email client!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      await navigator.clipboard.writeText(htmlContent);
      toast.success('Copied as HTML text');
    }
  };

  return (
    <div className="bg-card/80 backdrop-blur-sm border border-border rounded-xl overflow-hidden">
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2 text-foreground">
              <FileText className="w-5 h-5 text-primary" />
              Client Proposal Email
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Share proposals with clients for review & signature
            </p>
          </div>
          <Button
            size="sm"
            onClick={handleCopy}
            disabled={!selected}
            className="gap-2"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied!' : 'Copy Email'}
          </Button>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Select Proposal</label>
          <Select value={selectedId} onValueChange={setSelectedId}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a proposal…" />
            </SelectTrigger>
            <SelectContent>
              {proposals.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.event_name} — {p.client_name}
                  {p.status === 'signed' ? ' ✓' : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selected && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            {expanded ? 'Hide Preview' : 'Show Preview'}
          </button>
        )}

        {expanded && selected && (
          <div
            className="border border-border rounded-lg overflow-hidden bg-white"
            dangerouslySetInnerHTML={{ __html: htmlContent }}
          />
        )}
      </div>
    </div>
  );
}
