import { Card, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar } from 'lucide-react';
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
    created_at: string;
    cover_images?: CoverImage[] | null;
  };
}

export function CreativeSessionCover({ session }: CreativeSessionCoverProps) {
  const coverImage = (session.cover_images as CoverImage[] | null)?.[0] || null;

  return (
    <Card className="border border-border/50 bg-card overflow-hidden">
      {coverImage && (
        <div className="relative aspect-[21/9] overflow-hidden">
          <img
            src={coverImage.url}
            alt="Session cover"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-card via-card/30 to-transparent" />
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
            <h1 className="text-lg sm:text-xl font-semibold text-foreground truncate">
              {session.project_name}
            </h1>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <Badge variant="secondary" className="text-[10px] sm:text-xs">
                {session.client_name}
              </Badge>
              <span className="text-[10px] sm:text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {format(new Date(session.created_at), 'MMM d, yyyy')}
              </span>
            </div>
          </div>
        </div>
      </CardHeader>
    </Card>
  );
}
