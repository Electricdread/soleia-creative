import { supabase } from '@/integrations/supabase/client';

export interface ArtlistClip {
  id: string;
  title: string;
  thumbnail: string;
  videoUrl: string;
  previewUrl?: string;
  resolution: string;
  duration: string;
  category: string;
  sourceUrl: string;
  description?: string;
}

type ArtlistResponse<T = any> = {
  success: boolean;
  error?: string;
  clips?: T[];
  totalFound?: number;
  cached?: boolean;
};

export const artlistApi = {
  // Get cached clips from database (fast)
  async getCachedClips(category: string): Promise<ArtlistResponse<ArtlistClip>> {
    try {
      const { data, error } = await supabase
        .from('cached_clips')
        .select('*')
        .eq('category', category)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Cache fetch error:', error);
        return { success: false, error: error.message };
      }

      if (data && data.length > 0) {
        const clips = data.map(c => ({
          id: c.id,
          title: c.title,
          thumbnail: c.thumbnail,
          videoUrl: c.video_url,
          previewUrl: c.preview_url,
          resolution: c.resolution,
          duration: c.duration,
          category: c.category,
          sourceUrl: c.source_url,
        }));
        return { success: true, clips, totalFound: clips.length, cached: true };
      }
      
      return { success: true, clips: [], totalFound: 0, cached: false };
    } catch (err) {
      console.error('Cache exception:', err);
      return { success: false, error: err instanceof Error ? err.message : 'Failed to fetch cache' };
    }
  },

  // Scrape clips from a category (uses cache if available)
  async scrapeCategory(category: string, forceRefresh: boolean = false): Promise<ArtlistResponse<ArtlistClip>> {
    try {
      const { data, error } = await supabase.functions.invoke('scrape-artlist', {
        body: { category, forceRefresh },
      });

      if (error) {
        console.error('Scrape error:', error);
        return { success: false, error: error.message };
      }
      return data;
    } catch (err) {
      console.error('Scrape exception:', err);
      return { success: false, error: err instanceof Error ? err.message : 'Failed to scrape' };
    }
  },

  // Search for clips
  async search(query: string, limit: number = 20): Promise<ArtlistResponse<ArtlistClip>> {
    try {
      const { data, error } = await supabase.functions.invoke('search-artlist', {
        body: { query, limit },
      });

      if (error) {
        console.error('Search error:', error);
        return { success: false, error: error.message };
      }
      return data;
    } catch (err) {
      console.error('Search exception:', err);
      return { success: false, error: err instanceof Error ? err.message : 'Failed to search' };
    }
  },
};

// Category definitions for Artlist motion graphics
export const artlistCategories = [
  { key: 'motion-backgrounds', label: 'Motion Backgrounds', icon: '🌊' },
  { key: 'abstract', label: 'Abstract', icon: '🔮' },
  { key: 'particles', label: 'Particles', icon: '✨' },
  { key: 'nature', label: 'Nature', icon: '🌿' },
  { key: 'technology', label: 'Technology', icon: '💻' },
  { key: 'corporate', label: 'Corporate', icon: '🏢' },
  { key: 'events', label: 'Events', icon: '🎉' },
] as const;

export type ArtlistCategoryKey = typeof artlistCategories[number]['key'];
