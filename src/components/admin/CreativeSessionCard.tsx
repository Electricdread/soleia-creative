import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Copy, Trash2, ExternalLink, ChevronDown, Users, Clock, FileText, Wrench, Palette } from 'lucide-react';
import { format, differenceInDays, addDays } from 'date-fns';

interface CreativeSession {
  id: string;
  token: string;
  project_name: string;
  client_name: string;
  circleback_url: string | null;
  circleback_summary: string | null;
  technical_notes: string | null;
  creative_notes: string | null;
  created_at: string;
  is_active: boolean;
}

interface CreativeSessionCardProps {
  session: CreativeSession;
  index: number;
  onCopyLink: (token: string) => void;
  onDelete: (id: string) => void;
  onOpen: (token: string) => void;
}

// Parse transcript and highlight key sections
function parseTranscript(text: string) {
  // Common patterns for key information
  const patterns = [
    { regex: /(deadline|due date|deliver|by\s+\w+\s+\d+)/gi, type: 'deadline' },
    { regex: /(budget|cost|\$\d+|\d+k)/gi, type: 'budget' },
    { regex: /(action item|todo|task|need to|must|should)/gi, type: 'action' },
    { regex: /(decision|decided|agreed|confirmed|approved)/gi, type: 'decision' },
    { regex: /(next steps|follow up|schedule|meeting)/gi, type: 'followup' },
  ];

  // Split into sentences
  const sentences = text.split(/(?<=[.!?])\s+/);
  
  return sentences.map((sentence, idx) => {
    let type: string | null = null;
    for (const pattern of patterns) {
      if (pattern.regex.test(sentence)) {
        type = pattern.type;
        break;
      }
    }
    return { text: sentence, type, id: idx };
  });
}

function getHighlightClass(type: string | null) {
  switch (type) {
    case 'deadline': return 'bg-red-500/20 text-red-300 border-l-2 border-red-500';
    case 'budget': return 'bg-emerald-500/20 text-emerald-300 border-l-2 border-emerald-500';
    case 'action': return 'bg-cyan-500/20 text-cyan-300 border-l-2 border-cyan-500';
    case 'decision': return 'bg-purple-500/20 text-purple-300 border-l-2 border-purple-500';
    case 'followup': return 'bg-amber-500/20 text-amber-300 border-l-2 border-amber-500';
    default: return '';
  }
}

export function CreativeSessionCard({ session, index, onCopyLink, onDelete, onOpen }: CreativeSessionCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const sessionDate = new Date(session.created_at);
  const expirationDate = addDays(sessionDate, 21);
  const daysRemaining = differenceInDays(expirationDate, new Date());
  const isExpired = daysRemaining < 0;
  const isUrgent = daysRemaining <= 5 && daysRemaining >= 0;

  const parsedSummary = session.circleback_summary ? parseTranscript(session.circleback_summary) : [];

  return (
    <Card className="group border-zinc-700/50 bg-zinc-900/90 hover:border-cyan-500/40 transition-all duration-300 overflow-hidden">
      {/* ShowBLOX gradient accent bar */}
      <div className="h-1.5 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500" />
      
      <CardContent className="p-0">
        {/* Main Summary Header */}
        <div className="p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            {/* Left: Date + Project Info */}
            <div className="flex-1 min-w-0">
              {/* Large Date Display */}
              <div className="flex items-start gap-4 mb-4">
                <div className="shrink-0 text-center">
                  <div className={`text-3xl sm:text-4xl font-tech font-bold leading-none ${isExpired ? 'text-red-400' : isUrgent ? 'text-amber-400' : 'text-cyan-400'}`}>
                    {format(sessionDate, 'd')}
                  </div>
                  <div className="text-xs font-tech uppercase tracking-widest text-zinc-400 mt-0.5">
                    {format(sessionDate, 'MMM')}
                  </div>
                  <div className="text-[10px] font-tech text-zinc-600">
                    {format(sessionDate, 'yyyy')}
                  </div>
                </div>
                
                <div className="flex-1 min-w-0 pt-1">
                  {/* Project Name - Large & Bold */}
                  <h3 className="text-lg sm:text-xl font-tech font-bold uppercase tracking-wide text-white truncate mb-1">
                    {session.project_name}
                  </h3>
                  
                  {/* Client Badge */}
                  <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/40 font-tech uppercase text-xs tracking-wider h-6">
                    <Users className="h-3 w-3 mr-1.5" />
                    {session.client_name}
                  </Badge>
                </div>
              </div>

              {/* Countdown Calendar */}
              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                isExpired 
                  ? 'bg-red-500/10 border border-red-500/30' 
                  : isUrgent 
                    ? 'bg-amber-500/10 border border-amber-500/30'
                    : 'bg-cyan-500/10 border border-cyan-500/30'
              }`}>
                <Clock className={`h-4 w-4 ${isExpired ? 'text-red-400' : isUrgent ? 'text-amber-400' : 'text-cyan-400'}`} />
                <div className="flex-1">
                  <div className={`text-xs font-tech uppercase tracking-wider ${isExpired ? 'text-red-300' : isUrgent ? 'text-amber-300' : 'text-cyan-300'}`}>
                    {isExpired ? 'SESSION EXPIRED' : isUrgent ? 'EXPIRES SOON' : '21-DAY TERMS'}
                  </div>
                  <div className={`text-sm font-tech font-bold ${isExpired ? 'text-red-400' : isUrgent ? 'text-amber-400' : 'text-zinc-300'}`}>
                    {isExpired 
                      ? `Expired ${Math.abs(daysRemaining)} days ago`
                      : `${daysRemaining} days remaining`
                    }
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-tech text-zinc-500 uppercase">Expires</div>
                  <div className={`text-xs font-tech font-bold ${isExpired ? 'text-red-400' : 'text-zinc-400'}`}>
                    {format(expirationDate, 'MMM d')}
                  </div>
                </div>
              </div>

              {/* Circleback Link */}
              {session.circleback_url && (
                <a
                  href={session.circleback_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 mt-3 px-3 py-1.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 transition-colors text-xs font-tech uppercase tracking-wider"
                >
                  <ExternalLink className="h-3 w-3" />
                  View Call Recording
                </a>
              )}
            </div>

            {/* Right: Action Buttons */}
            <div className="flex flex-col gap-1.5 shrink-0">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onOpen(session.token)}
                title="Open session"
                className="text-zinc-400 hover:text-cyan-400 hover:bg-cyan-500/10 h-9 w-9"
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onCopyLink(session.token)}
                title="Copy link"
                className="text-zinc-400 hover:text-emerald-400 hover:bg-emerald-500/10 h-9 w-9"
              >
                <Copy className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDelete(session.id)}
                title="Delete session"
                className="text-zinc-400 hover:text-red-400 hover:bg-red-500/10 h-9 w-9"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Expandable Transcript & Notes */}
        {(session.circleback_summary || session.technical_notes || session.creative_notes) && (
          <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
            <CollapsibleTrigger asChild>
              <button className="w-full flex items-center justify-between px-4 sm:px-5 py-3 border-t border-zinc-700/50 hover:bg-zinc-800/50 transition-colors">
                <span className="text-xs font-tech uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                  <FileText className="h-3.5 w-3.5" />
                  Session Details
                </span>
                <ChevronDown className={`h-4 w-4 text-zinc-500 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
              </button>
            </CollapsibleTrigger>
            
            <CollapsibleContent>
              <div className="px-4 sm:px-5 pb-5 space-y-4 border-t border-zinc-700/30">
                {/* Transcript with Highlights */}
                {session.circleback_summary && (
                  <div className="pt-4">
                    <h4 className="text-xs font-tech uppercase tracking-widest text-amber-400 mb-3 flex items-center gap-2">
                      <FileText className="h-3.5 w-3.5" />
                      Call Transcript
                    </h4>
                    <div className="space-y-2 text-sm font-tech text-zinc-300 leading-relaxed">
                      {parsedSummary.map((sentence) => (
                        <p 
                          key={sentence.id} 
                          className={`${sentence.type ? `pl-3 py-1 rounded-r ${getHighlightClass(sentence.type)}` : ''}`}
                        >
                          {sentence.text}
                        </p>
                      ))}
                    </div>
                    
                    {/* Legend */}
                    <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-zinc-700/30">
                      <span className="text-[10px] font-tech text-zinc-600 uppercase tracking-wider">Key:</span>
                      <Badge variant="outline" className="text-[10px] border-red-500/30 text-red-400">Deadline</Badge>
                      <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-400">Budget</Badge>
                      <Badge variant="outline" className="text-[10px] border-cyan-500/30 text-cyan-400">Action</Badge>
                      <Badge variant="outline" className="text-[10px] border-purple-500/30 text-purple-400">Decision</Badge>
                      <Badge variant="outline" className="text-[10px] border-amber-500/30 text-amber-400">Follow-up</Badge>
                    </div>
                  </div>
                )}

                {/* Technical & Creative Notes */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  {session.technical_notes && (
                    <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-3">
                      <h4 className="text-[10px] font-tech uppercase tracking-widest text-blue-400 mb-2 flex items-center gap-1.5">
                        <Wrench className="h-3 w-3" />
                        Technical Notes
                      </h4>
                      <p className="text-xs font-tech text-zinc-400 leading-relaxed whitespace-pre-wrap">
                        {session.technical_notes}
                      </p>
                    </div>
                  )}
                  
                  {session.creative_notes && (
                    <div className="bg-pink-500/5 border border-pink-500/20 rounded-lg p-3">
                      <h4 className="text-[10px] font-tech uppercase tracking-widest text-pink-400 mb-2 flex items-center gap-1.5">
                        <Palette className="h-3 w-3" />
                        Creative Notes
                      </h4>
                      <p className="text-xs font-tech text-zinc-400 leading-relaxed whitespace-pre-wrap">
                        {session.creative_notes}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Notes indicator when collapsed */}
        {!isExpanded && (session.technical_notes || session.creative_notes) && (
          <div className="flex items-center gap-3 px-4 sm:px-5 pb-4">
            {session.technical_notes && (
              <span className="inline-flex items-center gap-1.5 text-[10px] text-blue-400 font-tech uppercase tracking-wider">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                Tech Notes
              </span>
            )}
            {session.creative_notes && (
              <span className="inline-flex items-center gap-1.5 text-[10px] text-pink-400 font-tech uppercase tracking-wider">
                <div className="w-1.5 h-1.5 rounded-full bg-pink-500" />
                Creative Notes
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
