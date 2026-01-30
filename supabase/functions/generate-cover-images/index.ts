import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface GenerateRequest {
  sessionId: string;
  circleback_summary?: string;
  project_name: string;
  client_name: string;
  creative_notes?: string;
  technical_notes?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sessionId, circleback_summary, project_name, client_name, creative_notes, technical_notes } = await req.json() as GenerateRequest;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Build context from all available session data
    const contextParts = [];
    if (circleback_summary) contextParts.push(`Call Summary: ${circleback_summary}`);
    if (creative_notes) contextParts.push(`Creative Direction: ${creative_notes}`);
    if (technical_notes) contextParts.push(`Technical Requirements: ${technical_notes}`);
    
    const context = contextParts.join("\n\n") || `Project: ${project_name} for ${client_name}`;

    // Step 1: Analyze the content and generate 3 image prompts using AI
    const analysisResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `You are a creative director analyzing project briefs to extract visual themes. 
Generate exactly 3 distinct image prompts that capture the essence of the project's creative vision.

Each prompt should be:
- Visually striking and professional
- Abstract or conceptual (not literal representations)
- Suitable for a creative agency cover page
- High-end, artistic, and evocative
- Different from each other (one mood/atmosphere, one texture/pattern, one conceptual/symbolic)

Output a JSON object with this structure:
{
  "themes": ["theme1", "theme2", "theme3"],
  "prompts": [
    "detailed image prompt 1...",
    "detailed image prompt 2...", 
    "detailed image prompt 3..."
  ]
}

Make prompts photorealistic and cinematic. Include lighting, mood, and composition details.`
          },
          {
            role: "user",
            content: `Analyze this project brief and generate 3 image prompts:\n\nProject: ${project_name}\nClient: ${client_name}\n\n${context}`
          }
        ],
        response_format: { type: "json_object" }
      }),
    });

    if (!analysisResponse.ok) {
      console.error("AI analysis failed:", await analysisResponse.text());
      throw new Error("Failed to analyze content");
    }

    const analysisData = await analysisResponse.json();
    const analysisContent = analysisData.choices?.[0]?.message?.content;
    
    let themes: string[] = [];
    let prompts: string[] = [];
    
    try {
      const parsed = JSON.parse(analysisContent);
      themes = parsed.themes || [];
      prompts = parsed.prompts || [];
    } catch (e) {
      console.error("Failed to parse AI response:", analysisContent);
      // Fallback prompts based on project name
      themes = ["Atmosphere", "Texture", "Concept"];
      prompts = [
        `Cinematic wide shot of ethereal light rays piercing through atmospheric haze, golden hour lighting, ${project_name} creative vision, ultra high resolution, professional photography`,
        `Abstract macro texture photography, rich jewel tones, metallic and organic materials intertwined, studio lighting, ${project_name} aesthetic, 8K quality`,
        `Conceptual still life arrangement representing ${project_name}, dramatic chiaroscuro lighting, minimalist composition, editorial photography style`
      ];
    }

    // Step 2: Generate 3 images using Lovable AI image generation
    const imagePromises = prompts.slice(0, 3).map(async (prompt, index) => {
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
                content: prompt + " Ultra high resolution, cinematic, professional."
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
        
        const fileName = `${sessionId}/cover-${index + 1}-${Date.now()}.png`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
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

        return {
          url: urlData.publicUrl,
          theme: themes[index] || `Theme ${index + 1}`,
          prompt: prompt
        };
      } catch (err) {
        console.error(`Error generating image ${index}:`, err);
        return null;
      }
    });

    const generatedImages = await Promise.all(imagePromises);
    const validImages = generatedImages.filter(img => img !== null);

    // Step 3: Update the session with generated images
    const { error: updateError } = await supabase
      .from("creative_sessions")
      .update({
        cover_images: validImages,
        cover_themes: themes,
        cover_generated_at: new Date().toISOString()
      })
      .eq("id", sessionId);

    if (updateError) {
      console.error("Failed to update session:", updateError);
      throw new Error("Failed to save generated images");
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        images: validImages,
        themes: themes
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in generate-cover-images:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
