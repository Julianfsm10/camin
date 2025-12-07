import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { Header } from "@/components/layout/Header";
import { useVoice } from "@/hooks/useVoice";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface SettingsData {
  fullName: string;
  email: string;
  age: number | null;
  gender: string | null;
  genderOther: string | null;
  foodAllergies: string[];
  foodAllergiesOther: string | null;
  medicalConditions: string[];
  medicalConditionsOther: string | null;
  dietaryPreferences: string[];
  dietaryPreferencesOther: string | null;
  dislikedFoods: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  audioEnabled: boolean;
  vibrationEnabled: boolean;
  highContrast: boolean;
}

const FOOD_ALLERGIES = [
  { value: "gluten", label: "Gluten" },
  { value: "lactosa", label: "Lactosa" },
  { value: "mani", label: "Maní / Cacahuate" },
  { value: "mariscos", label: "Mariscos" },
  { value: "pescado", label: "Pescado" },
  { value: "huevo", label: "Huevo" },
  { value: "soya", label: "Soya" },
  { value: "frutos_secos", label: "Frutos secos" },
];

const MEDICAL_CONDITIONS = [
  { value: "diabetes", label: "Diabetes" },
  { value: "hipertension", label: "Hipertensión" },
  { value: "celiquia", label: "Celiaquía" },
  { value: "asma", label: "Asma" },
  { value: "intolerancia_lactosa", label: "Intolerancia a la lactosa" },
];

const DIETARY_PREFERENCES = [
  { value: "vegetariano", label: "Vegetariano" },
  { value: "vegano", label: "Vegano" },
  { value: "sin_gluten", label: "Sin gluten" },
  { value: "sin_lacteos", label: "Sin lácteos" },
  { value: "bajo_azucar", label: "Bajo en azúcar" },
  { value: "bajo_sodio", label: "Bajo en sodio" },
  { value: "alto_proteina", label: "Alto en proteína" },
  { value: "no_picante", label: "No picante" },
  { value: "no_frito", label: "No frito" },
];

export default function Settings() {
  const navigate = useNavigate();
  const { speak } = useVoice();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<SettingsData>({
    fullName: "",
    email: "",
    age: null,
    gender: null,
    genderOther: null,
    foodAllergies: [],
    foodAllergiesOther: null,
    medicalConditions: [],
    medicalConditionsOther: null,
    dietaryPreferences: [],
    dietaryPreferencesOther: null,
    dislikedFoods: null,
    emergencyContactName: null,
    emergencyContactPhone: null,
    audioEnabled: true,
    vibrationEnabled: true,
    highContrast: false,
  });

  useEffect(() => {
    speak("Configuración y preferencias");
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error) {
        console.error("Error loading profile:", error);
        speak("Error al cargar configuración");
        return;
      }

      if (profile) {
        setSettings({
          fullName: profile.full_name || "",
          email: profile.email || user.email || "",
          age: profile.age,
          gender: profile.gender,
          genderOther: profile.gender_other,
          foodAllergies: profile.food_allergies || [],
          foodAllergiesOther: profile.food_allergies_other,
          medicalConditions: profile.medical_conditions || [],
          medicalConditionsOther: profile.medical_conditions_other,
          dietaryPreferences: profile.dietary_preferences || [],
          dietaryPreferencesOther: profile.dietary_preferences_other,
          dislikedFoods: profile.disliked_foods,
          emergencyContactName: profile.emergency_contact_name,
          emergencyContactPhone: profile.emergency_contact_phone,
          audioEnabled: profile.audio_enabled ?? true,
          vibrationEnabled: profile.vibration_enabled ?? true,
          highContrast: profile.high_contrast ?? false,
        });
      }
    } catch (error) {
      console.error("Error:", error);
      speak("Error al cargar configuración");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      speak("Guardando cambios");

      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate("/auth");
        return;
      }

      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: settings.fullName,
          age: settings.age,
          gender: settings.gender,
          gender_other: settings.genderOther,
          food_allergies: settings.foodAllergies,
          food_allergies_other: settings.foodAllergiesOther,
          medical_conditions: settings.medicalConditions,
          medical_conditions_other: settings.medicalConditionsOther,
          dietary_preferences: settings.dietaryPreferences,
          dietary_preferences_other: settings.dietaryPreferencesOther,
          disliked_foods: settings.dislikedFoods,
          emergency_contact_name: settings.emergencyContactName,
          emergency_contact_phone: settings.emergencyContactPhone,
          audio_enabled: settings.audioEnabled,
          vibration_enabled: settings.vibrationEnabled,
          high_contrast: settings.highContrast,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);

      if (error) {
        throw error;
      }

      speak("Cambios guardados exitosamente");
      toast({
        title: "Guardado",
        description: "Tu configuración se ha guardado correctamente.",
      });
    } catch (error) {
      console.error("Error saving:", error);
      speak("Error al guardar cambios");
      toast({
        title: "Error",
        description: "No se pudieron guardar los cambios.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const toggleArrayItem = (array: string[], item: string): string[] => {
    if (array.includes(item)) {
      return array.filter((i) => i !== item);
    }
    return [...array, item];
  };

  if (loading) {
    return (
      <>
        <Header title="Configuración" showBack />
        <MobileLayout className="flex items-center justify-center">
          <p className="text-muted-foreground text-lg">Cargando configuración...</p>
        </MobileLayout>
      </>
    );
  }

  return (
    <>
      <Header title="Configuración" showBack />
      <MobileLayout className="py-6 space-y-6 pb-24">
        {/* Datos Básicos */}
        <section className="card-elevated space-y-4 animate-fade-in">
          <h2 className="text-lg font-semibold text-foreground border-b border-border pb-2">
            📋 Datos Básicos
          </h2>

          <div>
            <label className="text-sm font-medium text-muted-foreground block mb-2">
              Nombre completo
            </label>
            <Input
              value={settings.fullName}
              onChange={(e) => setSettings({ ...settings, fullName: e.target.value })}
              onFocus={() => speak("Campo: Nombre completo")}
              placeholder="Tu nombre completo"
              className="min-h-[56px] text-base"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground block mb-2">
              Correo electrónico
            </label>
            <Input
              value={settings.email}
              readOnly
              className="min-h-[56px] text-base bg-muted cursor-not-allowed"
            />
            <p className="text-xs text-muted-foreground mt-1">
              El email no puede modificarse
            </p>
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground block mb-2">
              Edad
            </label>
            <Input
              type="number"
              min={18}
              max={120}
              value={settings.age || ""}
              onChange={(e) => setSettings({ ...settings, age: parseInt(e.target.value) || null })}
              onFocus={() => speak("Campo: Edad")}
              placeholder="Ej: 35"
              className="min-h-[56px] text-base"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground block mb-2">
              Género
            </label>
            <Select
              value={settings.gender || ""}
              onValueChange={(value) => setSettings({ ...settings, gender: value })}
            >
              <SelectTrigger className="min-h-[56px] text-base" onFocus={() => speak("Campo: Género")}>
                <SelectValue placeholder="Selecciona..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mujer">Mujer</SelectItem>
                <SelectItem value="hombre">Hombre</SelectItem>
                <SelectItem value="prefiero_no_decir">Prefiero no decir</SelectItem>
                <SelectItem value="otro">Otro</SelectItem>
              </SelectContent>
            </Select>

            {settings.gender === "otro" && (
              <Input
                value={settings.genderOther || ""}
                onChange={(e) => setSettings({ ...settings, genderOther: e.target.value })}
                placeholder="Especifica..."
                className="min-h-[56px] text-base mt-2"
              />
            )}
          </div>
        </section>

        {/* Alergias Alimentarias */}
        <section className="card-elevated space-y-4 animate-fade-in" style={{ animationDelay: "100ms" }}>
          <h2 className="text-lg font-semibold text-foreground border-b border-border pb-2">
            🚫 Alergias Alimentarias
          </h2>

          <div className="space-y-3">
            {FOOD_ALLERGIES.map((allergy) => (
              <label key={allergy.value} className="flex items-center space-x-3 cursor-pointer min-h-[44px]">
                <Checkbox
                  checked={settings.foodAllergies.includes(allergy.value)}
                  onCheckedChange={() =>
                    setSettings({
                      ...settings,
                      foodAllergies: toggleArrayItem(settings.foodAllergies, allergy.value),
                    })
                  }
                  onFocus={() => speak(`Opción: ${allergy.label}`)}
                />
                <span className="text-foreground text-base">{allergy.label}</span>
              </label>
            ))}
          </div>

          <Input
            value={settings.foodAllergiesOther || ""}
            onChange={(e) => setSettings({ ...settings, foodAllergiesOther: e.target.value })}
            onFocus={() => speak("Campo: Otra alergia")}
            placeholder="Otra alergia no listada..."
            className="min-h-[56px] text-base"
          />
        </section>

        {/* Condiciones Médicas */}
        <section className="card-elevated space-y-4 animate-fade-in" style={{ animationDelay: "200ms" }}>
          <h2 className="text-lg font-semibold text-foreground border-b border-border pb-2">
            🏥 Condiciones Médicas
          </h2>

          <div className="space-y-3">
            {MEDICAL_CONDITIONS.map((condition) => (
              <label key={condition.value} className="flex items-center space-x-3 cursor-pointer min-h-[44px]">
                <Checkbox
                  checked={settings.medicalConditions.includes(condition.value)}
                  onCheckedChange={() =>
                    setSettings({
                      ...settings,
                      medicalConditions: toggleArrayItem(settings.medicalConditions, condition.value),
                    })
                  }
                  onFocus={() => speak(`Opción: ${condition.label}`)}
                />
                <span className="text-foreground text-base">{condition.label}</span>
              </label>
            ))}
          </div>

          <Input
            value={settings.medicalConditionsOther || ""}
            onChange={(e) => setSettings({ ...settings, medicalConditionsOther: e.target.value })}
            onFocus={() => speak("Campo: Otra condición médica")}
            placeholder="Otra condición no listada..."
            className="min-h-[56px] text-base"
          />
        </section>

        {/* Preferencias Alimentarias */}
        <section className="card-elevated space-y-4 animate-fade-in" style={{ animationDelay: "300ms" }}>
          <h2 className="text-lg font-semibold text-foreground border-b border-border pb-2">
            🍽️ Preferencias Alimentarias
          </h2>

          <div className="space-y-3">
            {DIETARY_PREFERENCES.map((pref) => (
              <label key={pref.value} className="flex items-center space-x-3 cursor-pointer min-h-[44px]">
                <Checkbox
                  checked={settings.dietaryPreferences.includes(pref.value)}
                  onCheckedChange={() =>
                    setSettings({
                      ...settings,
                      dietaryPreferences: toggleArrayItem(settings.dietaryPreferences, pref.value),
                    })
                  }
                  onFocus={() => speak(`Opción: ${pref.label}`)}
                />
                <span className="text-foreground text-base">{pref.label}</span>
              </label>
            ))}
          </div>

          <Input
            value={settings.dietaryPreferencesOther || ""}
            onChange={(e) => setSettings({ ...settings, dietaryPreferencesOther: e.target.value })}
            onFocus={() => speak("Campo: Otra preferencia")}
            placeholder="Otra preferencia no listada..."
            className="min-h-[56px] text-base"
          />
        </section>

        {/* Comidas que NO le gustan */}
        <section className="card-elevated space-y-4 animate-fade-in" style={{ animationDelay: "400ms" }}>
          <h2 className="text-lg font-semibold text-foreground border-b border-border pb-2">
            👎 Comidas que NO te gustan
          </h2>

          <Textarea
            value={settings.dislikedFoods || ""}
            onChange={(e) => setSettings({ ...settings, dislikedFoods: e.target.value })}
            onFocus={() => speak("Campo: Comidas que no te gustan")}
            placeholder="Ej: pescado, picante, cebolla, amargo, brócoli..."
            className="min-h-[120px] text-base resize-none"
          />
        </section>

        {/* Contacto de Emergencia */}
        <section className="card-elevated space-y-4 animate-fade-in" style={{ animationDelay: "500ms" }}>
          <h2 className="text-lg font-semibold text-foreground border-b border-border pb-2">
            🚨 Contacto de Emergencia
          </h2>

          <div>
            <label className="text-sm font-medium text-muted-foreground block mb-2">
              Nombre del contacto
            </label>
            <Input
              value={settings.emergencyContactName || ""}
              onChange={(e) => setSettings({ ...settings, emergencyContactName: e.target.value })}
              onFocus={() => speak("Campo: Nombre del contacto de emergencia")}
              placeholder="Ej: María González"
              className="min-h-[56px] text-base"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground block mb-2">
              Teléfono del contacto
            </label>
            <Input
              type="tel"
              value={settings.emergencyContactPhone || ""}
              onChange={(e) => setSettings({ ...settings, emergencyContactPhone: e.target.value })}
              onFocus={() => speak("Campo: Teléfono del contacto de emergencia")}
              placeholder="Ej: +57 300 123 4567"
              className="min-h-[56px] text-base"
            />
          </div>
        </section>

        {/* Botón Guardar */}
        <Button
          onClick={handleSave}
          disabled={saving}
          onMouseEnter={() => speak("Guardar cambios")}
          className="w-full min-h-[64px] text-lg font-semibold sticky bottom-6"
        >
          <Save className="w-5 h-5 mr-2" />
          {saving ? "Guardando..." : "Guardar Cambios"}
        </Button>
      </MobileLayout>
    </>
  );
}
