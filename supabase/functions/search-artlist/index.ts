import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, limit = 20 } = await req.json();
    
    const apiKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!apiKey) {
      console.error('FIRECRAWL_API_KEY not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'Firecrawl connector not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Searching Artlist for:', query);

    // Use Firecrawl search to find motion graphics on Artlist
    const searchResponse = await fetch('https://api.firecrawl.dev/v1/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `site:artlist.io motion graphics ${query}`,
        limit: limit,
        scrapeOptions: {
          formats: ['markdown'],
        },
      }),
    });

    const searchData = await searchResponse.json();

    if (!searchResponse.ok) {
      console.error('Firecrawl search error:', searchData);
      return new Response(
        JSON.stringify({ success: false, error: searchData.error || 'Search failed' }),
        { status: searchResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse search results into clips
    const clips = (searchData.data || []).map((result: any, i: number) => {
      const title = result.title || `Motion Graphics ${i + 1}`;
      return {
        id: `search-${i}`,
        title: title.replace(' - Artlist', '').replace(' | Artlist', '').trim(),
        thumbnail: `https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&h=225&fit=crop`,
        videoUrl: result.url || '',
        resolution: '4K',
        duration: '0:15-0:30',
        category: 'search',
        sourceUrl: result.url || '',
        description: result.description || '',
      };
    }).filter((clip: any) => 
      clip.videoUrl.includes('artlist.io') && 
      (clip.videoUrl.includes('stock-footage') || clip.videoUrl.includes('clip'))
    );

    console.log('Search found clips:', clips.length);

    return new Response(
      JSON.stringify({ 
        success: true, 
        clips,
        query,
        totalFound: clips.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in search-artlist:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
