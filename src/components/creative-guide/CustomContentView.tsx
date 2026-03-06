import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, Download, Clock, Monitor, Sparkles, DollarSign, FileText, CheckCircle, PhoneCall, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CUSTOM_CONTENT_INFO } from '@/lib/creativeGuide';

const PRICING_ITEMS = [
  {
    title: 'Logo Animation / Preparation',
    description: 'Animations preparing logos for pixel-mapped LED screens.',
    price: '$2,000–$6,000+',
  },
  {
    title: 'Themed / Branded Content',
    description: 'Custom background animations aligned with event theme and brand colors.',
    price: '$2,000–$6,000+',
  },
  {
    title: 'Elevator Branding',
    description: 'Main logo delivered in three files, prepared for static or vertical motion.',
    price: '$500–$750+',
  },
  {
    title: 'Individual Signage Feeds',
    description: 'Setup of logo, graphic, or video feed in cabanas or bungalows.',
    price: '$99 per feed',
  },
];

const TERMS = [
  'Any new components outside this scope will require a separate estimate',
  'Assets must be delivered by the stated deadline',
  'Late approvals or deliveries may incur rush fees',
  'Revisions must be submitted in writing before work resumes',
  'Fonts, stock images, and icons are not included and will be billed to the client; usage rights belong to the client',
  'Upon final payment, the client owns rights to rendered design files (source files excluded)',
  'Event footage may be captured for promotional use unless otherwise requested in writing',
  'In the event of cancellation after work has begun, the client is responsible for payment proportional to work completed',
];

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

      {/* Venue Interior Image - Elegant Frame */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
      >
        <Card className="glass border-primary/20 overflow-hidden group hover:border-primary/40 transition-all duration-500 hover:shadow-[0_0_40px_-10px_hsl(var(--primary)/0.3)]">
          <div className="relative">
            {/* Elegant frame with gold accent borders */}
            <div className="absolute inset-0 z-10 pointer-events-none border-4 border-primary/10 dark:border-primary/20" />
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent z-10" />
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent z-10" />
            
            <img 
              src="/creative-guide/custom-content.jpg" 
              alt="Soleia LED Display System"
              className="w-full h-auto transition-transform duration-700 group-hover:scale-[1.02]"
            />
            
            {/* Theme-aware gradient overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/20 to-transparent pointer-events-none dark:from-background/90 dark:via-background/30" />
            <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-transparent to-transparent pointer-events-none dark:from-background/50" />
            
            {/* Corner accents */}
            <div className="absolute top-2 left-2 w-6 h-6 border-t-2 border-l-2 border-primary/40 rounded-tl-sm z-10" />
            <div className="absolute top-2 right-2 w-6 h-6 border-t-2 border-r-2 border-primary/40 rounded-tr-sm z-10" />
            <div className="absolute bottom-2 left-2 w-6 h-6 border-b-2 border-l-2 border-primary/40 rounded-bl-sm z-10" />
            <div className="absolute bottom-2 right-2 w-6 h-6 border-b-2 border-r-2 border-primary/40 rounded-br-sm z-10" />
          </div>
          <CardContent className="p-4 sm:p-6 bg-gradient-to-b from-transparent to-primary/5 dark:to-primary/10">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 shadow-lg shadow-primary/10">
                <Monitor className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-gradient-gold">Immersive LED Environment</h3>
                <p className="text-xs text-muted-foreground">Multi-zone display system ready for your brand</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Soleia's state-of-the-art LED ecosystem features radial Sol Rays, curved architectural displays, 
              and immersive screen walls—all designed to showcase your custom content with maximum visual impact.
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Creative Team Blurb */}
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

      {/* Content Development Pricing */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="glass border-primary/30 overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 shadow-lg shadow-primary/10">
                <DollarSign className="w-5 h-5 text-primary" />
              </div>
              <CardTitle className="text-lg text-gradient-gold">Content Development Pricing</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {PRICING_ITEMS.map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 + index * 0.05 }}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg bg-background/50 border border-border/50 gap-2"
              >
                <div className="flex-1">
                  <h4 className="font-medium text-sm">{item.title}</h4>
                  <p className="text-xs text-muted-foreground">{item.description}</p>
                </div>
                <Badge variant="secondary" className="self-start sm:self-center bg-primary/10 text-primary border-primary/20 whitespace-nowrap">
                  {item.price}
                </Badge>
              </motion.div>
            ))}
          </CardContent>
        </Card>
      </motion.div>

      {/* Asset Deadline */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <Card className="glass border-amber-500/30 bg-amber-500/5">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-start gap-4">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 shrink-0">
                <AlertCircle className="w-5 h-5 text-amber-500" />
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-amber-500 dark:text-amber-400">Asset Deadline</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  To ensure the highest quality creative output, <strong className="text-foreground">all assets must be delivered 21 business days prior to the event.</strong>
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Late delivery of assets or approvals may result in rush fees and may limit revisions or previews.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Terms */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="glass border-border/50">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-muted/50 to-muted/30">
                <FileText className="w-5 h-5 text-muted-foreground" />
              </div>
              <CardTitle className="text-lg">Terms</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {TERMS.map((term, index) => (
                <motion.li
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.25 + index * 0.03 }}
                  className="flex items-start gap-2 text-sm text-muted-foreground"
                >
                  <CheckCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <span>{term}</span>
                </motion.li>
              ))}
            </ul>
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
        transition={{ delay: 0.25 }}
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

      {/* What's Next? */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="glass border-primary/40 bg-gradient-to-br from-primary/5 to-accent/5 overflow-hidden">
          <CardContent className="p-6 sm:p-8 text-center space-y-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 shadow-lg shadow-primary/10 w-fit mx-auto">
              <PhoneCall className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-gradient-gold">What's Next?</h3>
            <p className="text-sm text-muted-foreground max-w-lg mx-auto leading-relaxed">
              We're happy to answer any questions and walk you through the creative opportunities at Soleia. 
              Schedule a creative call at any time, and the ShowBlox team will guide you through the process.
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

export default CustomContentView;
