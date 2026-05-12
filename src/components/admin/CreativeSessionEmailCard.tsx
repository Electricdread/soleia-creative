import { useState, useEffect } from 'react';
import { Copy, Check, Palette, ChevronDown, ChevronUp, Folder } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

interface CoverImage {
  url: string;
  theme: string;
  prompt: string;
}

interface SessionOption {
  id: string;
  token: string;
  project_name: string;
  client_name: string;
  cover_images: CoverImage[] | null;
  event_date: string | null;
  proposal_id: string | null;
}

function buildProjectFolderSection(folderUrl: string) {
  if (!folderUrl) return '';
  return `<table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="width:100%;border-collapse:collapse;margin:0 0 24px;">
              <tr>
                <td width="3" style="width:3px;background-color:#DAA520;font-size:0;line-height:0;">&nbsp;</td>
                <td style="background-color:#faf8f3;padding:18px 22px;">
                  <p style="margin:0 0 6px;font-size:14px;font-weight:700;color:#1a1a1a;">&#128193; Your Project Folder</p>
                  <p style="margin:0 0 14px;font-size:13px;line-height:1.6;color:#555555;">
                    Access your <strong>Soleia Creative Guide</strong>, <strong>Pixel Map</strong>, and the <strong>Asset Upload</strong> folder — all in one place.
                  </p>
                  <table role="presentation" border="0" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
                    <tr>
                      <td style="background-color:#1a1a1a;border-radius:6px;padding:11px 22px;text-align:center;">
                        <a href="${folderUrl}" target="_blank" style="display:inline-block;color:#DAA520;font-size:13px;font-weight:600;text-decoration:none;letter-spacing:0.5px;">Open Project Folder &#8594;</a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>`;
}

function buildCreativeSessionEmailHtml(
  projectName: string,
  clientName: string,
  coverImageUrl: string | null,
  sessionLink: string,
  eventDate: string | null,
  folderUrl: string,
) {
  const logoUrl = 'https://rszawchsbpsmtrtvljta.supabase.co/storage/v1/object/public/email-assets/soleia-logo-color.png';
  const formattedDate = eventDate
    ? new Date(eventDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : null;

  const heroSection = coverImageUrl
    ? `<tr>
        <td style="padding:0;text-align:center;">
          <img src="${coverImageUrl}" alt="${projectName}" width="100%" style="display:block;width:100%;height:auto;max-height:300px;border:0;outline:none;text-decoration:none;" />
        </td>
      </tr>
      <tr>
        <td style="background-color:#0a0a0a;padding:16px 24px;text-align:center;">
          <img src="${logoUrl}" alt="Soleia Las Vegas" width="120" style="display:block;height:40px;width:auto;margin:0 auto;border:0;outline:none;text-decoration:none;" />
        </td>
      </tr>`
    : `<tr>
        <td style="background-color:#111111;padding:60px 24px;text-align:center;">
          <img src="${logoUrl}" alt="Soleia Las Vegas" width="180" style="display:block;height:60px;width:auto;margin:0 auto;border:0;outline:none;text-decoration:none;" />
        </td>
      </tr>`;

  return `<table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="width:100%;min-width:100%;border-collapse:collapse;background-color:#f3f1eb;font-family:'Helvetica Neue',Arial,sans-serif;">
  <tr>
    <td align="center" style="padding:0;background-color:#f3f1eb;">
      <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="width:100%;border-collapse:collapse;background-color:#ffffff;border:1px solid #e5e5e5;">
        ${heroSection}

        <tr>
          <td style="padding:32px 28px;background-color:#ffffff;">
            <h2 style="font-size:22px;font-weight:700;color:#1a1a1a;margin:0 0 6px;">Your Creative Session is Ready</h2>
            ${formattedDate ? `<p style="font-size:13px;color:#B8860B;margin:0 0 20px;letter-spacing:0.5px;font-weight:600;">${formattedDate}</p>` : '<div style="height:14px;"></div>'}

            <p style="font-size:15px;line-height:1.7;color:#333333;margin:0 0 20px;">
              Dear ${clientName || 'Valued Client'},
            </p>

            <p style="font-size:15px;line-height:1.7;color:#333333;margin:0 0 16px;">
              We're excited to share the curated design concepts for <strong style="color:#B8860B;">${projectName || '[Project Name]'}</strong>. Your personalized Creative Session is now available for review — browse through our mood boards, explore visual directions, and let us know what resonates with your vision.
            </p>

            ${buildProjectFolderSection(folderUrl)}

            <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="width:100%;border-collapse:collapse;margin:0 0 24px;">
              <tr>
                <td style="background-color:#f9f9f9;padding:20px 24px;">
                  <p style="font-size:14px;font-weight:700;color:#1a1a1a;margin:0 0 12px;">How to Navigate Your Session:</p>
                  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="width:100%;border-collapse:collapse;">
                    <tr>
                      <td width="36" style="padding:6px 12px 6px 0;vertical-align:top;font-size:20px;">&#127912;</td>
                      <td style="padding:6px 0;font-size:14px;line-height:1.6;color:#555555;">
                        <strong>Browse</strong> — Scroll through the curated design boards at your own pace
                      </td>
                    </tr>
                    <tr>
                      <td width="36" style="padding:6px 12px 6px 0;vertical-align:top;font-size:20px;">&#128172;</td>
                      <td style="padding:6px 0;font-size:14px;line-height:1.6;color:#555555;">
                        <strong>Comment</strong> — Tap any item to leave feedback or ask questions
                      </td>
                    </tr>
                    <tr>
                      <td width="36" style="padding:6px 12px 6px 0;vertical-align:top;font-size:20px;">&#9989;</td>
                      <td style="padding:6px 0;font-size:14px;line-height:1.6;color:#555555;">
                        <strong>Approve</strong> — Use the approve button on your favorite concepts to add them to your selections
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
                        <a href="${sessionLink}" target="_blank" style="display:inline-block;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;letter-spacing:0.5px;">View Creative Session &#8594;</a>
                      </td>
                    </tr>
                   </table>
                </td>
              </tr>
            </table>

            <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="width:100%;border-collapse:collapse;">
              <tr>
                <td style="padding:0 0 24px;text-align:center;">
                  <p style="font-size:11px;color:#999999;margin:0 0 4px;">If the button above doesn't work, copy and paste this link into your browser:</p>
                  <p style="font-size:11px;color:#B8860B;margin:0;word-break:break-all;">
                    <a href="${sessionLink}" style="color:#B8860B;text-decoration:underline;">${sessionLink}</a>
                  </p>
                </td>
              </tr>
            </table>

            <p style="font-size:15px;line-height:1.7;color:#333333;margin:0;">
              If you have any questions or would like to discuss the designs further, please don't hesitate to reach out. We look forward to your feedback!
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

export function CreativeSessionEmailCard() {
  const [sessions, setSessions] = useState<SessionOption[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [folderUrl, setFolderUrl] = useState('');

  useEffect(() => {
    const fetchSessions = async () => {
      const { data } = await supabase
        .from('creative_sessions')
        .select('id, token, project_name, client_name, cover_images, event_date, proposal_id')
        .eq('is_active', true)
        .order('event_date', { ascending: true, nullsFirst: false });
      if (data) {
        setSessions(
          data.map((s) => ({
            ...s,
            cover_images: s.cover_images as unknown as CoverImage[] | null,
          }))
        );
      }
    };
    fetchSessions();
  }, []);

  const selected = sessions.find((s) => s.id === selectedId);

  // When a session is selected, auto-fetch the linked proposal's drive_folder_url
  useEffect(() => {
    let cancelled = false;
    const loadFolder = async () => {
      if (!selected?.proposal_id) {
        setFolderUrl('');
        return;
      }
      const { data } = await supabase
        .from('proposals')
        .select('drive_folder_url')
        .eq('id', selected.proposal_id)
        .maybeSingle();
      if (!cancelled) setFolderUrl((data as any)?.drive_folder_url || '');
    };
    loadFolder();
    return () => { cancelled = true; };
  }, [selected?.proposal_id]);

  const coverImageUrl = selected?.cover_images?.[0]?.url || null;
  const sessionLink = selected
    ? `${getPublicOrigin()}/creative/${selected.token}`
    : '';

  const htmlContent = selected
    ? buildCreativeSessionEmailHtml(
        selected.project_name,
        selected.client_name,
        coverImageUrl,
        sessionLink,
        selected.event_date,
        folderUrl.trim()
      )
    : '';

  const handleCopy = async () => {
    if (!selected) {
      toast.error('Please select a creative session first');
      return;
    }
    try {
      const htmlBlob = new Blob([htmlContent], { type: 'text/html' });
      const textBlob = new Blob([`Your Creative Session for ${selected.project_name} is ready. View it here: ${sessionLink}`], { type: 'text/plain' });
      await navigator.clipboard.write([new ClipboardItem({ 'text/html': htmlBlob, 'text/plain': textBlob })]);
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
              <Palette className="w-5 h-5 text-primary" />
              Creative Session Email
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Share creative sessions with clients for review
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
          <label className="text-sm font-medium text-foreground">Select Session</label>
          <Select value={selectedId} onValueChange={setSelectedId}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a creative session…" />
            </SelectTrigger>
            <SelectContent>
              {sessions.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.project_name} — {s.client_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selected && (
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Folder className="w-3.5 h-3.5 text-[#c49a3c]" />
              Project Folder Link {selected.proposal_id ? '(auto-filled from proposal)' : '(optional)'}
            </Label>
            <Input
              value={folderUrl}
              onChange={(e) => setFolderUrl(e.target.value)}
              placeholder="https://drive.google.com/drive/folders/..."
              className="font-mono text-xs"
            />
            <p className="text-[11px] text-muted-foreground">
              When set, the email shows a "Open Project Folder" CTA. Leave blank to omit.
            </p>
          </div>
        )}

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
