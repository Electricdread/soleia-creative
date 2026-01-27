import React from 'react';
import { motion } from 'framer-motion';
import { DollarSign, FileText, CheckCircle, PhoneCall, AlertCircle, Sparkles, Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

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

export function IntroductionView() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-semibold text-gradient-gold">Welcome to Soleia</h2>
        <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
          Your comprehensive guide to content development, pricing, and creative opportunities at Soleia Las Vegas.
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
        transition={{ delay: 0.2 }}
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
        transition={{ delay: 0.25 }}
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
                  transition={{ delay: 0.3 + index * 0.03 }}
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

      {/* What's Next? */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
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

      {/* Download CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="text-center"
      >
        <Button 
          size="lg" 
          className="gap-2 bg-gradient-to-r from-primary to-accent hover:opacity-90"
          asChild
        >
          <a href="/creative-guide/After_Effects_Template.zip" download>
            <Download className="w-5 h-5" />
            Pixelmap Specs and After Effects Template
          </a>
        </Button>
        <p className="text-xs text-muted-foreground mt-2">
          Download the After Effects template and pixelmap specifications
        </p>
      </motion.div>
    </div>
  );
}

export default IntroductionView;
