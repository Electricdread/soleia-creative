import { useState, useEffect } from 'react';
import { Copy, Check, Palette, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
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
}

function buildCreativeSessionEmailHtml(
  projectName: string,
  clientName: string,
  coverImageUrl: string | null,
  sessionLink: string,
  eventDate: string | null
) {
  const logoUrl = 'https://rszawchsbpsmtrtvljta.supabase.co/storage/v1/object/public/email-assets/soleia-logo-color.png';
  const formattedDate = eventDate
    ? new Date(eventDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : null;

  const heroSection = coverImageUrl
    ? `<div style="position:relative;">
        <img src="${coverImageUrl}" alt="${projectName}" style="width:100%;height:auto;display:block;max-height:300px;object-fit:cover;" />
        <div style="position:absolute;bottom:0;left:0;right:0;height:80px;background:linear-gradient(transparent,#0a0a0a);"></div>
      </div>`
    : `<div style="background:linear-gradient(160deg,#0a0a0a 0%,#1a1a1a 40%,#252525 70%,#1a1a1a 100%);padding:60px 24px;text-align:center;">
        <img src="${logoUrl}" alt="Soleia Las Vegas" style="height:60px;width:auto;margin:0 auto;display:block;" />
      </div>`;

  const logoBar = coverImageUrl
    ? `<div style="background:#0a0a0a;padding:16px 24px;text-align:center;">
        <img src="${logoUrl}" alt="Soleia Las Vegas" style="height:40px;width:auto;margin:0 auto;display:block;" />
      </div>`
    : '';

  return `<div style="font-family:'Helvetica Neue',Arial,sans-serif;max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e5e5;">
  ${heroSection}
  ${logoBar}

  <div style="padding:32px 28px;">
    <h2 style="font-size:22px;font-weight:700;color:#1a1a1a;margin:0 0 6px;">Your Creative Session is Ready</h2>
    ${formattedDate ? `<p style="font-size:13px;color:#B8860B;margin:0 0 20px;letter-spacing:0.5px;font-weight:600;">${formattedDate}</p>` : '<div style="height:14px;"></div>'}

    <p style="font-size:15px;line-height:1.7;color:#333333;margin:0 0 20px;">
      Dear ${clientName || 'Valued Client'},
    </p>

    <p style="font-size:15px;line-height:1.7;color:#333333;margin:0 0 16px;">
      We're excited to share the curated design concepts for <strong style="color:#B8860B;">${projectName || '[Project Name]'}</strong>. Your personalized Creative Session is now available for review — browse through our mood boards, explore visual directions, and let us know what resonates with your vision.
    </p>

    <div style="background:#f9f9f9;border-radius:8px;padding:20px 24px;margin:0 0 24px;">
      <p style="font-size:14px;font-weight:700;color:#1a1a1a;margin:0 0 12px;">How to Navigate Your Session:</p>
      <table style="width:100%;border-collapse:collapse;">
        <tr>
          <td style="padding:6px 12px 6px 0;vertical-align:top;font-size:20px;">🎨</td>
          <td style="padding:6px 0;font-size:14px;line-height:1.6;color:#555;">
            <strong>Browse</strong> — Scroll through the curated design boards at your own pace
          </td>
        </tr>
        <tr>
          <td style="padding:6px 12px 6px 0;vertical-align:top;font-size:20px;">💬</td>
          <td style="padding:6px 0;font-size:14px;line-height:1.6;color:#555;">
            <strong>Comment</strong> — Tap any item to leave feedback or ask questions
          </td>
        </tr>
        <tr>
          <td style="padding:6px 12px 6px 0;vertical-align:top;font-size:20px;">✅</td>
          <td style="padding:6px 0;font-size:14px;line-height:1.6;color:#555;">
            <strong>Approve</strong> — Use the approve button on your favorite concepts to add them to your selections
          </td>
        </tr>
      </table>
    </div>

    <div style="text-align:center;margin:28px 0;">
      <a href="${sessionLink}" target="_blank" style="display:inline-block;background:linear-gradient(135deg,#B8860B,#DAA520);color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;padding:14px 36px;border-radius:8px;letter-spacing:0.5px;">
        View Creative Session →
      </a>
    </div>

    <p style="font-size:15px;line-height:1.7;color:#333333;margin:0;">
      If you have any questions or would like to discuss the designs further, please don't hesitate to reach out. We look forward to your feedback!
    </p>
  </div>

  <div style="background:linear-gradient(160deg,#0a0a0a 0%,#1a1a1a 40%,#252525 70%,#1a1a1a 100%);padding:24px;text-align:center;">
    <img src="${logoUrl}" alt="Soleia" style="height:28px;width:auto;margin:0 auto 8px;display:block;opacity:0.85;" />
    <p style="margin:0 0 4px;font-size:12px;color:#DAA520;letter-spacing:1px;">Creative Team</p>
    <p style="margin:0;font-size:12px;color:#888888;">
      <a href="mailto:luisdreamslv@gmail.com" style="color:#888888;text-decoration:none;">luisdreamslv@gmail.com</a>
    </p>
  </div>
</div>`;
}

export function CreativeSessionEmailCard() {
  const [sessions, setSessions] = useState<SessionOption[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const fetchSessions = async () => {
      const { data } = await supabase
        .from('creative_sessions')
        .select('id, token, project_name, client_name, cover_images, event_date')
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
  const coverImageUrl = selected?.cover_images?.[0]?.url || null;
  const sessionLink = selected
    ? `${window.location.origin}/creative/${selected.token}`
    : '';

  const htmlContent = selected
    ? buildCreativeSessionEmailHtml(
        selected.project_name,
        selected.client_name,
        coverImageUrl,
        sessionLink,
        selected.event_date
      )
    : '';

  const handleCopy = async () => {
    if (!selected) {
      toast.error('Please select a creative session first');
      return;
    }
    try {
      const blob = new Blob([htmlContent], { type: 'text/html' });
      await navigator.clipboard.write([new ClipboardItem({ 'text/html': blob })]);
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
