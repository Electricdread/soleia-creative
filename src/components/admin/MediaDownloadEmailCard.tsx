import { useState } from 'react';
import { Copy, Check, Download, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

function buildMediaDownloadEmailHtml(projectName: string, clientName: string, downloadLink: string) {
  const logoUrl = 'https://rszawchsbpsmtrtvljta.supabase.co/storage/v1/object/public/email-assets/soleia-logo-color.png';
  return `<div style="font-family:'Helvetica Neue',Arial,sans-serif;max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e5e5;">
  <div style="background:linear-gradient(160deg,#0a0a0a 0%,#1a1a1a 40%,#252525 70%,#1a1a1a 100%);padding:40px 24px;text-align:center;">
    <img src="${logoUrl}" alt="Soleia Las Vegas" style="height:60px;width:auto;margin:0 auto;display:block;" />
  </div>

  <div style="padding:32px 28px;">
    <p style="font-size:15px;line-height:1.7;color:#333333;margin:0 0 20px;">
      Hi${clientName ? ` <strong>${clientName}</strong>` : ''},
    </p>

    <p style="font-size:15px;line-height:1.7;color:#333333;margin:0 0 20px;">
      Your media files for <strong style="color:#B8860B;">${projectName || '[Project Name]'}</strong> are ready for download. Please use the link below to access and retrieve all deliverables.
    </p>

    <div style="text-align:center;margin:28px 0;">
      <a href="${downloadLink || '#'}" target="_blank" style="display:inline-block;background:linear-gradient(135deg,#B8860B,#DAA520);color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;padding:14px 36px;border-radius:8px;letter-spacing:0.5px;">
        Download Media
      </a>
    </div>

    <div style="background:#f9f9f9;border-radius:8px;padding:16px 20px;margin:0 0 24px;">
      <p style="font-size:14px;line-height:1.7;color:#555555;margin:0;">
        Click the button above to open the shared folder. You can download individual files or the entire folder at once. This link will remain active for your convenience.
      </p>
    </div>

    <p style="font-size:15px;line-height:1.7;color:#333333;margin:0;">
      If you have any questions or need additional formats, please don't hesitate to reach out.
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

export function MediaDownloadEmailCard() {
  const [projectName, setProjectName] = useState('');
  const [clientName, setClientName] = useState('');
  const [downloadLink, setDownloadLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const handleCopy = async () => {
    if (!projectName.trim()) {
      toast.error('Please enter a project name');
      return;
    }
    const html = buildMediaDownloadEmailHtml(projectName.trim(), clientName.trim(), downloadLink.trim());
    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/html': new Blob([html], { type: 'text/html' }),
          'text/plain': new Blob([html], { type: 'text/plain' }),
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
            <Download className="w-5 h-5 text-muted-foreground" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Media Download Email</h3>
            <p className="text-sm text-muted-foreground">Share media download links with clients</p>
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

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Project Name</Label>
          <Input
            placeholder="e.g. Acme Corp Annual Gala"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Client Name</Label>
          <Input
            placeholder="e.g. John Smith"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Download Link</Label>
          <Input
            placeholder="https://www.dropbox.com/..."
            value={downloadLink}
            onChange={(e) => setDownloadLink(e.target.value)}
          />
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          size="sm"
          onClick={handleCopy}
          className="gap-2 bg-secondary hover:bg-secondary/80 text-secondary-foreground"
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          {copied ? 'Copied' : 'Copy Email'}
        </Button>
      </div>

      {expanded && (
        <div
          className="border border-border rounded-lg p-4 max-h-72 overflow-y-auto bg-muted"
          dangerouslySetInnerHTML={{ __html: buildMediaDownloadEmailHtml(projectName || '[Project Name]', clientName || '[Client]', downloadLink || '#') }}
        />
      )}
    </div>
  );
}
