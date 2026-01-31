import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  FileText, Target, Lightbulb, CheckCircle2, Calendar, 
  Layers, Clock, Newspaper, Sparkles, ArrowLeft
} from 'lucide-react';
import { format } from 'date-fns';

interface StrategicBrief {
  headline: string;
  executiveSummary: string;
  keyObjectives: string[];
  creativeDirection: {
    theme: string;
    description: string;
    visualKeywords: string[];
  };
  technicalRequirements: string[];
  timeline: {
    phase: string;
    description: string;
  }[];
  actionItems: string[];
}

interface CoverImage {
  url: string;
  theme: string;
  prompt: string;
}

interface EditorialBriefingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  session: {
    project_name: string;
    client_name: string;
    circleback_summary: string | null;
    created_at: string;
    cover_images?: CoverImage[] | null;
    featured_images?: CoverImage[] | null;
  };
}

function parseStrategicBrief(summary: string | null): StrategicBrief | null {
  if (!summary) return null;
  
  try {
    const parsed = JSON.parse(summary);
    if (parsed.headline || parsed.executiveSummary || parsed.keyObjectives) {
      return parsed as StrategicBrief;
    }
    return null;
  } catch {
    return null;
  }
}

function parseEditorialContent(text: string) {
  const patterns = [
    { regex: /(deadline|due date|deliver|by\s+\w+\s+\d+)/gi, type: 'deadline' },
    { regex: /(budget|cost|\$\d+|\d+k)/gi, type: 'budget' },
    { regex: /(action item|todo|task|need to|must|should)/gi, type: 'action' },
    { regex: /(decision|decided|agreed|confirmed|approved)/gi, type: 'decision' },
    { regex: /(next steps|follow up|schedule|meeting)/gi, type: 'followup' },
  ];

  const paragraphs = text.split(/\n\n+/).filter(p => p.trim());
  
  return paragraphs.map((paragraph, idx) => {
    let type: string | null = null;
    for (const pattern of patterns) {
      if (pattern.regex.test(paragraph)) {
        type = pattern.type;
        break;
      }
    }
    return { text: paragraph.trim(), type, id: idx };
  });
}

function getHighlightClass(type: string | null) {
  switch (type) {
    case 'deadline': return 'border-l-2 border-red-500 bg-red-500/10 pl-3';
    case 'budget': return 'border-l-2 border-emerald-500 bg-emerald-500/10 pl-3';
    case 'action': return 'border-l-2 border-cyan-500 bg-cyan-500/10 pl-3';
    case 'decision': return 'border-l-2 border-purple-500 bg-purple-500/10 pl-3';
    case 'followup': return 'border-l-2 border-amber-500 bg-amber-500/10 pl-3';
    default: return '';
  }
}

export function EditorialBriefingModal({ open, onOpenChange, session }: EditorialBriefingModalProps) {
  const strategicBrief = parseStrategicBrief(session.circleback_summary);
  const isLegacySummary = session.circleback_summary && !strategicBrief;
  const parsedEditorial = isLegacySummary ? parseEditorialContent(session.circleback_summary!) : [];
  
  const coverImages = (session.cover_images as CoverImage[] | null) || [];
  const featuredImages = (session.featured_images as CoverImage[] | null) || 
                         coverImages.slice(0, 3);

  // Show modal as long as we have something to display
  const hasContent = session.circleback_summary || featuredImages.length > 0 || coverImages.length > 0;

  if (!hasContent) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 bg-zinc-950 border-zinc-800 overflow-hidden">
        {/* Hero Image Section */}
        {featuredImages.length > 0 && (
          <div className="relative">
            {/* Main Hero Image */}
            <div className="relative aspect-[21/9] overflow-hidden">
              <img 
                src={featuredImages[0].url} 
                alt={featuredImages[0].theme}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/50 to-transparent" />
              
              {/* Floating Title */}
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-4 w-4 text-amber-400" />
                  <span className="text-[10px] font-tech uppercase tracking-[0.3em] text-amber-400">
                    Creative Briefing
                  </span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-tech font-bold text-white leading-tight max-w-2xl">
                  {strategicBrief?.headline || session.project_name}
                </h2>
                <div className="flex items-center gap-3 mt-3">
                  <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30 font-tech text-[10px] uppercase tracking-wider">
                    {session.client_name}
                  </Badge>
                  <span className="text-xs text-zinc-400 font-tech flex items-center gap-1.5">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(session.created_at), 'MMMM d, yyyy')}
                  </span>
                </div>
              </div>
            </div>

            {/* Secondary Images Grid */}
            {featuredImages.length > 1 && (
              <div className="flex gap-2 px-6 -mt-8 relative z-10">
                {featuredImages.slice(1, 3).map((img, idx) => (
                  <div key={idx} className="flex-1 aspect-video rounded-lg overflow-hidden border-2 border-zinc-800">
                    <img 
                      src={img.url} 
                      alt={img.theme}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <ScrollArea className="max-h-[50vh]">
          <div className="p-6 space-y-6">
            {/* Strategic Brief Content */}
            {strategicBrief && (
              <>
                {/* Executive Summary */}
                {strategicBrief.executiveSummary && (
                  <div className="space-y-3">
                    <h3 className="text-xs font-tech uppercase tracking-widest flex items-center gap-2 text-amber-400">
                      <FileText className="h-3.5 w-3.5" />
                      Executive Summary
                    </h3>
                    <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/5 border border-amber-500/20 rounded-xl p-5">
                      <p className="text-sm text-zinc-200 font-tech leading-relaxed">
                        {strategicBrief.executiveSummary}
                      </p>
                    </div>
                  </div>
                )}

                {/* Two Column Layout */}
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Key Objectives */}
                  {strategicBrief.keyObjectives && strategicBrief.keyObjectives.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-xs font-tech uppercase tracking-widest flex items-center gap-2 text-cyan-400">
                        <Target className="h-3.5 w-3.5" />
                        Key Objectives
                      </h3>
                      <div className="bg-cyan-500/5 border border-cyan-500/20 rounded-xl p-4 space-y-2">
                        {strategicBrief.keyObjectives.map((objective, idx) => (
                          <div key={idx} className="flex items-start gap-2 text-sm text-zinc-300 font-tech">
                            <CheckCircle2 className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
                            <span>{objective}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Technical Requirements */}
                  {strategicBrief.technicalRequirements && strategicBrief.technicalRequirements.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-xs font-tech uppercase tracking-widest flex items-center gap-2 text-purple-400">
                        <Layers className="h-3.5 w-3.5" />
                        Technical Requirements
                      </h3>
                      <div className="bg-purple-500/5 border border-purple-500/20 rounded-xl p-4 space-y-2">
                        {strategicBrief.technicalRequirements.map((req, idx) => (
                          <div key={idx} className="flex items-start gap-2 text-sm text-zinc-300 font-tech">
                            <span className="text-purple-400 font-bold shrink-0">•</span>
                            <span>{req}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Creative Direction */}
                {strategicBrief.creativeDirection && (
                  <div className="space-y-3">
                    <h3 className="text-xs font-tech uppercase tracking-widest flex items-center gap-2 text-pink-400">
                      <Lightbulb className="h-3.5 w-3.5" />
                      Creative Direction
                    </h3>
                    <div className="bg-gradient-to-br from-pink-500/10 to-purple-500/5 border border-pink-500/20 rounded-xl p-5 space-y-4">
                      <div>
                        <Badge className="bg-pink-500/20 text-pink-300 border-pink-500/30 font-tech text-xs mb-2">
                          {strategicBrief.creativeDirection.theme}
                        </Badge>
                        <p className="text-sm text-zinc-200 font-tech leading-relaxed">
                          {strategicBrief.creativeDirection.description}
                        </p>
                      </div>
                      {strategicBrief.creativeDirection.visualKeywords && strategicBrief.creativeDirection.visualKeywords.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-2 border-t border-pink-500/20">
                          {strategicBrief.creativeDirection.visualKeywords.map((keyword, idx) => (
                            <Badge key={idx} variant="outline" className="text-[10px] border-pink-500/30 text-pink-300 font-tech">
                              {keyword}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Timeline */}
                {strategicBrief.timeline && strategicBrief.timeline.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-xs font-tech uppercase tracking-widest flex items-center gap-2 text-blue-400">
                      <Clock className="h-3.5 w-3.5" />
                      Timeline
                    </h3>
                    <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4">
                      <div className="space-y-3">
                        {strategicBrief.timeline.map((phase, idx) => (
                          <div key={idx} className="flex gap-4 items-start">
                            <div className="flex flex-col items-center">
                              <div className="w-3 h-3 rounded-full bg-blue-500" />
                              {idx < strategicBrief.timeline.length - 1 && (
                                <div className="w-0.5 h-8 bg-blue-500/30" />
                              )}
                            </div>
                            <div className="flex-1 -mt-0.5">
                              <span className="text-sm font-tech font-bold text-blue-400">{phase.phase}</span>
                              <p className="text-sm text-zinc-300 font-tech mt-0.5">{phase.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Items */}
                {strategicBrief.actionItems && strategicBrief.actionItems.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-xs font-tech uppercase tracking-widest flex items-center gap-2 text-emerald-400">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Action Items
                    </h3>
                    <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4">
                      <div className="grid sm:grid-cols-2 gap-2">
                        {strategicBrief.actionItems.map((item, idx) => (
                          <div key={idx} className="flex items-start gap-2 text-sm text-zinc-300 font-tech bg-emerald-500/5 rounded-lg p-2">
                            <span className="text-emerald-400 font-bold shrink-0">{idx + 1}.</span>
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Legacy Summary */}
            {isLegacySummary && (
              <div className="space-y-4">
                <h3 className="text-xs font-tech uppercase tracking-widest flex items-center gap-2 text-amber-400">
                  <Newspaper className="h-3.5 w-3.5" />
                  Meeting Summary
                </h3>
                <div className="bg-zinc-900/50 border border-zinc-700/50 rounded-xl p-5 space-y-3">
                  {parsedEditorial.map((block) => (
                    <p 
                      key={block.id} 
                      className={`text-sm text-zinc-300 font-tech leading-relaxed rounded py-2 ${block.type ? getHighlightClass(block.type) : ''}`}
                    >
                      {block.text}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {/* No Content Fallback */}
            {!strategicBrief && !isLegacySummary && (
              <div className="text-center py-8">
                <Newspaper className="h-12 w-12 text-zinc-600 mx-auto mb-3" />
                <p className="text-sm text-zinc-500 font-tech">
                  No briefing summary available yet.
                </p>
                <p className="text-xs text-zinc-600 font-tech mt-1">
                  Generate a summary by analyzing the Circleback URL.
                </p>
              </div>
            )}

            {/* Back to Session Button */}
            <div className="pt-6 border-t border-zinc-800">
              <Button 
                onClick={() => onOpenChange(false)}
                variant="outline"
                className="w-full sm:w-auto bg-zinc-900 border-zinc-700 hover:bg-zinc-800 hover:border-cyan-500/50 text-zinc-200 font-tech"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Session
              </Button>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
