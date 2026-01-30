import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const userId = url.searchParams.get("userId");
    const action = url.searchParams.get("action");

    if (!userId || !action) {
      return createHtmlResponse("Error", "Missing userId or action parameter", false);
    }

    if (action !== "approve" && action !== "deny") {
      return createHtmlResponse("Error", "Invalid action. Must be 'approve' or 'deny'", false);
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Get user info first
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId);
    
    if (userError || !userData?.user) {
      console.error("Error fetching user:", userError);
      return createHtmlResponse("Error", "User not found", false);
    }

    const userEmail = userData.user.email || "Unknown";

    if (action === "approve") {
      // Add admin role to user
      const { error: roleError } = await supabaseAdmin
        .from("user_roles")
        .upsert(
          { user_id: userId, role: "admin" },
          { onConflict: "user_id,role" }
        );

      if (roleError) {
        console.error("Error adding admin role:", roleError);
        return createHtmlResponse("Error", "Failed to approve user: " + roleError.message, false);
      }

      console.log(`User ${userEmail} (${userId}) approved as admin`);
      return createHtmlResponse(
        "User Approved ✓",
        `${userEmail} has been granted admin access to ShowBlox.`,
        true
      );
    } else {
      // Deny - delete the user account
      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);

      if (deleteError) {
        console.error("Error deleting user:", deleteError);
        return createHtmlResponse("Error", "Failed to deny user: " + deleteError.message, false);
      }

      console.log(`User ${userEmail} (${userId}) denied and deleted`);
      return createHtmlResponse(
        "User Denied",
        `${userEmail}'s registration has been denied and their account has been removed.`,
        true
      );
    }
  } catch (error: unknown) {
    console.error("Error in approve-user:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return createHtmlResponse("Error", errorMessage, false);
  }
};

function createHtmlResponse(title: string, message: string, success: boolean): Response {
  const statusColor = success ? (title.includes("Denied") ? "#f59e0b" : "#22c55e") : "#ef4444";
  const icon = success ? (title.includes("Denied") ? "🚫" : "✓") : "✕";
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title} - ShowBlox</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background-color: #000;
          color: #fff;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }
        .container {
          max-width: 500px;
          width: 100%;
          background-color: #18181b;
          border-radius: 16px;
          padding: 50px 40px;
          text-align: center;
          border: 1px solid #27272a;
        }
        .logo {
          font-size: 28px;
          font-weight: bold;
          letter-spacing: 3px;
          margin-bottom: 40px;
          color: #fff;
        }
        .icon {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background-color: ${statusColor}20;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 24px;
          font-size: 36px;
          color: ${statusColor};
        }
        h1 {
          font-size: 24px;
          font-weight: 600;
          margin-bottom: 16px;
          color: #fff;
        }
        p {
          color: #a1a1aa;
          line-height: 1.6;
          font-size: 16px;
        }
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #27272a;
          color: #52525b;
          font-size: 12px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="logo">SHOWBLOX</div>
        <div class="icon">${icon}</div>
        <h1>${title}</h1>
        <p>${message}</p>
        <div class="footer">
          ShowBlox Creative Management System
        </div>
      </div>
    </body>
    </html>
  `;

  return new Response(html, {
    status: success ? 200 : 400,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      ...corsHeaders,
    },
  });
}

serve(handler);
