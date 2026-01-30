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
    const url = new URL(req.url);
    const userId = url.searchParams.get("userId");
    const action = url.searchParams.get("action");

    console.log("Received request - userId:", userId, "action:", action);

    if (!userId || !action) {
      return createHtmlResponse("error", "Missing userId or action parameter", "", "Missing required parameters");
    }

    // Validate UUID format
    if (!UUID_REGEX.test(userId)) {
      console.error("Invalid UUID format:", userId);
      return createHtmlResponse("error", "Invalid user ID format", "", "The user ID provided is not valid");
    }

    if (action !== "approve" && action !== "deny") {
      return createHtmlResponse("error", "Invalid action", "", "Action must be 'approve' or 'deny'");
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
      return createHtmlResponse("error", "User not found", "", "This user may have already been processed or doesn't exist");
    }

    const userEmail = userData.user.email || "Unknown";

    if (action === "approve") {
      // Check if user already has admin role
      const { data: existingRole } = await supabaseAdmin
        .from("user_roles")
        .select("id")
        .eq("user_id", userId)
        .eq("role", "admin")
        .maybeSingle();

      if (existingRole) {
        return createHtmlResponse("info", "Already Approved", userEmail, "This user already has admin access to ShowBlox");
      }

      // Add admin role to user
      const { error: roleError } = await supabaseAdmin
        .from("user_roles")
        .insert({ user_id: userId, role: "admin" });

      if (roleError) {
        console.error("Error adding admin role:", roleError);
        return createHtmlResponse("error", "Approval Failed", userEmail, roleError.message);
      }

      console.log(`User ${userEmail} (${userId}) approved as admin`);
      return createHtmlResponse("approved", "Access Granted", userEmail, "This user now has full admin access to ShowBlox");
    } else {
      // Deny - delete the user account
      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);

      if (deleteError) {
        console.error("Error deleting user:", deleteError);
        return createHtmlResponse("error", "Denial Failed", userEmail, deleteError.message);
      }

      console.log(`User ${userEmail} (${userId}) denied and deleted`);
      return createHtmlResponse("denied", "Access Denied", userEmail, "This user's registration has been denied and their account removed");
    }
  } catch (error: unknown) {
    console.error("Error in approve-user:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return createHtmlResponse("error", "System Error", "", errorMessage);
  }
};

function createHtmlResponse(
  status: "approved" | "denied" | "error" | "info",
  title: string,
  email: string,
  message: string
): Response {
  const configs = {
    approved: {
      gradient: "linear-gradient(135deg, #22c55e, #16a34a)",
      glow: "rgba(34,197,94,0.4)",
      icon: `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`,
      color: "#22c55e",
    },
    denied: {
      gradient: "linear-gradient(135deg, #f59e0b, #d97706)",
      glow: "rgba(245,158,11,0.4)",
      icon: `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line></svg>`,
      color: "#f59e0b",
    },
    error: {
      gradient: "linear-gradient(135deg, #ef4444, #dc2626)",
      glow: "rgba(239,68,68,0.4)",
      icon: `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`,
      color: "#ef4444",
    },
    info: {
      gradient: "linear-gradient(135deg, #06b6d4, #0891b2)",
      glow: "rgba(6,182,212,0.4)",
      icon: `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`,
      color: "#06b6d4",
    },
  };

  const config = configs[status];
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title} - ShowBlox</title>
      <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
          font-family: 'JetBrains Mono', monospace;
          background: linear-gradient(135deg, #09090b 0%, #18181b 50%, #09090b 100%);
          color: #fff;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          position: relative;
          overflow: hidden;
        }
        
        /* Animated background grid */
        body::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image: 
            radial-gradient(circle at 1px 1px, rgba(255,255,255,0.03) 1px, transparent 0);
          background-size: 40px 40px;
          pointer-events: none;
        }
        
        /* Glow orbs */
        .orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          opacity: 0.3;
          pointer-events: none;
        }
        
        .orb-1 {
          width: 400px;
          height: 400px;
          background: ${config.glow};
          top: -200px;
          left: -100px;
          animation: float 8s ease-in-out infinite;
        }
        
        .orb-2 {
          width: 300px;
          height: 300px;
          background: rgba(139,92,246,0.3);
          bottom: -150px;
          right: -100px;
          animation: float 10s ease-in-out infinite reverse;
        }
        
        @keyframes float {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(30px, -30px) scale(1.1); }
        }
        
        .container {
          position: relative;
          max-width: 500px;
          width: 100%;
          background: linear-gradient(180deg, rgba(24,24,27,0.95) 0%, rgba(15,15,17,0.95) 100%);
          border-radius: 24px;
          overflow: hidden;
          box-shadow: 
            0 0 0 1px rgba(255,255,255,0.05),
            0 25px 50px -12px rgba(0,0,0,0.8),
            0 0 100px -20px ${config.glow};
          backdrop-filter: blur(20px);
        }
        
        /* Gradient bar */
        .gradient-bar {
          height: 4px;
          background: linear-gradient(90deg, #06b6d4, #8b5cf6, #ec4899, #06b6d4);
          background-size: 300% 100%;
          animation: gradient-flow 4s linear infinite;
        }
        
        @keyframes gradient-flow {
          0% { background-position: 0% 50%; }
          100% { background-position: 300% 50%; }
        }
        
        .content {
          padding: 50px 40px;
          text-align: center;
        }
        
        /* Logo */
        .logo {
          font-size: 20px;
          font-weight: 700;
          letter-spacing: 4px;
          color: #fff;
          margin-bottom: 40px;
          opacity: 0.7;
        }
        
        /* Status Icon */
        .icon-wrapper {
          width: 100px;
          height: 100px;
          border-radius: 50%;
          background: ${config.gradient};
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 30px;
          box-shadow: 
            0 0 40px ${config.glow},
            0 0 80px ${config.glow},
            inset 0 0 30px rgba(255,255,255,0.1);
          animation: icon-glow 2s ease-in-out infinite;
        }
        
        @keyframes icon-glow {
          0%, 100% { 
            box-shadow: 
              0 0 40px ${config.glow},
              0 0 80px ${config.glow},
              inset 0 0 30px rgba(255,255,255,0.1);
          }
          50% { 
            box-shadow: 
              0 0 60px ${config.glow},
              0 0 120px ${config.glow},
              inset 0 0 40px rgba(255,255,255,0.15);
          }
        }
        
        h1 {
          font-size: 28px;
          font-weight: 700;
          margin-bottom: 16px;
          color: #fff;
          letter-spacing: 1px;
        }
        
        .email {
          display: inline-block;
          font-size: 14px;
          font-weight: 500;
          color: ${config.color};
          background: ${config.color}15;
          padding: 10px 20px;
          border-radius: 8px;
          border: 1px solid ${config.color}30;
          margin-bottom: 20px;
        }
        
        .message {
          font-size: 14px;
          line-height: 1.8;
          color: #a1a1aa;
          max-width: 380px;
          margin: 0 auto;
        }
        
        ${status === "approved" ? `
        .cta {
          display: inline-block;
          margin-top: 30px;
          padding: 14px 32px;
          background: ${config.gradient};
          color: #fff;
          text-decoration: none;
          border-radius: 10px;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 2px;
          text-transform: uppercase;
          box-shadow: 0 0 30px ${config.glow};
          transition: all 0.3s ease;
        }
        
        .cta:hover {
          transform: translateY(-2px);
          box-shadow: 0 0 50px ${config.glow};
        }
        ` : ''}
        
        .footer {
          padding: 24px 40px;
          border-top: 1px solid rgba(255,255,255,0.05);
          text-align: center;
        }
        
        .footer-text {
          font-size: 10px;
          letter-spacing: 2px;
          color: #52525b;
          text-transform: uppercase;
        }
      </style>
    </head>
    <body>
      <div class="orb orb-1"></div>
      <div class="orb orb-2"></div>
      
      <div class="container">
        <div class="gradient-bar"></div>
        
        <div class="content">
          <div class="logo">SHOWBLOX</div>
          
          <div class="icon-wrapper">
            ${config.icon}
          </div>
          
          <h1>${title}</h1>
          
          ${email ? `<div class="email">${email}</div>` : ''}
          
          <p class="message">${message}</p>
          
          ${status === "approved" ? `
          <a href="https://showblox-soleia.lovable.app/admin" class="cta">
            Go to Portal →
          </a>
          ` : ''}
        </div>
        
        <div class="footer">
          <div class="footer-text">ShowBlox Creative Management System</div>
        </div>
      </div>
    </body>
    </html>
  `;

  return new Response(html, {
    status: status === "error" ? 400 : 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      ...corsHeaders,
    },
  });
}

serve(handler);
