import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ScrapedImage {
  id: string;
  url: string;
  thumbnail: string;
  title: string;
  source: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url, source } = await req.json();

    if (!url) {
      return new Response(
        JSON.stringify({ success: false, error: 'URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!apiKey) {
      console.error('FIRECRAWL_API_KEY not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'Firecrawl connector not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Scraping ${source} gallery:`, url);

    // Use Firecrawl to scrape the gallery page
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url,
        formats: ['html', 'links'],
        waitFor: 5000,
        onlyMainContent: false,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Firecrawl error:', errorData);
      return new Response(
        JSON.stringify({ success: false, error: errorData.error || 'Failed to scrape gallery' }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const html = data.data?.html || '';
    const links = data.data?.links || [];

    const images: ScrapedImage[] = [];

    if (source === 'midjourney') {
      // Extract Midjourney image patterns
      // Look for CDN image URLs
      const cdnPattern = /https:\/\/cdn\.midjourney\.com\/[^"'\s]+/g;
      const cdnMatches: string[] = (html.match(cdnPattern) || []) as string[];
      
      // Also look for image elements with specific patterns
      const imgPattern = /<img[^>]+src="(https:\/\/[^"]+(?:midjourney|mj)[^"]+)"/gi;
      let imgMatch;
      while ((imgMatch = imgPattern.exec(html)) !== null) {
        cdnMatches.push(imgMatch[1]);
      }

      // Deduplicate and process
      const uniqueUrls = [...new Set(cdnMatches)];
      
      uniqueUrls.slice(0, 50).forEach((imgUrl, index) => {
        // Skip thumbnails and get full images
        const cleanUrl = imgUrl.replace(/&amp;/g, '&');
        
        images.push({
          id: `mj-${Date.now()}-${index}`,
          url: cleanUrl,
          thumbnail: cleanUrl.includes('?') ? `${cleanUrl}&w=256` : `${cleanUrl}?w=256`,
          title: `Midjourney Image ${index + 1}`,
          source: 'midjourney',
        });
      });

    } else if (source === 'openart') {
      // Extract OpenArt image patterns
      const openartPattern = /https:\/\/(?:cdn\.openart\.ai|openart\.ai\/uploads)[^"'\s]+/g;
      const openartMatches: string[] = (html.match(openartPattern) || []) as string[];
      
      // Look for image elements
      const imgPattern = /<img[^>]+src="(https:\/\/[^"]+openart[^"]+)"/gi;
      let imgMatch;
      while ((imgMatch = imgPattern.exec(html)) !== null) {
        openartMatches.push(imgMatch[1]);
      }

      const uniqueUrls = [...new Set(openartMatches)];
      
      uniqueUrls.slice(0, 50).forEach((imgUrl, index) => {
        const cleanUrl = imgUrl.replace(/&amp;/g, '&');
        
        images.push({
          id: `oa-${Date.now()}-${index}`,
          url: cleanUrl,
          thumbnail: cleanUrl,
          title: `OpenArt Image ${index + 1}`,
          source: 'openart',
        });
      });
    }

    // Filter out non-image URLs and duplicates
    const validImages = images.filter(img => {
      const url = img.url.toLowerCase();
      return (
        url.includes('.jpg') || 
        url.includes('.jpeg') || 
        url.includes('.png') || 
        url.includes('.webp') ||
        url.includes('cdn.midjourney') ||
        url.includes('cdn.openart')
      );
    });

    console.log(`Found ${validImages.length} images from ${source}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        images: validImages,
        totalFound: validImages.length,
        source,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in scrape-creative-gallery:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
