import { useState } from 'react';
import { Copy, Check, Mail, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const DELIVERY_EMAIL_TEMPLATE = `Subject: Content Delivery Guide — Soleia Venue Screens

Hi [Client Name],

We are providing you with an After Effects project file prepared specifically for our LED video configuration mapping. This template is pre-built to match our venue's exact screen layout, so you can drop in your content and export with confidence.

Below is a quick step-by-step guide to deliver your custom content for our venue screens.

──────────────────────────
STEP 1: PREPARE YOUR VIDEO
──────────────────────────
Export your final video from After Effects, Premiere, or your editing tool in ProRes 422 or high-quality H.264.

──────────────────────────
STEP 2: DOWNLOAD RESOLUME ALLEY (FREE)
──────────────────────────
Our venue runs on Resolume media servers, which require DXV3-encoded files.
Download the free Resolume Alley encoder here: https://resolume.com/software/alley

──────────────────────────
STEP 3: ENCODE TO DXV3
──────────────────────────
Open your video in Resolume Alley and encode using the DXV3 codec. For content with transparency, select "DXV3 Alpha."

──────────────────────────
STEP 4: CHECK SPECS
──────────────────────────
Make sure your files match these requirements:

• TV Displays — 1920×1080 or 3840×2160 | MOV | DXV3 | Max 8GB
• LED Pixel Map — 3840×2160 | MOV w/ Alpha | DXV3 | 60fps | Max 30GB

──────────────────────────
STEP 5: SUBMIT CONTENT
──────────────────────────
Please submit your encoded files at least 21 business days before your event so we can test and approve playback.

──────────────────────────
TIPS
──────────────────────────
• Export in ProRes first for best quality before DXV3 encoding
• Use darker tones — LED screens are very bright
• Use white or light logo versions for best visibility
• Include alpha channel for transparent overlays

If you have any questions, don't hesitate to reach out. We're here to help make your event look stunning!

Best regards,
DSX Soleia Creative Team
`;

export function EmailTemplateCard() {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(DELIVERY_EMAIL_TEMPLATE);
    setCopied(true);
    toast.success('Email template copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-card/80 backdrop-blur-sm border border-border rounded-xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-muted border border-border flex items-center justify-center">
            <Mail className="w-5 h-5 text-muted-foreground" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Content Delivery Email</h3>
            <p className="text-sm text-muted-foreground">Pre-formatted template for client delivery instructions</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setExpanded(!expanded)}
            className="border-border text-muted-foreground hover:text-foreground hover:bg-muted"
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
          <Button
            size="sm"
            onClick={handleCopy}
            className="gap-2 bg-secondary hover:bg-secondary/80 text-secondary-foreground"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied' : 'Copy Template'}
          </Button>
        </div>
      </div>
      
      {expanded && (
        <pre className="text-xs text-muted-foreground bg-muted border border-border rounded-lg p-4 max-h-64 overflow-y-auto whitespace-pre-wrap font-mono">
          {DELIVERY_EMAIL_TEMPLATE}
        </pre>
      )}
    </div>
  );
}
