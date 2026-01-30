import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface SignupNotificationRequest {
  userEmail: string;
  userId: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userEmail, userId }: SignupNotificationRequest = await req.json();

    if (!userEmail || !userId) {
      throw new Error("Missing required fields");
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
    
    // Create approval/denial URLs (these would link to an admin action endpoint)
    const approveUrl = `${SUPABASE_URL}/functions/v1/approve-user?userId=${userId}&action=approve`;
    const denyUrl = `${SUPABASE_URL}/functions/v1/approve-user?userId=${userId}&action=deny`;

    const emailResponse = await resend.emails.send({
      from: "ShowBlox <noreply@ninemilelion.com>",
      to: ["ninemilelion@gmail.com"],
      subject: "New Admin Registration Request - ShowBlox",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #000; color: #fff; padding: 40px; }
            .container { max-width: 600px; margin: 0 auto; background-color: #18181b; border-radius: 12px; padding: 40px; }
            .logo { text-align: center; margin-bottom: 30px; }
            .logo h1 { font-size: 28px; font-weight: bold; letter-spacing: 2px; margin: 0; }
            h2 { color: #fff; margin-bottom: 20px; }
            p { color: #a1a1aa; line-height: 1.6; }
            .user-email { background-color: #27272a; padding: 15px 20px; border-radius: 8px; margin: 20px 0; }
            .user-email strong { color: #fff; }
            .buttons { margin-top: 30px; text-align: center; }
            .btn { display: inline-block; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 0 10px; }
            .btn-approve { background-color: #22c55e; color: #fff; }
            .btn-deny { background-color: #ef4444; color: #fff; }
            .footer { margin-top: 40px; text-align: center; color: #71717a; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="logo">
              <h1>SHOWBLOX</h1>
            </div>
            <h2>New Admin Registration Request</h2>
            <p>A new user has requested admin access to the ShowBlox portal:</p>
            <div class="user-email">
              <strong>Email:</strong> ${userEmail}
            </div>
            <p>Please review this request and approve or deny access:</p>
            <div class="buttons">
              <a href="${approveUrl}" class="btn btn-approve">✓ Approve</a>
              <a href="${denyUrl}" class="btn btn-deny">✕ Deny</a>
            </div>
            <div class="footer">
              <p>ShowBlox Creative Management System</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log("Admin notification email sent:", emailResponse);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: unknown) {
    console.error("Error sending notification:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
