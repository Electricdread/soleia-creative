import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface ScrapedEventData {
  event_name: string;
  event_date: string;
  event_time: string;
  guaranteed_guests: string;
  expected_guests: string;
  venue: string;
  venue_address: string;
  venue_phone: string;
  managers: { name: string; email: string }[];
  recent_activity: { description: string; time_ago: string; by: string }[];
}

function parseEventPage(markdown: string): ScrapedEventData {
  const data: ScrapedEventData = {
    event_name: '',
    event_date: '',
    event_time: '',
    guaranteed_guests: '',
    expected_guests: '',
    venue: '',
    venue_address: '',
    venue_phone: '',
    managers: [],
    recent_activity: [],
    signed_documents: [],
  };

  const lines = markdown.split('\n').map(l => l.trim());

  // Event name - first H1
  const h1Match = markdown.match(/^# (.+)$/m);
  if (h1Match) data.event_name = h1Match[1].replace(/ at .+$/, '');

  // Event name from ### with event-name icon
  const eventNameMatch = markdown.match(/### .*event-name.*\s+(.+)/i);
  if (eventNameMatch) data.event_name = eventNameMatch[1].trim();

  // Date & time
  for (let i = 0; i < lines.length; i++) {
    const dateMatch = lines[i].match(/^(Mon|Tue|Wed|Thu|Fri|Sat|Sun),\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d+,\s+\d{4}$/i);
    if (dateMatch) {
      data.event_date = lines[i];
      // Next non-empty line is likely the time
      for (let j = i + 1; j < Math.min(i + 3, lines.length); j++) {
        if (lines[j] && lines[j].match(/\d+:\d+\s*(am|pm)/i)) {
          data.event_time = lines[j];
          break;
        }
      }
      break;
    }
  }

  // Guest counts
  const guaranteedMatch = markdown.match(/\*\*(\d[\d,]*)\s*guaranteed guests\*\*/i);
  if (guaranteedMatch) data.guaranteed_guests = guaranteedMatch[1];

  const expectedMatch = markdown.match(/\*\*(\d[\d,]*)\s*guests expected\*\*/i);
  if (expectedMatch) data.expected_guests = expectedMatch[1];

  // Venue - look for venue section
  const venueHeaderMatch = markdown.match(/### .*event-venue.*\s*(.+)/i);
  if (venueHeaderMatch) data.venue = venueHeaderMatch[1].trim();

  // Address - look for maps link
  const addressMatch = markdown.match(/\[([^\]]*Las Vegas[^\]]*)\]\(http:\/\/maps\.google/i);
  if (addressMatch) data.venue_address = addressMatch[1].replace(/\\\//g, ' ').replace(/\s+/g, ' ').trim();

  // Phone
  const phoneMatch = markdown.match(/(\d{3}-\d{3}-\d{4})/);
  if (phoneMatch) data.venue_phone = phoneMatch[1];

  // Managers - look for "#### Name" followed by email
  const managerRegex = /#### ([A-Z][a-z]+ [A-Z][a-z]+)\s*\n\s*\n\s*\[([^\]]+@[^\]]+)\]/g;
  let mMatch;
  while ((mMatch = managerRegex.exec(markdown)) !== null) {
    if (!data.managers.find(m => m.name === mMatch[1])) {
      data.managers.push({ name: mMatch[1], email: mMatch[2] });
    }
  }

  // Recent activity
  const activityMatches = markdown.matchAll(/(A payment of \$[\d,.]+|Document .+) was (received|signed|shared).+?\n\n\n\n(.+? ago) by (.+)/g);
  for (const am of activityMatches) {
    data.recent_activity.push({
      description: `${am[1]} was ${am[2]}`,
      time_ago: am[3].trim(),
      by: am[4].trim(),
    });
  }

  // Signed documents
  const signedDocRegex = /\[(.+?)\]\(https:\/\/portal\.tripleseat\.com\/signed_doc.+?\)\s*\n\s*\nSigned on (.+)/g;
  let sdMatch;
  while ((sdMatch = signedDocRegex.exec(markdown)) !== null) {
    data.signed_documents.push({ title: sdMatch[1], signed_on: sdMatch[2].trim() });
  }

  // Payments table
  const paymentRowRegex = /\| \*\*\[Receipt\].+?\*\* \| (-?\$[\d,.]+) \| ([^|]*) \| ([^|]*) \| ([^|]*) \| ([^|]*) \|/g;
  let pMatch;
  while ((pMatch = paymentRowRegex.exec(markdown)) !== null) {
    data.payments.push({
      amount: pMatch[1].trim(),
      due: pMatch[2].trim(),
      status: pMatch[3].trim(),
      method: pMatch[4].trim(),
      title: pMatch[5].trim(),
    });
  }

  // Grand total
  const grandTotalMatch = markdown.match(/\*\*Grand Total\*\* \| \*\*(\$[\d,.]+)\*\*/);
  if (grandTotalMatch) data.grand_total = grandTotalMatch[1];

  // Outstanding
  const outstandingMatch = markdown.match(/Total Outstanding\*? \| (\$[\d,.]+)/);
  if (outstandingMatch) data.total_outstanding = outstandingMatch[1];

  return data;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { tripleseat_url, event_uid, force_refresh } = await req.json();

    if (!tripleseat_url) {
      return new Response(
        JSON.stringify({ success: false, error: 'tripleseat_url is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check cache first (unless force_refresh)
    if (!force_refresh && event_uid) {
      const { data: cached } = await supabase
        .from('calendar_event_tripleseat_cache')
        .select('scraped_data, scraped_at')
        .eq('event_uid', event_uid)
        .maybeSingle();

      if (cached) {
        const cacheAge = Date.now() - new Date(cached.scraped_at).getTime();
        const ONE_HOUR = 60 * 60 * 1000;
        if (cacheAge < ONE_HOUR) {
          return new Response(
            JSON.stringify({ success: true, data: cached.scraped_data, cached: true }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }
    }

    // Fetch the public Triple Seat page
    console.log('Fetching Triple Seat page:', tripleseat_url);
    const pageRes = await fetch(tripleseat_url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SoleiaBot/1.0)' },
    });

    if (!pageRes.ok) {
      return new Response(
        JSON.stringify({ success: false, error: `Failed to fetch page: ${pageRes.status}` }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const html = await pageRes.text();

    // Convert HTML to simple text for parsing
    // Strip HTML tags but keep structure
    let text = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/?(h[1-6]|p|div|li|tr|td|th)[^>]*>/gi, '\n')
      .replace(/<a[^>]*href="([^"]*)"[^>]*>([^<]*)<\/a>/gi, '[$2]($1)')
      .replace(/<img[^>]*src="([^"]*)"[^>]*>/gi, '![image]($1)')
      .replace(/<strong>([^<]*)<\/strong>/gi, '**$1**')
      .replace(/<[^>]+>/g, '')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&nbsp;/g, ' ')
      .replace(/&#39;/g, "'")
      .replace(/&quot;/g, '"')
      .replace(/\n{3,}/g, '\n\n');

    // Try to parse structured data from the HTML directly
    const scrapedData: any = {
      event_name: '',
      event_date: '',
      event_time: '',
      guaranteed_guests: '',
      expected_guests: '',
      venue: '',
      venue_address: '',
      venue_phone: '',
      managers: [],
      recent_activity: [],
      signed_documents: [],
      payments: [],
      grand_total: '',
      total_outstanding: '',
    };

    // Extract from HTML directly for better accuracy
    // Event name from title
    const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
    if (titleMatch) {
      scrapedData.event_name = titleMatch[1].replace(/ - Tripleseat.*$/i, '').replace(/ at .+$/, '').trim();
    }

    // Guest counts from HTML
    const guestGuaranteedHtml = html.match(/(\d[\d,]*)\s*guaranteed\s*guests/i);
    if (guestGuaranteedHtml) scrapedData.guaranteed_guests = guestGuaranteedHtml[1];

    const guestExpectedHtml = html.match(/(\d[\d,]*)\s*guests?\s*expected/i);
    if (guestExpectedHtml) scrapedData.expected_guests = guestExpectedHtml[1];

    // Date from HTML
    const dateHtml = html.match(/(Mon|Tue|Wed|Thu|Fri|Sat|Sun),\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d+,\s+\d{4}/i);
    if (dateHtml) scrapedData.event_date = dateHtml[0];

    // Time
    const timeHtml = html.match(/(\d{1,2}:\d{2}\s*(am|pm)\s*-\s*\d{1,2}:\d{2}\s*(am|pm))/i);
    if (timeHtml) scrapedData.event_time = timeHtml[0];

    // Venue address
    const addressHtml = html.match(/maps\.google\.com[^"]*q=([^"&]+)/i);
    if (addressHtml) scrapedData.venue_address = decodeURIComponent(addressHtml[1].replace(/\+/g, ' ')).trim();

    // Phone
    const phoneHtml = html.match(/(\d{3}[-.)\s]\s*\d{3}[-.)\s]\s*\d{4})/);
    if (phoneHtml) scrapedData.venue_phone = phoneHtml[1];

    // Managers - look for email patterns with names
    const managerSection = html.match(/Event Managers[\s\S]*?(?=Recent Activity|Stats|$)/i);
    if (managerSection) {
      const emailMatches = managerSection[0].matchAll(/([A-Z][a-z]+ [A-Z][a-z]+)[\s\S]*?href="mailto:([^"]+)"/g);
      for (const em of emailMatches) {
        if (!scrapedData.managers.find((m: any) => m.email === em[2])) {
          scrapedData.managers.push({ name: em[1], email: em[2] });
        }
      }
    }

    // Payments from table
    const paymentRows = html.matchAll(/class="payment-row"[^>]*>[\s\S]*?<td[^>]*>([-$\d,.]+)<\/td>[\s\S]*?<td[^>]*>([^<]*)<\/td>[\s\S]*?<td[^>]*>([^<]*)<\/td>/gi);
    for (const pr of paymentRows) {
      scrapedData.payments.push({
        amount: pr[1].trim(),
        due: pr[2].trim(),
        status: pr[3].trim(),
        method: '',
        title: '',
      });
    }

    // Grand total
    const grandTotalHtml = html.match(/Grand Total[\s\S]*?\$([\d,.]+)/i);
    if (grandTotalHtml) scrapedData.grand_total = `$${grandTotalHtml[1]}`;

    // Outstanding
    const outstandingHtml = html.match(/Total Outstanding[\s\S]*?\$([\d,.]+)/i);
    if (outstandingHtml) scrapedData.total_outstanding = `$${outstandingHtml[1]}`;

    // Signed documents
    const signedDocs = html.matchAll(/signed_doc[^"]*"[^>]*>([^<]+)<\/a>[\s\S]*?Signed on ([^<]+)/gi);
    for (const sd of signedDocs) {
      scrapedData.signed_documents.push({
        title: sd[1].trim(),
        signed_on: sd[2].trim(),
      });
    }

    // Also try parsing from the text/markdown conversion
    const textParsed = parseEventPage(text);
    
    // Merge - prefer HTML-extracted data, fall back to text-parsed
    for (const key of Object.keys(scrapedData)) {
      if (!scrapedData[key] || (Array.isArray(scrapedData[key]) && scrapedData[key].length === 0)) {
        scrapedData[key] = (textParsed as any)[key] || scrapedData[key];
      }
    }

    // Cache the result
    if (event_uid) {
      await supabase.from('calendar_event_tripleseat_cache').upsert(
        {
          event_uid,
          tripleseat_url,
          scraped_data: scrapedData,
          scraped_at: new Date().toISOString(),
        },
        { onConflict: 'event_uid' }
      );
    }

    console.log('Scraped event data:', JSON.stringify(scrapedData).substring(0, 500));

    return new Response(
      JSON.stringify({ success: true, data: scrapedData, cached: false }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error scraping Triple Seat:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
