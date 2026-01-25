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

// Fetch thumbnail and preview from a clip page with improved video extraction
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
        formats: ['html', 'rawHtml'],
        waitFor: 5000, // Increased wait time for video elements to load
        onlyMainContent: false,
      }),
    });

    if (!response.ok) return { thumbnail: '', previewUrl: '', duration: '' };

    const data = await response.json();
    const html = data.data?.html || data.data?.rawHtml || '';

    // Find thumbnail - prioritize Artlist CDN images
    let thumbnail = '';
    
    // Look for artgrid.imgix.net thumbnails (most reliable)
    const artgridMatch = html.match(/https:\/\/artgrid\.imgix\.net\/[^"'\s]+/);
    if (artgridMatch) {
      thumbnail = artgridMatch[0].replace(/&amp;/g, '&');
    }
    
    // Look for artlist-content-images.imgix.net
    if (!thumbnail) {
      const artlistImgMatch = html.match(/https:\/\/artlist-content-images\.imgix\.net\/[^"'\s]+/);
      if (artlistImgMatch) {
        thumbnail = artlistImgMatch[0].replace(/&amp;/g, '&');
      }
    }
    
    // Look for og:image (usually high quality)
    if (!thumbnail) {
      const ogImageMatch = html.match(/property="og:image"[^>]*content="([^"]+)"/);
      if (ogImageMatch) {
        thumbnail = ogImageMatch[1];
      }
    }
    
    // Look for video poster
    if (!thumbnail) {
      const posterMatch = html.match(/poster="(https:\/\/[^"]+)"/);
      if (posterMatch) thumbnail = posterMatch[1];
    }

    // Find video preview URL - look for static-videos.artlist.io (main CDN)
    let previewUrl = '';
    
    // Primary: Look for static-videos.artlist.io URLs (most reliable)
    const staticVideoMatch = html.match(/https:\/\/static-videos\.artlist\.io\/[^"'\s]+\.mp4/i);
    if (staticVideoMatch) {
      previewUrl = staticVideoMatch[0];
    }
    
    // Look for artlist video CDN patterns
    if (!previewUrl) {
      const artlistVideoMatch = html.match(/https:\/\/[^"'\s]*artlist[^"'\s]*\/[^"'\s]+\.mp4/i);
      if (artlistVideoMatch) {
        previewUrl = artlistVideoMatch[0];
      }
    }
    
    // Look for video source elements
    if (!previewUrl) {
      const sourceMatch = html.match(/<source[^>]*src="(https:\/\/[^"]+\.mp4)"/i);
      if (sourceMatch) {
        previewUrl = sourceMatch[1];
      }
    }
    
    // Look for video src attribute
    if (!previewUrl) {
      const videoSrcMatch = html.match(/<video[^>]*src="(https:\/\/[^"]+\.mp4)"/i);
      if (videoSrcMatch) previewUrl = videoSrcMatch[1];
    }
    
    // Look for preview URLs in JSON data or scripts
    if (!previewUrl) {
      const jsonPreviewMatch = html.match(/"(?:preview|video|mp4)[Uu]rl?":\s*"(https:\/\/[^"]+\.mp4)"/i);
      if (jsonPreviewMatch) previewUrl = jsonPreviewMatch[1];
    }
    
    // Look for cloudfront or CDN video URLs
    if (!previewUrl) {
      const cloudfrontMatch = html.match(/https:\/\/[^"'\s]*cloudfront[^"'\s]*\.mp4/i);
      if (cloudfrontMatch) previewUrl = cloudfrontMatch[0];
    }

    // Try to extract duration
    let duration = '';
    const durationPatterns = [
      /duration['":\s]+['"]?(\d+:\d+)/i,
      /"duration":\s*"?(\d+:\d+)"?/i,
      /class="[^"]*duration[^"]*"[^>]*>(\d+:\d+)/i,
      />(\d{1,2}:\d{2})</,
    ];
    
    for (const pattern of durationPatterns) {
      const match = html.match(pattern);
      if (match) {
        duration = match[1];
        break;
      }
    }
    
    // Default duration if not found
    if (!duration) {
      duration = '00:15';
    }

    console.log(`Clip details for ${clipUrl}: thumbnail=${thumbnail ? 'found' : 'missing'}, preview=${previewUrl ? 'found' : 'missing'}`);

    return { thumbnail, previewUrl, duration };
  } catch (error) {
    console.error('Error fetching clip details:', error);
    return { thumbnail: '', previewUrl: '', duration: '00:15' };
  }
}

Deno.serve(async (req) => {
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

    // Map category to more specific search terms for better video results
    const categorySearchTerms: Record<string, string> = {
      'featured-collections': 'motion graphics background loop 4K animation video',
      'motion-backgrounds': 'motion graphics background loop animation',
      'abstract': 'abstract visual patterns geometric animation loop',
      'particles': 'particles dust floating glitter effects overlay',
      'nature': 'nature landscape drone aerial cinematic video',
      'events': 'celebration fireworks confetti party overlay',
      'technology': 'technology digital data hologram futuristic',
      'corporate': 'business office professional meeting corporate',
      'all': 'motion graphics video loop 4K'
    };

    const searchTerm = categorySearchTerms[category] || categorySearchTerms['featured-collections'];

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

    // Filter for actual clip pages and remove duplicates
    const seenUrls = new Set<string>();
    const clipResults = results.filter((r: any) => {
      if (!r.url || !r.url.includes('/clip/')) return false;
      if (seenUrls.has(r.url)) return false;
      seenUrls.add(r.url);
      return true;
    }).slice(0, 18);

    console.log('Filtered unique clip results:', clipResults.length);

    // Process all clips in parallel batches to fetch real thumbnails and previews
    const batchSize = 3; // Smaller batch for more reliable results
    for (let batchStart = 0; batchStart < clipResults.length; batchStart += batchSize) {
      const batch = clipResults.slice(batchStart, batchStart + batchSize);
      
      const batchResults = await Promise.all(batch.map(async (result: any, batchIndex: number) => {
        const i = batchStart + batchIndex;
        
        let title = (result.title || `Motion Clip ${i + 1}`)
          .replace(/ - Artlist$/i, '')
          .replace(/ \| Artlist$/i, '')
          .replace(/ – Stock Footage$/i, '')
          .replace(/ – Stock Video$/i, '')
          .replace(/ - Stock Footage$/i, '')
          .trim();
        
        // Clean up title format
        if (title.includes(' by ')) {
          title = title.split(' by ')[0].trim();
        }
        
        // Truncate very long titles
        if (title.length > 60) {
          title = title.substring(0, 57) + '...';
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
          duration: details.duration,
          category,
          sourceUrl: result.url,
        };
      }));
      
      clips.push(...batchResults);
      
      // Small delay between batches to avoid rate limiting
      if (batchStart + batchSize < clipResults.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
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
