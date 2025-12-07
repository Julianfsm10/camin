import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface UserContext {
  foodAllergies: string[];
  foodAllergiesOther: string;
  medicalConditions: string[];
  medicalConditionsOther: string;
  dietaryPreferences: string[];
  dietaryPreferencesOther: string;
  dislikedFoods: string;
  gender: string;
  genderOther: string;
  age: number | null;
}

function buildPersonalizedPrompt(userContext: UserContext | null): string {
  let prompt = `Eres un asistente visual para personas ciegas o con discapacidad visual. Analiza esta imagen y proporciona información clara y útil.

## TU TAREA
1. Describe detalladamente qué hay en la imagen
2. Lee cualquier texto visible
3. Identifica posibles riesgos basados en el perfil del usuario
`;

  if (userContext) {
    prompt += `\n## INFORMACIÓN DEL USUARIO\n`;

    // Food allergies
    const hasAllergies = userContext.foodAllergies?.length > 0 && 
      !userContext.foodAllergies.includes('ninguna');
    
    if (hasAllergies || userContext.foodAllergiesOther) {
      const allergies = [...(userContext.foodAllergies?.filter(a => a !== 'ninguna') || [])];
      if (userContext.foodAllergiesOther) {
        allergies.push(userContext.foodAllergiesOther);
      }
      prompt += `- ⚠️ ALERGIAS ALIMENTARIAS: ${allergies.join(', ')}\n`;
      prompt += `  → Si hay alimentos, VERIFICA si contienen estos alérgenos\n`;
    }

    // Medical conditions
    const hasConditions = userContext.medicalConditions?.length > 0 && 
      !userContext.medicalConditions.includes('ninguna');
    
    if (hasConditions || userContext.medicalConditionsOther) {
      const conditions = [...(userContext.medicalConditions?.filter(c => c !== 'ninguna') || [])];
      if (userContext.medicalConditionsOther) {
        conditions.push(userContext.medicalConditionsOther);
      }
      prompt += `- 🏥 CONDICIONES MÉDICAS: ${conditions.join(', ')}\n`;
      prompt += `  → Si hay alimentos o medicamentos, considera estas condiciones\n`;
    }

    // Dietary preferences
    const hasPreferences = userContext.dietaryPreferences?.length > 0 && 
      !userContext.dietaryPreferences.includes('ninguna');
    
    if (hasPreferences || userContext.dietaryPreferencesOther) {
      const prefs = [...(userContext.dietaryPreferences?.filter(p => p !== 'ninguna') || [])];
      if (userContext.dietaryPreferencesOther) {
        prefs.push(userContext.dietaryPreferencesOther);
      }
      prompt += `- 🥗 PREFERENCIAS ALIMENTARIAS: ${prefs.join(', ')}\n`;
      prompt += `  → Si hay comida, indica si es compatible con estas preferencias\n`;
    }

    // Disliked foods
    if (userContext.dislikedFoods) {
      prompt += `- 👎 NO LE GUSTAN: ${userContext.dislikedFoods}\n`;
    }

    // Gender (for bathrooms)
    if (userContext.gender && userContext.gender !== 'prefiero_no_decir') {
      let genderText = '';
      if (userContext.gender === 'femenino' || userContext.gender === 'mujer') {
        genderText = 'mujer';
      } else if (userContext.gender === 'masculino' || userContext.gender === 'hombre') {
        genderText = 'hombre';
      } else if (userContext.gender === 'otro' && userContext.genderOther) {
        genderText = userContext.genderOther;
      } else if (userContext.gender === 'otro') {
        genderText = 'persona no binaria';
      }
      
      if (genderText) {
        prompt += `- 🚻 GÉNERO: ${genderText}\n`;
        prompt += `  → Si es un baño público, indica si es el apropiado\n`;
      }
    }
  }

  prompt += `
## REGLAS DE ALERTAS
- CRÍTICO (type: "critical"): Alérgenos detectados, peligros inmediatos
- ADVERTENCIA (type: "warning"): Incompatibilidad con condiciones médicas, baño incorrecto
- INFORMACIÓN (type: "info"): Preferencias no cumplidas, información útil

## FORMATO DE RESPUESTA
Responde SOLO con un JSON válido (sin texto adicional ni bloques de código):
{
  "description": "Descripción completa y clara de la imagen en español",
  "alerts": [
    {
      "type": "critical" | "warning" | "info",
      "category": "alergia" | "condicion_medica" | "preferencia" | "genero" | "seguridad" | "otro",
      "message": "Mensaje claro y directo de la alerta"
    }
  ],
  "safeToConsume": true | false | null,
  "recommendations": ["recomendación 1", "recomendación 2"]
}

NOTAS:
- "safeToConsume" solo aplica si hay alimentos/bebidas/medicamentos en la imagen, de lo contrario usa null
- Si no hay alertas, devuelve un array vacío []
- Sé específico y directo en las descripciones
- Prioriza la seguridad del usuario`;

  return prompt;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageBase64, userContext } = await req.json();

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

    const base64Data = imageBase64.includes(',') 
      ? imageBase64.split(',')[1] 
      : imageBase64;

    const personalizedPrompt = buildPersonalizedPrompt(userContext || null);

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
                text: personalizedPrompt
              }
            ]
          }
        ],
        max_tokens: 1500
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
    const responseText = data.choices?.[0]?.message?.content || "";

    // Try to parse as JSON
    let analysis;
    try {
      // Extract JSON from response (might have extra text)
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        // Fallback if not JSON
        analysis = {
          description: responseText,
          alerts: [],
          safeToConsume: null,
          recommendations: []
        };
      }
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      analysis = {
        description: responseText,
        alerts: [],
        safeToConsume: null,
        recommendations: []
      };
    }

    return new Response(
      JSON.stringify({ 
        analysis,
        description: analysis.description // Keep backward compatibility
      }),
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
