import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface AnalyzeRequest {
  sessionId: string;
  circlebackUrl: string;
  projectName: string;
  clientName: string;
}

interface StrategicBrief {
  headline: string;
  executiveSummary: string;
  keyObjectives: string[];
  creativeDirection: {
    theme: string;
    description: string;
    visualKeywords: string[];
  };
  technicalRequirements: string[];
  timeline: {
    phase: string;
    description: string;
  }[];
  actionItems: string[];
  imagePrompts: string[];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sessionId, circlebackUrl, projectName, clientName } = await req.json() as AnalyzeRequest;

    const PERPLEXITY_API_KEY = Deno.env.get("PERPLEXITY_API_KEY");
    if (!PERPLEXITY_API_KEY) {
      throw new Error("PERPLEXITY_API_KEY not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("Analyzing Circleback URL:", circlebackUrl);

    // Step 1: Use Perplexity to analyze the Circleback URL
    const perplexityResponse = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${PERPLEXITY_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "sonar",
        messages: [
          {
            role: "system",
            content: `You are a creative agency strategic analyst. Analyze meeting transcripts and URLs to extract actionable creative briefs.

Output a JSON object with this EXACT structure:
{
  "headline": "A compelling 5-8 word project headline",
  "executiveSummary": "2-3 sentence strategic overview of the project",
  "keyObjectives": ["objective1", "objective2", "objective3"],
  "creativeDirection": {
    "theme": "One word creative theme",
    "description": "2 sentences describing the visual and creative direction",
    "visualKeywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"]
  },
  "technicalRequirements": ["requirement1", "requirement2", "requirement3"],
  "timeline": [
    {"phase": "Phase 1", "description": "Description"},
    {"phase": "Phase 2", "description": "Description"}
  ],
  "actionItems": ["action1", "action2", "action3"],
  "imagePrompts": [
    "Ultra-detailed cinematic prompt for hero image 1...",
    "Ultra-detailed cinematic prompt for image 2...",
    "Ultra-detailed cinematic prompt for image 3..."
  ]
}

For imagePrompts: Create 3 professional, cinematic prompts that capture the project's creative essence. Include lighting, mood, composition, and style details. Make them abstract and evocative, not literal.`
          },
          {
            role: "user",
            content: `Analyze this Circleback meeting recording and extract a strategic creative brief.

Project: ${projectName}
Client: ${clientName}
Circleback URL: ${circlebackUrl}

Scrape and analyze the meeting content from the URL, then generate a comprehensive strategic brief with actionable insights and visual direction.`
          }
        ],
        max_tokens: 2000,
        temperature: 0.3,
      }),
    });

    if (!perplexityResponse.ok) {
      const errorText = await perplexityResponse.text();
      console.error("Perplexity API error:", perplexityResponse.status, errorText);
      throw new Error(`Perplexity analysis failed: ${perplexityResponse.status}`);
    }

    const perplexityData = await perplexityResponse.json();
    const analysisContent = perplexityData.choices?.[0]?.message?.content || "";
    const citations = perplexityData.citations || [];

    console.log("Perplexity analysis complete, parsing response...");

    // Parse the strategic brief from Perplexity response
    let strategicBrief: StrategicBrief;
    
    try {
      // Try to extract JSON from the response
      const jsonMatch = analysisContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        strategicBrief = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.log("Failed to parse JSON, creating fallback brief");
      // Create fallback brief from raw content
      strategicBrief = {
        headline: `${projectName} Creative Vision`,
        executiveSummary: analysisContent.substring(0, 300) + "...",
        keyObjectives: [
          "Define creative direction",
          "Establish visual identity",
          "Deliver on client vision"
        ],
        creativeDirection: {
          theme: "Innovation",
          description: "A bold, modern approach that captures the essence of the brand.",
          visualKeywords: ["dynamic", "premium", "immersive", "cinematic", "sophisticated"]
        },
        technicalRequirements: [
          "High-resolution deliverables",
          "Multi-platform optimization",
          "Brand guideline compliance"
        ],
        timeline: [
          { phase: "Discovery", description: "Research and concept development" },
          { phase: "Production", description: "Asset creation and refinement" },
          { phase: "Delivery", description: "Final assets and handoff" }
        ],
        actionItems: [
          "Review creative concepts",
          "Approve visual direction",
          "Schedule follow-up"
        ],
        imagePrompts: [
          `Cinematic wide shot of ethereal light rays piercing through atmospheric haze, golden hour lighting, ${projectName} creative vision, ultra high resolution, professional photography`,
          `Abstract macro texture photography, rich jewel tones, metallic and organic materials intertwined, studio lighting, ${projectName} aesthetic, 8K quality`,
          `Conceptual still life arrangement representing ${projectName}, dramatic chiaroscuro lighting, minimalist composition, editorial photography style`
        ]
      };
    }

    // Step 2: Generate cover images using Lovable AI
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    let generatedImages: { url: string; theme: string; prompt: string }[] = [];

    if (LOVABLE_API_KEY && strategicBrief.imagePrompts?.length > 0) {
      console.log("Generating cover images...");

      const imagePromises = strategicBrief.imagePrompts.slice(0, 3).map(async (prompt, index) => {
        try {
          const imageResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${LOVABLE_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "google/gemini-2.5-flash-image",
              messages: [
                {
                  role: "user",
                  content: prompt + " Ultra high resolution, cinematic, professional, 8K quality."
                }
              ],
              modalities: ["image", "text"]
            }),
          });

          if (!imageResponse.ok) {
            console.error(`Image generation ${index} failed:`, await imageResponse.text());
            return null;
          }

          const imageData = await imageResponse.json();
          const base64Image = imageData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

          if (!base64Image) {
            console.error(`No image returned for prompt ${index}`);
            return null;
          }

          // Upload to Supabase storage
          const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, "");
          const imageBuffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
          const fileName = `${sessionId}/briefing-${index + 1}-${Date.now()}.png`;

          const { error: uploadError } = await supabase.storage
            .from("creative-uploads")
            .upload(fileName, imageBuffer, {
              contentType: "image/png",
              upsert: true
            });

          if (uploadError) {
            console.error(`Upload failed for image ${index}:`, uploadError);
            return null;
          }

          const { data: urlData } = supabase.storage
            .from("creative-uploads")
            .getPublicUrl(fileName);

          const themes = ["Hero Visual", "Texture Detail", "Conceptual"];
          return {
            url: urlData.publicUrl,
            theme: themes[index] || `Visual ${index + 1}`,
            prompt: prompt
          };
        } catch (err) {
          console.error(`Error generating image ${index}:`, err);
          return null;
        }
      });

      const results = await Promise.all(imagePromises);
      generatedImages = results.filter(img => img !== null) as typeof generatedImages;
    }

    // Step 3: Update the session with analyzed data
    const { error: updateError } = await supabase
      .from("creative_sessions")
      .update({
        circleback_summary: JSON.stringify(strategicBrief),
        cover_images: generatedImages.length > 0 ? generatedImages : null,
        cover_themes: strategicBrief.creativeDirection?.visualKeywords || [],
        cover_generated_at: new Date().toISOString()
      })
      .eq("id", sessionId);

    if (updateError) {
      console.error("Failed to update session:", updateError);
      throw new Error("Failed to save analysis");
    }

    console.log("Analysis complete, session updated");

    return new Response(
      JSON.stringify({
        success: true,
        brief: strategicBrief,
        images: generatedImages,
        citations: citations
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in analyze-circleback:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
