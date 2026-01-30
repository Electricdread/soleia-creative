import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ExternalLink, ChevronDown, FileText, Palette, Wrench, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { useState } from 'react';
import soleiaLogo from '@/assets/soleia-wide-logo.png';

interface CreativeSessionCoverProps {
  session: {
    project_name: string;
    client_name: string;
    circleback_url: string | null;
    circleback_summary: string | null;
    technical_notes: string | null;
    creative_notes: string | null;
    created_at: string;
  };
}

export function CreativeSessionCover({ session }: CreativeSessionCoverProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <Card className="border-zinc-800 bg-zinc-900/80 backdrop-blur-sm overflow-hidden font-tech">
      <CardHeader className="pb-3 sm:pb-4 px-3 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <img 
              src={soleiaLogo} 
              alt="Soleia" 
              className="h-6 sm:h-8 object-contain"
            />
            <div className="h-6 sm:h-8 w-px bg-zinc-700" />
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
          {session.circleback_url && (
            <Button
              variant="outline"
              size="sm"
              className="gap-2 shrink-0 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300 font-tech text-xs uppercase tracking-wider h-10 sm:h-8 touch-manipulation"
              asChild
            >
              <a
                href={session.circleback_url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                <span>View Call</span>
              </a>
            </Button>
          )}
        </div>
      </CardHeader>

      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleTrigger asChild>
          <Button 
            variant="ghost" 
            className="w-full justify-between px-3 sm:px-6 py-3 h-auto border-t border-zinc-800 rounded-none hover:bg-zinc-800/50 touch-manipulation"
          >
            <span className="text-xs font-tech uppercase tracking-widest flex items-center gap-2 text-zinc-400">
              <FileText className="h-3.5 w-3.5" />
              Session_Brief
            </span>
            <ChevronDown className={`h-4 w-4 text-zinc-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
          </Button>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="space-y-3 sm:space-y-4 pt-3 sm:pt-4 px-3 sm:px-6">
            {/* Call Summary */}
            {session.circleback_summary && (
              <div className="space-y-2">
                <h3 className="text-[10px] sm:text-xs font-tech uppercase tracking-widest flex items-center gap-2 text-amber-400">
                  <FileText className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                  Call_Summary
                </h3>
                <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-3 sm:p-4">
                  <p className="text-xs sm:text-sm text-zinc-300 whitespace-pre-wrap font-tech leading-relaxed">
                    {session.circleback_summary}
                  </p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 gap-3 sm:gap-4">
              {/* Technical Notes */}
              {session.technical_notes && (
                <div className="space-y-2">
                  <h3 className="text-[10px] sm:text-xs font-tech uppercase tracking-widest flex items-center gap-2 text-cyan-400">
                    <Wrench className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                    Technical_Requirements
                  </h3>
                  <div className="bg-cyan-500/5 border border-cyan-500/20 rounded-lg p-3 sm:p-4">
                    <p className="text-xs sm:text-sm text-zinc-300 whitespace-pre-wrap font-tech leading-relaxed">
                      {session.technical_notes}
                    </p>
                  </div>
                </div>
              )}

              {/* Creative Notes */}
              {session.creative_notes && (
                <div className="space-y-2">
                  <h3 className="text-[10px] sm:text-xs font-tech uppercase tracking-widest flex items-center gap-2 text-pink-400">
                    <Palette className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                    Creative_Direction
                  </h3>
                  <div className="bg-pink-500/5 border border-pink-500/20 rounded-lg p-3 sm:p-4">
                    <p className="text-xs sm:text-sm text-zinc-300 whitespace-pre-wrap font-tech leading-relaxed">
                      {session.creative_notes}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {!session.circleback_summary && !session.technical_notes && !session.creative_notes && (
              <p className="text-xs text-zinc-600 text-center py-4 font-tech uppercase tracking-wider">
                // No session notes added
              </p>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
