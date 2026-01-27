import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export function IntroductionView() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-semibold text-gradient-gold">Welcome to Soleia</h2>
        <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
          Your comprehensive guide to creative opportunities at Soleia Las Vegas.
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
    </div>
  );
}

export default IntroductionView;
