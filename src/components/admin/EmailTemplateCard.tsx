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
    <div className="bg-zinc-900/80 backdrop-blur-sm border border-zinc-800 rounded-xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-white/5 border border-zinc-700 flex items-center justify-center">
            <Mail className="w-5 h-5 text-zinc-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Content Delivery Email</h3>
            <p className="text-sm text-zinc-500">Pre-formatted template for client delivery instructions</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setExpanded(!expanded)}
            className="border-zinc-700 text-zinc-400 hover:text-white hover:bg-zinc-800"
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
          <Button
            size="sm"
            onClick={handleCopy}
            className="gap-2 bg-zinc-700 hover:bg-zinc-600 text-white"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied' : 'Copy Template'}
          </Button>
        </div>
      </div>
      
      {expanded && (
        <pre className="text-xs text-zinc-400 bg-zinc-950 border border-zinc-800 rounded-lg p-4 max-h-64 overflow-y-auto whitespace-pre-wrap font-mono">
          {DELIVERY_EMAIL_TEMPLATE}
        </pre>
      )}
    </div>
  );
}
