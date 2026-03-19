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
    <Card className="border-zinc-800 bg-zinc-900/80 overflow-hidden font-tech">
      {/* Cover Image Hero */}
      {coverImage && (
        <div className="relative aspect-[21/9] overflow-hidden">
          <img
            src={coverImage.url}
            alt="Session cover"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/30 to-transparent" />
        </div>
      )}

      <CardHeader className="pb-4 px-4 sm:px-6">
        <div className="flex items-center gap-3 sm:gap-4">
          <img
            src={soleiaLogo}
            alt="Soleia"
            className="h-6 sm:h-8 object-contain"
          />
          <div className="h-6 w-px bg-zinc-700" />
          <div className="min-w-0 flex-1">
            <h1 className="text-lg sm:text-xl font-bold text-cyan-400 uppercase tracking-wide truncate">
              {session.project_name}
            </h1>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 font-tech text-[10px] sm:text-xs uppercase tracking-wider">
                {session.client_name}
              </Badge>
              <span className="text-[10px] sm:text-xs text-zinc-500 flex items-center gap-1 font-tech">
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
