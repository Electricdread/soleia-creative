import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Hardcoded recipient for testing (Resend requires domain verification for other recipients)
const RECIPIENT_EMAIL = "ninemilelion@gmail.com";

interface Selection {
  external_id: string;
  title: string;
  thumbnail: string;
  note?: string;
  category: string;
}

interface SendSelectionsRequest {
  selections: Selection[];
  pdfBase64: string;
  recipientEmail?: string; // Ignored - using hardcoded email
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { selections, pdfBase64 }: SendSelectionsRequest = await req.json();

    if (!selections || !pdfBase64) {
      throw new Error("Missing required fields: selections or pdfBase64");
    }

    // Create HTML summary of selections
    const selectionsHtml = selections.map(s => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #eee;">
          <img src="${s.thumbnail}" alt="${s.title}" style="width: 120px; height: 68px; object-fit: cover; border-radius: 4px;" />
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #eee;">
          <strong>${s.title}</strong><br/>
          <span style="color: #666; font-size: 12px;">${s.category}</span>
          ${s.note ? `<br/><em style="color: #888; font-size: 12px;">Note: ${s.note}</em>` : ''}
        </td>
      </tr>
    `).join('');

    console.log(`Sending selections email to: ${RECIPIENT_EMAIL}`);

    const emailResponse = await resend.emails.send({
      from: "Looks Collection <onboarding@resend.dev>",
      to: [RECIPIENT_EMAIL],
      subject: `Your Looks Collection Selections (${selections.length} clips)`,
      html: `
        <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #1a1a1a; border-bottom: 2px solid #f59e0b; padding-bottom: 12px;">
            Looks Collection
          </h1>
          <p>Here are your selected motion graphics clips with notes:</p>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            ${selectionsHtml}
          </table>
          <p style="color: #666; font-size: 14px;">
            Total selections: <strong>${selections.length}</strong>
          </p>
          <p style="color: #888; font-size: 12px; margin-top: 30px;">
            A PDF version is attached to this email.
          </p>
        </div>
      `,
      attachments: [
        {
          filename: `looks-collection-${new Date().toISOString().split('T')[0]}.pdf`,
          content: pdfBase64,
        }
      ],
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending selections email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

Deno.serve(handler);
