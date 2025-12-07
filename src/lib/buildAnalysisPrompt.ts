export interface UserContext {
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

export function buildAnalysisPrompt(userContext: UserContext): string {
  let prompt = `Eres un asistente visual para personas ciegas o con discapacidad visual. Analiza esta imagen y proporciona información clara y útil.

## TU TAREA
1. Describe detalladamente qué hay en la imagen
2. Lee cualquier texto visible
3. Identifica posibles riesgos basados en el perfil del usuario

## INFORMACIÓN DEL USUARIO
`;

  // Food allergies
  const hasAllergies = userContext.foodAllergies.length > 0 && 
    !userContext.foodAllergies.includes('ninguna');
  
  if (hasAllergies || userContext.foodAllergiesOther) {
    const allergies = [...userContext.foodAllergies.filter(a => a !== 'ninguna')];
    if (userContext.foodAllergiesOther) {
      allergies.push(userContext.foodAllergiesOther);
    }
    prompt += `- ⚠️ ALERGIAS ALIMENTARIAS: ${allergies.join(', ')}\n`;
    prompt += `  → Si hay alimentos, VERIFICA si contienen estos alérgenos\n`;
  }

  // Medical conditions
  const hasConditions = userContext.medicalConditions.length > 0 && 
    !userContext.medicalConditions.includes('ninguna');
  
  if (hasConditions || userContext.medicalConditionsOther) {
    const conditions = [...userContext.medicalConditions.filter(c => c !== 'ninguna')];
    if (userContext.medicalConditionsOther) {
      conditions.push(userContext.medicalConditionsOther);
    }
    prompt += `- 🏥 CONDICIONES MÉDICAS: ${conditions.join(', ')}\n`;
    prompt += `  → Si hay alimentos o medicamentos, considera estas condiciones\n`;
  }

  // Dietary preferences
  const hasPreferences = userContext.dietaryPreferences.length > 0 && 
    !userContext.dietaryPreferences.includes('ninguna');
  
  if (hasPreferences || userContext.dietaryPreferencesOther) {
    const prefs = [...userContext.dietaryPreferences.filter(p => p !== 'ninguna')];
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

  prompt += `
## REGLAS DE ALERTAS
- CRÍTICO (type: "critical"): Alérgenos detectados, peligros inmediatos
- ADVERTENCIA (type: "warning"): Incompatibilidad con condiciones médicas, baño incorrecto
- INFORMACIÓN (type: "info"): Preferencias no cumplidas, información útil

## FORMATO DE RESPUESTA
Responde SOLO con un JSON válido (sin texto adicional):
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
- "safeToConsume" solo aplica si hay alimentos/bebidas/medicamentos en la imagen
- Si no hay alertas, devuelve un array vacío []
- Sé específico y directo en las descripciones
- Prioriza la seguridad del usuario`;

  return prompt;
}

export function hasProfileData(userContext: UserContext): boolean {
  return (
    userContext.foodAllergies.length > 0 ||
    !!userContext.foodAllergiesOther ||
    userContext.medicalConditions.length > 0 ||
    !!userContext.medicalConditionsOther ||
    userContext.dietaryPreferences.length > 0 ||
    !!userContext.dietaryPreferencesOther ||
    !!userContext.dislikedFoods ||
    !!userContext.gender
  );
}

export function getMissingProfileFields(userContext: UserContext): string[] {
  const missing: string[] = [];
  
  if (userContext.foodAllergies.length === 0 && !userContext.foodAllergiesOther) {
    missing.push("alergias alimentarias");
  }
  if (userContext.medicalConditions.length === 0 && !userContext.medicalConditionsOther) {
    missing.push("condiciones médicas");
  }
  if (userContext.dietaryPreferences.length === 0 && !userContext.dietaryPreferencesOther) {
    missing.push("preferencias alimentarias");
  }
  
  return missing;
}
