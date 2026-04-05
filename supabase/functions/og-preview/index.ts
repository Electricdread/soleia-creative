import { createClient } from "https://esm.sh/@supabase/supabase-js@2.91.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const token = url.searchParams.get("token");
  const type = url.searchParams.get("type") || "creative"; // creative | session

  if (!token) {
    return new Response("Missing token", { status: 400, headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  let title = "Soleia Creative";
  let description = "Creative collaboration session";
  let imageUrl = "";
  let pageUrl = "";

  const siteOrigin = "https://soleia-creative.lovable.app";

  if (type === "creative") {
    const { data } = await supabase
      .from("creative_sessions")
      .select("project_name, client_name, cover_images, event_date, creative_notes")
      .eq("token", token)
      .eq("is_active", true)
      .maybeSingle();

    if (data) {
      title = `${data.project_name} — ${data.client_name}`;
      description = data.creative_notes
        ? data.creative_notes.substring(0, 160)
        : `Creative session for ${data.client_name}`;
      if (data.event_date) {
        description += ` • ${data.event_date}`;
      }
      const covers = data.cover_images as any[];
      if (covers?.length > 0 && covers[0]?.url) {
        imageUrl = covers[0].url;
      }
      pageUrl = `${siteOrigin}/creative/${token}`;
    }
  } else if (type === "session") {
    const { data } = await supabase
      .from("client_links")
      .select("event_name, client_name, event_date")
      .eq("token", token)
      .eq("is_active", true)
      .maybeSingle();

    if (data) {
      title = `${data.event_name} — ${data.client_name}`;
      description = `Content selection session for ${data.client_name}`;
      if (data.event_date) {
        description += ` • ${data.event_date}`;
      }
      pageUrl = `${siteOrigin}/session/${token}`;
    }
  }

  if (!pageUrl) {
    return new Response("Not found", { status: 404, headers: corsHeaders });
  }

  // Return JSON for API calls, HTML for crawlers
  const accept = req.headers.get("accept") || "";
  if (accept.includes("application/json")) {
    return new Response(
      JSON.stringify({ title, description, image: imageUrl, url: pageUrl }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Serve OG HTML that redirects to the real page
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}" />
  
  <!-- Open Graph -->
  <meta property="og:type" content="website" />
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  <meta property="og:url" content="${escapeHtml(pageUrl)}" />
  ${imageUrl ? `<meta property="og:image" content="${escapeHtml(imageUrl)}" />` : ""}
  
  <!-- Twitter Card -->
  <meta name="twitter:card" content="${imageUrl ? "summary_large_image" : "summary"}" />
  <meta name="twitter:title" content="${escapeHtml(title)}" />
  <meta name="twitter:description" content="${escapeHtml(description)}" />
  ${imageUrl ? `<meta name="twitter:image" content="${escapeHtml(imageUrl)}" />` : ""}
  
  <!-- Redirect to actual page -->
  <meta http-equiv="refresh" content="0;url=${escapeHtml(pageUrl)}" />
  <link rel="canonical" href="${escapeHtml(pageUrl)}" />
</head>
<body>
  <p>Redirecting to <a href="${escapeHtml(pageUrl)}">${escapeHtml(title)}</a>...</p>
</body>
</html>`;

  return new Response(html, {
    headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8" },
  });
});

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
