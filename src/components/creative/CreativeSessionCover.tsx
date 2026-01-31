import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ExternalLink, ChevronDown, FileText, Palette, Wrench, Calendar, Target, Lightbulb, CheckCircle2, BookOpen, Newspaper, Images, ZoomIn } from 'lucide-react';
import { format } from 'date-fns';
import { useState } from 'react';
import soleiaLogo from '@/assets/soleia-wide-logo.png';
import { EditorialBriefingModal } from './EditorialBriefingModal';

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

interface CreativeSessionCoverProps {
  session: {
    project_name: string;
    client_name: string;
    circleback_url: string | null;
    circleback_summary: string | null;
    technical_notes: string | null;
    creative_notes: string | null;
    created_at: string;
    cover_images?: CoverImage[] | null;
    featured_images?: CoverImage[] | null;
  };
}

// Try to parse strategic brief from circleback_summary
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

// Parse raw text and highlight key sections for editorial display
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

// Editorial Image Grid Component
function EditorialImageGrid({ images, headline }: { images: CoverImage[]; headline?: string }) {
  if (images.length === 0) return null;

  // For 1 image: full width hero
  if (images.length === 1) {
    return (
      <div className="relative aspect-[21/9] rounded-xl overflow-hidden mb-6">
        <img 
          src={images[0].url} 
          alt={images[0].theme}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/30 to-transparent" />
        <div className="absolute bottom-4 left-4">
          <Badge className="bg-pink-500/20 text-pink-400 border-pink-500/30 font-tech text-[10px] uppercase tracking-widest">
            {images[0].theme}
          </Badge>
        </div>
        {headline && (
          <h2 className="absolute bottom-4 right-4 text-xl sm:text-2xl font-tech font-bold text-white text-right max-w-[60%] leading-tight">
            {headline}
          </h2>
        )}
      </div>
    );
  }

  // For 2 images: side by side
  if (images.length === 2) {
    return (
      <div className="grid grid-cols-2 gap-3 mb-6">
        {images.map((img, idx) => (
          <div key={idx} className="relative aspect-video rounded-xl overflow-hidden">
            <img 
              src={img.url} 
              alt={img.theme}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
            <div className="absolute bottom-3 left-3">
              <Badge className="bg-pink-500/20 text-pink-400 border-pink-500/30 font-tech text-[10px] uppercase tracking-widest">
                {img.theme}
              </Badge>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // For 3 images: 1 large hero + 2 smaller
  return (
    <div className="grid grid-cols-3 gap-3 mb-6">
      <div className="col-span-2 relative aspect-[16/9] rounded-xl overflow-hidden">
        <img 
          src={images[0].url} 
          alt={images[0].theme}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/20 to-transparent" />
        <div className="absolute bottom-3 left-3">
          <Badge className="bg-pink-500/20 text-pink-400 border-pink-500/30 font-tech text-[10px] uppercase tracking-widest">
            {images[0].theme}
          </Badge>
        </div>
        {headline && (
          <h2 className="absolute bottom-3 right-3 text-lg sm:text-xl font-tech font-bold text-white text-right max-w-[60%] leading-tight">
            {headline}
          </h2>
        )}
      </div>
      <div className="flex flex-col gap-3">
        {images.slice(1, 3).map((img, idx) => (
          <div key={idx} className="relative flex-1 rounded-xl overflow-hidden min-h-0">
            <img 
              src={img.url} 
              alt={img.theme}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
            <div className="absolute bottom-2 left-2">
              <Badge className="bg-pink-500/20 text-pink-400 border-pink-500/30 font-tech text-[8px] sm:text-[10px] uppercase tracking-widest">
                {img.theme}
              </Badge>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function CreativeSessionCover({ session }: CreativeSessionCoverProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isBriefingOpen, setIsBriefingOpen] = useState(false);
  const strategicBrief = parseStrategicBrief(session.circleback_summary);
  const isLegacySummary = session.circleback_summary && !strategicBrief;
  const parsedEditorial = isLegacySummary ? parseEditorialContent(session.circleback_summary!) : [];
  
  // Get the selected cover image (first one in array) for hero
  const coverImage = (session.cover_images as CoverImage[] | null)?.[0] || null;
  
  // Get featured images for editorial (or fallback to cover_images)
  const featuredImages = (session.featured_images as CoverImage[] | null) || [];
  const hasFeaturedImages = featuredImages.length > 0;
  
  // Check if briefing content is available
  const hasBriefingContent = session.circleback_summary || hasFeaturedImages;

  return (
    <Card className="border-zinc-800 bg-zinc-900/80 backdrop-blur-sm overflow-hidden font-tech">
      {/* Cover Image Hero - Clickable for Briefing */}
      {coverImage && (
        <div 
          className={`relative aspect-[21/9] overflow-hidden ${hasBriefingContent ? 'cursor-pointer group' : ''}`}
          onClick={() => hasBriefingContent && setIsBriefingOpen(true)}
        >
          <img 
            src={coverImage.url} 
            alt={coverImage.theme}
            className={`w-full h-full object-cover transition-transform duration-500 ${hasBriefingContent ? 'group-hover:scale-105' : ''}`}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/40 to-transparent" />
          
          {/* Hover Overlay for Briefing */}
          {hasBriefingContent && (
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
              <div className="bg-zinc-900/80 backdrop-blur-sm rounded-xl px-6 py-4 flex items-center gap-3 border border-zinc-700">
                <ZoomIn className="h-5 w-5 text-amber-400" />
                <span className="text-sm font-tech uppercase tracking-wider text-white">View Briefing</span>
              </div>
            </div>
          )}
          
          <div className="absolute bottom-4 left-4 sm:left-6">
            <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 font-tech text-[10px] uppercase tracking-widest">
              {coverImage.theme}
            </Badge>
          </div>
        </div>
      )}
      
      {/* Editorial Briefing Modal */}
      <EditorialBriefingModal
        open={isBriefingOpen}
        onOpenChange={setIsBriefingOpen}
        session={session}
      />
      
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
            {/* Featured Editorial Images */}
            {hasFeaturedImages && (
              <EditorialImageGrid 
                images={featuredImages} 
                headline={strategicBrief?.headline}
              />
            )}

            {/* Strategic Brief (AI-generated structured format) */}
            {strategicBrief && (
              <div className="space-y-4">
                {/* Headline - only show if no featured images (it's in the grid otherwise) */}
                {!hasFeaturedImages && (
                  <div className="border-l-2 border-amber-500 pl-4">
                    <h2 className="text-lg sm:text-xl font-tech font-bold text-white leading-tight">
                      {strategicBrief.headline}
                    </h2>
                  </div>
                )}

                {/* Executive Summary */}
                {strategicBrief.executiveSummary && (
                  <div className="space-y-2">
                    <h3 className="text-[10px] sm:text-xs font-tech uppercase tracking-widest flex items-center gap-2 text-amber-400">
                      <FileText className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                      Executive_Summary
                    </h3>
                    <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-3 sm:p-4">
                      <p className="text-xs sm:text-sm text-zinc-300 font-tech leading-relaxed">
                        {strategicBrief.executiveSummary}
                      </p>
                    </div>
                  </div>
                )}

                {/* Key Objectives */}
                {strategicBrief.keyObjectives && strategicBrief.keyObjectives.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-[10px] sm:text-xs font-tech uppercase tracking-widest flex items-center gap-2 text-cyan-400">
                      <Target className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                      Key_Objectives
                    </h3>
                    <div className="bg-cyan-500/5 border border-cyan-500/20 rounded-lg p-3 sm:p-4">
                      <ul className="space-y-2">
                        {strategicBrief.keyObjectives.map((objective, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-xs sm:text-sm text-zinc-300 font-tech">
                            <CheckCircle2 className="h-3.5 w-3.5 text-cyan-400 shrink-0 mt-0.5" />
                            {objective}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {/* Creative Direction */}
                {strategicBrief.creativeDirection && (
                  <div className="space-y-2">
                    <h3 className="text-[10px] sm:text-xs font-tech uppercase tracking-widest flex items-center gap-2 text-pink-400">
                      <Lightbulb className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                      Creative_Direction
                    </h3>
                    <div className="bg-pink-500/5 border border-pink-500/20 rounded-lg p-3 sm:p-4 space-y-3">
                      <div>
                        <span className="text-[10px] font-tech uppercase tracking-wider text-pink-400/70">Theme:</span>
                        <p className="text-sm text-white font-tech font-medium mt-0.5">
                          {strategicBrief.creativeDirection.theme}
                        </p>
                      </div>
                      <p className="text-xs sm:text-sm text-zinc-300 font-tech leading-relaxed">
                        {strategicBrief.creativeDirection.description}
                      </p>
                      {strategicBrief.creativeDirection.visualKeywords && strategicBrief.creativeDirection.visualKeywords.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-2">
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

                {/* Action Items */}
                {strategicBrief.actionItems && strategicBrief.actionItems.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-[10px] sm:text-xs font-tech uppercase tracking-widest flex items-center gap-2 text-emerald-400">
                      <CheckCircle2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                      Action_Items
                    </h3>
                    <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-3 sm:p-4">
                      <ul className="space-y-2">
                        {strategicBrief.actionItems.map((item, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-xs sm:text-sm text-zinc-300 font-tech">
                            <span className="text-emerald-400 font-bold">{idx + 1}.</span>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Legacy Call Summary (plain text) - Editorial Style */}
            {isLegacySummary && (
              <div className="space-y-3">
                <h3 className="text-[10px] sm:text-xs font-tech uppercase tracking-widest flex items-center gap-2 text-amber-400">
                  <Newspaper className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                  Call_Summary_Editorial
                </h3>
                <div className="bg-zinc-950/50 border border-zinc-700/50 rounded-xl p-4 sm:p-5 space-y-4">
                  {/* Header with divider */}
                  <div className="border-b border-zinc-700/50 pb-4">
                    <h4 className="text-lg sm:text-xl font-tech font-bold text-white mb-1">
                      Meeting Notes
                    </h4>
                    <p className="text-xs text-zinc-500 font-tech">
                      {format(new Date(session.created_at), 'EEEE, MMMM d, yyyy')}
                    </p>
                  </div>
                  
                  {/* Parsed content with highlights */}
                  <div className="space-y-3">
                    {parsedEditorial.map((block) => (
                      <p 
                        key={block.id} 
                        className={`text-sm text-zinc-300 font-tech leading-relaxed rounded py-2 ${block.type ? getHighlightClass(block.type) : ''}`}
                      >
                        {block.text}
                      </p>
                    ))}
                  </div>

                  {/* Legend */}
                  <div className="flex flex-wrap gap-2 pt-4 border-t border-zinc-700/30">
                    <span className="text-[10px] font-tech text-zinc-600 uppercase tracking-wider">Key:</span>
                    <Badge variant="outline" className="text-[10px] border-red-500/30 text-red-400">Deadline</Badge>
                    <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-400">Budget</Badge>
                    <Badge variant="outline" className="text-[10px] border-cyan-500/30 text-cyan-400">Action</Badge>
                    <Badge variant="outline" className="text-[10px] border-purple-500/30 text-purple-400">Decision</Badge>
                    <Badge variant="outline" className="text-[10px] border-amber-500/30 text-amber-400">Follow-up</Badge>
                  </div>
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

            {!session.circleback_summary && !strategicBrief && !session.technical_notes && !session.creative_notes && (
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
