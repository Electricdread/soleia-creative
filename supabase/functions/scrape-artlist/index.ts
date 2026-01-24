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
async function fetchClipDetails(apiKey: string, clipUrl: string): Promise<{ thumbnail: string; previewUrl: string; duration: string }> {
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
        waitFor: 3000,
        onlyMainContent: false,
      }),
    });

    if (!response.ok) return { thumbnail: '', previewUrl: '', duration: '' };

    const data = await response.json();
    const html = data.data?.html || '';

    // Find thumbnail - prioritize Artlist CDN images
    let thumbnail = '';
    
    // Look for og:image first (usually high quality)
    const ogImageMatch = html.match(/property="og:image"[^>]*content="([^"]+)"/);
    if (ogImageMatch) {
      thumbnail = ogImageMatch[1];
    }
    
    // Look for video poster
    if (!thumbnail) {
      const posterMatch = html.match(/poster="(https:\/\/[^"]+)"/);
      if (posterMatch) thumbnail = posterMatch[1];
    }
    
    // Look for Artlist CDN images
    if (!thumbnail) {
      const cdnMatch = html.match(/src="(https:\/\/(?:cdn|d\d+)[^"]*artlist[^"]*\.(?:jpg|jpeg|png|webp)[^"]*)"/i);
      if (cdnMatch) thumbnail = cdnMatch[1];
    }
    
    // Look for any thumbnail/poster class images
    if (!thumbnail) {
      const thumbMatch = html.match(/class="[^"]*(?:thumbnail|poster|preview)[^"]*"[^>]*src="([^"]+)"/i);
      if (thumbMatch) thumbnail = thumbMatch[1];
    }

    // Find video preview URL - look for mp4/webm sources
    let previewUrl = '';
    
    // Look for video source elements
    const sourceMatch = html.match(/<source[^>]*src="(https:\/\/[^"]+\.(?:mp4|webm))"/i);
    if (sourceMatch) {
      previewUrl = sourceMatch[1];
    }
    
    // Look for video src attribute
    if (!previewUrl) {
      const videoSrcMatch = html.match(/<video[^>]*src="(https:\/\/[^"]+\.(?:mp4|webm))"/i);
      if (videoSrcMatch) previewUrl = videoSrcMatch[1];
    }
    
    // Look for preview URLs in data attributes or JSON
    if (!previewUrl) {
      const previewDataMatch = html.match(/preview[_-]?(?:url|src|video)["']?\s*[:=]\s*["'](https:\/\/[^"']+\.(?:mp4|webm))/i);
      if (previewDataMatch) previewUrl = previewDataMatch[1];
    }
    
    // Look for Artlist CDN video URLs
    if (!previewUrl) {
      const cdnVideoMatch = html.match(/(https:\/\/(?:cdn|d\d+|stream)[^"'\s]*artlist[^"'\s]*\.(?:mp4|webm))/i);
      if (cdnVideoMatch) previewUrl = cdnVideoMatch[1];
    }

    // Try to extract duration
    let duration = '';
    const durationMatch = html.match(/duration['":\s]+(\d+:\d+)/i) || html.match(/(\d{1,2}:\d{2})/);
    if (durationMatch) {
      duration = durationMatch[1];
    }

    return { thumbnail, previewUrl, duration };
  } catch (error) {
    console.error('Error fetching clip details:', error);
    return { thumbnail: '', previewUrl: '', duration: '' };
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
      'motion-backgrounds': 'motion graphics background loop animation',
      'abstract': 'abstract visual patterns geometric animation',
      'particles': 'particles dust floating glitter effects',
      'nature': 'nature landscape drone aerial cinematic',
      'events': 'celebration fireworks confetti party',
      'technology': 'technology digital data hologram futuristic',
      'corporate': 'business office professional meeting',
      'all': 'motion graphics video loop'
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
        limit: 20,
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
      r.url && r.url.includes('/clip/')
    ).slice(0, 16);

    console.log('Filtered clip results:', clipResults.length);

    // Process all clips in parallel batches to fetch real thumbnails
    const batchSize = 4;
    for (let batchStart = 0; batchStart < clipResults.length; batchStart += batchSize) {
      const batch = clipResults.slice(batchStart, batchStart + batchSize);
      
      const batchResults = await Promise.all(batch.map(async (result: any, batchIndex: number) => {
        const i = batchStart + batchIndex;
        
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
        
        // Fetch actual thumbnail and preview
        const details = await fetchClipDetails(apiKey, result.url);
        
        return {
          id: clipId,
          title,
          thumbnail: details.thumbnail,
          videoUrl: result.url,
          previewUrl: details.previewUrl,
          resolution: '4K',
          duration: details.duration || '0:15',
          category,
          sourceUrl: result.url,
        };
      }));
      
      clips.push(...batchResults);
    }

    console.log('Total clips processed:', clips.length);
    console.log('Clips with thumbnails:', clips.filter(c => c.thumbnail).length);
    console.log('Clips with previews:', clips.filter(c => c.previewUrl).length);

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
