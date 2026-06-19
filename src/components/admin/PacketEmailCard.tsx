import { useState } from 'react';
import { Copy, Check, Mail, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';

export type PacketEmailKind = 'pre_call' | 'creative_pre_call';

interface PacketEmailFields {
  kind: PacketEmailKind;
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

function buildPacketEmailHtml(f: PacketEmailFields) {
  const isCreative = f.kind === 'creative_pre_call';
  const title = isCreative ? 'Your Creative Pre-Call Packet' : 'Your Pre-Call Packet';
  const intro = isCreative
    ? `Ahead of our creative call, please review the Soleia Creative Guide and upload your brand assets to your secure project folder.`
    : `Ahead of our pre-call, we've prepared a private packet with everything you need — the Creative Guide, your Pixel Map reference, and a secure folder to upload your brand assets.`;
  const primaryLabel = isCreative ? 'Open the Soleia Creative Guide' : 'Open Your Packet';
  const driveLabel = isCreative ? 'Upload Your Assets' : 'Open Your Project Folder';
  const eventBanner = f.eventDate
    ? `<table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="width:100%;border-collapse:collapse;margin:0 0 24px;">
        <tr>
          <td style="background-color:#fdf6e3;border:2px solid #DAA520;padding:18px 20px;text-align:center;">
            <p style="margin:0 0 4px;font-size:18px;font-weight:700;color:#1a1a1a;">&#128197; Event Date: ${formatDate(f.eventDate)}</p>
            <p style="margin:0;font-size:14px;color:#555555;">Please review the materials below ahead of our call.</p>
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
          <td style="background-color:#111111;padding:40px 24px;text-align:center;">
            <img src="${LOGO_URL}" alt="Soleia Las Vegas" width="180" style="display:block;height:60px;width:auto;margin:0 auto;border:0;outline:none;text-decoration:none;" />
            <p style="margin:18px 0 0;font-size:12px;color:#DAA520;letter-spacing:3px;text-transform:uppercase;">${isCreative ? 'Creative Pre-Call' : 'Pre-Call Packet'}</p>
          </td>
        </tr>

        <tr>
          <td style="padding:32px 28px;background-color:#ffffff;">
            <h1 style="margin:0 0 18px;font-size:22px;line-height:1.3;color:#1a1a1a;font-weight:600;">${title}</h1>
            <p style="font-size:15px;line-height:1.7;color:#333333;margin:0 0 20px;">
              Hi${f.clientName ? ` <strong>${f.clientName}</strong>` : ''},
            </p>

            ${eventBanner}

            <p style="font-size:15px;line-height:1.7;color:#333333;margin:0 0 24px;">${intro}</p>

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
              If you have any questions ahead of our call, just reply to this email — we're here to help.
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

function buildPacketEmailText(f: PacketEmailFields) {
  const isCreative = f.kind === 'creative_pre_call';
  const intro = isCreative
    ? `Ahead of our creative call, please review the Soleia Creative Guide and upload your brand assets to your secure project folder.`
    : `Ahead of our pre-call, we've prepared a private packet with everything you need — the Creative Guide, your Pixel Map reference, and a secure folder to upload your brand assets.`;
  const dateLine = f.eventDate ? `Event Date: ${formatDate(f.eventDate)}\n\n` : '';
  const drive = f.driveUrl ? `\n\n${isCreative ? 'Upload Your Assets' : 'Open Your Project Folder'}: ${f.driveUrl}` : '';
  return `Hi${f.clientName ? ` ${f.clientName}` : ''},

${dateLine}${intro}

${isCreative ? 'Open the Soleia Creative Guide' : 'Open Your Packet'}: ${f.packetUrl}${drive}

If you have any questions ahead of our call, just reply to this email — we're here to help.

— Soleia Creative Team`;
}

interface Props {
  kind: PacketEmailKind;
  clientName: string;
  eventDate?: string | null;
  packetUrl: string;
  driveUrl?: string | null;
}

export function PacketEmailCard({ kind, clientName: initialName, eventDate, packetUrl, driveUrl }: Props) {
  const [clientName, setClientName] = useState(initialName ?? '');
  const [url, setUrl] = useState(packetUrl);
  const [drive, setDrive] = useState(driveUrl ?? '');
  const [date, setDate] = useState(eventDate ?? '');
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(true);

  const fields: PacketEmailFields = {
    kind,
    clientName: clientName.trim(),
    eventDate: date || null,
    packetUrl: url.trim(),
    driveUrl: drive.trim() || null,
  };

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
              {kind === 'creative_pre_call' ? 'Creative Pre-Call Email' : 'Pre-Call Packet Email'}
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
