// Soleia Creative — proposal-export
// Exposes signed/accepted proposals (and their line items + Tripleseat
// calendar associations) so DSXBooks can aggregate billing data from both
// the DSX Studios and Soleia Creative projects with one consumer shape.

import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Two auth modes:
    //  1) Machine-to-machine: x-api-key header matches DSXBOOKS_EXPORT_KEY
    //  2) Admin user JWT: Authorization: Bearer <jwt> with admin role
    const exportKey = Deno.env.get("DSXBOOKS_EXPORT_KEY");
    const providedKey = req.headers.get("x-api-key");
    let authorized = false;

    if (exportKey && providedKey && providedKey === exportKey) {
      authorized = true;
    } else {
      const authHeader = req.headers.get("Authorization");
      if (!authHeader) {
        return new Response(
          JSON.stringify({ error: "Unauthorized" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      const userClient = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: { user }, error: authError } = await userClient.auth.getUser();
      if (authError || !user) {
        return new Response(
          JSON.stringify({ error: "Unauthorized" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      const { data: isAdmin, error: adminErr } = await userClient.rpc("has_role", {
        _user_id: user.id,
        _role: "admin",
      });
      if (adminErr || !isAdmin) {
        return new Response(
          JSON.stringify({ error: "Forbidden" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      authorized = true;
    }

    if (!authorized) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabase = createClient(supabaseUrl, serviceKey);

    const url = new URL(req.url);
    // Soleia stores signed proposals with status = 'accepted' (DSX uses 'signed').
    // Default to 'accepted' here; DSXBooks can override per source.
    const status = url.searchParams.get("status") || "accepted";
    const since = url.searchParams.get("since"); // ISO timestamp

    let query = supabase
      .from("proposals")
      .select("*")
      .eq("is_active", true)
      .eq("status", status)
      .order("signed_at", { ascending: false });

    if (since) {
      query = query.gte("signed_at", since);
    }

    const { data: proposals, error: proposalsError } = await query;
    if (proposalsError) throw proposalsError;

    if (!proposals || proposals.length === 0) {
      return new Response(
        JSON.stringify({
          proposals: [],
          items: [],
          clients: [],
          events: [],
          associations: [],
          exported_at: new Date().toISOString(),
          source: "soleia",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const proposalIds = proposals.map((p: any) => p.id);

    // Line items for all returned proposals
    const { data: items, error: itemsError } = await supabase
      .from("proposal_items")
      .select("*")
      .in("proposal_id", proposalIds)
      .order("sort_order", { ascending: true });
    if (itemsError) throw itemsError;

    // Tripleseat calendar associations — lets DSXBooks tie a Soleia proposal
    // to the same Tripleseat event it already knows from DSX.
    const { data: assocRows, error: assocError } = await supabase
      .from("calendar_event_associations")
      .select("entity_id, event_uid")
      .eq("entity_type", "proposal")
      .in("entity_id", proposalIds);
    if (assocError) throw assocError;

    const associations = (assocRows || []).map((a: any) => ({
      proposal_id: a.entity_id,
      event_uid: a.event_uid,
    }));

    return new Response(
      JSON.stringify({
        proposals,
        items: items || [],
        // Soleia has no separate clients/events tables — return empty arrays
        // so the consumer shape matches the DSX Studios export response.
        clients: [],
        events: [],
        associations,
        exported_at: new Date().toISOString(),
        source: "soleia",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("proposal-export error:", err);
    return new Response(
      JSON.stringify({ error: "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
