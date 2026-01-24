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
        // Check if cache is less than 1 hour old
        const cacheAge = Date.now() - new Date(cachedClips[0].created_at).getTime();
        const oneHour = 60 * 60 * 1000;
        
        if (cacheAge < oneHour) {
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

    // Map category to Artlist URL path
    const categoryMap: Record<string, string> = {
      'motion-backgrounds': 'motion-backgrounds',
      'abstract': 'abstract',
      'particles': 'particles',
      'nature': 'nature',
      'events': 'events',
      'technology': 'technology',
      'corporate': 'corporate',
      'all': 'motion-graphics'
    };

    const categorySlug = categoryMap[category] || 'motion-graphics';
    const artlistUrl = `https://artlist.io/stock-footage/category/${categorySlug}`;

    console.log('Scraping Artlist URL:', artlistUrl);

    // Scrape the main page for clip data with extract
    const scrapeResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: artlistUrl,
        formats: ['extract'],
        extract: {
          schema: {
            type: 'object',
            properties: {
              clips: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    title: { type: 'string' },
                    thumbnailUrl: { type: 'string' },
                    videoPreviewUrl: { type: 'string' },
                    clipUrl: { type: 'string' },
                    duration: { type: 'string' },
                    resolution: { type: 'string' }
                  }
                }
              }
            }
          },
          prompt: 'Extract all video clips from this motion graphics category page. For each clip, get the title, thumbnail image URL, video preview URL (mp4/webm), clip page URL, duration, and resolution.'
        },
        waitFor: 5000,
      }),
    });

    const scrapeData = await scrapeResponse.json();

    if (!scrapeResponse.ok) {
      console.error('Firecrawl scrape error:', scrapeData);
      return new Response(
        JSON.stringify({ success: false, error: scrapeData.error || 'Failed to scrape page' }),
        { status: scrapeResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse clips from extracted data
    const clips: ArtlistClip[] = [];
    const extractedClips = scrapeData.data?.extract?.clips || [];
    
    console.log('Extracted clips count:', extractedClips.length);

    for (let i = 0; i < extractedClips.length; i++) {
      const extracted = extractedClips[i];
      const clipId = `artlist-${category}-${i}-${Date.now()}`;
      
      // Clean up the thumbnail URL
      let thumbnail = extracted.thumbnailUrl || '';
      if (thumbnail.startsWith('//')) thumbnail = `https:${thumbnail}`;
      if (!thumbnail || !thumbnail.startsWith('http')) {
        thumbnail = `https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&h=225&fit=crop&q=80`;
      }
      
      // Clean up preview URL
      let previewUrl = extracted.videoPreviewUrl || '';
      if (previewUrl.startsWith('//')) previewUrl = `https:${previewUrl}`;
      
      // Clean up source URL
      let sourceUrl = extracted.clipUrl || '';
      if (sourceUrl && !sourceUrl.startsWith('http')) {
        sourceUrl = `https://artlist.io${sourceUrl.startsWith('/') ? '' : '/'}${sourceUrl}`;
      }

      clips.push({
        id: clipId,
        title: extracted.title || `Motion Clip ${i + 1}`,
        thumbnail,
        videoUrl: sourceUrl,
        previewUrl,
        resolution: extracted.resolution || '4K',
        duration: extracted.duration || '0:15-0:30',
        category,
        sourceUrl,
      });
    }

    // If no clips extracted, try fallback map method
    if (clips.length === 0) {
      console.log('No clips extracted, trying map fallback...');
      
      const mapResponse = await fetch('https://api.firecrawl.dev/v1/map', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: artlistUrl,
          limit: 50,
          includeSubdomains: false,
        }),
      });

      const mapData = await mapResponse.json();

      if (mapResponse.ok) {
        const clipLinks = (mapData.links || []).filter((link: string) => 
          link.includes('/stock-footage/clip/') || link.includes('/stock-video/')
        ).slice(0, 24);

        for (let i = 0; i < clipLinks.length; i++) {
          const link = clipLinks[i];
          const titleMatch = link.match(/\/clip\/([^\/]+)/);
          const title = titleMatch ? 
            titleMatch[1]
              .replace(/-/g, ' ')
              .replace(/\d+$/, '')
              .trim()
              .split(' ')
              .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
              .join(' ') 
            : `Motion Clip ${i + 1}`;

          clips.push({
            id: `artlist-${category}-${i}-${Date.now()}`,
            title,
            thumbnail: `https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&h=225&fit=crop&q=80`,
            videoUrl: link,
            previewUrl: '',
            resolution: '4K',
            duration: '0:15-0:30',
            category,
            sourceUrl: link,
          });
        }
      }
    }

    console.log('Total clips found:', clips.length);

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
