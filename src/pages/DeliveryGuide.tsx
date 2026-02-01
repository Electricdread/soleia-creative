import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Download, 
  ExternalLink, 
  FileVideo, 
  Clock,
  Sparkles,
  CheckCircle2,
  ArrowLeft,
  FileText,
  Loader2,
  Film,
  Zap,
  Settings
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import soleiaLogo from '@/assets/soleia-logo-new.png';
import solIcon from '@/assets/sol-icon.png';
import { PoweredByShowBlox } from '@/components/PoweredByShowBlox';
import { downloadDeliveryGuidePdf } from '@/lib/deliveryGuidePdf';
import { toast } from 'sonner';

const RESOLUME_URL = 'https://www.resolume.com';
const RESOLUME_ALLEY_URL = 'https://resolume.com/software/alley';

const workflowSteps = [
  {
    step: 1,
    title: 'Export Source Video',
    description: 'Export in ProRes 422 or high-quality H264 from your editing software',
    icon: Film,
  },
  {
    step: 2,
    title: 'Open Resolume Alley',
    description: 'Download the free encoder from resolume.com/software/alley',
    icon: Download,
  },
  {
    step: 3,
    title: 'Encode to DXV3',
    description: 'Select DXV3 codec and export your content',
    icon: Settings,
  },
  {
    step: 4,
    title: 'Submit Content',
    description: 'Send your encoded files to us for review',
    icon: Zap,
  },
];

const proTips = [
  { title: 'Export in ProRes first', desc: 'For best quality before encoding to DXV3.' },
  { title: 'Avoid bright backgrounds', desc: 'LED screens are very bright—use darker tones for better contrast.' },
  { title: 'Use light logos', desc: 'White or light logo versions display best on venue screens.' },
  { title: 'Include alpha channel', desc: 'Use DXV3 Alpha for transparent overlays on LED displays.' },
  { title: 'Test your content', desc: 'Preview your video at full resolution before submitting.' },
  { title: 'Keep file sizes reasonable', desc: 'Large files take longer to process and test.' },
];

const DeliveryGuide = () => {
  const navigate = useNavigate();
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownloadPdf = async () => {
    setIsDownloading(true);
    try {
      const livePageUrl = `${window.location.origin}/delivery-guide`;
      await downloadDeliveryGuidePdf(livePageUrl);
      toast.success('PDF downloaded successfully');
    } catch (error) {
      console.error('PDF download error:', error);
      toast.error('Failed to download PDF');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-orange-50/30 to-white">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-amber-200/50 shadow-sm">
        <div className="container mx-auto px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            {/* Back button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/')}
              className="gap-2 text-amber-900 hover:bg-amber-100/50"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back to Looks</span>
            </Button>

            {/* Logo */}
            <div className="flex items-center gap-3">
              <img 
                src={soleiaLogo} 
                alt="Soleia" 
                className="h-8 sm:h-10 object-contain"
              />
              <div className="hidden sm:block">
                <h1 className="text-lg font-display font-semibold bg-gradient-to-r from-amber-700 via-orange-600 to-amber-700 bg-clip-text text-transparent">
                  Content Preparation Guide
                </h1>
                <p className="text-xs text-amber-800/60">DXV3 Encoding for Resolume</p>
              </div>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-2">
              <Button 
                size="sm"
                variant="outline"
                onClick={handleDownloadPdf}
                disabled={isDownloading}
                className="gap-2 border-amber-300 text-amber-800 hover:bg-amber-50"
              >
                {isDownloading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <FileText className="w-4 h-4" />
                )}
                <span>PDF</span>
              </Button>
              <Button 
                size="sm"
                onClick={() => window.open(RESOLUME_ALLEY_URL, '_blank')}
                className="gap-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white shadow-lg shadow-amber-600/25"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Get Encoder</span>
              </Button>
              <PoweredByShowBlox variant="header" />
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-12 sm:py-16 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-200/40 via-transparent to-transparent" />
        <div className="container mx-auto px-4 relative">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-3xl mx-auto space-y-4"
          >
            <div className="flex justify-center mb-4">
              <img src={solIcon} alt="" className="w-16 h-16 object-contain drop-shadow-lg" />
            </div>
            <Badge className="bg-amber-100 text-amber-800 border-amber-300">
              <Sparkles className="w-3 h-3 mr-1" />
              Content Preparation
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-display font-bold bg-gradient-to-r from-amber-700 via-orange-600 to-amber-700 bg-clip-text text-transparent">
              Preparing Your Content
            </h2>
            <p className="text-amber-900/70 text-lg">
              Our venue uses Resolume media servers. Follow this guide to encode your content in the required DXV3 format.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <main className="container mx-auto px-4 pb-16 space-y-10">
        

        {/* Encoding Workflow */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-6"
        >
          <div className="text-center">
            <h3 className="text-2xl font-display font-semibold bg-gradient-to-r from-amber-700 to-orange-600 bg-clip-text text-transparent">
              Encoding Workflow
            </h3>
            <p className="text-amber-900/60 mt-1">Follow these steps to prepare your content</p>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {workflowSteps.map((item, index) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + index * 0.1 }}
              >
                <Card className="h-full border-amber-200 bg-white/80 backdrop-blur-sm hover:shadow-lg hover:shadow-amber-500/10 transition-all">
                  <CardContent className="p-5 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white font-bold shadow-lg shadow-amber-500/30">
                        {item.step}
                      </div>
                      <item.icon className="w-5 h-5 text-amber-600" />
                    </div>
                    <h4 className="font-semibold text-amber-950">{item.title}</h4>
                    <p className="text-sm text-amber-900/70">{item.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.section>

        <Separator className="bg-amber-200" />


        {/* Pro Tips */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-4"
        >
          <h3 className="text-xl font-display font-semibold text-amber-950">Pro Tips</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {proTips.map((tip, idx) => (
              <Card key={idx} className="border-amber-200 bg-white/80">
                <CardContent className="p-4 flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium text-amber-950">{tip.title}</p>
                    <p className="text-sm text-amber-900/70">{tip.desc}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.section>
      </main>
      
      {/* Footer */}
      <footer className="border-t border-amber-200 bg-white/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src={soleiaLogo} alt="Soleia" className="h-6 object-contain opacity-70" />
            <span className="text-sm text-amber-800/60">Content Preparation Guide</span>
          </div>
          <a 
            href={RESOLUME_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-amber-700 hover:text-amber-800 font-medium flex items-center gap-1"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            resolume.com
          </a>
        </div>
      </footer>
    </div>
  );
};

export default DeliveryGuide;
