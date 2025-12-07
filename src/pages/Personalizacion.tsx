import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { BottomNav } from "@/components/layout/BottomNav";
import { Header } from "@/components/layout/Header";
import { useVoice } from "@/hooks/useVoice";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ProfileData {
  age: number | null;
  gender: string | null;
  gender_other: string | null;
  food_allergies: string[];
  food_allergies_other: string | null;
  medical_conditions: string[];
  medical_conditions_other: string | null;
  dietary_preferences: string[];
  dietary_preferences_other: string | null;
  disliked_foods: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
}

export default function Personalizacion() {
  const navigate = useNavigate();
  const { speak } = useVoice();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [profileData, setProfileData] = useState<ProfileData>({
    age: null,
    gender: null,
    gender_other: null,
    food_allergies: [],
    food_allergies_other: null,
    medical_conditions: [],
    medical_conditions_other: null,
    dietary_preferences: [],
    dietary_preferences_other: null,
    disliked_foods: null,
    emergency_contact_name: null,
    emergency_contact_phone: null,
  });

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Error fetching profile:", error);
        toast({
          title: "Error",
          description: "No se pudo cargar tu perfil.",
          variant: "destructive",
        });
      } else if (data) {
        setProfileData({
          age: data.age,
          gender: data.gender,
          gender_other: data.gender_other,
          food_allergies: data.food_allergies || [],
          food_allergies_other: data.food_allergies_other,
          medical_conditions: data.medical_conditions || [],
          medical_conditions_other: data.medical_conditions_other,
          dietary_preferences: data.dietary_preferences || [],
          dietary_preferences_other: data.dietary_preferences_other,
          disliked_foods: data.disliked_foods,
          emergency_contact_name: data.emergency_contact_name,
          emergency_contact_phone: data.emergency_contact_phone,
        });
      }

      setIsLoading(false);
    };

    fetchProfile();

    const timer = setTimeout(() => {
      speak("Personalización de perfil. Completa tus datos personales.");
    }, 500);
    
    return () => clearTimeout(timer);
  }, [navigate, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    speak("Guardando datos");

    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      navigate("/auth");
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        age: profileData.age,
        gender: profileData.gender,
        gender_other: profileData.gender_other,
        food_allergies: profileData.food_allergies,
        food_allergies_other: profileData.food_allergies_other,
        medical_conditions: profileData.medical_conditions,
        medical_conditions_other: profileData.medical_conditions_other,
        dietary_preferences: profileData.dietary_preferences,
        dietary_preferences_other: profileData.dietary_preferences_other,
        disliked_foods: profileData.disliked_foods,
        emergency_contact_name: profileData.emergency_contact_name,
        emergency_contact_phone: profileData.emergency_contact_phone,
      })
      .eq("user_id", user.id);

    setIsSaving(false);

    if (error) {
      console.error("Error updating profile:", error);
      speak("Error al guardar");
      toast({
        title: "Error",
        description: "No se pudieron guardar los datos.",
        variant: "destructive",
      });
    } else {
      speak("Datos actualizados correctamente");
      toast({
        title: "Éxito",
        description: "Datos actualizados correctamente.",
      });
    }
  };

  const updateField = <K extends keyof ProfileData>(field: K, value: ProfileData[K]) => {
    setProfileData((prev) => ({ ...prev, [field]: value }));
  };

  if (isLoading) {
    return (
      <>
        <Header title="Personalización" showBack />
        <MobileLayout className="flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </MobileLayout>
        <BottomNav />
      </>
    );
  }

  return (
    <>
      <Header title="Personalización" showBack />
      <MobileLayout showBottomNav className="py-6 space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Info */}
          <section className="animate-fade-in">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3 px-1">
              Información Personal
            </h3>
            <div className="card-elevated space-y-4">
              <div>
                <Label htmlFor="age" className="text-foreground mb-2 block">Edad</Label>
                <Input
                  id="age"
                  type="number"
                  min={1}
                  max={120}
                  value={profileData.age || ""}
                  onChange={(e) => updateField("age", e.target.value ? parseInt(e.target.value) : null)}
                  className="input-large"
                  placeholder="Tu edad"
                />
              </div>

              <div>
                <Label htmlFor="gender" className="text-foreground mb-2 block">Género</Label>
                <Select
                  value={profileData.gender || ""}
                  onValueChange={(value) => updateField("gender", value)}
                >
                  <SelectTrigger className="input-large">
                    <SelectValue placeholder="Selecciona tu género" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hombre">Masculino</SelectItem>
                    <SelectItem value="mujer">Femenino</SelectItem>
                    <SelectItem value="otro">Otro</SelectItem>
                    <SelectItem value="prefiero_no_decir">Prefiero no decir</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {profileData.gender === "otro" && (
                <div>
                  <Label htmlFor="gender_other" className="text-foreground mb-2 block">Especificar género</Label>
                  <Input
                    id="gender_other"
                    type="text"
                    value={profileData.gender_other || ""}
                    onChange={(e) => updateField("gender_other", e.target.value)}
                    className="input-large"
                    placeholder="Especifica tu género"
                  />
                </div>
              )}
            </div>
          </section>

          {/* Health Info */}
          <section className="animate-fade-in" style={{ animationDelay: "100ms" }}>
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3 px-1">
              Información de Salud
            </h3>
            <div className="card-elevated space-y-4">
              <div>
                <Label htmlFor="food_allergies" className="text-foreground mb-2 block">Alergias alimentarias</Label>
                <Textarea
                  id="food_allergies"
                  value={profileData.food_allergies.join(", ")}
                  onChange={(e) => updateField("food_allergies", e.target.value.split(",").map(s => s.trim()).filter(Boolean))}
                  className="input-large min-h-[80px] resize-none"
                  placeholder="Ej: Maní, Mariscos, Gluten (separados por coma)"
                />
              </div>

              <div>
                <Label htmlFor="food_allergies_other" className="text-foreground mb-2 block">Otras alergias</Label>
                <Input
                  id="food_allergies_other"
                  type="text"
                  value={profileData.food_allergies_other || ""}
                  onChange={(e) => updateField("food_allergies_other", e.target.value)}
                  className="input-large"
                  placeholder="Alergias adicionales"
                />
              </div>

              <div>
                <Label htmlFor="medical_conditions" className="text-foreground mb-2 block">Condiciones médicas</Label>
                <Textarea
                  id="medical_conditions"
                  value={profileData.medical_conditions.join(", ")}
                  onChange={(e) => updateField("medical_conditions", e.target.value.split(",").map(s => s.trim()).filter(Boolean))}
                  className="input-large min-h-[80px] resize-none"
                  placeholder="Ej: Diabetes, Hipertensión (separados por coma)"
                />
              </div>

              <div>
                <Label htmlFor="medical_conditions_other" className="text-foreground mb-2 block">Otras condiciones</Label>
                <Input
                  id="medical_conditions_other"
                  type="text"
                  value={profileData.medical_conditions_other || ""}
                  onChange={(e) => updateField("medical_conditions_other", e.target.value)}
                  className="input-large"
                  placeholder="Condiciones adicionales"
                />
              </div>
            </div>
          </section>

          {/* Dietary Preferences */}
          <section className="animate-fade-in" style={{ animationDelay: "200ms" }}>
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3 px-1">
              Preferencias Alimentarias
            </h3>
            <div className="card-elevated space-y-4">
              <div>
                <Label htmlFor="dietary_preferences" className="text-foreground mb-2 block">Preferencias dietéticas</Label>
                <Textarea
                  id="dietary_preferences"
                  value={profileData.dietary_preferences.join(", ")}
                  onChange={(e) => updateField("dietary_preferences", e.target.value.split(",").map(s => s.trim()).filter(Boolean))}
                  className="input-large min-h-[80px] resize-none"
                  placeholder="Ej: Vegetariano, Vegano, Sin lactosa (separados por coma)"
                />
              </div>

              <div>
                <Label htmlFor="dietary_preferences_other" className="text-foreground mb-2 block">Otras preferencias</Label>
                <Input
                  id="dietary_preferences_other"
                  type="text"
                  value={profileData.dietary_preferences_other || ""}
                  onChange={(e) => updateField("dietary_preferences_other", e.target.value)}
                  className="input-large"
                  placeholder="Preferencias adicionales"
                />
              </div>

              <div>
                <Label htmlFor="disliked_foods" className="text-foreground mb-2 block">Alimentos que no te gustan</Label>
                <Textarea
                  id="disliked_foods"
                  value={profileData.disliked_foods || ""}
                  onChange={(e) => updateField("disliked_foods", e.target.value)}
                  className="input-large min-h-[80px] resize-none"
                  placeholder="Alimentos que prefieres evitar"
                />
              </div>
            </div>
          </section>

          {/* Emergency Contact */}
          <section className="animate-fade-in" style={{ animationDelay: "300ms" }}>
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3 px-1">
              Contacto de Emergencia
            </h3>
            <div className="card-elevated space-y-4">
              <div>
                <Label htmlFor="emergency_contact_name" className="text-foreground mb-2 block">Nombre del contacto</Label>
                <Input
                  id="emergency_contact_name"
                  type="text"
                  value={profileData.emergency_contact_name || ""}
                  onChange={(e) => updateField("emergency_contact_name", e.target.value)}
                  className="input-large"
                  placeholder="Nombre completo"
                />
              </div>

              <div>
                <Label htmlFor="emergency_contact_phone" className="text-foreground mb-2 block">Teléfono del contacto</Label>
                <Input
                  id="emergency_contact_phone"
                  type="tel"
                  value={profileData.emergency_contact_phone || ""}
                  onChange={(e) => updateField("emergency_contact_phone", e.target.value)}
                  className="input-large"
                  placeholder="+52 555 123 4567"
                />
              </div>
            </div>
          </section>

          {/* Submit Button */}
          <Button
            type="submit"
            className="btn-hero"
            disabled={isSaving}
            onMouseEnter={() => speak("Botón guardar cambios")}
          >
            {isSaving ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="w-6 h-6" />
                Guardar cambios
              </>
            )}
          </Button>
        </form>
      </MobileLayout>
      <BottomNav />
    </>
  );
}
