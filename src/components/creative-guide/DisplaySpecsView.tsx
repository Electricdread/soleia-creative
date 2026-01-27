import React from 'react';
import { motion } from 'framer-motion';
import { FileText, Tv, Monitor, Layers } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DISPLAY_TYPES, type DisplayType } from '@/lib/creativeGuide';

interface DisplaySpecsViewProps {
  onSelectDisplay?: (displayId: string) => void;
}

const categoryIcons: Record<string, React.ReactNode> = {
  'tv': <Tv className="w-5 h-5" />,
  'elevator': <Layers className="w-5 h-5" />,
  'led': <Monitor className="w-5 h-5" />,
  'ticker': <FileText className="w-5 h-5" />,
};

const categoryColors: Record<string, string> = {
  'tv': 'bg-primary/20 text-primary border-primary/30',
  'elevator': 'bg-accent/20 text-accent border-accent/30',
  'led': 'bg-primary/25 text-primary border-primary/40',
  'ticker': 'bg-success/20 text-success border-success/30',
};

function SpecRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-start py-2 border-b border-border/30 last:border-0">
      <span className="text-xs text-muted-foreground font-medium">{label}</span>
      <span className="text-sm text-foreground text-right font-mono">{value}</span>
    </div>
  );
}

function DisplayCard({ display }: { display: DisplayType }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="h-full"
    >
      <Card className="h-full glass border-border/50 overflow-hidden">
        {/* Image */}
        <div className="relative aspect-video overflow-hidden">
          <img 
            src={display.image} 
            alt={display.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent" />
          <Badge 
            className={`absolute top-3 left-3 ${categoryColors[display.category]} text-xs`}
          >
            {categoryIcons[display.category]}
            <span className="ml-1.5 capitalize">{display.category}</span>
          </Badge>
        </div>

        <CardHeader className="pb-2">
          <CardTitle className="text-lg">{display.name}</CardTitle>
          <p className="text-sm text-muted-foreground">{display.description}</p>
        </CardHeader>

        <CardContent className="space-y-4">
          <Tabs defaultValue="video" className="w-full">
            <TabsList className="w-full grid grid-cols-2 h-9">
              <TabsTrigger value="video" className="text-xs">Video Specs</TabsTrigger>
              <TabsTrigger value="graphic" className="text-xs">Graphic Specs</TabsTrigger>
            </TabsList>
            
            <TabsContent value="video" className="mt-3 space-y-1">
              <SpecRow label="Resolution" value={display.videoSpecs.resolution} />
              <SpecRow label="Format" value={display.videoSpecs.format} />
              {display.videoSpecs.codec && (
                <SpecRow label="Codec" value={display.videoSpecs.codec} />
              )}
              {display.videoSpecs.frameRate && (
                <SpecRow label="Frame Rate" value={display.videoSpecs.frameRate} />
              )}
              {display.videoSpecs.duration && (
                <SpecRow label="Duration" value={display.videoSpecs.duration} />
              )}
              {display.videoSpecs.fileSize && (
                <SpecRow label="Max File Size" value={display.videoSpecs.fileSize} />
              )}
            </TabsContent>

            <TabsContent value="graphic" className="mt-3 space-y-1">
              <SpecRow label="Resolution" value={display.graphicSpecs.resolution} />
              <SpecRow label="Format" value={display.graphicSpecs.format} />
            </TabsContent>
          </Tabs>

          {/* Deliverables */}
          {display.deliverables && display.deliverables.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-border/30">
              <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                Total Deliverables: {display.deliverables.length} Files
              </p>
              <ul className="text-xs text-muted-foreground space-y-1">
                {display.deliverables.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-primary mt-0.5">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Creative Notes */}
          {display.creativeNotes && display.creativeNotes.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-border/30">
              <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                Creative Notes
              </p>
              <ul className="text-xs text-muted-foreground space-y-1.5">
                {display.creativeNotes.map((note, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-amber-500 mt-0.5">⚡</span>
                    <span>{note}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Dimensions */}
          {display.dimensions && display.dimensions.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-border/30">
              <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                Screen Dimensions
              </p>
              <div className="flex flex-wrap gap-1.5">
                {display.dimensions.map((dim, idx) => (
                  <Badge key={idx} variant="secondary" className="text-[10px] font-mono">
                    {dim.label}: {dim.width}×{dim.height}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function DisplaySpecsView({ onSelectDisplay }: DisplaySpecsViewProps) {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-semibold text-gradient-gold">Display Specifications</h2>
        <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
          Technical requirements for all display types at Soleia. Use these specifications when preparing your branded content.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {DISPLAY_TYPES.map((display, index) => (
          <motion.div
            key={display.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <DisplayCard display={display} />
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export default DisplaySpecsView;
