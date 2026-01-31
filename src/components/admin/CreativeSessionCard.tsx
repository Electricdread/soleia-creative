import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Copy, Trash2, ExternalLink, ChevronDown, Users, Clock, FileText, Wrench, Palette, BookOpen, ImageIcon, Images, ZoomIn, Globe, Lock, Pencil, Check, X } from 'lucide-react';
import { format, differenceInDays, addDays } from 'date-fns';
import { CoverPageGenerator } from './CoverPageGenerator';
import { TechnicalBriefingArticle } from './TechnicalBriefingArticle';
import { CoverImageSelector, CoverImagePreview } from './CoverImageSelector';
import { FeaturedImageSelector, FeaturedImagesPreview } from './FeaturedImageSelector';
import { EditorialBriefingModal } from '@/components/creative/EditorialBriefingModal';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Json } from '@/integrations/supabase/types';

interface CoverImage {
  url: string;
  theme: string;
  prompt: string;
}

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
  is_public?: boolean;
  cover_images?: CoverImage[] | null;
  cover_themes?: string[] | null;
  cover_generated_at?: string | null;
  featured_images?: CoverImage[] | null;
}

interface CreativeSessionCardProps {
  session: CreativeSession;
  index: number;
  onCopyLink: (token: string) => void;
  onDelete: (id: string) => void;
  onOpen: (token: string) => void;
  onSessionUpdate?: () => void;
}

// Try to parse strategic brief from circleback_summary
function parseStrategicBrief(summary: string | null): StrategicBrief | null {
  if (!summary) return null;
  
  try {
    const parsed = JSON.parse(summary);
    // Check if it has the expected structure
    if (parsed.headline || parsed.executiveSummary || parsed.keyObjectives) {
      return parsed as StrategicBrief;
    }
    return null;
  } catch {
    // Not JSON, it's raw text - return null
    return null;
  }
}

// Parse legacy transcript and highlight key sections
function parseTranscript(text: string) {
  const patterns = [
    { regex: /(deadline|due date|deliver|by\s+\w+\s+\d+)/gi, type: 'deadline' },
    { regex: /(budget|cost|\$\d+|\d+k)/gi, type: 'budget' },
    { regex: /(action item|todo|task|need to|must|should)/gi, type: 'action' },
    { regex: /(decision|decided|agreed|confirmed|approved)/gi, type: 'decision' },
    { regex: /(next steps|follow up|schedule|meeting)/gi, type: 'followup' },
  ];

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

export function CreativeSessionCard({ session, index, onCopyLink, onDelete, onOpen, onSessionUpdate }: CreativeSessionCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showBriefing, setShowBriefing] = useState(false);
  const [isBriefingModalOpen, setIsBriefingModalOpen] = useState(false);
  const [coverImages, setCoverImages] = useState<CoverImage[]>(
    (session.cover_images as CoverImage[]) || []
  );
  const [selectedCoverImage, setSelectedCoverImage] = useState<CoverImage | null>(
    (session.cover_images as CoverImage[])?.find(img => img.url) || null
  );
  const [featuredImages, setFeaturedImages] = useState<CoverImage[]>(
    (session.featured_images as CoverImage[]) || []
  );
  const [strategicBrief, setStrategicBrief] = useState<StrategicBrief | null>(
    parseStrategicBrief(session.circleback_summary)
  );
  const [isPublic, setIsPublic] = useState(session.is_public ?? false);
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [editedCreativeNotes, setEditedCreativeNotes] = useState(session.creative_notes || '');
  const [savingNotes, setSavingNotes] = useState(false);
  
  const sessionDate = new Date(session.created_at);
  const expirationDate = addDays(sessionDate, 21);
  const daysRemaining = differenceInDays(expirationDate, new Date());
  const isExpired = daysRemaining < 0;
  const isUrgent = daysRemaining <= 5 && daysRemaining >= 0;

  // For legacy plain text summaries
  const isLegacySummary = session.circleback_summary && !strategicBrief;
  const parsedSummary = isLegacySummary ? parseTranscript(session.circleback_summary!) : [];

  const handleImagesGenerated = (images: CoverImage[]) => {
    setCoverImages(images);
    // Auto-select first image if none selected
    if (images.length > 0 && !selectedCoverImage) {
      setSelectedCoverImage(images[0]);
    }
    onSessionUpdate?.();
  };

  const handleBriefGenerated = (brief: StrategicBrief | null) => {
    setStrategicBrief(brief);
    if (brief) {
      setShowBriefing(true);
    }
    onSessionUpdate?.();
  };

  const handleCoverImageSelect = async (image: CoverImage) => {
    setSelectedCoverImage(image);
    
    // Persist the selection - reorder cover_images so selected is first
    const reorderedImages = [image, ...coverImages.filter(img => img.url !== image.url)];
    
    const { error } = await supabase
      .from('creative_sessions')
      .update({ cover_images: reorderedImages as unknown as Json })
      .eq('id', session.id);

    if (error) {
      toast.error('Failed to save cover selection');
      console.error(error);
    } else {
      toast.success('Cover image selected');
      onSessionUpdate?.();
    }
  };

  const handleFeaturedImagesSelect = async (images: CoverImage[]) => {
    setFeaturedImages(images);
    
    const { error } = await supabase
      .from('creative_sessions')
      .update({ featured_images: images as unknown as Json })
      .eq('id', session.id);

    if (error) {
      toast.error('Failed to save featured images');
      console.error(error);
    } else {
      toast.success(`${images.length} image${images.length !== 1 ? 's' : ''} selected for editorial`);
      onSessionUpdate?.();
    }
  };

  const handlePublicToggle = async (checked: boolean) => {
    setIsPublic(checked);
    
    const { error } = await supabase
      .from('creative_sessions')
      .update({ is_public: checked })
      .eq('id', session.id);

    if (error) {
      toast.error('Failed to update visibility');
      setIsPublic(!checked);
      console.error(error);
    } else {
      toast.success(checked ? 'Session is now public' : 'Session is now private');
      onSessionUpdate?.();
    }
  };

  const handleSaveCreativeNotes = async () => {
    setSavingNotes(true);
    
    const { error } = await supabase
      .from('creative_sessions')
      .update({ creative_notes: editedCreativeNotes.trim() || null })
      .eq('id', session.id);

    if (error) {
      toast.error('Failed to save notes');
      console.error(error);
    } else {
      toast.success('Creative notes saved');
      setIsEditingNotes(false);
      onSessionUpdate?.();
    }
    setSavingNotes(false);
  };

  const handleCancelEditNotes = () => {
    setEditedCreativeNotes(session.creative_notes || '');
    setIsEditingNotes(false);
  };

  // Show briefing automatically if we have a strategic brief
  useEffect(() => {
    if (strategicBrief && coverImages.length > 0) {
      setShowBriefing(true);
    }
  }, [strategicBrief, coverImages.length]);

  return (
    <div className="space-y-4">
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
                    
                    {/* Client Badge + Visibility */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/40 font-tech uppercase text-xs tracking-wider h-6">
                        <Users className="h-3 w-3 mr-1.5" />
                        {session.client_name}
                      </Badge>
                      
                      {/* Public/Private Toggle */}
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={isPublic}
                          onCheckedChange={handlePublicToggle}
                          className="data-[state=checked]:bg-emerald-500 data-[state=unchecked]:bg-amber-500/50"
                        />
                        <Badge className={`font-tech uppercase text-[10px] tracking-wider h-5 ${
                          isPublic 
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' 
                            : 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                        }`}>
                          {isPublic ? <Globe className="h-3 w-3 mr-1" /> : <Lock className="h-3 w-3 mr-1" />}
                          {isPublic ? 'Public' : 'Private'}
                        </Badge>
                      </div>
                    </div>
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

                {/* Selected Cover Image Preview - Clickable for Briefing */}
                {selectedCoverImage && (
                  <div className="mt-4 pt-4 border-t border-zinc-700/30">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-tech uppercase tracking-widest text-amber-400 flex items-center gap-1.5">
                        <ImageIcon className="h-3 w-3" />
                        Session Cover
                      </span>
                      <CoverImageSelector
                        images={coverImages}
                        selectedImage={selectedCoverImage}
                        onSelect={handleCoverImageSelect}
                      />
                    </div>
                    <div 
                      className="relative cursor-pointer group"
                      onClick={() => setIsBriefingModalOpen(true)}
                    >
                      <CoverImagePreview image={selectedCoverImage} />
                      {/* Hover overlay */}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center rounded-lg">
                        <div className="bg-zinc-900/80 backdrop-blur-sm rounded-xl px-4 py-2 flex items-center gap-2 border border-zinc-700">
                          <ZoomIn className="h-4 w-4 text-amber-400" />
                          <span className="text-xs font-tech uppercase tracking-wider text-white">View Briefing</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Editorial Briefing Modal */}
                <EditorialBriefingModal
                  open={isBriefingModalOpen}
                  onOpenChange={setIsBriefingModalOpen}
                  session={{
                    project_name: session.project_name,
                    client_name: session.client_name,
                    circleback_summary: session.circleback_summary,
                    created_at: session.created_at,
                    cover_images: coverImages,
                    featured_images: featuredImages,
                  }}
                />

                {/* Cover Image Generator */}
                <div className="mt-4 pt-4 border-t border-zinc-700/30">
                  <CoverPageGenerator
                    sessionId={session.id}
                    projectName={session.project_name}
                    clientName={session.client_name}
                    circlebackUrl={session.circleback_url}
                    circlebackSummary={session.circleback_summary}
                    creativeNotes={session.creative_notes}
                    technicalNotes={session.technical_notes}
                    existingImages={coverImages}
                    onImagesGenerated={handleImagesGenerated}
                    onBriefGenerated={handleBriefGenerated}
                  />
                </div>

                {/* Cover Image Selector (when images exist but none selected) */}
                {coverImages.length > 0 && !selectedCoverImage && (
                  <div className="mt-3">
                    <CoverImageSelector
                      images={coverImages}
                      selectedImage={selectedCoverImage}
                      onSelect={handleCoverImageSelect}
                    />
                  </div>
                )}

                {/* Featured Images Selector for Editorial */}
                {coverImages.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-zinc-700/30">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-tech uppercase tracking-widest text-pink-400 flex items-center gap-1.5">
                        <Images className="h-3 w-3" />
                        Editorial Images
                      </span>
                    </div>
                    <FeaturedImageSelector
                      images={coverImages}
                      featuredImages={featuredImages}
                      onSelect={handleFeaturedImagesSelect}
                    />
                    {featuredImages.length > 0 && (
                      <FeaturedImagesPreview images={featuredImages} />
                    )}
                  </div>
                )}

                {/* Quick Creative Notes Editor */}
                <div className="mt-3 pt-3 border-t border-zinc-700/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-tech uppercase tracking-widest text-pink-400 flex items-center gap-1.5">
                      <Palette className="h-3 w-3" />
                      Creative Notes
                    </span>
                    {!isEditingNotes && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsEditingNotes(true)}
                        className="h-6 px-2 text-[10px] text-pink-400 hover:text-pink-300 hover:bg-pink-500/10 font-tech uppercase tracking-wider"
                      >
                        <Pencil className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                    )}
                  </div>
                  {isEditingNotes ? (
                    <div className="space-y-2">
                      <Textarea
                        value={editedCreativeNotes}
                        onChange={(e) => setEditedCreativeNotes(e.target.value)}
                        placeholder="Brand colors, mood, style direction..."
                        className="bg-black/50 border-pink-500/30 text-white placeholder:text-zinc-600 focus:border-pink-500 focus:ring-pink-500/20 font-tech text-xs min-h-[80px]"
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={handleSaveCreativeNotes}
                          disabled={savingNotes}
                          className="h-7 px-2 bg-pink-500 hover:bg-pink-600 text-white font-tech text-[10px] uppercase"
                        >
                          <Check className="h-3 w-3 mr-1" />
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={handleCancelEditNotes}
                          disabled={savingNotes}
                          className="h-7 px-2 text-zinc-400 hover:text-white font-tech text-[10px] uppercase"
                        >
                          <X className="h-3 w-3 mr-1" />
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : session.creative_notes ? (
                    <p className="text-xs font-tech text-zinc-400 leading-relaxed whitespace-pre-wrap bg-pink-500/5 border border-pink-500/20 rounded-lg p-2">
                      {session.creative_notes}
                    </p>
                  ) : (
                    <p className="text-xs font-tech text-zinc-600 italic">No creative notes yet. Click Edit to add.</p>
                  )}
                </div>

                {/* Toggle Briefing View Button */}
                {strategicBrief && coverImages.length > 0 && (
                  <Button
                    onClick={() => setShowBriefing(!showBriefing)}
                    variant="outline"
                    size="sm"
                    className="w-full mt-3 border-purple-500/30 text-purple-400 hover:bg-purple-500/10 font-tech uppercase tracking-wider"
                  >
                    <BookOpen className="h-3.5 w-3.5 mr-2" />
                    {showBriefing ? 'Hide Technical Briefing' : 'View Technical Briefing'}
                  </Button>
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

          {/* Expandable Legacy Transcript & Notes (only for old-style summaries) */}
          {(isLegacySummary || session.technical_notes || session.creative_notes) && !strategicBrief && (
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
                  {/* Legacy Transcript with Highlights */}
                  {isLegacySummary && (
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
                    
                    {(session.creative_notes || isEditingNotes) && (
                      <div className="bg-pink-500/5 border border-pink-500/20 rounded-lg p-3">
                        <h4 className="text-[10px] font-tech uppercase tracking-widest text-pink-400 mb-2 flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <Palette className="h-3 w-3" />
                            Creative Notes
                          </span>
                          {!isEditingNotes && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setIsEditingNotes(true)}
                              className="h-5 px-1.5 text-pink-400 hover:text-pink-300 hover:bg-pink-500/10"
                            >
                              <Pencil className="h-3 w-3" />
                            </Button>
                          )}
                        </h4>
                        {isEditingNotes ? (
                          <div className="space-y-2">
                            <Textarea
                              value={editedCreativeNotes}
                              onChange={(e) => setEditedCreativeNotes(e.target.value)}
                              placeholder="Brand colors, mood, style direction..."
                              className="bg-black/50 border-pink-500/30 text-white placeholder:text-zinc-600 focus:border-pink-500 focus:ring-pink-500/20 font-tech text-xs min-h-[80px]"
                            />
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={handleSaveCreativeNotes}
                                disabled={savingNotes}
                                className="h-7 px-2 bg-pink-500 hover:bg-pink-600 text-white font-tech text-[10px] uppercase"
                              >
                                <Check className="h-3 w-3 mr-1" />
                                Save
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={handleCancelEditNotes}
                                disabled={savingNotes}
                                className="h-7 px-2 text-zinc-400 hover:text-white font-tech text-[10px] uppercase"
                              >
                                <X className="h-3 w-3 mr-1" />
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-xs font-tech text-zinc-400 leading-relaxed whitespace-pre-wrap">
                            {session.creative_notes}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* Notes indicator when collapsed */}
          {!isExpanded && !strategicBrief && (session.technical_notes || session.creative_notes) && (
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

      {/* Technical Briefing Article (shown below the card) */}
      {showBriefing && strategicBrief && (
        <TechnicalBriefingArticle
          projectName={session.project_name}
          clientName={session.client_name}
          createdAt={session.created_at}
          brief={strategicBrief}
          images={coverImages}
        />
      )}
    </div>
  );
}
