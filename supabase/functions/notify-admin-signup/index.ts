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
    
    // Create approval/denial URLs
    const approveUrl = `${SUPABASE_URL}/functions/v1/approve-user?userId=${userId}&action=approve`;
    const denyUrl = `${SUPABASE_URL}/functions/v1/approve-user?userId=${userId}&action=deny`;

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
              background: linear-gradient(135deg, #09090b 0%, #18181b 50%, #09090b 100%);
              color: #fff; 
              padding: 40px 20px;
              min-height: 100vh;
            }
            
            .document {
              max-width: 650px;
              margin: 0 auto;
              background: linear-gradient(180deg, #18181b 0%, #0f0f11 100%);
              border-radius: 16px;
              overflow: hidden;
              box-shadow: 
                0 0 0 1px rgba(255,255,255,0.05),
                0 25px 50px -12px rgba(0,0,0,0.8),
                0 0 100px -20px rgba(6,182,212,0.15);
            }
            
            /* Header Bar */
            .header-bar {
              height: 4px;
              background: linear-gradient(90deg, #06b6d4, #8b5cf6, #ec4899, #06b6d4);
              background-size: 300% 100%;
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
              width: 60px;
              height: 60px;
              background: linear-gradient(135deg, #06b6d4, #8b5cf6);
              border-radius: 12px;
              margin-bottom: 20px;
              box-shadow: 0 0 30px rgba(6,182,212,0.3);
            }
            
            .logo-mark svg {
              width: 32px;
              height: 32px;
              fill: white;
            }
            
            .brand-name {
              font-size: 24px;
              font-weight: 700;
              letter-spacing: 4px;
              color: #fff;
              margin-bottom: 8px;
            }
            
            .doc-type {
              font-size: 10px;
              letter-spacing: 3px;
              color: #71717a;
              text-transform: uppercase;
            }
            
            /* Document Body */
            .body {
              padding: 40px;
            }
            
            .section-title {
              font-size: 11px;
              font-weight: 600;
              letter-spacing: 2px;
              color: #06b6d4;
              text-transform: uppercase;
              margin-bottom: 20px;
              display: flex;
              align-items: center;
              gap: 12px;
            }
            
            .section-title::after {
              content: '';
              flex: 1;
              height: 1px;
              background: linear-gradient(90deg, rgba(6,182,212,0.3) 0%, transparent 100%);
            }
            
            .info-card {
              background: rgba(39,39,42,0.5);
              border: 1px solid rgba(255,255,255,0.05);
              border-radius: 12px;
              padding: 24px;
              margin-bottom: 30px;
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
              color: #06b6d4;
              background: rgba(6,182,212,0.1);
              padding: 6px 12px;
              border-radius: 6px;
              border: 1px solid rgba(6,182,212,0.2);
            }
            
            .info-value.pending {
              color: #f59e0b;
              display: flex;
              align-items: center;
              gap: 6px;
            }
            
            .pulse-dot {
              width: 8px;
              height: 8px;
              background: #f59e0b;
              border-radius: 50%;
              animation: pulse 2s infinite;
            }
            
            @keyframes pulse {
              0%, 100% { opacity: 1; transform: scale(1); }
              50% { opacity: 0.5; transform: scale(1.2); }
            }
            
            /* Message */
            .message {
              font-size: 14px;
              line-height: 1.8;
              color: #a1a1aa;
              margin-bottom: 30px;
              padding: 20px;
              background: rgba(6,182,212,0.05);
              border-left: 3px solid #06b6d4;
              border-radius: 0 8px 8px 0;
            }
            
            /* Action Buttons */
            .actions {
              display: flex;
              gap: 16px;
              margin-top: 30px;
            }
            
            .btn {
              flex: 1;
              display: inline-block;
              padding: 18px 24px;
              border-radius: 12px;
              text-decoration: none;
              font-family: 'JetBrains Mono', monospace;
              font-size: 12px;
              font-weight: 600;
              letter-spacing: 2px;
              text-transform: uppercase;
              text-align: center;
              transition: all 0.3s ease;
            }
            
            .btn-approve {
              background: linear-gradient(135deg, #22c55e, #16a34a);
              color: #fff;
              box-shadow: 
                0 0 20px rgba(34,197,94,0.4),
                0 0 40px rgba(34,197,94,0.2),
                inset 0 1px 0 rgba(255,255,255,0.2);
              border: 1px solid rgba(34,197,94,0.5);
            }
            
            .btn-approve:hover {
              box-shadow: 
                0 0 30px rgba(34,197,94,0.6),
                0 0 60px rgba(34,197,94,0.3),
                inset 0 1px 0 rgba(255,255,255,0.2);
              transform: translateY(-2px);
            }
            
            .btn-deny {
              background: linear-gradient(135deg, #ef4444, #dc2626);
              color: #fff;
              box-shadow: 
                0 0 20px rgba(239,68,68,0.4),
                0 0 40px rgba(239,68,68,0.2),
                inset 0 1px 0 rgba(255,255,255,0.2);
              border: 1px solid rgba(239,68,68,0.5);
            }
            
            .btn-deny:hover {
              box-shadow: 
                0 0 30px rgba(239,68,68,0.6),
                0 0 60px rgba(239,68,68,0.3),
                inset 0 1px 0 rgba(255,255,255,0.2);
              transform: translateY(-2px);
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
                <a href="${approveUrl}" class="btn btn-approve">✓ Approve Access</a>
                <a href="${denyUrl}" class="btn btn-deny">✕ Deny Request</a>
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
