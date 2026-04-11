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
  const type = url.searchParams.get("type") || "creative";

  if (!token) {
    return new Response("Missing token", { status: 400, headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  let title = "Soleia Creative";
  let description = "Soleia Las Vegas";
  let imageUrl = "";
  let pageUrl = "";

  const siteOrigin = "https://soleiacreative.app";

  if (type === "creative") {
    const { data } = await supabase
      .from("creative_sessions")
      .select("project_name, client_name, cover_images, event_date, creative_notes")
      .eq("token", token)
      .eq("is_active", true)
      .maybeSingle();

    if (data) {
      title = `${data.project_name} — ${data.client_name} | Soleia Creative`;
      description = data.creative_notes
        ? data.creative_notes.substring(0, 160)
        : `Creative session for ${data.client_name} at Soleia Las Vegas`;
      if (data.event_date) description += ` • ${data.event_date}`;
      const covers = data.cover_images as any[];
      if (covers?.length > 0 && covers[0]?.url) imageUrl = covers[0].url;
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
      title = `${data.event_name} — ${data.client_name} | Soleia Creative`;
      description = `Content selection session for ${data.client_name} at Soleia Las Vegas`;
      if (data.event_date) description += ` • ${data.event_date}`;
      pageUrl = `${siteOrigin}/session/${token}`;
    }
  } else if (type === "proposal") {
    const { data } = await supabase
      .from("proposals")
      .select("event_name, client_name, venue_name, event_date, status, notes")
      .eq("token", token)
      .eq("is_active", true)
      .maybeSingle();

    if (data) {
      const statusLabel = data.status === "signed" ? "✅ Signed" : data.status === "sent" ? "📋 Pending" : "";
      title = `Proposal: ${data.event_name} — ${data.client_name} | Soleia Creative`;
      description = `${statusLabel ? statusLabel + " — " : ""}Event proposal for ${data.client_name}`;
      if (data.venue_name) description += ` at ${data.venue_name}`;
      if (data.event_date) description += ` • ${data.event_date}`;
      pageUrl = `${siteOrigin}/proposal/${token}`;
    }
  } else if (type === "delivery") {
    const { data } = await supabase
      .from("creative_sessions")
      .select("project_name, client_name, cover_images, event_date")
      .eq("token", token)
      .eq("is_active", true)
      .maybeSingle();

    if (data) {
      title = `Delivery Guide: ${data.project_name} — ${data.client_name} | Soleia Creative`;
      description = `Content delivery guide & specs for ${data.client_name} at Soleia Las Vegas`;
      if (data.event_date) description += ` • ${data.event_date}`;
      const covers = data.cover_images as any[];
      if (covers?.length > 0 && covers[0]?.url) imageUrl = covers[0].url;
      pageUrl = `${siteOrigin}/delivery/${token}`;
    }
  } else if (type === "preview") {
    const { data: linkData } = await supabase
      .from("client_links")
      .select("event_name, client_name")
      .eq("token", token)
      .eq("is_active", true)
      .maybeSingle();

    if (linkData) {
      title = `Content Preview: ${linkData.event_name} — ${linkData.client_name} | Soleia Creative`;
      description = `Video preview for ${linkData.client_name} at Soleia Las Vegas`;
      pageUrl = `${siteOrigin}/preview/${token}`;
    }
  }

  if (!pageUrl) {
    return new Response("Not found", { status: 404, headers: corsHeaders });
  }

  const accept = req.headers.get("accept") || "";
  if (accept.includes("application/json")) {
    return new Response(
      JSON.stringify({ title, description, image: imageUrl, url: pageUrl, type }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}" />
  <meta property="og:type" content="website" />
  <meta property="og:title" content="${esc(title)}" />
  <meta property="og:description" content="${esc(description)}" />
  <meta property="og:url" content="${esc(pageUrl)}" />
  <meta property="og:site_name" content="Soleia Creative" />
  ${imageUrl ? `<meta property="og:image" content="${esc(imageUrl)}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />` : ""}
  <meta name="twitter:card" content="${imageUrl ? "summary_large_image" : "summary"}" />
  <meta name="twitter:title" content="${esc(title)}" />
  <meta name="twitter:description" content="${esc(description)}" />
  ${imageUrl ? `<meta name="twitter:image" content="${esc(imageUrl)}" />` : ""}
  <meta http-equiv="refresh" content="0;url=${esc(pageUrl)}" />
  <link rel="canonical" href="${esc(pageUrl)}" />
</head>
<body>
  <p>Redirecting to <a href="${esc(pageUrl)}">${esc(title)}</a>...</p>
</body>
</html>`;

  return new Response(html, {
    headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8" },
  });
});

function esc(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
