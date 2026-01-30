import { useState, useEffect } from 'react';
import { ExternalLink, Loader2, Heart, Images, RefreshCw, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { SyncedAlbum } from './SyncedAlbum';

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
  media_type?: 'image' | 'video';
  width?: number;
  height?: number;
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
  const [cachedCounts, setCachedCounts] = useState<Record<string, number>>({});
  const [profileUrls, setProfileUrls] = useState<Record<string, string>>({
    midjourney: '',
    openart: '',
  });
  const [isLoadingCache, setIsLoadingCache] = useState(true);

  // Load cached content on mount
  useEffect(() => {
    loadCachedContent();
  }, []);

  const loadCachedContent = async () => {
    setIsLoadingCache(true);
    try {
      const { data, error } = await supabase
        .from('synced_creative_content')
        .select('*')
        .order('sort_order', { ascending: true, nullsFirst: false })
        .order('synced_at', { ascending: false });

      if (error) throw error;

      // Group by source
      const grouped: Record<string, SyncedImage[]> = {};
      const counts: Record<string, number> = {};
      
      data?.forEach((item) => {
        const img: SyncedImage = {
          id: item.id,
          url: item.url,
          thumbnail: item.thumbnail || item.url,
          title: item.title || 'Untitled',
          source: item.source,
          media_type: item.media_type as 'image' | 'video' || 'image',
          width: item.width || undefined,
          height: item.height || undefined,
        };
        
        if (!grouped[item.source]) {
          grouped[item.source] = [];
          counts[item.source] = 0;
        }
        grouped[item.source].push(img);
        counts[item.source]++;
      });

      setSyncedImages(grouped);
      setCachedCounts(counts);
    } catch (error) {
      console.error('Failed to load cached content:', error);
    } finally {
      setIsLoadingCache(false);
    }
  };

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
        // Cache the images in the database
        const imagesToCache = data.images.map((img: SyncedImage, index: number) => ({
          external_id: img.id,
          source: workspace.id,
          url: img.url,
          thumbnail: img.thumbnail,
          title: img.title,
          media_type: img.url?.includes('.mp4') || img.url?.includes('.webm') ? 'video' : 'image',
          sort_order: index,
          synced_at: new Date().toISOString(),
        }));

        // Upsert to avoid duplicates
        const { error: cacheError } = await supabase
          .from('synced_creative_content')
          .upsert(imagesToCache, { 
            onConflict: 'external_id,source',
            ignoreDuplicates: false 
          });

        if (cacheError) {
          console.error('Cache error:', cacheError);
        }

        // Reload from cache to get proper IDs
        await loadCachedContent();
        
        toast({
          title: "Sync Complete",
          description: `Found ${data.images.length} items from ${workspace.name} and cached them.`,
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
    <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl overflow-hidden">
      {/* Workspace Tabs */}
      <div className="px-3 py-2 border-b border-zinc-800 flex items-center gap-2 bg-zinc-900 overflow-x-auto">
        {workspaces.map((workspace) => {
          const count = cachedCounts[workspace.id] || 0;
          return (
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
              {workspace.canSync && count > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-pink-500/20 text-pink-400 text-[10px]">
                  {count}
                </span>
              )}
              {workspace.canSync && count === 0 && (
                <Heart className="w-3 h-3 opacity-50" />
              )}
            </button>
          );
        })}
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

              {currentWorkspace.canSync && cachedCounts[currentWorkspace.id] > 0 && (
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                  <Database className="w-3 h-3 text-emerald-400" />
                  <span className="text-[10px] font-tech text-emerald-400 uppercase">Cached</span>
                </div>
              )}
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

            {/* Loading state */}
            {isLoadingCache && currentWorkspace.canSync && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
              </div>
            )}

            {/* Beautiful Synced Album */}
            {!isLoadingCache && currentWorkspace.canSync && (
              <SyncedAlbum
                images={currentImages}
                source={currentWorkspace.id}
                onRefresh={() => syncLikedContent(currentWorkspace)}
                isRefreshing={isSyncing === currentWorkspace.id}
              />
            )}

            {/* Non-syncable workspace message */}
            {!currentWorkspace.canSync && (
              <div className="text-center py-8 text-zinc-500">
                <Images className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-xs font-tech">Direct sync not available</p>
                <p className="text-[10px] mt-1">Use the login button to access {currentWorkspace.name}</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
