import React from 'react';
import { motion } from 'framer-motion';
import { Palette, Calendar, Download, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CUSTOM_CONTENT_INFO, GUIDE_IMAGES } from '@/lib/creativeGuide';

export function CustomContentView() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-semibold text-gradient-gold">Custom Content Creation</h2>
        <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
          {CUSTOM_CONTENT_INFO.description}
        </p>
      </div>

      {/* Main Image */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="glass border-border/50 overflow-hidden">
          <div className="relative">
            <img 
              src={GUIDE_IMAGES.customContent} 
              alt="Custom Content Creation"
              className="w-full h-auto"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/20 to-transparent pointer-events-none" />
            <div className="absolute bottom-4 left-4 right-4">
              <Badge className="bg-primary/90 text-primary-foreground">
                <Palette className="w-3 h-3 mr-1" />
                Pixelmap Control
              </Badge>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Timeline Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {CUSTOM_CONTENT_INFO.timeline.map((item, index) => (
          <motion.div
            key={item.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="glass border-border/50 h-full">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-500/10">
                    <Calendar className="w-5 h-5 text-amber-500" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{item.title}</CardTitle>
                    <div className="flex items-center gap-1.5 mt-1">
                      <Clock className="w-3 h-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {item.days} Business Days Prior
                      </span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Note */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="glass border-primary/30 bg-primary/5">
          <CardContent className="p-4 sm:p-6">
            <p className="text-sm text-muted-foreground italic text-center">
              "{CUSTOM_CONTENT_INFO.note}"
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Download CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-center"
      >
        <Button 
          size="lg" 
          className="gap-2 bg-gradient-to-r from-primary to-accent hover:opacity-90"
          asChild
        >
          <a href="/creative-guide/After_Effects_Template.zip" download>
            <Download className="w-5 h-5" />
            {CUSTOM_CONTENT_INFO.downloadLabel}
          </a>
        </Button>
        <p className="text-xs text-muted-foreground mt-2">
          Download the After Effects template and pixelmap specifications
        </p>
      </motion.div>

      {/* Technical Requirements Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="glass border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">Technical Requirements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-muted/30 border border-border/50 text-center">
                <p className="text-2xl font-bold text-primary">3840×2160</p>
                <p className="text-xs text-muted-foreground mt-1">Master Resolution</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/30 border border-border/50 text-center">
                <p className="text-2xl font-bold text-primary">DXV3</p>
                <p className="text-xs text-muted-foreground mt-1">Preferred Codec</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/30 border border-border/50 text-center">
                <p className="text-2xl font-bold text-primary">60 FPS</p>
                <p className="text-xs text-muted-foreground mt-1">Frame Rate</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground text-center mt-4">
              For optimal playback on our Resolume Media Server. Visit{' '}
              <a 
                href="https://resolume.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                resolume.com
              </a>
              {' '}for codec details.
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

export default CustomContentView;
