import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  ExternalLink, 
  FileVideo, 
  Clock,
  Sparkles,
  ArrowLeft,
  Printer,
  Loader2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import tailgateLogo from '@/assets/tailgate-logo.png';
import { toast } from 'sonner';

const RESOLUME_URL = 'https://www.resolume.com';
const RESOLUME_ALLEY_URL = 'https://resolume.com/software/alley';

const displaySpecs = [
  { label: 'TV Displays', resolution: '1920x1080' },
  { label: 'Display 1 LED Screen', resolution: '5760x1000' },
  { label: 'Display 2A LED Screen', resolution: '1920x1056' },
  { label: 'Display 2 LED Screen', resolution: '1920x1056' },
];

const workflowSteps = [
  { step: 1, title: 'Export Source Video', description: 'Export in ProRes or high-quality H264' },
  { step: 2, title: 'Open Resolume Alley', description: 'Free encoder for DXV3 conversion' },
  { step: 3, title: 'Encode to DXV3', description: 'Select DXV3 codec and export' },
  { step: 4, title: 'Submit Content', description: '21 days before your event' },
];

const TailgateDeliveryGuide = () => {
  const navigate = useNavigate();
  const [isDownloading, setIsDownloading] = useState(false);

  const handlePrintPdf = async () => {
    setIsDownloading(true);
    try {
      const { downloadTailgateDeliveryGuidePdf } = await import('@/lib/tailgateDeliveryGuidePdf');
      await downloadTailgateDeliveryGuidePdf();
      toast.success('PDF downloaded - open the file and print');
    } catch (error) {
      console.error('PDF print error:', error);
      toast.error('Failed to generate PDF');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-sky-50/30 to-white">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-200/50 shadow-sm">
        <div className="container mx-auto px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/')}
              className="gap-2 text-slate-700 hover:bg-slate-100/50"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back</span>
            </Button>

            <div className="flex items-center gap-3">
              <img src={tailgateLogo} alt="Tailgate Beach Club" className="h-10 sm:h-12 object-contain" />
              <div className="hidden sm:block">
                <h1 className="text-lg font-semibold text-slate-800">
                  Content Delivery Guide
                </h1>
                <p className="text-xs text-slate-500">DXV3 Format Specifications</p>
              </div>
            </div>

            <Button 
              size="sm"
              onClick={handlePrintPdf}
              disabled={isDownloading}
              className="gap-2 bg-[#2b4c6f] hover:bg-[#1e3a56] text-white shadow-lg"
            >
              {isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4" />}
              <span className="hidden sm:inline">Print PDF</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative py-12 sm:py-16 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-sky-200/40 via-transparent to-transparent" />
        <div className="container mx-auto px-4 relative">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-3xl mx-auto space-y-4">
            <Badge className="bg-sky-100 text-sky-800 border-sky-300">
              <Sparkles className="w-3 h-3 mr-1" />
              Ready-Made Content Delivery
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#2b4c6f]">
              Delivering Your Content
            </h2>
            <p className="text-slate-600 text-lg">
              Our venue uses Resolume media servers. Follow this guide to ensure your content displays flawlessly.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <main className="container mx-auto px-4 pb-16 space-y-10">
        
        {/* Resolume Download */}
        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="overflow-hidden border-slate-200 bg-white/80 backdrop-blur-sm shadow-xl shadow-sky-500/10">
            <CardContent className="p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="p-4 rounded-2xl bg-gradient-to-br from-sky-100 to-slate-100 shrink-0">
                  <FileVideo className="w-10 h-10 text-[#2b4c6f]" />
                </div>
                <div className="flex-1 text-center sm:text-left">
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">DXV3 Codec Required</h3>
                  <p className="text-slate-600 mb-4">Download the free Resolume Alley encoder to convert your videos to DXV3 format.</p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center sm:justify-start">
                    <Button size="lg" onClick={() => window.open(RESOLUME_ALLEY_URL, '_blank')} className="gap-2 bg-[#2b4c6f] hover:bg-[#1e3a56] text-white shadow-lg">
                      <ExternalLink className="w-4 h-4" />
                      Get Resolume Alley (Free)
                    </Button>
                    <Button variant="outline" size="lg" onClick={() => window.open(RESOLUME_URL, '_blank')} className="gap-2 border-slate-300 text-slate-700 hover:bg-slate-50">
                      <ExternalLink className="w-4 h-4" />
                      Resolume.com
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.section>

        {/* Encoding Workflow */}
        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="space-y-6">
          <div className="text-center">
            <h3 className="text-2xl font-semibold text-[#2b4c6f]">Encoding Workflow</h3>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {workflowSteps.map((item, index) => (
              <motion.div key={item.step} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + index * 0.1 }}>
                <Card className="h-full border-slate-200 bg-white/80 hover:shadow-lg transition-all">
                  <CardContent className="p-5 space-y-3">
                    <div className="w-10 h-10 rounded-full bg-[#2b4c6f] flex items-center justify-center text-white font-bold shadow-lg">
                      {item.step}
                    </div>
                    <h4 className="font-semibold text-slate-900">{item.title}</h4>
                    <p className="text-sm text-slate-600">{item.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Submission Timeline */}
        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card className="border-slate-200 bg-gradient-to-br from-sky-50 to-slate-50 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl text-slate-900">
                <Clock className="w-6 h-6 text-[#2b4c6f]" />
                Submission Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4 p-4 rounded-xl bg-white/70 border border-sky-200">
                <div className="text-4xl font-bold text-[#2b4c6f]">21</div>
                <div>
                  <p className="font-semibold text-slate-900">Business Days Minimum</p>
                  <p className="text-sm text-slate-600">Submit your content at least 21 business days before your event for testing and approval.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.section>
      </main>
      
      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src={tailgateLogo} alt="Tailgate Beach Club" className="h-8 object-contain opacity-70" />
            <span className="text-sm text-slate-500">Content Delivery Specifications</span>
          </div>
          <a href={RESOLUME_URL} target="_blank" rel="noopener noreferrer" className="text-sm text-slate-600 hover:text-slate-800 font-medium flex items-center gap-1">
            <ExternalLink className="w-3.5 h-3.5" />
            resolume.com
          </a>
        </div>
      </footer>
    </div>
  );
};

export default TailgateDeliveryGuide;
