import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { event_uid, tripleseat_url } = await req.json();

    if (!tripleseat_url || !event_uid) {
      return new Response(
        JSON.stringify({ success: false, error: "event_uid and tripleseat_url are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const firecrawlKey = Deno.env.get("FIRECRAWL_API_KEY");
    if (!firecrawlKey) {
      return new Response(
        JSON.stringify({ success: false, error: "Firecrawl not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check cache first (1 hour TTL)
    const { data: cached } = await supabase
      .from("calendar_event_tripleseat_cache")
      .select("*")
      .eq("event_uid", event_uid)
      .maybeSingle();

    if (cached) {
      const age = Date.now() - new Date(cached.scraped_at).getTime();
      const ONE_HOUR = 60 * 60 * 1000;
      if (age < ONE_HOUR) {
        return new Response(
          JSON.stringify({ success: true, data: cached.scraped_data, cached: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Scrape with Firecrawl
    console.log("Scraping Triple Seat URL:", tripleseat_url);
    const scrapeResponse = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${firecrawlKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: tripleseat_url,
        formats: ["markdown"],
        onlyMainContent: true,
        waitFor: 3000,
      }),
    });

    const scrapeData = await scrapeResponse.json();

    if (!scrapeResponse.ok) {
      console.error("Firecrawl error:", scrapeData);
      return new Response(
        JSON.stringify({ success: false, error: `Scrape failed: ${scrapeData.error || scrapeResponse.status}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const markdown = scrapeData.data?.markdown || scrapeData.markdown || "";
    const metadata = scrapeData.data?.metadata || scrapeData.metadata || {};

    // Parse the markdown for event details
    const eventDetails = parseEventDetails(markdown);
    eventDetails.page_title = metadata.title || "";

    // Upsert cache
    await supabase
      .from("calendar_event_tripleseat_cache")
      .upsert({
        event_uid,
        tripleseat_url,
        scraped_data: eventDetails,
        scraped_at: new Date().toISOString(),
      }, { onConflict: "event_uid" });

    return new Response(
      JSON.stringify({ success: true, data: eventDetails, cached: false }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function parseEventDetails(markdown: string): Record<string, string> {
  const details: Record<string, string> = {};
  if (!markdown) return details;

  const lines = markdown.split("\n").map((l) => l.trim()).filter(Boolean);

  // Common Triple Seat field patterns
  const fieldPatterns = [
    { key: "Event Name", patterns: [/event\s*name\s*[:：]\s*(.+)/i, /^#\s*(.+)/] },
    { key: "Event ID", patterns: [/event\s*(?:id|#)\s*[:：]\s*(.+)/i, /(?:booking|event)\s*#?\s*[:：]?\s*(\d{5,})/i] },
    { key: "Event Date", patterns: [/(?:event\s*)?date\s*[:：]\s*(.+)/i] },
    { key: "Event Time", patterns: [/(?:event\s*)?time\s*[:：]\s*(.+)/i, /(\d{1,2}:\d{2}\s*(?:am|pm)\s*[-–]\s*\d{1,2}:\d{2}\s*(?:am|pm))/i] },
    { key: "Event Type", patterns: [/event\s*(?:type|style)\s*[:：]\s*(.+)/i] },
    { key: "Area", patterns: [/areas?\s*[:：]\s*(.+)/i, /rooms?\s*[:：]\s*(.+)/i, /spaces?\s*[:：]\s*(.+)/i] },
    { key: "Expected Guests", patterns: [/#?\s*expected\s*guests?\s*[:：]\s*(.+)/i, /expected\s*(?:guest\s*)?count\s*[:：]\s*(.+)/i, /guest\s*count\s*[:：]\s*(.+)/i] },
    { key: "Guaranteed Guests", patterns: [/#?\s*guaranteed\s*guests?\s*[:：]\s*(.+)/i] },
    { key: "Owner", patterns: [/owner\s*[:：]\s*(.+)/i, /assigned\s*to\s*[:：]\s*(.+)/i] },
    { key: "Manager", patterns: [/managers?\s*[:：]\s*(.+)/i] },
    { key: "Booking", patterns: [/booking\s*(?:type)?\s*[:：]\s*(.+)/i] },
    { key: "Lead Source", patterns: [/lead\s*source\s*[:：]\s*(.+)/i] },
    { key: "Status", patterns: [/(?:event\s*)?status\s*[:：]\s*(.+)/i] },
    { key: "Contact", patterns: [/(?:primary\s*)?contact\s*[:：]\s*(.+)/i] },
    { key: "Company", patterns: [/company\s*[:：]\s*(.+)/i, /organization\s*[:：]\s*(.+)/i] },
    { key: "Phone", patterns: [/phone\s*[:：]\s*(.+)/i] },
    { key: "Email", patterns: [/email\s*[:：]\s*(.+)/i] },
    { key: "Meal Periods", patterns: [/meal\s*periods?\s*[:：]\s*(.+)/i] },
    { key: "Created On", patterns: [/created\s*(?:on|at)?\s*[:：]\s*(.+)/i] },
    { key: "Updated At", patterns: [/updated\s*(?:on|at)?\s*[:：]\s*(.+)/i] },
  ];

  for (const line of lines) {
    // Skip URL-only lines
    if (/^https?:\/\//i.test(line)) continue;
    // Skip markdown formatting artifacts
    if (/^\*{2,}$/.test(line) || /^-{3,}$/.test(line) || /^\|/.test(line)) continue;

    for (const field of fieldPatterns) {
      if (details[field.key]) continue; // already found
      for (const pattern of field.patterns) {
        const match = line.match(pattern);
        if (match && match[1]) {
          const value = match[1].replace(/\*+/g, "").replace(/\|/g, "").trim();
          if (value && value.length > 0 && value.length < 500) {
            details[field.key] = value;
            break;
          }
        }
      }
    }

    // Generic key: value fallback
    const genericMatch = line.match(/^([A-Za-z][A-Za-z\s#]{1,30}?)\s*[:：]\s*(.{1,200})$/);
    if (genericMatch) {
      const key = genericMatch[1].trim();
      const value = genericMatch[2].replace(/\*+/g, "").trim();
      if (key && value && !details[key] && !/^https?$/i.test(key)) {
        details[key] = value;
      }
    }
  }

  return details;
}
