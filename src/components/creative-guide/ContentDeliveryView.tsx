import { motion } from 'framer-motion';
import { ExternalLink, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import solIcon from '@/assets/sol-icon.png';

export const ContentDeliveryView = () => {
  return (
    <div className="space-y-10 max-w-3xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-4"
      >
        <div className="flex justify-center mb-4">
          <img src={solIcon} alt="" className="w-16 h-16 object-contain drop-shadow-lg" />
        </div>
        <h2 className="text-3xl sm:text-4xl font-display font-bold text-gradient-gold">
          Content Delivery Guide
        </h2>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          The Soleia Content Delivery Guide provides clients with technical specifications, encoding workflows, and asset submission instructions.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <Card className="glass border-primary/20">
          <CardContent className="p-8 text-center space-y-6">
            <div className="p-4 rounded-2xl bg-primary/10 inline-flex">
              <Send className="w-10 h-10 text-primary" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-display font-semibold text-foreground">
                Open the Delivery Guide
              </h3>
              <p className="text-muted-foreground">
                View the full delivery guide page with DXV3 encoding instructions, display specifications, and the client asset upload portal.
              </p>
            </div>
            <Button
              size="lg"
              onClick={() => window.open('/delivery-guide', '_blank')}
              className="gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              Open Delivery Guide
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};
