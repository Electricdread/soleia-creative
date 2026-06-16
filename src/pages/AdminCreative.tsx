import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { CreativeSessionManager } from '@/components/admin/CreativeSessionManager';

import { CollectAssetsEmailCard } from '@/components/admin/CollectAssetsEmailCard';
import { MediaDownloadEmailCard } from '@/components/admin/MediaDownloadEmailCard';
import { ClientAssetCollectEmailCard } from '@/components/admin/ClientAssetCollectEmailCard';
import { CreativeSessionEmailCard } from '@/components/admin/CreativeSessionEmailCard';
import { ProposalEmailCard } from '@/components/admin/ProposalEmailCard';
import { ArrowLeft, Settings } from 'lucide-react';
import soleiaLogo from '@/assets/soleia-wide-logo.png';

export default function AdminCreative() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="relative z-10 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/admin')}
                className="text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div className="h-6 w-px bg-border" />
              <img
                src={soleiaLogo}
                alt="Soleia"
                className="h-8 w-auto object-contain"
              />
            </div>

            <div className="flex items-center gap-3">
              <h1 className="font-display text-lg text-foreground">
                Soleia Creative
              </h1>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/admin')}
                className="text-muted-foreground hover:text-foreground h-8 w-8"
                aria-label="Go to admin portal"
              >
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <CreativeSessionEmailCard />
        <ProposalEmailCard />
        
        <CollectAssetsEmailCard />
        <MediaDownloadEmailCard />
        <ClientAssetCollectEmailCard />
        <div className="bg-card/80 backdrop-blur-sm border border-border rounded-xl overflow-hidden p-6">
          <CreativeSessionManager />
        </div>
      </main>
    </div>
  );
}
