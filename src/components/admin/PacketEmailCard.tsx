import { useState } from 'react';
import { Copy, Check, Mail, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';

export type PacketEmailKind = 'pre_call' | 'post_call' | 'custom' | 'creative_pre_call';

interface PacketEmailFields {
  kind: PacketEmailKind;
  /** Set when the packet is sent together with a client's proposal. */
  proposalUrl?: string;
  /**
   * Set to include the services & pricing reference. This goes out before a
   * client proposal exists, so they can see what we offer and what it costs.
   */
  priceSheetUrl?: string;
  clientName: string;
  eventDate?: string | null;
  packetUrl: string;
  driveUrl?: string | null;
}

const LOGO_URL = 'https://rszawchsbpsmtrtvljta.supabase.co/storage/v1/object/public/email-assets/soleia-logo-color.png';

function formatDate(d?: string | null) {
  if (!d) return '';
  try {
    return format(parseISO(d), 'EEEE, MMMM d, yyyy');
  } catch {
    return d;
  }
}

/**
 * Wording per packet version. Written in the Soleia voice: state what the
 * packet is and what the client needs to do, without scene-setting.
 *
 * When a proposal accompanies the packet the opening changes to follow the
 * meeting it came out of, and the proposal becomes the second call to action.
 */
function packetCopy(f: PacketEmailFields) {
  const withProposal = Boolean(f.proposalUrl);
  const withPriceSheet = Boolean(f.priceSheetUrl);
  const proposalSentence = withProposal
    ? ' Your proposal is ready to review, select and sign.'
    : '';

  switch (f.kind) {
    case 'post_call':
      return {
        subject: withPriceSheet
          ? 'Choose your Soleia services and next steps for {{event_name}}'
          : 'Next steps for {{event_name}}',
        title: withPriceSheet
          ? 'Choose the services that make your event feel like yours.'
          : 'Your next creative step.',
        intro: 'Thank you for the thoughtful conversation today. We’ve captured the direction, screen opportunities and next decisions so everyone is moving from the same brief.' + proposalSentence,
        primaryLabel: 'Open Your Packet',
        driveLabel: 'Open Shared Project Folder',
        eyebrow: 'After the Creative Call',
        closing: withPriceSheet
          ? 'Please make your selections and sign within 72 hours. Reply here with any questions.'
          : 'The Creative Guide remains available in your project folder whenever your team needs venue or delivery details.',
        banner: 'Client content is due 21 business days before the event.',
      };
    case 'custom':
    case 'creative_pre_call':
      return {
        subject: 'Your Soleia creative packet for {{event_name}}',
        title: 'A creative path built around the decisions you need next.',
        intro: 'We’ve prepared a tailored creative packet for your event. It gives your team the shared venue references while keeping the next step focused on the decisions we still need to make together.',
        primaryLabel: 'Open Your Creative Packet',
        driveLabel: 'Open Shared Google Drive',
        eyebrow: 'Soleia Creative',
        closing: 'Reply here with any questions, or with the context that will make the next conversation more productive.',
        banner: 'Please review the materials below.',
      };
    default:
      return {
        subject: 'Let’s find a time to shape your Soleia creative direction',
        title: 'Let’s get the right pieces in front of your team.',
        intro: 'Thank you for the introduction. I’m sharing the essentials now so your team can explore the venue and start gathering what will help us shape your event together.',
        primaryLabel: 'Open Your Packet',
        driveLabel: 'Open Shared Project Folder',
        eyebrow: 'Before the Creative Call',
        closing: 'Looking forward to meeting you. Please reply with three dates and three time windows that work for your team.',
        banner: 'Please review the materials below ahead of our call.',
      };
  }
}

const emailCard = (label: string, text: string) => `
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="width:100%;border-collapse:collapse;margin:0 0 12px;">
    <tr><td style="padding:17px 18px;border-left:3px solid #c9963d;background:#faf8f3;">
      <p style="margin:0 0 5px;color:#9a6f20;font-size:10px;letter-spacing:1.6px;text-transform:uppercase;font-weight:700;">${label}</p>
      <p style="margin:0;color:#3e3b36;font-size:14px;line-height:1.62;">${text}</p>
    </td></tr>
  </table>`;

function emailCards(f: PacketEmailFields) {
  const withPriceSheet = Boolean(f.priceSheetUrl);
  switch (f.kind) {
    case 'post_call':
      return [
        withPriceSheet
          ? emailCard('Your interactive service price sheet', 'Review the Soleia services, tick the options you would like for your event and adjust eligible quantities. Your selections become the accepted scope when you sign.')
          : emailCard('Your next creative step', 'We’ll share only the project materials and approvals appropriate for your event. Please reply with any decisions needed from your team.'),
        emailCard('Your shared Google Drive', 'Use <strong>03_Client Asset Collect</strong> for logos, fonts, approved brand materials and references. Finished mapped content belongs in the matching <strong>04_Finals</strong> surface folder.'),
        emailCard('Content deadline', 'Please submit client content no later than 21 business days before the event so the team can test, map and prepare playback correctly.'),
      ].join('');
    case 'custom':
    case 'creative_pre_call':
      return [
        emailCard('What to review now', 'Use the Creative Guide and your shared Google Drive to understand the venue, screen capabilities and delivery requirements.'),
        emailCard('When direction is still forming', 'If your team is still exploring a direction and the event is months away, we’ll schedule a focused follow-up before confirming the next creative step.'),
        emailCard('A single source of truth', 'Your shared Google Drive remains with the project and contains only the materials approved for this custom path.'),
      ].join('');
    default:
      return [
        emailCard('Your shared project folder', 'Inside: the Soleia Creative Guide project with the After Effects file, the Pixel Map and Content Delivery Guide, plus <strong>03_Client Asset Collect</strong> for logos, fonts, brand files and references.'),
        emailCard('Choose a Creative Call', 'Please send back three dates and three time windows that work for your team. Once we compare availability, the Event Manager will confirm a 30-minute Microsoft Teams call.'),
        withPriceSheet
          ? emailCard('Price sheet', 'Use the included service price sheet as a reference before we talk through the right scope for your event.')
          : '',
      ].join('');
  }
}

function buildPacketEmailHtml(f: PacketEmailFields) {
  const c = packetCopy(f);
  const { title, intro, primaryLabel, driveLabel } = c;
  const cards = emailCards(f);
  const eventBanner = f.eventDate
    ? `<table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="width:100%;border-collapse:collapse;margin:0 0 24px;">
        <tr>
          <td style="background-color:#fdf6e3;border:2px solid #DAA520;padding:18px 20px;text-align:center;">
            <p style="margin:0 0 4px;font-size:18px;font-weight:700;color:#1a1a1a;">&#128197; Event Date: ${formatDate(f.eventDate)}</p>
            <p style="margin:0;font-size:14px;color:#555555;">${c.banner}</p>
          </td>
        </tr>
      </table>`
    : '';

  const driveBlock = f.driveUrl
    ? `<table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="width:100%;border-collapse:collapse;margin:0 0 8px;">
        <tr>
          <td align="center" style="padding:6px 0 20px;">
            <table role="presentation" border="0" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
              <tr>
                <td style="background-color:#1a1a1a;border:1px solid #DAA520;border-radius:8px;padding:12px 28px;text-align:center;">
                  <a href="${f.driveUrl}" target="_blank" style="display:inline-block;color:#DAA520;font-size:14px;font-weight:600;text-decoration:none;letter-spacing:0.5px;">${driveLabel}</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>`
    : '';

  return `<table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="width:100%;min-width:100%;border-collapse:collapse;background-color:#f3f1eb;font-family:'Helvetica Neue',Arial,sans-serif;">
  <tr>
    <td align="center" style="padding:0;background-color:#f3f1eb;">
      <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="width:100%;border-collapse:collapse;background-color:#ffffff;border:1px solid #e5e5e5;">
        <tr>
          <td style="background-color:#171817;padding:34px 34px 27px;text-align:center;">
            <img src="${LOGO_URL}" alt="Soleia Las Vegas" width="180" style="display:block;height:60px;width:auto;margin:0 auto;border:0;outline:none;text-decoration:none;" />
            <p style="margin:18px 0 0;font-size:10px;color:#d7a84c;letter-spacing:3px;text-transform:uppercase;font-weight:700;">${c.eyebrow}</p>
          </td>
        </tr>

        <tr>
          <td style="padding:34px 34px 18px;background-color:#ffffff;">
            <h1 style="font-family:Georgia,'Times New Roman',serif;margin:0 0 20px;font-size:30px;line-height:1.12;color:#1b1b19;font-weight:500;">${title}</h1>
            <p style="font-size:15px;line-height:1.7;color:#333333;margin:0 0 20px;">
              Hi${f.clientName ? ` <strong>${f.clientName}</strong>` : ''},
            </p>

            ${eventBanner}

            <p style="font-size:15px;line-height:1.7;color:#383631;margin:0 0 22px;">${intro}</p>

            ${cards}

            <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="width:100%;border-collapse:collapse;">
              <tr>
                <td align="center" style="padding:8px 0 12px;">
                  <table role="presentation" border="0" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
                    <tr>
                      <td style="background-color:#B8860B;border-radius:8px;padding:14px 36px;text-align:center;">
                        <a href="${f.packetUrl}" target="_blank" style="display:inline-block;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;letter-spacing:0.5px;">${primaryLabel}</a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            ${f.proposalUrl ? `
            <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="width:100%;border-collapse:collapse;">
              <tr>
                <td align="center" style="padding:0 0 12px;">
                  <table role="presentation" border="0" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
                    <tr>
                      <td style="background-color:#111111;border:2px solid #B8860B;border-radius:8px;padding:13px 34px;text-align:center;">
                        <a href="${f.proposalUrl}" target="_blank" style="display:inline-block;color:#DAA520;font-size:15px;font-weight:600;text-decoration:none;letter-spacing:0.5px;">Review &amp; Sign Your Proposal</a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>` : ''}

            ${f.priceSheetUrl ? `
            <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="width:100%;border-collapse:collapse;">
              <tr>
                <td align="center" style="padding:0 0 12px;">
                  <table role="presentation" border="0" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
                    <tr>
                      <td style="background-color:#111111;border:2px solid #B8860B;border-radius:8px;padding:13px 34px;text-align:center;">
                        <a href="${f.priceSheetUrl}" target="_blank" style="display:inline-block;color:#DAA520;font-size:15px;font-weight:600;text-decoration:none;letter-spacing:0.5px;">View Services &amp; Pricing</a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>` : ''}

            ${driveBlock}

            <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="width:100%;border-collapse:collapse;margin:24px 0 0;">
              <tr>
                <td width="3" style="width:3px;background-color:#DAA520;font-size:0;line-height:0;">&nbsp;</td>
                <td style="background-color:#faf8f3;padding:16px 20px;">
                  <p style="margin:0 0 6px;font-size:13px;color:#888;letter-spacing:1.5px;text-transform:uppercase;">Direct Link</p>
                  <p style="margin:0;font-size:13px;line-height:1.6;color:#444;word-break:break-all;">
                    <a href="${f.packetUrl}" style="color:#B8860B;text-decoration:none;">${f.packetUrl}</a>
                  </p>
                </td>
              </tr>
            </table>

            <p style="font-size:15px;line-height:1.7;color:#333333;margin:28px 0 0;">
              ${c.closing}
            </p>
          </td>
        </tr>

        <tr>
          <td style="background-color:#171817;padding:24px;text-align:center;">
            <img src="${LOGO_URL}" alt="Soleia" width="84" style="display:block;height:28px;width:auto;margin:0 auto 8px;border:0;opacity:0.85;outline:none;text-decoration:none;" />
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

function buildPacketEmailText(f: PacketEmailFields) {
  const { intro, primaryLabel, driveLabel, closing } = packetCopy(f);
  const dateLine = f.eventDate ? `Event Date: ${formatDate(f.eventDate)}\n\n` : '';
  const drive = f.driveUrl ? `\n\n${driveLabel}: ${f.driveUrl}` : '';
  const proposal = f.proposalUrl ? `\n\nReview & Sign Your Proposal: ${f.proposalUrl}` : '';
  const priceSheet = f.priceSheetUrl ? `\n\nView Services & Pricing: ${f.priceSheetUrl}` : '';
  return `Hi${f.clientName ? ` ${f.clientName}` : ''},

${dateLine}${intro}

${primaryLabel}: ${f.packetUrl}${drive}${proposal}${priceSheet}

${closing}

— Soleia Creative Team`;
}

interface Props {
  kind: PacketEmailKind;
  clientName: string;
  eventDate?: string | null;
  packetUrl: string;
  driveUrl?: string | null;
  /** Pass a proposal link to send the packet and a client's proposal together. */
  proposalUrl?: string | null;
  /** Pass the services & pricing reference to include it in the email. */
  priceSheetUrl?: string | null;
}

export function PacketEmailCard({ kind, clientName: initialName, eventDate, packetUrl, driveUrl, proposalUrl, priceSheetUrl }: Props) {
  const [clientName, setClientName] = useState(initialName ?? '');
  const [url, setUrl] = useState(packetUrl);
  const [drive, setDrive] = useState(driveUrl ?? '');
  const [date, setDate] = useState(eventDate ?? '');
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const [proposal, setProposal] = useState(proposalUrl ?? '');

  const fields: PacketEmailFields = {
    kind,
    clientName: clientName.trim(),
    eventDate: date || null,
    packetUrl: url.trim(),
    driveUrl: drive.trim() || null,
    proposalUrl: proposal.trim() || undefined,
    priceSheetUrl: priceSheetUrl?.trim() || undefined,
  };
  const copy = packetCopy(fields);
  const emailLabel = kind === 'post_call'
    ? 'Post-Call Packet Email'
    : kind === 'custom' || kind === 'creative_pre_call'
      ? 'Custom Creative Packet Email'
      : 'Pre-Call Packet Email';

  const handleCopy = async () => {
    const html = buildPacketEmailHtml(fields);
    const text = buildPacketEmailText(fields);
    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/html': new Blob([html], { type: 'text/html' }),
          'text/plain': new Blob([text], { type: 'text/plain' }),
        }),
      ]);
      setCopied(true);
      toast.success('Rich email copied — paste into your email client');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      navigator.clipboard.writeText(html);
      setCopied(true);
      toast.success('HTML copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="bg-card/80 backdrop-blur-sm border border-border rounded-xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-muted border border-border flex items-center justify-center">
            <Mail className="w-5 h-5 text-muted-foreground" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              {emailLabel}
            </h3>
            <p className="text-sm text-muted-foreground">
              Branded HTML email — copy and paste into your email client
            </p>
          </div>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setExpanded(!expanded)}
          className="border-border text-muted-foreground hover:text-foreground hover:bg-muted"
        >
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </Button>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Suggested subject</Label>
        <Input value={copy.subject} readOnly onFocus={(event) => event.currentTarget.select()} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Client Name</Label>
          <Input value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="e.g. John Smith" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Event Date</Label>
          <Input type="date" value={date ?? ''} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label className="text-xs text-muted-foreground">Packet URL</Label>
          <Input value={url} onChange={(e) => setUrl(e.target.value)} />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label className="text-xs text-muted-foreground">Drive Folder URL (optional)</Label>
          <Input value={drive} onChange={(e) => setDrive(e.target.value)} placeholder="https://drive.google.com/..." />
        </div>
      </div>

      <div className="flex justify-end">
        <Button size="sm" onClick={handleCopy} className="gap-2 bg-secondary hover:bg-secondary/80 text-secondary-foreground">
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          {copied ? 'Copied' : 'Copy Email'}
        </Button>
      </div>

      {expanded && (
        <div
          className="border border-border rounded-lg p-4 max-h-[28rem] overflow-y-auto bg-muted"
          dangerouslySetInnerHTML={{ __html: buildPacketEmailHtml(fields) }}
        />
      )}
    </div>
  );
}
