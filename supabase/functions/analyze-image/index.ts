import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageBase64 } = await req.json();

    if (!imageBase64) {
      return new Response(
        JSON.stringify({ error: "No image provided" }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Clean base64 data (remove data URL prefix if present)
    const base64Data = imageBase64.includes(',') 
      ? imageBase64.split(',')[1] 
      : imageBase64;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `Eres un asistente de accesibilidad para personas con discapacidad visual. Tu trabajo es describir imágenes de manera clara, detallada y útil.

Reglas para la descripción:
1. Describe primero los elementos más importantes (personas, objetos principales, texto visible)
2. Incluye colores, tamaños relativos y posiciones espaciales
3. Menciona cualquier texto visible en la imagen
4. Describe el contexto general (interior/exterior, iluminación, ambiente)
5. Usa un lenguaje natural y amigable en español
6. Sé conciso pero informativo (3-5 oraciones)
7. Si hay personas, describe su postura, vestimenta y actividad (sin identificar individuos)
8. Menciona posibles obstáculos o elementos de seguridad si son relevantes`
          },
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${base64Data}`
                }
              },
              {
                type: "text",
                text: "Describe esta imagen detalladamente para una persona ciega. Incluye objetos, personas, colores, texto visible y el contexto espacial."
              }
            ]
          }
        ],
        max_tokens: 500
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Demasiadas solicitudes. Por favor, espera un momento." }),
          { 
            status: 429, 
            headers: { ...corsHeaders, "Content-Type": "application/json" } 
          }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Se requiere agregar créditos para continuar usando el servicio." }),
          { 
            status: 402, 
            headers: { ...corsHeaders, "Content-Type": "application/json" } 
          }
        );
      }
      
      throw new Error("AI analysis failed");
    }

    const data = await response.json();
    const description = data.choices?.[0]?.message?.content || "No se pudo generar una descripción.";

    return new Response(
      JSON.stringify({ description }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in analyze-image:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Error al analizar la imagen" 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
