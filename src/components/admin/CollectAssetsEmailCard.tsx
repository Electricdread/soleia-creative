import { useState } from 'react';
import { Copy, Check, FolderUp, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

function buildAssetsEmailHtml(projectName: string, cloudLink: string) {
  const logoUrl = 'https://rszawchsbpsmtrtvljta.supabase.co/storage/v1/object/public/email-assets/soleia-logo-color.png';
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f5f5f5;font-family:'Helvetica Neue',Arial,sans-serif;">
<table width="100%" border="0" cellspacing="0" cellpadding="0" bgcolor="#f5f5f5"><tr><td align="center" style="padding:20px 0;">

<table width="600" border="0" cellspacing="0" cellpadding="0" style="background:#ffffff;border:1px solid #e5e5e5;">
  <!-- HEADER -->
  <tr><td bgcolor="#111111" style="padding:40px 24px;text-align:center;">
    <img src="${logoUrl}" alt="Soleia Las Vegas" width="180" style="height:60px;width:auto;display:block;margin:0 auto;" />
  </td></tr>

  <!-- BODY -->
  <tr><td style="padding:32px 28px;background:#ffffff;">
    <p style="font-size:15px;line-height:1.7;color:#333333;margin:0 0 20px;">
      We are providing you with an After Effects project file prepared specifically for our LED video configuration mapping for <strong style="color:#B8860B;">${projectName || '[Project Name]'}</strong>. This template is pre-built to match our venue's exact screen layout, so you can drop in your content and export with confidence.
    </p>

    <p style="font-size:15px;line-height:1.7;color:#333333;margin:0 0 24px;">
      Below is a quick step-by-step guide to deliver your custom content for our venue screens.
    </p>

    <!-- STEP 1 -->
    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin:0 0 20px;"><tr>
      <td width="3" bgcolor="#DAA520"></td>
      <td style="background:#faf8f3;padding:16px 20px;">
        <p style="margin:0 0 6px;font-size:14px;font-weight:700;color:#B8860B;">STEP 1: PREPARE YOUR VIDEO</p>
        <p style="margin:0;font-size:14px;line-height:1.7;color:#444444;">Export your final video from After Effects, Premiere, or your editing tool in ProRes 422 or high-quality H.264.</p>
      </td>
    </tr></table>

    <!-- STEP 2 -->
    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin:0 0 20px;"><tr>
      <td width="3" bgcolor="#DAA520"></td>
      <td style="background:#faf8f3;padding:16px 20px;">
        <p style="margin:0 0 6px;font-size:14px;font-weight:700;color:#B8860B;">STEP 2: DOWNLOAD RESOLUME ALLEY (FREE)</p>
        <p style="margin:0;font-size:14px;line-height:1.7;color:#444444;">Our venue runs on Resolume media servers, which require DXV3-encoded files. Download the free encoder here: <a href="https://resolume.com/software/alley" style="color:#B8860B;text-decoration:underline;">resolume.com/software/alley</a></p>
      </td>
    </tr></table>

    <!-- STEP 3 -->
    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin:0 0 20px;"><tr>
      <td width="3" bgcolor="#DAA520"></td>
      <td style="background:#faf8f3;padding:16px 20px;">
        <p style="margin:0 0 6px;font-size:14px;font-weight:700;color:#B8860B;">STEP 3: ENCODE TO DXV3</p>
        <p style="margin:0;font-size:14px;line-height:1.7;color:#444444;">Open your video in Resolume Alley and encode using the DXV3 codec. For content with transparency, select "DXV3 Alpha."</p>
      </td>
    </tr></table>

    <!-- STEP 4 -->
    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin:0 0 20px;"><tr>
      <td width="3" bgcolor="#DAA520"></td>
      <td style="background:#faf8f3;padding:16px 20px;">
        <p style="margin:0 0 6px;font-size:14px;font-weight:700;color:#B8860B;">STEP 4: CHECK SPECS</p>
        <p style="margin:0;font-size:14px;line-height:1.7;color:#444444;">Make sure your files match these requirements:</p>
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin:10px 0 0;font-size:13px;">
          <tr style="border-bottom:1px solid #e5e5e5;">
            <td style="padding:6px 8px;font-weight:600;color:#333;">TV Displays</td>
            <td style="padding:6px 8px;color:#555;">1920×1080 or 3840×2160 · MOV · DXV3 · Max 8GB</td>
          </tr>
          <tr>
            <td style="padding:6px 8px;font-weight:600;color:#333;">LED Pixel Map</td>
            <td style="padding:6px 8px;color:#555;">3840×2160 · MOV w/ Alpha · DXV3 · 60fps · Max 30GB</td>
          </tr>
        </table>
      </td>
    </tr></table>

    <!-- STEP 5 -->
    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin:0 0 24px;"><tr>
      <td width="3" bgcolor="#DAA520"></td>
      <td style="background:#faf8f3;padding:16px 20px;">
        <p style="margin:0 0 6px;font-size:14px;font-weight:700;color:#B8860B;">STEP 5: SUBMIT CONTENT</p>
        <p style="margin:0;font-size:14px;line-height:1.7;color:#444444;">Please submit your encoded files at least 21 business days before your event so we can test and approve playback.</p>
      </td>
    </tr></table>

    <!-- CTA BUTTON -->
    <table width="100%" border="0" cellspacing="0" cellpadding="0"><tr><td align="center" style="padding:28px 0;">
      <table border="0" cellspacing="0" cellpadding="0"><tr>
        <td bgcolor="#B8860B" style="border-radius:8px;padding:14px 36px;">
          <a href="${cloudLink || '#'}" target="_blank" style="display:inline-block;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;letter-spacing:0.5px;">Access Project Folder</a>
        </td>
      </tr></table>
    </td></tr></table>

    <!-- TIPS -->
    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin:0 0 24px;"><tr>
      <td style="background:#f9f9f9;padding:16px 20px;">
        <p style="font-size:14px;font-weight:700;color:#333;margin:0 0 8px;">Tips for Best Results</p>
        <ul style="margin:0;padding:0 0 0 18px;font-size:13px;line-height:2;color:#555555;">
          <li>Export in ProRes first for best quality before DXV3 encoding</li>
          <li>Use darker tones — LED screens are very bright</li>
          <li>Use white or light logo versions for best visibility</li>
          <li>Include alpha channel for transparent overlays</li>
        </ul>
      </td>
    </tr></table>

    <p style="font-size:15px;line-height:1.7;color:#333333;margin:0;">
      If you have any questions, don't hesitate to reach out. We're here to help make your event look stunning!
    </p>
  </td></tr>

  <!-- FOOTER -->
  <tr><td bgcolor="#111111" style="padding:24px;text-align:center;">
    <img src="${logoUrl}" alt="Soleia" width="84" style="height:28px;width:auto;display:block;margin:0 auto 8px;opacity:0.85;" />
    <p style="margin:0 0 4px;font-size:12px;color:#DAA520;letter-spacing:1px;">Creative Team</p>
    <p style="margin:0;font-size:12px;color:#888888;">
      <a href="mailto:luisdreamslv@gmail.com" style="color:#888888;text-decoration:none;">luisdreamslv@gmail.com</a>
    </p>
  </td></tr>
</table>

</td></tr></table>
</body></html>`;
}

export function CollectAssetsEmailCard() {
  const [projectName, setProjectName] = useState('');
  const [cloudLink, setCloudLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const handleCopy = async () => {
    if (!projectName.trim()) {
      toast.error('Please enter a project name');
      return;
    }
    const html = buildAssetsEmailHtml(projectName.trim(), cloudLink.trim());
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
            <FolderUp className="w-5 h-5 text-muted-foreground" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Content Delivery Email</h3>
            <p className="text-sm text-muted-foreground">Branded template for content delivery instructions</p>
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
          <Label className="text-xs text-muted-foreground">Project Name</Label>
          <Input
            placeholder="e.g. Acme Corp Annual Gala"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Cloud Link (Dropbox / Google Drive)</Label>
          <Input
            placeholder="https://www.dropbox.com/..."
            value={cloudLink}
            onChange={(e) => setCloudLink(e.target.value)}
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
          dangerouslySetInnerHTML={{ __html: buildAssetsEmailHtml(projectName || '[Project Name]', cloudLink || '#') }}
        />
      )}
    </div>
  );
}
