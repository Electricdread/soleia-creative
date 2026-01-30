import { useState } from 'react';
import { ExternalLink, Download, Loader2, Heart, Images, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Workspace {
  id: string;
  name: string;
  url: string;
  loginUrl: string;
  icon: string;
  color: string;
  canSync: boolean;
}

interface SyncedImage {
  id: string;
  url: string;
  thumbnail: string;
  title: string;
  source: string;
}

const workspaces: Workspace[] = [
  {
    id: 'midjourney',
    name: 'MidJourney',
    url: 'https://www.midjourney.com/explore',
    loginUrl: 'https://www.midjourney.com/auth/signin',
    icon: '🎨',
    color: 'purple',
    canSync: true,
  },
  {
    id: 'openart',
    name: 'OpenArt.ai',
    url: 'https://openart.ai/home',
    loginUrl: 'https://openart.ai/auth/login',
    icon: '✨',
    color: 'pink',
    canSync: true,
  },
  {
    id: 'chatgpt',
    name: 'ChatGPT',
    url: 'https://chat.openai.com/',
    loginUrl: 'https://chat.openai.com/auth/login',
    icon: '🤖',
    color: 'emerald',
    canSync: false,
  },
  {
    id: 'perplexity',
    name: 'Perplexity',
    url: 'https://www.perplexity.ai/',
    loginUrl: 'https://www.perplexity.ai/',
    icon: '🔮',
    color: 'cyan',
    canSync: false,
  },
];

export function EmbeddedWorkspaces() {
  const { toast } = useToast();
  const [activeWorkspace, setActiveWorkspace] = useState('midjourney');
  const [isSyncing, setIsSyncing] = useState<string | null>(null);
  const [syncedImages, setSyncedImages] = useState<Record<string, SyncedImage[]>>({});
  const [profileUrls, setProfileUrls] = useState<Record<string, string>>({
    midjourney: '',
    openart: '',
  });

  const openInNewTab = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleProfileUrlChange = (workspaceId: string, url: string) => {
    setProfileUrls(prev => ({ ...prev, [workspaceId]: url }));
  };

  const syncLikedContent = async (workspace: Workspace) => {
    const profileUrl = profileUrls[workspace.id];
    
    if (!profileUrl) {
      toast({
        title: "Profile URL Required",
        description: `Please enter your ${workspace.name} profile or gallery URL after logging in.`,
        variant: "destructive",
      });
      return;
    }

    setIsSyncing(workspace.id);
    
    try {
      const { data, error } = await supabase.functions.invoke('scrape-creative-gallery', {
        body: { 
          url: profileUrl,
          source: workspace.id,
        },
      });

      if (error) throw error;

      if (data?.success && data?.images) {
        setSyncedImages(prev => ({
          ...prev,
          [workspace.id]: data.images,
        }));
        
        toast({
          title: "Sync Complete",
          description: `Found ${data.images.length} images from ${workspace.name}`,
        });
      } else {
        throw new Error(data?.error || 'Failed to sync content');
      }
    } catch (error) {
      console.error('Sync error:', error);
      toast({
        title: "Sync Failed",
        description: error instanceof Error ? error.message : "Could not sync content",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(null);
    }
  };

  const currentWorkspace = workspaces.find(w => w.id === activeWorkspace);
  const currentImages = syncedImages[activeWorkspace] || [];

  return (
    <div className="bg-zinc-900/80 border border-zinc-800 rounded-lg overflow-hidden">
      {/* Workspace Tabs */}
      <div className="px-3 py-2 border-b border-zinc-800 flex items-center gap-2 bg-zinc-900 overflow-x-auto">
        {workspaces.map((workspace) => (
          <button
            key={workspace.id}
            onClick={() => setActiveWorkspace(workspace.id)}
            className={`px-3 py-1.5 text-xs font-tech rounded-lg transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeWorkspace === workspace.id
                ? `bg-${workspace.color}-500/20 text-${workspace.color}-400 border border-${workspace.color}-500/30`
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
          >
            <span>{workspace.icon}</span>
            <span className="hidden sm:inline">{workspace.name}</span>
            {workspace.canSync && (
              <Heart className="w-3 h-3 opacity-50" />
            )}
          </button>
        ))}
      </div>

      {/* Workspace Content */}
      <div className="p-4 space-y-4">
        {currentWorkspace && (
          <>
            {/* Quick Actions Bar */}
            <div className="flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => openInNewTab(currentWorkspace.loginUrl)}
                className="text-xs border-zinc-700 hover:bg-zinc-800"
              >
                <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                Login to {currentWorkspace.name}
              </Button>
              
              <Button
                size="sm"
                variant="outline"
                onClick={() => openInNewTab(currentWorkspace.url)}
                className="text-xs border-zinc-700 hover:bg-zinc-800"
              >
                <Images className="w-3.5 h-3.5 mr-1.5" />
                Browse Gallery
              </Button>
            </div>

            {/* Sync Section for supported workspaces */}
            {currentWorkspace.canSync && (
              <Card className="p-3 bg-zinc-800/50 border-zinc-700">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <Heart className="w-4 h-4 text-pink-400" />
                    <span className="text-xs font-tech text-zinc-300 uppercase tracking-wider">
                      Sync Liked Content
                    </span>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="url"
                      placeholder={`Enter your ${currentWorkspace.name} profile/gallery URL...`}
                      value={profileUrls[currentWorkspace.id] || ''}
                      onChange={(e) => handleProfileUrlChange(currentWorkspace.id, e.target.value)}
                      className="flex-1 px-3 py-2 text-xs bg-zinc-900 border border-zinc-700 rounded-lg text-white placeholder:text-zinc-500 focus:outline-none focus:border-purple-500/50"
                    />
                    <Button
                      size="sm"
                      onClick={() => syncLikedContent(currentWorkspace)}
                      disabled={isSyncing === currentWorkspace.id}
                      className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-xs"
                    >
                      {isSyncing === currentWorkspace.id ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                          Syncing...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                          Sync Likes
                        </>
                      )}
                    </Button>
                  </div>
                  
                  <p className="text-[10px] text-zinc-500">
                    {currentWorkspace.id === 'midjourney' 
                      ? 'Enter your Midjourney explore page URL (e.g., https://www.midjourney.com/explore?tab=top)'
                      : 'Enter your OpenArt profile or collection URL'
                    }
                  </p>
                </div>
              </Card>
            )}

            {/* Synced Images Grid */}
            {currentImages.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-tech text-zinc-400 uppercase tracking-wider">
                    Synced Content ({currentImages.length})
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-xs text-zinc-400 hover:text-white"
                    onClick={() => syncLikedContent(currentWorkspace)}
                    disabled={isSyncing !== null}
                  >
                    <RefreshCw className="w-3 h-3 mr-1" />
                    Refresh
                  </Button>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {currentImages.map((img) => (
                    <div
                      key={img.id}
                      className="relative aspect-square rounded-lg overflow-hidden bg-zinc-800 group cursor-pointer"
                      onClick={() => openInNewTab(img.url)}
                    >
                      <img
                        src={img.thumbnail}
                        alt={img.title}
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="absolute bottom-0 left-0 right-0 p-2">
                          <p className="text-[10px] text-white truncate">{img.title}</p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 bg-black/50 hover:bg-black/70"
                        onClick={(e) => {
                          e.stopPropagation();
                          openInNewTab(img.url);
                        }}
                      >
                        <Download className="w-3 h-3 text-white" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {currentWorkspace.canSync && currentImages.length === 0 && (
              <div className="text-center py-8 text-zinc-500">
                <Images className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-xs font-tech">No synced content yet</p>
                <p className="text-[10px] mt-1">Login to {currentWorkspace.name} and enter your gallery URL to sync</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
