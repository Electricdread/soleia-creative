import { Card, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Sparkles } from 'lucide-react';
import { format, isValid, parseISO } from 'date-fns';
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
    cover_images?: CoverImage[] | null;
    creative_notes?: string | null;
  };
}

export function CreativeSessionCover({ session }: CreativeSessionCoverProps) {
  const coverImage = (session.cover_images as CoverImage[] | null)?.[0] || null;
  // The header date is the show day. It used to be created_at, which clients
  // read as the event date. event_date is a plain 'YYYY-MM-DD': parseISO keeps
  // it a local calendar day, where new Date() would read UTC midnight and slip
  // a day west of UTC. No event date, no date shown.
  const eventDay = session.event_date ? parseISO(session.event_date) : null;

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
              {eventDay && isValid(eventDay) && (
                <span className="text-[10px] sm:text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {format(eventDay, 'MMM d, yyyy')}
                </span>
              )}
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
