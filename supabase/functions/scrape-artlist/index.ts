import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ArtlistClip {
  id: string;
  title: string;
  thumbnail: string;
  videoUrl: string;
  previewUrl: string;
  resolution: string;
  duration: string;
  category: string;
  sourceUrl: string;
}

// Fetch thumbnail and preview from a clip page
async function fetchClipDetails(apiKey: string, clipUrl: string): Promise<{ thumbnail: string; previewUrl: string }> {
  try {
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: clipUrl,
        formats: ['html'],
        waitFor: 2000,
        onlyMainContent: false,
      }),
    });

    if (!response.ok) return { thumbnail: '', previewUrl: '' };

    const data = await response.json();
    const html = data.data?.html || '';

    // Find thumbnail - look for og:image or poster images
    const ogImageMatch = html.match(/property="og:image"[^>]*content="([^"]+)"/);
    const posterMatch = html.match(/poster="([^"]+)"/);
    const imgMatch = html.match(/src="(https:\/\/[^"]+(?:thumbnail|poster|cdn)[^"]*\.(?:jpg|jpeg|png|webp)[^"]*)"/i);
    
    const thumbnail = ogImageMatch?.[1] || posterMatch?.[1] || imgMatch?.[1] || '';

    // Find video preview URL
    const videoMatch = html.match(/src="(https:\/\/[^"]+(?:preview|video)[^"]*\.(?:mp4|webm)[^"]*)"/i);
    const sourceMatch = html.match(/<source[^>]*src="([^"]+\.(?:mp4|webm))"/i);
    
    const previewUrl = videoMatch?.[1] || sourceMatch?.[1] || '';

    return { thumbnail, previewUrl };
  } catch (error) {
    console.error('Error fetching clip details:', error);
    return { thumbnail: '', previewUrl: '' };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { category, forceRefresh = false } = await req.json();
    
    // Initialize Supabase client with service role for caching
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check for cached clips first (unless force refresh)
    if (!forceRefresh) {
      const { data: cachedClips, error: cacheError } = await supabase
        .from('cached_clips')
        .select('*')
        .eq('category', category)
        .order('created_at', { ascending: false });

      if (!cacheError && cachedClips && cachedClips.length > 0) {
        // Check if cache is less than 24 hours old
        const cacheAge = Date.now() - new Date(cachedClips[0].created_at).getTime();
        const twentyFourHours = 24 * 60 * 60 * 1000;
        
        if (cacheAge < twentyFourHours) {
          console.log('Returning cached clips for category:', category);
          const clips = cachedClips.map(c => ({
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
          
          return new Response(
            JSON.stringify({ 
              success: true, 
              clips,
              totalFound: clips.length,
              category,
              cached: true
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }
    }

    const apiKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!apiKey) {
      console.error('FIRECRAWL_API_KEY not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'Firecrawl connector not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Map category to search terms
    const categorySearchTerms: Record<string, string> = {
      'motion-backgrounds': 'motion graphics background loop',
      'abstract': 'abstract visual patterns animation',
      'particles': 'particles effects motion',
      'nature': 'nature landscape aerial cinematic',
      'events': 'event celebration fireworks party',
      'technology': 'technology digital data futuristic',
      'corporate': 'business corporate office professional',
      'all': 'motion graphics video'
    };

    const searchTerm = categorySearchTerms[category] || 'motion graphics';

    console.log('Searching Artlist for:', searchTerm);

    // Search for clips using Firecrawl search
    const searchResponse = await fetch('https://api.firecrawl.dev/v1/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `site:artlist.io/stock-footage/clip ${searchTerm}`,
        limit: 24,
      }),
    });

    const searchData = await searchResponse.json();
    
    if (!searchResponse.ok) {
      console.error('Search failed:', searchData);
      return new Response(
        JSON.stringify({ success: false, error: searchData.error || 'Search failed' }),
        { status: searchResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const clips: ArtlistClip[] = [];
    const results = searchData.data || [];
    
    console.log('Search found:', results.length, 'results');

    // Filter for actual clip pages
    const clipResults = results.filter((r: any) => 
      r.url && (r.url.includes('/clip/') || r.url.includes('/footage/'))
    );

    console.log('Filtered clip results:', clipResults.length);

    // Process clips - fetch thumbnails for first 12, use placeholders for rest
    for (let i = 0; i < clipResults.length; i++) {
      const result = clipResults[i];
      
      let title = (result.title || `Motion Clip ${i + 1}`)
        .replace(' - Artlist', '')
        .replace(' | Artlist', '')
        .replace(' – Stock Footage', '')
        .replace(' – Stock Video', '')
        .trim();
      
      // Clean up title format
      if (title.includes(' by ')) {
        title = title.split(' by ')[0].trim();
      }

      const clipId = `artlist-${category}-${i}-${Date.now()}`;
      
      // Fetch actual thumbnail for first 8 clips
      let thumbnail = '';
      let previewUrl = '';
      
      if (i < 8) {
        const details = await fetchClipDetails(apiKey, result.url);
        thumbnail = details.thumbnail;
        previewUrl = details.previewUrl;
      }
      
      // Fallback thumbnail based on category
      const fallbackThumbnails: Record<string, string> = {
        'motion-backgrounds': 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400&h=225&fit=crop&q=80',
        'abstract': 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&h=225&fit=crop&q=80',
        'particles': 'https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?w=400&h=225&fit=crop&q=80',
        'nature': 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400&h=225&fit=crop&q=80',
        'events': 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=400&h=225&fit=crop&q=80',
        'technology': 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&h=225&fit=crop&q=80',
        'corporate': 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&h=225&fit=crop&q=80',
      };
      
      if (!thumbnail) {
        thumbnail = fallbackThumbnails[category] || fallbackThumbnails['motion-backgrounds'];
      }

      clips.push({
        id: clipId,
        title,
        thumbnail,
        videoUrl: result.url,
        previewUrl,
        resolution: '4K',
        duration: '0:15-0:30',
        category,
        sourceUrl: result.url,
      });
    }

    console.log('Total clips processed:', clips.length);

    // Cache the clips in the database
    if (clips.length > 0) {
      // Delete old cached clips for this category
      await supabase
        .from('cached_clips')
        .delete()
        .eq('category', category);

      // Insert new clips
      const clipsToInsert = clips.map(clip => ({
        external_id: clip.id,
        title: clip.title,
        thumbnail: clip.thumbnail,
        video_url: clip.videoUrl,
        preview_url: clip.previewUrl,
        resolution: clip.resolution,
        duration: clip.duration,
        category: clip.category,
        source_url: clip.sourceUrl,
      }));

      const { error: insertError } = await supabase
        .from('cached_clips')
        .insert(clipsToInsert);

      if (insertError) {
        console.error('Error caching clips:', insertError);
      } else {
        console.log('Cached', clips.length, 'clips for category:', category);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        clips,
        totalFound: clips.length,
        category,
        cached: false
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in scrape-artlist:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
