import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    let userId: string | null = null;
    let action: string | null = null;

    // Support both query params (from email links) and POST body (from app)
    if (req.method === "GET") {
      const url = new URL(req.url);
      userId = url.searchParams.get("userId");
      action = url.searchParams.get("action");
      
      // For GET requests (email links), redirect to the app management page
      if (userId && action) {
        const appUrl = `https://showblox-soleia.lovable.app/admin/users?userId=${userId}&action=${action}`;
        return Response.redirect(appUrl, 302);
      }
    } else if (req.method === "POST") {
      const body = await req.json();
      userId = body.userId;
      action = body.action;
    }

    console.log("Received request - userId:", userId, "action:", action);

    if (!userId || !action) {
      return new Response(
        JSON.stringify({ error: "Missing userId or action parameter" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Validate UUID format
    if (!UUID_REGEX.test(userId)) {
      console.error("Invalid UUID format:", userId);
      return new Response(
        JSON.stringify({ error: "Invalid user ID format" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (action !== "approve" && action !== "deny") {
      return new Response(
        JSON.stringify({ error: "Action must be 'approve' or 'deny'" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    if (action === "approve") {
      // Check if user already has admin role
      const { data: existingRole } = await supabaseAdmin
        .from("user_roles")
        .select("id")
        .eq("user_id", userId)
        .eq("role", "admin")
        .maybeSingle();

      if (existingRole) {
        return new Response(
          JSON.stringify({ success: true, message: "User already has admin access" }),
          { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      // Add admin role to user - using upsert to handle edge cases
      const { error: roleError } = await supabaseAdmin
        .from("user_roles")
        .upsert({ user_id: userId, role: "admin" }, { onConflict: "user_id,role" });

      if (roleError) {
        console.error("Error adding admin role:", roleError);
        return new Response(
          JSON.stringify({ error: roleError.message }),
          { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      console.log(`User ${userId} approved as admin`);
      return new Response(
        JSON.stringify({ success: true, message: "User approved successfully" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    } else {
      // Deny - delete the user account
      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);

      if (deleteError) {
        // If user not found, that's okay - they may have been already deleted
        if (deleteError.message.includes("not found")) {
          console.log(`User ${userId} not found - may have been already deleted`);
          return new Response(
            JSON.stringify({ success: true, message: "User already removed" }),
            { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }
        
        console.error("Error deleting user:", deleteError);
        return new Response(
          JSON.stringify({ error: deleteError.message }),
          { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      console.log(`User ${userId} denied and deleted`);
      return new Response(
        JSON.stringify({ success: true, message: "User denied and removed" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }
  } catch (error: unknown) {
    console.error("Error in approve-user:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
