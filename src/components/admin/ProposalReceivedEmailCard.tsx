import { useState } from 'react';
import { Check, ChevronDown, ChevronUp, Copy, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';

/**
 * The reply that goes out once a client returns a signed proposal.
 *
 * It does two jobs in one short email: confirm we have the proposal, and hand
 * them their creative session — which is where the brief lives, and where they
 * will review looks later. Written to be read in under a minute; the timeline
 * is stated as three numbers because the step-by-step version already waits for
 * them inside the session.
 */

const LOGO_URL = 'https://rszawchsbpsmtrtvljta.supabase.co/storage/v1/object/public/email-assets/soleia-logo-color.png';

export interface ProposalReceivedFields {
  clientName: string;
  eventName: string;
  eventDate?: string | null;
  sessionUrl: string;
  /** Where they drop logos, fonts and brand assets, when we have a folder for them. */
  driveUrl?: string | null;
}

function formatDate(d?: string | null) {
  if (!d) return '';
  try {
    return format(parseISO(d), 'EEEE, MMMM d, yyyy');
  } catch {
    return d;
  }
}

export function buildProposalReceivedSubject(f: ProposalReceivedFields) {
  return `Received, thank you — next steps for ${f.eventName || 'your event'}`;
}

export function buildProposalReceivedText(f: ProposalReceivedFields) {
  const drive = f.driveUrl
    ? `\n\nYour project folder for logos, fonts and brand assets is here:\n${f.driveUrl}`
    : '';
  return `Hi${f.clientName ? ` ${f.clientName}` : ''},

Thank you — we have your signed proposal for ${f.eventName || 'your event'} in hand.
We're glad to be building this one with you.

Your creative session is open here:
${f.sessionUrl}

It's your private space for this event. Inside you'll find a short creative brief — the mood of the room, your palette and anything to steer clear of, how you'd like the elevator moment used, and how many looks you want across the night. It takes a few minutes, saves as you go, and your answers reach our team as you write them. That brief is what we build your first looks from, so it's the most useful thing you can give us right now.

The same page is where you'll review and approve those looks when they land, so it's worth keeping.${drive}

Once your brand assets are with us the clock starts: 14 days to your first review cut, 3 days for your consolidated notes, then one revision round.

Any questions, just reply to this email.

— Soleia Creative Team`;
}

export function buildProposalReceivedHtml(f: ProposalReceivedFields) {
  const dateBanner = f.eventDate
    ? `<table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="width:100%;border-collapse:collapse;margin:0 0 24px;">
        <tr>
          <td style="background-color:#fdf6e3;border:2px solid #DAA520;padding:18px 20px;text-align:center;">
            <p style="margin:0 0 4px;font-size:18px;font-weight:700;color:#1a1a1a;">&#128197; Event Date: ${formatDate(f.eventDate)}</p>
            <p style="margin:0;font-size:14px;color:#555555;">Your signed proposal is on file.</p>
          </td>
        </tr>
      </table>`
    : '';

  const driveBlock = f.driveUrl
    ? `<table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="width:100%;border-collapse:collapse;">
        <tr>
          <td align="center" style="padding:0 0 12px;">
            <table role="presentation" border="0" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
              <tr>
                <td style="background-color:#111111;border:2px solid #B8860B;border-radius:8px;padding:13px 34px;text-align:center;">
                  <a href="${f.driveUrl}" target="_blank" style="display:inline-block;color:#DAA520;font-size:15px;font-weight:600;text-decoration:none;letter-spacing:0.5px;">Upload Your Brand Assets</a>
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
          <td style="background-color:#111111;padding:40px 24px;text-align:center;">
            <img src="${LOGO_URL}" alt="Soleia Las Vegas" width="180" style="display:block;height:60px;width:auto;margin:0 auto;border:0;outline:none;text-decoration:none;" />
            <p style="margin:18px 0 0;font-size:12px;color:#DAA520;letter-spacing:3px;text-transform:uppercase;">Proposal Received</p>
          </td>
        </tr>

        <tr>
          <td style="padding:32px 28px;background-color:#ffffff;">
            <h1 style="margin:0 0 18px;font-size:22px;line-height:1.3;color:#1a1a1a;font-weight:600;">Received &mdash; thank you.</h1>
            <p style="font-size:15px;line-height:1.7;color:#333333;margin:0 0 20px;">
              Hi${f.clientName ? ` <strong>${f.clientName}</strong>` : ''},
            </p>

            ${dateBanner}

            <p style="font-size:15px;line-height:1.7;color:#333333;margin:0 0 20px;">
              Thank you &mdash; we have your signed proposal for <strong style="color:#B8860B;">${f.eventName || 'your event'}</strong> in hand.
              We&rsquo;re glad to be building this one with you.
            </p>

            <p style="font-size:15px;line-height:1.7;color:#333333;margin:0 0 24px;">
              Your creative session is open below. It&rsquo;s your private space for this event, and inside you&rsquo;ll
              find a short creative brief &mdash; the mood of the room, your palette and anything to steer clear of,
              how you&rsquo;d like the elevator moment used, and how many looks you want across the night. It takes a
              few minutes, saves as you go, and your answers reach our team as you write them. That brief is what we
              build your first looks from, so it&rsquo;s the most useful thing you can give us right now.
            </p>

            <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="width:100%;border-collapse:collapse;">
              <tr>
                <td align="center" style="padding:8px 0 12px;">
                  <table role="presentation" border="0" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
                    <tr>
                      <td style="background-color:#B8860B;border-radius:8px;padding:14px 36px;text-align:center;">
                        <a href="${f.sessionUrl}" target="_blank" style="display:inline-block;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;letter-spacing:0.5px;">Open Your Creative Session</a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            ${driveBlock}

            <p style="font-size:15px;line-height:1.7;color:#333333;margin:12px 0 24px;">
              The same page is where you&rsquo;ll review and approve your looks when they land, so it&rsquo;s worth keeping.
            </p>

            <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="width:100%;border-collapse:collapse;margin:0 0 24px;">
              <tr>
                <td style="background-color:#faf8f3;border-left:3px solid #DAA520;padding:16px 20px;">
                  <p style="margin:0 0 8px;font-size:12px;color:#B8860B;letter-spacing:1.5px;text-transform:uppercase;font-weight:700;">Once your assets are with us</p>
                  <p style="margin:0;font-size:14px;line-height:1.7;color:#444;">
                    <strong>14 days</strong> to your first review cut &nbsp;&middot;&nbsp;
                    <strong>3 days</strong> for your consolidated notes &nbsp;&middot;&nbsp;
                    <strong>one</strong> revision round
                  </p>
                </td>
              </tr>
            </table>

            <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="width:100%;border-collapse:collapse;">
              <tr>
                <td width="3" style="width:3px;background-color:#DAA520;font-size:0;line-height:0;">&nbsp;</td>
                <td style="background-color:#faf8f3;padding:16px 20px;">
                  <p style="margin:0 0 6px;font-size:13px;color:#888;letter-spacing:1.5px;text-transform:uppercase;">Direct Link</p>
                  <p style="margin:0;font-size:13px;line-height:1.6;color:#444;word-break:break-all;">
                    <a href="${f.sessionUrl}" style="color:#B8860B;text-decoration:none;">${f.sessionUrl}</a>
                  </p>
                </td>
              </tr>
            </table>

            <p style="font-size:15px;line-height:1.7;color:#333333;margin:28px 0 0;">
              Any questions, just reply to this email.
            </p>
          </td>
        </tr>

        <tr>
          <td style="background-color:#111111;padding:24px;text-align:center;">
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

interface Props {
  clientName: string;
  eventName: string;
  eventDate?: string | null;
  sessionUrl: string;
  driveUrl?: string | null;
}

export function ProposalReceivedEmailCard({
  clientName: initialName,
  eventName: initialEvent,
  eventDate,
  sessionUrl: initialSession,
  driveUrl,
}: Props) {
  const [clientName, setClientName] = useState(initialName ?? '');
  const [eventName, setEventName] = useState(initialEvent ?? '');
  const [sessionUrl, setSessionUrl] = useState(initialSession ?? '');
  const [drive, setDrive] = useState(driveUrl ?? '');
  const [date, setDate] = useState(eventDate ?? '');
  const [copied, setCopied] = useState(false);
  const [copiedText, setCopiedText] = useState(false);
  const [expanded, setExpanded] = useState(true);

  const fields: ProposalReceivedFields = {
    clientName: clientName.trim(),
    eventName: eventName.trim(),
    eventDate: date || null,
    sessionUrl: sessionUrl.trim(),
    driveUrl: drive.trim() || null,
  };

  const copyRich = async () => {
    const html = buildProposalReceivedHtml(fields);
    const text = buildProposalReceivedText(fields);
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
      await navigator.clipboard.writeText(html);
      setCopied(true);
      toast.success('HTML copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // A reply to a client's own email is usually typed into an existing thread,
  // where pasting a branded table looks wrong. Plain text covers that case.
  const copyPlain = async () => {
    await navigator.clipboard.writeText(buildProposalReceivedText(fields));
    setCopiedText(true);
    toast.success('Plain text copied — good for replying in a thread');
    setTimeout(() => setCopiedText(false), 2000);
  };

  const copySubject = async () => {
    await navigator.clipboard.writeText(buildProposalReceivedSubject(fields));
    toast.success('Subject copied');
  };

  return (
    <div className="bg-card/80 backdrop-blur-sm border border-border rounded-xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-muted border border-border flex items-center justify-center">
            <Mail className="w-5 h-5 text-muted-foreground" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Proposal Received Reply</h3>
            <p className="text-sm text-muted-foreground">
              Confirms the signed proposal and hands them their creative session
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

      <button
        type="button"
        onClick={copySubject}
        className="w-full rounded-lg border border-border bg-muted/50 px-3 py-2 text-left transition-colors hover:border-primary/40"
      >
        <span className="block text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
          Subject — click to copy
        </span>
        <span className="mt-0.5 block text-sm text-foreground">{buildProposalReceivedSubject(fields)}</span>
      </button>

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
          <Label className="text-xs text-muted-foreground">Event Name</Label>
          <Input value={eventName} onChange={(e) => setEventName(e.target.value)} />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label className="text-xs text-muted-foreground">Creative Session URL</Label>
          <Input
            value={sessionUrl}
            onChange={(e) => setSessionUrl(e.target.value)}
            placeholder="https://soleiacreative.app/creative/…"
          />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label className="text-xs text-muted-foreground">Drive Folder URL (optional)</Label>
          <Input value={drive} onChange={(e) => setDrive(e.target.value)} placeholder="https://drive.google.com/..." />
        </div>
      </div>

      <div className="flex flex-wrap justify-end gap-2">
        <Button size="sm" variant="outline" onClick={copyPlain} className="gap-2">
          {copiedText ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          {copiedText ? 'Copied' : 'Copy Plain Text'}
        </Button>
        <Button
          size="sm"
          onClick={copyRich}
          className="gap-2 bg-secondary hover:bg-secondary/80 text-secondary-foreground"
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          {copied ? 'Copied' : 'Copy Email'}
        </Button>
      </div>

      {expanded && (
        <div
          className="border border-border rounded-lg p-4 max-h-[28rem] overflow-y-auto bg-muted"
          dangerouslySetInnerHTML={{ __html: buildProposalReceivedHtml(fields) }}
        />
      )}
    </div>
  );
}

export default ProposalReceivedEmailCard;
