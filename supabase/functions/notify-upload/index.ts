import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "resend";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface NotifyUploadRequest {
  linkId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Supabase credentials not configured");
    }

    const resend = new Resend(resendApiKey);
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { linkId, fileName, fileType, fileSize }: NotifyUploadRequest = await req.json();

    if (!linkId || !fileName) {
      throw new Error("Missing required fields: linkId, fileName");
    }

    // Fetch session details
    const { data: linkData, error: linkError } = await supabase
      .from("client_links")
      .select("client_name, event_name, event_date, token")
      .eq("id", linkId)
      .single();

    if (linkError || !linkData) {
      throw new Error("Session not found");
    }

    // Format file size
    const formatFileSize = (bytes: number) => {
      if (bytes < 1024) return `${bytes} B`;
      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    // Get file category
    const getCategory = (type: string) => {
      if (type.startsWith("image/")) return "Image/Logo";
      if (type.startsWith("video/")) return "Video";
      return "Document";
    };

    const sessionUrl = `${req.headers.get("origin") || "https://soleiacreative.app"}/session/${linkData.token}`;

    // Send notification email
    // Using hardcoded email for Resend trial domain verification
    const emailResponse = await resend.emails.send({
      from: "Soleia <onboarding@resend.dev>",
      to: ["ninemilelion@gmail.com"],
      subject: `New File Upload: ${linkData.client_name} - ${linkData.event_name}`,
      html: `
        <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #333; font-size: 24px; margin-bottom: 20px;">
            📁 New File Uploaded
          </h1>
          
          <div style="background: #f8f9fa; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
            <h2 style="color: #666; font-size: 14px; text-transform: uppercase; margin: 0 0 10px 0;">
              Session Details
            </h2>
            <p style="margin: 5px 0; color: #333;">
              <strong>Client:</strong> ${linkData.client_name}
            </p>
            <p style="margin: 5px 0; color: #333;">
              <strong>Event:</strong> ${linkData.event_name}
            </p>
            ${linkData.event_date ? `<p style="margin: 5px 0; color: #333;"><strong>Date:</strong> ${linkData.event_date}</p>` : ""}
          </div>
          
          <div style="background: #e8f4f8; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
            <h2 style="color: #666; font-size: 14px; text-transform: uppercase; margin: 0 0 10px 0;">
              Uploaded File
            </h2>
            <p style="margin: 5px 0; color: #333;">
              <strong>File:</strong> ${fileName}
            </p>
            <p style="margin: 5px 0; color: #333;">
              <strong>Type:</strong> ${getCategory(fileType)}
            </p>
            <p style="margin: 5px 0; color: #333;">
              <strong>Size:</strong> ${formatFileSize(fileSize)}
            </p>
          </div>
          
          <a href="${sessionUrl}" style="display: inline-block; background: #6366f1; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
            View Session
          </a>
          
          <p style="color: #999; font-size: 12px; margin-top: 30px;">
            This notification was sent automatically when a client uploaded a file.
          </p>
        </div>
      `,
    });

    console.log("Upload notification email sent:", emailResponse);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in notify-upload function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
