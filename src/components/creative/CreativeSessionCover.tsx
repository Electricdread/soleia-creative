import { Card, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Sparkles } from 'lucide-react';
import { format } from 'date-fns';
import soleiaLogo from '@/assets/soleia-wide-logo.png';

interface CoverImage {
  url: string;
  theme: string;
  prompt: string;
}

interface CreativeSessionCoverProps {
  session: {
    project_name: string;
    client_name: string;
    event_date?: string | null;
    created_at: string;
    cover_images?: CoverImage[] | null;
    creative_notes?: string | null;
  };
}

// The client sees the event's date. event_date is a plain date ("2026-10-14"), read as local midnight
// (as the admin card does) so it never slips a day; sessions without one fall back to the day they were made.
function sessionDateLabel(session: CreativeSessionCoverProps['session']) {
  const d = session.event_date ? new Date(session.event_date + 'T00:00:00') : new Date(session.created_at);
  return format(d, 'MMM d, yyyy');
}

export function CreativeSessionCover({ session }: CreativeSessionCoverProps) {
  const coverImage = (session.cover_images as CoverImage[] | null)?.[0] || null;

  return (
    <Card className="border border-border/50 bg-card overflow-hidden">
      {coverImage && (
        <div className="aspect-[21/9] overflow-hidden">
          <img
            src={coverImage.url}
            alt="Session cover"
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <CardHeader className="pb-4 px-4 sm:px-6">
        <div className="flex items-center gap-3 sm:gap-4">
          <img
            src={soleiaLogo}
            alt="Soleia"
            className="h-6 sm:h-8 object-contain"
          />
          <div className="h-6 w-px bg-border" />
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl font-bold font-display text-foreground truncate">
              {session.project_name}
            </h1>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <Badge variant="secondary" className="text-[10px] sm:text-xs">
                {session.client_name}
              </Badge>
              <span className="text-[10px] sm:text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {sessionDateLabel(session)}
              </span>
            </div>
          </div>
        </div>
      </CardHeader>

      {session.creative_notes && (
        <div className="px-4 sm:px-6 pb-5">
          <div className="relative border-l-2 border-primary/30 pl-4 py-1">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Sparkles className="h-3.5 w-3.5 text-primary/70" />
              <span className="text-[11px] font-semibold uppercase tracking-wider text-primary/70">
                Creative Director Notes
              </span>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground italic whitespace-pre-line">
              {session.creative_notes}
            </p>
          </div>
        </div>
      )}
    </Card>
  );
}
