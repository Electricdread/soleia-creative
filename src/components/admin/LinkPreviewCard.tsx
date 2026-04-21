import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ExternalLink, Link2 } from 'lucide-react';
import { toast } from 'sonner';
import { getPublicOrigin } from '@/lib/ogShare';

interface LinkPreviewCardProps {
  token: string;
  type: 'creative' | 'session';
  projectName: string;
  clientName: string;
  coverImageUrl?: string | null;
  eventDate?: string | null;
}

export function LinkPreviewCard({ token, type, projectName, clientName, coverImageUrl, eventDate }: LinkPreviewCardProps) {
  const [showPreview, setShowPreview] = useState(false);

  const directUrl = `${getPublicOrigin()}/${type === 'creative' ? 'creative' : 'session'}/${token}`;

  const copyDirectLink = () => {
    navigator.clipboard.writeText(directUrl);
    toast.success('Direct link copied!');
  };

  return (
    <div className="space-y-2">
      {/* Preview card */}
      <div
        className="rounded-lg border border-border/60 overflow-hidden bg-card hover:border-primary/30 transition-colors cursor-pointer"
        onClick={() => setShowPreview(!showPreview)}
      >
        {coverImageUrl && (
          <div className="h-20 w-full overflow-hidden">
            <img src={coverImageUrl} alt="" className="w-full h-full object-cover" />
          </div>
        )}
        <div className="p-2.5">
          <p className="text-xs font-medium text-foreground truncate">{projectName}</p>
          <p className="text-[11px] text-muted-foreground truncate">{clientName}{eventDate ? ` • ${eventDate}` : ''}</p>
          <p className="text-[10px] text-muted-foreground/60 truncate mt-1">
            {type === 'creative' ? 'Creative Session' : 'Idea Session'}
          </p>
        </div>
      </div>

      {/* Share actions */}
      {showPreview && (
        <div className="flex gap-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={copyDirectLink}
                  className="h-7 text-xs gap-1 px-2 flex-1"
                >
                  <Link2 className="w-3 h-3" />
                  Copy Link
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">Copy direct link</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <Button
            size="sm"
            variant="outline"
            onClick={() => window.open(directUrl, '_blank')}
            className="h-7 w-7 p-0"
          >
            <ExternalLink className="w-3 h-3" />
          </Button>
        </div>
      )}
    </div>
  );
}
