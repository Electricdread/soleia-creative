import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ArtlistClip {
  id: string;
  title: string;
  thumbnail: string;
  videoUrl: string;
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
    const { category } = await req.json();
    
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

    // First, map the page to find clip links
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

    if (!mapResponse.ok) {
      console.error('Firecrawl map error:', mapData);
      return new Response(
        JSON.stringify({ success: false, error: mapData.error || 'Failed to map page' }),
        { status: mapResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Filter for clip URLs
    const clipLinks = (mapData.links || []).filter((link: string) => 
      link.includes('/stock-footage/clip/') || link.includes('/stock-video/')
    ).slice(0, 24); // Limit to 24 clips

    console.log('Found clip links:', clipLinks.length);

    // Scrape the main page for clip data
    const scrapeResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: artlistUrl,
        formats: ['html', 'markdown'],
        onlyMainContent: true,
        waitFor: 3000,
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

    // Parse clips from HTML content
    const clips: ArtlistClip[] = [];
    const html = scrapeData.data?.html || scrapeData.html || '';
    
    // Extract clip information from HTML using regex patterns
    // Look for clip cards with image, title, and duration
    const clipCardPattern = /<article[^>]*>[\s\S]*?<\/article>/gi;
    const clipMatches = html.match(clipCardPattern) || [];
    
    // Also try to find video thumbnails and titles
    const imgPattern = /<img[^>]*src="([^"]+)"[^>]*alt="([^"]*)"[^>]*>/gi;
    const imgMatches = [...html.matchAll(imgPattern)];
    
    // Extract data URLs for previews
    const videoPreviewPattern = /data-preview="([^"]+)"|preview_url":"([^"]+)"/gi;
    const previewMatches = [...html.matchAll(videoPreviewPattern)];

  // Combine clip links with extracted data
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

      // Try to find corresponding image
      const thumbnail = imgMatches[i]?.[1] || 
        `https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&h=225&fit=crop`;

      clips.push({
        id: `artlist-${category}-${i}`,
        title: title,
        thumbnail: thumbnail.startsWith('//') ? `https:${thumbnail}` : thumbnail,
        videoUrl: link,
        resolution: '4K',
        duration: '0:15-0:30',
        category: category,
        sourceUrl: link,
      });
    }

    // If no clips found from links, create placeholder entries
    if (clips.length === 0) {
      const markdown = scrapeData.data?.markdown || scrapeData.markdown || '';
      const titleMatches = [...markdown.matchAll(/\[([^\]]+)\]\(([^)]+)\)/g)];
      
      for (let i = 0; i < Math.min(titleMatches.length, 24); i++) {
        const [, title, url] = titleMatches[i];
        if (url.includes('stock-footage') || url.includes('clip')) {
          clips.push({
            id: `artlist-${category}-${i}`,
            title: title || `Motion Clip ${i + 1}`,
            thumbnail: `https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&h=225&fit=crop`,
            videoUrl: url.startsWith('http') ? url : `https://artlist.io${url}`,
            resolution: '4K',
            duration: '0:15-0:30',
            category: category,
            sourceUrl: url.startsWith('http') ? url : `https://artlist.io${url}`,
          });
        }
      }
    }

    console.log('Extracted clips:', clips.length);

    return new Response(
      JSON.stringify({ 
        success: true, 
        clips,
        totalFound: clips.length,
        category: category
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
