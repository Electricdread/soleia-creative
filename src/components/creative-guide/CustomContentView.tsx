import React from 'react';
import { motion } from 'framer-motion';
import { Palette, Calendar, Download, Clock, Sparkles } from 'lucide-react';
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

      {/* ShowBlox Partnership Blurb */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="glass border-primary/30 overflow-hidden group hover:border-primary/50 transition-all duration-500 hover:shadow-[0_0_40px_-10px_hsl(var(--primary)/0.3)]">
          <CardContent className="p-6 sm:p-8">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 shrink-0">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-gradient-gold">Content Creation with ShowBlox</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  ShowBlox develops custom motion graphics and branded content strategically designed for Soleia's multi-zone LED ecosystem. Our creative team ensures visual continuity, optimal resolution matching, and maximum impact across every screen in the venue.
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  From immersive logo reveals to ambient architectural visuals, we craft content that transforms Soleia into a fully branded environment—seamlessly integrating your brand across focal displays and atmospheric zones alike.
                </p>
              </div>
            </div>
          </CardContent>
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
            <Card className="glass border-border/50 h-full group hover:border-primary/40 transition-all duration-500 hover:shadow-[0_0_30px_-10px_hsl(var(--primary)/0.3)]">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                    <Calendar className="w-5 h-5 text-primary" />
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
    </div>
  );
}

export default CustomContentView;
