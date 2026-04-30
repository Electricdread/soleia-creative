import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ExternalLink,
  FileVideo,
  Clock,
  Sparkles,
  ArrowLeft,
  Upload,
  Loader2,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import SoleiaLogo from '@/components/SoleiaLogo';
import { HomeButton } from '@/components/HomeButton';

const RESOLUME_URL = 'https://www.resolume.com';
const RESOLUME_ALLEY_URL = 'https://resolume.com/software/alley';

const workflowSteps = [
  { step: 1, title: 'Prepare Your Video', description: 'Export your final video from After Effects, Premiere, or your editing tool in ProRes 422 or high-quality H.264.' },
  { step: 2, title: 'Download Resolume Alley (Free)', description: 'Our venue runs on Resolume media servers, which require DXV3-encoded files. Download the free encoder.' },
  { step: 3, title: 'Encode to DXV3', description: 'Open your video in Resolume Alley and encode using the DXV3 codec. For content with transparency, select "DXV3 Alpha."' },
  { step: 4, title: 'Check Specs', description: 'TV Displays — 1920×1080 or 3840×2160 | MOV | DXV3 | Max 8GB. LED Pixel Map — 3840×2160 | MOV w/ Alpha | DXV3 | 60fps | Max 30GB.' },
  { step: 5, title: 'Submit Content', description: 'Submit your encoded files at least 21 business days before your event so we can test and approve playback.' },
];

export default function SessionDeliveryGuide() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!token) return;
    supabase
      .from('creative_sessions')
      .select('*')
      .eq('token', token)
      .eq('is_active', true)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error || !data) {
          setNotFound(true);
        } else {
          setSession(data);
        }
        setLoading(false);
      });
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <h1 className="text-2xl font-bold text-foreground">Delivery Guide Not Found</h1>
        <p className="text-muted-foreground">This link may have expired or been deactivated.</p>
        <Button variant="outline" onClick={() => navigate('/')}>Go Home</Button>
      </div>
    );
  }

  const dropboxUrl = session?.dropbox_url;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/50 shadow-sm">
        <div className="container mx-auto px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <HomeButton />
              <SoleiaLogo className="h-8 sm:h-10" />
            </div>
            <div className="text-right">
              <h1 className="text-sm font-semibold text-foreground">Content Delivery Guide</h1>
              <p className="text-xs text-muted-foreground">{session.client_name} • {session.project_name}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative py-12 sm:py-16 overflow-hidden">
        <div className="container mx-auto px-4 relative">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-3xl mx-auto space-y-4">
            <Badge variant="outline" className="border-primary/30 text-primary">
              <Sparkles className="w-3 h-3 mr-1" />
              Content Delivery
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-gradient-gold">
              Delivering Your Content
            </h2>
            <p className="text-muted-foreground text-lg">
              We are providing you with an After Effects project file prepared specifically for our LED video configuration mapping. Follow this guide to ensure your content displays flawlessly.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <main className="container mx-auto px-4 pb-16 space-y-10 max-w-5xl">

        {/* Step-by-Step Workflow */}
        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="space-y-6">
          <div className="text-center">
            <h3 className="text-2xl font-display font-semibold text-gradient-gold">Step-by-Step Workflow</h3>
          </div>
          <Card className="glass border-primary/20">
            <CardContent className="p-6 sm:p-8 space-y-0 divide-y divide-border/40">
              {workflowSteps.map((item) => (
                <div key={item.step} className="flex items-start gap-4 py-4 first:pt-0 last:pb-0">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground font-bold text-sm shrink-0 shadow-lg">
                    {item.step}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-foreground">{item.title}</h4>
                    <p className="text-sm text-muted-foreground mt-0.5">{item.description}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.section>

        {/* Resolume Download */}
        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="overflow-hidden border-primary/20 glass">
            <CardContent className="p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="p-4 rounded-2xl bg-primary/10 shrink-0">
                  <FileVideo className="w-10 h-10 text-primary" />
                </div>
                <div className="flex-1 text-center sm:text-left">
                  <h3 className="text-xl font-display font-semibold text-foreground mb-2">DXV3 Codec Required</h3>
                  <p className="text-muted-foreground mb-4">Download the free Resolume Alley encoder to convert your videos to DXV3 format for optimal playback.</p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center sm:justify-start">
                    <Button size="lg" onClick={() => window.open(RESOLUME_ALLEY_URL, '_blank')} className="gap-2">
                      <ExternalLink className="w-4 h-4" />
                      Get Resolume Alley (Free)
                    </Button>
                    <Button variant="outline" size="lg" onClick={() => window.open(RESOLUME_URL, '_blank')} className="gap-2">
                      <ExternalLink className="w-4 h-4" />
                      Resolume.com
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.section>

        <Separator />

        {/* Submit Assets */}
        {dropboxUrl && (
          <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card className="overflow-hidden border-primary/20 glass shadow-xl">
              <CardContent className="p-6 sm:p-8">
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  <div className="p-4 rounded-2xl bg-primary/10 shrink-0">
                    <Upload className="w-10 h-10 text-primary" />
                  </div>
                  <div className="flex-1 text-center sm:text-left">
                    <h3 className="text-xl font-display font-semibold text-foreground mb-2">Submit Your Assets</h3>
                    <p className="text-muted-foreground mb-4">
                      Upload your company logos, brand assets, and content files directly through our secure file request portal.
                    </p>
                    <Button
                      size="lg"
                      onClick={() => window.open(dropboxUrl, '_blank')}
                      className="gap-2 shadow-lg"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Upload Files
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.section>
        )}

        {/* Submission Timeline */}
        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card className="glass border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl text-foreground">
                <Clock className="w-6 h-6 text-primary" />
                Submission Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4 p-4 rounded-xl bg-primary/5 border border-primary/20">
                <div className="text-4xl font-display font-bold text-primary">21</div>
                <div>
                  <p className="font-semibold text-foreground">Business Days Minimum</p>
                  <p className="text-sm text-muted-foreground">
                    Submit your content at least 21 business days before your event for testing and approval.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-background/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <SoleiaLogo className="h-6 opacity-70" />
            <span className="text-sm text-muted-foreground">Content Delivery Specifications</span>
          </div>
          <a href={RESOLUME_URL} target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-foreground font-medium flex items-center gap-1">
            <ExternalLink className="w-3.5 h-3.5" />
            resolume.com
          </a>
        </div>
      </footer>
    </div>
  );
}
