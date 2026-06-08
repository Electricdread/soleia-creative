import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // GET requests come from email links; redirect to the app where the
    // signed-in admin will trigger the protected POST call.
    if (req.method === "GET") {
      const url = new URL(req.url);
      const userId = url.searchParams.get("userId");
      const action = url.searchParams.get("action");
      if (userId && action) {
        const appUrl = `https://soleiacreative.app/admin/users?userId=${userId}&action=${action}`;
        return Response.redirect(appUrl, 302);
      }
      return json(400, { error: "Missing userId or action parameter" });
    }

    if (req.method !== "POST") {
      return json(405, { error: "Method not allowed" });
    }

    // Verify the caller is an authenticated admin.
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
    const callerId = userData.user.id;

    const { data: roleRow, error: roleLookupErr } = await supabaseAdmin
      .from("user_roles")
      .select("id")
      .eq("user_id", callerId)
      .eq("role", "admin")
      .maybeSingle();
    if (roleLookupErr || !roleRow) {
      return json(403, { error: "Admin privileges required" });
    }

    const body = await req.json().catch(() => ({}));
    const userId: string | null = body?.userId ?? null;
    const action: string | null = body?.action ?? null;

    if (!userId || !action) {
      return json(400, { error: "Missing userId or action parameter" });
    }
    if (!UUID_REGEX.test(userId)) {
      return json(400, { error: "Invalid user ID format" });
    }
    if (action !== "approve" && action !== "deny") {
      return json(400, { error: "Action must be 'approve' or 'deny'" });
    }

    if (action === "approve") {
      const { data: existingRole } = await supabaseAdmin
        .from("user_roles")
        .select("id")
        .eq("user_id", userId)
        .eq("role", "admin")
        .maybeSingle();

      if (existingRole) {
        return json(200, { success: true, message: "User already has admin access" });
      }

      const { error: roleError } = await supabaseAdmin
        .from("user_roles")
        .upsert({ user_id: userId, role: "admin" }, { onConflict: "user_id,role" });

      if (roleError) {
        console.error("Error adding admin role:", roleError);
        return json(500, { error: roleError.message });
      }

      console.log(`User ${userId} approved as admin by ${callerId}`);
      return json(200, { success: true, message: "User approved successfully" });
    }

    // Deny – delete the user account
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (deleteError) {
      if (deleteError.message.includes("not found")) {
        return json(200, { success: true, message: "User already removed" });
      }
      console.error("Error deleting user:", deleteError);
      return json(500, { error: deleteError.message });
    }
    console.log(`User ${userId} denied and deleted by ${callerId}`);
    return json(200, { success: true, message: "User denied and removed" });
  } catch (error: unknown) {
    console.error("Error in approve-user:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return json(500, { error: errorMessage });
  }
};

serve(handler);
