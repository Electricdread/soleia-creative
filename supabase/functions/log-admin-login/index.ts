import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });

// Called once per real sign-in (see useAuth's SIGNED_IN handler). Only
// records the event when the signed-in account currently holds the admin
// role — a pending signup hitting /admin/login isn't one yet.
const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return json(405, { error: "Method not allowed" });
  }

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.toLowerCase().startsWith("bearer ")) {
      return json(401, { error: "Authentication required" });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const token = authHeader.slice(7).trim();
    const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser(token);
    if (userErr || !userData?.user) {
      return json(401, { error: "Invalid or expired session" });
    }
    const caller = userData.user;

    const { data: roleRow } = await supabaseAdmin
      .from("user_roles")
      .select("id")
      .eq("user_id", caller.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleRow) {
      return json(200, { logged: false });
    }

    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      req.headers.get("cf-connecting-ip") ??
      null;
    const userAgent = req.headers.get("user-agent");

    const { error: insertErr } = await supabaseAdmin.from("admin_login_events").insert({
      user_id: caller.id,
      email: caller.email,
      ip_address: ip,
      user_agent: userAgent,
    });

    if (insertErr) {
      console.error("Error logging admin login:", insertErr);
      return json(500, { error: insertErr.message });
    }

    return json(200, { logged: true });
  } catch (error: unknown) {
    console.error("Error in log-admin-login:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return json(500, { error: message });
  }
};

serve(handler);
