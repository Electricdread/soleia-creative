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
    <Card className="border-primary/20 bg-gradient-to-br from-background to-primary/5 overflow-hidden">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <img 
              src={soleiaLogo} 
              alt="Soleia" 
              className="h-8 object-contain"
            />
            <div className="h-8 w-px bg-border" />
            <div>
              <h1 className="text-xl sm:text-2xl font-bold">{session.project_name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary">{session.client_name}</Badge>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {format(new Date(session.created_at), 'MMMM d, yyyy')}
                </span>
              </div>
            </div>
          </div>
          {session.circleback_url && (
            <Button
              variant="outline"
              size="sm"
              className="gap-2 shrink-0"
              asChild
            >
              <a
                href={session.circleback_url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-4 w-4" />
                <span className="hidden sm:inline">View Call</span>
              </a>
            </Button>
          )}
        </div>
      </CardHeader>

      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full justify-between px-6 py-2 h-auto border-t rounded-none">
            <span className="text-sm font-medium flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Session Brief
            </span>
            <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
          </Button>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="space-y-4 pt-4">
            {/* Call Summary */}
            {session.circleback_summary && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  Call Summary
                </h3>
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {session.circleback_summary}
                  </p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Technical Notes */}
              {session.technical_notes && (
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <Wrench className="h-4 w-4 text-blue-500" />
                    Technical Requirements
                  </h3>
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                    <p className="text-sm whitespace-pre-wrap">
                      {session.technical_notes}
                    </p>
                  </div>
                </div>
              )}

              {/* Creative Notes */}
              {session.creative_notes && (
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <Palette className="h-4 w-4 text-purple-500" />
                    Creative Direction
                  </h3>
                  <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
                    <p className="text-sm whitespace-pre-wrap">
                      {session.creative_notes}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {!session.circleback_summary && !session.technical_notes && !session.creative_notes && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No session notes have been added yet.
              </p>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
