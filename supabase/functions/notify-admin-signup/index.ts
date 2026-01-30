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
    const timestamp = new Date().toLocaleString('en-US', { 
      timeZone: 'America/New_York',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    // Create approval URL - goes to the app management page
    const managementUrl = `https://showblox-soleia.lovable.app/admin/users?userId=${userId}&action=approve`;

    const emailResponse = await resend.emails.send({
      from: "ShowBlox <onboarding@resend.dev>",
      to: ["ninemilelion@gmail.com"],
      subject: "🔐 Admin Access Request - ShowBlox Portal",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&display=swap');
            
            * { margin: 0; padding: 0; box-sizing: border-box; }
            
            body { 
              font-family: 'JetBrains Mono', monospace;
              background: #09090b;
              color: #fff; 
              padding: 20px;
              min-height: 100vh;
            }
            
            .document {
              max-width: 600px;
              margin: 0 auto;
              background: #18181b;
              border-radius: 12px;
              overflow: hidden;
              border: 1px solid #27272a;
              box-shadow: 0 25px 50px -12px rgba(0,0,0,0.8);
            }
            
            /* Header Bar */
            .header-bar {
              height: 3px;
              background: #3f3f46;
            }
            
            /* Document Header */
            .header {
              padding: 40px 40px 30px;
              border-bottom: 1px solid rgba(255,255,255,0.05);
              text-align: center;
            }
            
            .logo-mark {
              display: inline-flex;
              align-items: center;
              justify-content: center;
              width: 56px;
              height: 56px;
              background: #27272a;
              border-radius: 10px;
              margin-bottom: 16px;
              border: 1px solid #3f3f46;
            }
            
            .logo-mark svg {
              width: 28px;
              height: 28px;
              fill: #a1a1aa;
            }
            
            .brand-name {
              font-size: 20px;
              font-weight: 700;
              letter-spacing: 4px;
              color: #fafafa;
              margin-bottom: 6px;
            }
            
            .doc-type {
              font-size: 9px;
              letter-spacing: 2px;
              color: #52525b;
              text-transform: uppercase;
            }
            
            /* Document Body */
            .body {
              padding: 40px;
            }
            
            .section-title {
              font-size: 10px;
              font-weight: 600;
              letter-spacing: 2px;
              color: #71717a;
              text-transform: uppercase;
              margin-bottom: 16px;
              display: flex;
              align-items: center;
              gap: 10px;
            }
            
            .section-title::after {
              content: '';
              flex: 1;
              height: 1px;
              background: #27272a;
            }
            
            .info-card {
              background: #09090b;
              border: 1px solid #27272a;
              border-radius: 10px;
              padding: 20px;
              margin-bottom: 24px;
            }
            
            .info-row {
              display: flex;
              justify-content: space-between;
              align-items: center;
              padding: 12px 0;
              border-bottom: 1px solid rgba(255,255,255,0.03);
            }
            
            .info-row:last-child {
              border-bottom: none;
            }
            
            .info-label {
              font-size: 11px;
              letter-spacing: 1px;
              color: #71717a;
              text-transform: uppercase;
            }
            
            .info-value {
              font-size: 14px;
              font-weight: 500;
              color: #fff;
            }
            
            .info-value.email {
              color: #fafafa;
              background: #27272a;
              padding: 6px 12px;
              border-radius: 6px;
              border: 1px solid #3f3f46;
              font-size: 13px;
            }
            
            .info-value.pending {
              color: #a1a1aa;
              display: flex;
              align-items: center;
              gap: 6px;
            }
            
            .pulse-dot {
              width: 6px;
              height: 6px;
              background: #71717a;
              border-radius: 50%;
              animation: pulse 2s infinite;
            }
            
            @keyframes pulse {
              0%, 100% { opacity: 1; transform: scale(1); }
              50% { opacity: 0.5; transform: scale(1.2); }
            }
            
            /* Message */
            .message {
              font-size: 13px;
              line-height: 1.7;
              color: #71717a;
              margin-bottom: 24px;
              padding: 16px;
              background: #09090b;
              border-left: 2px solid #3f3f46;
              border-radius: 0 8px 8px 0;
            }
            
            /* Action Buttons */
            .actions {
              display: flex;
              gap: 12px;
              margin-top: 24px;
              flex-direction: column;
            }
            
            @media (min-width: 480px) {
              .actions {
                flex-direction: row;
              }
            }
            
            .btn {
              flex: 1;
              display: inline-block;
              padding: 16px 20px;
              border-radius: 8px;
              text-decoration: none;
              font-family: 'JetBrains Mono', monospace;
              font-size: 11px;
              font-weight: 600;
              letter-spacing: 1.5px;
              text-transform: uppercase;
              text-align: center;
              transition: all 0.2s ease;
            }
            
            .btn-approve {
              background: #22c55e;
              color: #fff;
              box-shadow: 0 0 20px rgba(34,197,94,0.3);
              border: none;
            }
            
            .btn-approve:hover {
              background: #16a34a;
              box-shadow: 0 0 30px rgba(34,197,94,0.5);
              transform: translateY(-1px);
            }
            
            .btn-deny {
              background: #27272a;
              color: #a1a1aa;
              border: 1px solid #3f3f46;
            }
            
            .btn-deny:hover {
              background: #3f3f46;
              color: #fafafa;
              transform: translateY(-1px);
            }
            
            /* Footer */
            .footer {
              padding: 30px 40px;
              border-top: 1px solid rgba(255,255,255,0.05);
              text-align: center;
            }
            
            .footer-text {
              font-size: 10px;
              letter-spacing: 2px;
              color: #52525b;
              text-transform: uppercase;
            }
            
            .doc-id {
              font-size: 9px;
              color: #3f3f46;
              margin-top: 10px;
              font-family: 'JetBrains Mono', monospace;
            }
          </style>
        </head>
        <body>
          <div class="document">
            <div class="header-bar"></div>
            
            <div class="header">
              <div class="logo-mark">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="white"/>
                  <path d="M2 17L12 22L22 17" stroke="white" stroke-width="2"/>
                  <path d="M2 12L12 17L22 12" stroke="white" stroke-width="2"/>
                </svg>
              </div>
              <div class="brand-name">SHOWBLOX</div>
              <div class="doc-type">Access Authorization Request</div>
            </div>
            
            <div class="body">
              <div class="section-title">Request Details</div>
              
              <div class="info-card">
                <div class="info-row">
                  <span class="info-label">Applicant Email</span>
                  <span class="info-value email">${userEmail}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Request Type</span>
                  <span class="info-value">Admin Portal Access</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Submitted</span>
                  <span class="info-value">${timestamp}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Status</span>
                  <span class="info-value pending">
                    <span class="pulse-dot"></span>
                    Pending Review
                  </span>
                </div>
              </div>
              
              <div class="message">
                A new user has requested administrative access to the ShowBlox Creative Management System. 
                Please review this request and take appropriate action. Approved users will receive 
                full access to all portal features.
              </div>
              
              <div class="section-title">Authorization Action</div>
              
              <div class="actions">
                <a href="${managementUrl}" class="btn btn-approve">✓ Review & Approve Access</a>
              </div>
            </div>
            
            <div class="footer">
              <div class="footer-text">ShowBlox Creative Management System</div>
              <div class="doc-id">REF: ${userId.slice(0, 8).toUpperCase()}</div>
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
