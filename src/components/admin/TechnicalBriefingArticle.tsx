import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Target, 
  Palette, 
  Wrench, 
  Clock, 
  CheckCircle2, 
  Quote,
  Sparkles,
  Calendar
} from 'lucide-react';
import { format } from 'date-fns';
import soleiaLogo from '@/assets/soleia-wide-logo.png';

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

interface TechnicalBriefingArticleProps {
  projectName: string;
  clientName: string;
  createdAt: string;
  brief: StrategicBrief;
  images: CoverImage[];
}

export function TechnicalBriefingArticle({
  projectName,
  clientName,
  createdAt,
  brief,
  images
}: TechnicalBriefingArticleProps) {
  return (
    <Card className="border-zinc-800 bg-zinc-900/95 backdrop-blur-sm overflow-hidden font-tech">
      {/* Top Accent Bar */}
      <div className="h-1 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500" />

      {/* Hero Section with Featured Image */}
      {images[0] && (
        <div className="relative aspect-[21/9] overflow-hidden">
          <img
            src={images[0].url}
            alt={brief.headline}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/50 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-zinc-900/80 via-transparent to-transparent" />
          
          {/* Overlay Content */}
          <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-4">
              <img src={soleiaLogo} alt="Soleia" className="h-6 sm:h-8 object-contain" />
              <div className="h-6 w-px bg-white/30" />
              <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30 font-tech text-[10px] uppercase tracking-widest">
                Creative Briefing
              </Badge>
            </div>
            
            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-bold uppercase tracking-tight text-white leading-tight mb-3">
              {brief.headline || projectName}
            </h1>
            
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <span className="text-purple-400 font-tech uppercase tracking-wider">
                {clientName}
              </span>
              <span className="text-zinc-500">|</span>
              <span className="text-zinc-400 flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                {format(new Date(createdAt), 'MMMM d, yyyy')}
              </span>
            </div>
          </div>
        </div>
      )}

      <CardContent className="p-6 sm:p-8 space-y-8">
        {/* Executive Summary */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center border border-amber-500/30">
              <Quote className="h-5 w-5 text-amber-400" />
            </div>
            <h2 className="text-lg font-bold uppercase tracking-wider text-white">Executive Summary</h2>
          </div>
          <div className="bg-amber-500/5 border-l-4 border-amber-500 pl-4 py-3 rounded-r-lg">
            <p className="text-zinc-300 leading-relaxed text-sm sm:text-base">
              {brief.executiveSummary}
            </p>
          </div>
        </section>

        {/* Two Column Layout for Images */}
        {images.length > 1 && (
          <div className="grid grid-cols-2 gap-3">
            {images.slice(1, 3).map((img, idx) => (
              <div key={idx} className="relative aspect-video rounded-lg overflow-hidden border border-zinc-700 group">
                <img
                  src={img.url}
                  alt={img.theme}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                <div className="absolute bottom-2 left-3">
                  <span className="text-[10px] font-tech uppercase tracking-widest text-cyan-400">
                    {img.theme}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Key Objectives */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center border border-cyan-500/30">
              <Target className="h-5 w-5 text-cyan-400" />
            </div>
            <h2 className="text-lg font-bold uppercase tracking-wider text-white">Key Objectives</h2>
          </div>
          <div className="grid gap-2">
            {brief.keyObjectives?.map((objective, idx) => (
              <div 
                key={idx} 
                className="flex items-start gap-3 bg-cyan-500/5 border border-cyan-500/20 rounded-lg p-3"
              >
                <div className="w-6 h-6 rounded-full bg-cyan-500/20 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-cyan-400">{idx + 1}</span>
                </div>
                <p className="text-sm text-zinc-300">{objective}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Creative Direction */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-pink-500/20 to-purple-500/20 flex items-center justify-center border border-pink-500/30">
              <Palette className="h-5 w-5 text-pink-400" />
            </div>
            <h2 className="text-lg font-bold uppercase tracking-wider text-white">Creative Direction</h2>
          </div>
          <div className="bg-gradient-to-br from-pink-500/5 to-purple-500/5 border border-pink-500/20 rounded-xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <Sparkles className="h-5 w-5 text-pink-400" />
              <span className="text-xl font-bold text-white uppercase tracking-wider">
                {brief.creativeDirection?.theme}
              </span>
            </div>
            <p className="text-zinc-300 text-sm leading-relaxed mb-4">
              {brief.creativeDirection?.description}
            </p>
            <div className="flex flex-wrap gap-2">
              {brief.creativeDirection?.visualKeywords?.map((keyword, idx) => (
                <Badge 
                  key={idx}
                  className="bg-purple-500/20 text-purple-300 border-purple-500/30 font-tech text-[10px] uppercase tracking-widest"
                >
                  {keyword}
                </Badge>
              ))}
            </div>
          </div>
        </section>

        {/* Technical Requirements & Timeline Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Technical Requirements */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center border border-blue-500/30">
                <Wrench className="h-5 w-5 text-blue-400" />
              </div>
              <h2 className="text-lg font-bold uppercase tracking-wider text-white">Technical Specs</h2>
            </div>
            <div className="space-y-2">
              {brief.technicalRequirements?.map((req, idx) => (
                <div 
                  key={idx}
                  className="flex items-start gap-2 bg-blue-500/5 border border-blue-500/20 rounded-lg p-3"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 shrink-0" />
                  <p className="text-sm text-zinc-300">{req}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Timeline */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500/20 to-green-500/20 flex items-center justify-center border border-emerald-500/30">
                <Clock className="h-5 w-5 text-emerald-400" />
              </div>
              <h2 className="text-lg font-bold uppercase tracking-wider text-white">Timeline</h2>
            </div>
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-3 top-4 bottom-4 w-px bg-emerald-500/30" />
              
              <div className="space-y-3">
                {brief.timeline?.map((phase, idx) => (
                  <div key={idx} className="relative pl-8">
                    <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    </div>
                    <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-3">
                      <h4 className="text-sm font-bold text-emerald-400 uppercase tracking-wider mb-1">
                        {phase.phase}
                      </h4>
                      <p className="text-xs text-zinc-400">{phase.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>

        {/* Action Items */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center border border-green-500/30">
              <CheckCircle2 className="h-5 w-5 text-green-400" />
            </div>
            <h2 className="text-lg font-bold uppercase tracking-wider text-white">Action Items</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {brief.actionItems?.map((action, idx) => (
              <div 
                key={idx}
                className="flex items-start gap-2 bg-green-500/5 border border-green-500/20 rounded-lg p-3"
              >
                <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                <p className="text-sm text-zinc-300">{action}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <div className="pt-6 border-t border-zinc-800">
          <div className="flex items-center justify-between text-[10px] font-tech uppercase tracking-widest text-zinc-600">
            <span>Generated by Soleia Creative AI</span>
            <span>Powered by Perplexity + Lovable AI</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
