import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, ExternalLink } from 'lucide-react';

interface DropboxUploadCardProps {
  settingsKey: string;
  variant?: 'amber' | 'slate';
}

export function DropboxUploadCard({ settingsKey, variant = 'amber' }: DropboxUploadCardProps) {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('site_settings')
      .select('value')
      .eq('key', settingsKey)
      .maybeSingle()
      .then(({ data }) => {
        setUrl(data?.value || null);
        setLoading(false);
      });
  }, [settingsKey]);

  if (loading || !url) return null;

  const isAmber = variant === 'amber';

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35 }}
    >
      <Card className={`overflow-hidden shadow-xl ${
        isAmber
          ? 'border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 shadow-amber-500/10'
          : 'border-slate-200 bg-gradient-to-br from-sky-50 to-slate-50 shadow-sky-500/10'
      }`}>
        <CardContent className="p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className={`p-4 rounded-2xl shrink-0 ${
              isAmber
                ? 'bg-gradient-to-br from-amber-100 to-orange-100'
                : 'bg-gradient-to-br from-sky-100 to-slate-100'
            }`}>
              <Upload className={`w-10 h-10 ${isAmber ? 'text-amber-700' : 'text-[#2b4c6f]'}`} />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h3 className={`text-xl font-semibold mb-2 ${
                isAmber ? 'font-display text-amber-950' : 'text-slate-900'
              }`}>
                Submit Your Assets
              </h3>
              <p className={`mb-4 ${isAmber ? 'text-amber-900/70' : 'text-slate-600'}`}>
                Upload your company logos, brand assets, and content files directly through our secure file request portal.
              </p>
              <Button
                size="lg"
                onClick={() => window.open(url, '_blank')}
                className={`gap-2 shadow-lg ${
                  isAmber
                    ? 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white shadow-amber-600/25'
                    : 'bg-[#2b4c6f] hover:bg-[#1e3a56] text-white'
                }`}
              >
                <ExternalLink className="w-4 h-4" />
                Upload Files
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.section>
  );
}
