import { useState, useEffect } from "react";
import { Camera, Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { BottomNav } from "@/components/layout/BottomNav";
import { Header } from "@/components/layout/Header";
import { AnalysisResults } from "@/components/photo-analysis/AnalysisResults";
import { ProfileIncompletePrompt } from "@/components/photo-analysis/ProfileIncompletePrompt";
import { useVoice } from "@/hooks/useVoice";
import { useCamera } from "@/hooks/useCamera";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { UserContext } from "@/lib/buildAnalysisPrompt";
import { getMissingProfileFields } from "@/lib/buildAnalysisPrompt";

type AnalysisState = "ready" | "capturing" | "analyzing" | "result" | "error";

interface AnalysisData {
  description: string;
  alerts: Array<{
    type: "critical" | "warning" | "info";
    category: string;
    message: string;
  }>;
  safeToConsume: boolean | null;
  recommendations: string[];
}

export default function AnalyzePhoto() {
  const { speak } = useVoice();
  const { videoRef, isReady: cameraReady, error: cameraError, startCamera, stopCamera, captureFrame } = useCamera();
  
  const [state, setState] = useState<AnalysisState>("ready");
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [userContext, setUserContext] = useState<UserContext | null>(null);
  const [missingFields, setMissingFields] = useState<string[]>([]);

  // Fetch user profile on mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (profile) {
          const context: UserContext = {
            foodAllergies: profile.food_allergies || [],
            foodAllergiesOther: profile.food_allergies_other || '',
            medicalConditions: profile.medical_conditions || [],
            medicalConditionsOther: profile.medical_conditions_other || '',
            dietaryPreferences: profile.dietary_preferences || [],
            dietaryPreferencesOther: profile.dietary_preferences_other || '',
            dislikedFoods: profile.disliked_foods || '',
            gender: profile.gender || '',
            genderOther: profile.gender_other || '',
            age: profile.age
          };
          setUserContext(context);
          setMissingFields(getMissingProfileFields(context));
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
    };

    fetchProfile();
  }, []);

  // Start camera and announce on mount
  useEffect(() => {
    speak("Captura de imagen. Centra el objeto y toca la pantalla para analizar.");
    startCamera();
    
    return () => {
      stopCamera();
    };
  }, []);

  // Announce camera ready
  useEffect(() => {
    if (cameraReady) {
      speak("Cámara lista. Toca el botón capturar para tomar una foto.");
    }
  }, [cameraReady]);

  // Announce camera error
  useEffect(() => {
    if (cameraError) {
      speak(cameraError, { priority: true });
    }
  }, [cameraError]);

  const handleCapture = async () => {
    if (!cameraReady) {
      speak("La cámara aún no está lista");
      return;
    }

    speak("Capturando imagen", { priority: true });
    setState("capturing");
    
    const imageData = captureFrame();
    if (!imageData) {
      speak("Error al capturar la imagen");
      setState("error");
      setErrorMessage("No se pudo capturar la imagen. Intenta de nuevo.");
      return;
    }
    
    setCapturedImage(imageData);
    stopCamera();
    
    setState("analyzing");
    speak("Analizando imagen con tu perfil personalizado. Por favor espera.");
    
    try {
      const { data, error } = await supabase.functions.invoke('analyze-image', {
        body: { 
          imageBase64: imageData,
          userContext: userContext
        }
      });

      if (error) {
        throw error;
      }

      if (data.error) {
        throw new Error(data.error);
      }

      // Use structured analysis if available, fallback to description
      if (data.analysis) {
        setAnalysis(data.analysis);
      } else {
        setAnalysis({
          description: data.description || "No se pudo generar una descripción.",
          alerts: [],
          safeToConsume: null,
          recommendations: []
        });
      }
      
      setState("result");
      
    } catch (error) {
      console.error('Analysis error:', error);
      const errorMsg = error instanceof Error ? error.message : "Error al analizar la imagen";
      setErrorMessage(errorMsg);
      setState("error");
      speak(`Error: ${errorMsg}`);
      toast.error(errorMsg);
    }
  };

  const handleReset = () => {
    speak("Nueva foto. Preparando cámara.");
    setState("ready");
    setAnalysis(null);
    setCapturedImage(null);
    setErrorMessage("");
    startCamera();
  };

  const handleShare = async () => {
    if (!analysis?.description) return;
    speak(analysis.description, { priority: true });
  };

  return (
    <>
      <Header title="Analizar Foto" showBack />
      
      <MobileLayout showBottomNav className="flex flex-col py-6">
        {/* Profile incomplete prompt */}
        {state === "ready" && missingFields.length > 0 && (
          <ProfileIncompletePrompt missingFields={missingFields} />
        )}

        {(state === "ready" || state === "capturing") && (
          <div className="flex-1 flex flex-col items-center justify-center gap-6 animate-fade-in">
            {/* Camera viewfinder */}
            <div className="relative w-full aspect-[3/4] max-w-[300px] bg-muted rounded-3xl overflow-hidden border-2 border-border">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="absolute inset-0 w-full h-full object-cover"
              />
              
              {!cameraReady && !cameraError && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/60">
                  <Loader2 className="w-10 h-10 text-primary animate-spin" />
                </div>
              )}
              
              {cameraError && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 p-4">
                  <AlertTriangle className="w-10 h-10 text-destructive mb-2" />
                  <p className="text-sm text-center text-muted-foreground">{cameraError}</p>
                </div>
              )}
              
              {/* Guide corners */}
              <div className="absolute top-4 left-4 w-8 h-8 border-l-4 border-t-4 border-primary rounded-tl-lg pointer-events-none" />
              <div className="absolute top-4 right-4 w-8 h-8 border-r-4 border-t-4 border-primary rounded-tr-lg pointer-events-none" />
              <div className="absolute bottom-4 left-4 w-8 h-8 border-l-4 border-b-4 border-primary rounded-bl-lg pointer-events-none" />
              <div className="absolute bottom-4 right-4 w-8 h-8 border-r-4 border-b-4 border-primary rounded-br-lg pointer-events-none" />

              {state === "capturing" && (
                <div className="absolute inset-0 bg-white/50 animate-pulse" />
              )}
            </div>

            <p className="text-center text-muted-foreground px-8">
              {userContext ? 
                "Tu perfil será usado para alertas personalizadas" : 
                "Centra el objeto y toca el botón para capturar"
              }
            </p>

            <Button
              variant="hero"
              size="hero"
              onClick={handleCapture}
              onMouseEnter={() => speak("Botón capturar foto")}
              disabled={!cameraReady || state === "capturing"}
              className="w-full max-w-[300px]"
            >
              {state === "capturing" ? (
                <Loader2 className="w-7 h-7 animate-spin" />
              ) : (
                <Camera className="w-7 h-7" />
              )}
              <span>{state === "capturing" ? "Capturando..." : "Capturar Foto"}</span>
            </Button>
          </div>
        )}

        {state === "analyzing" && (
          <div className="flex-1 flex flex-col items-center justify-center gap-6 animate-fade-in">
            {capturedImage && (
              <div className="w-full max-w-[250px] aspect-[3/4] rounded-2xl overflow-hidden border-2 border-border">
                <img 
                  src={capturedImage} 
                  alt="Imagen capturada" 
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            
            <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center">
              <Loader2 className="w-10 h-10 text-primary animate-spin" />
            </div>
            <div className="text-center">
              <p className="text-xl font-semibold text-foreground">
                Analizando imagen...
              </p>
              <p className="text-muted-foreground mt-2">
                {userContext ? "Aplicando tu perfil personalizado" : "La IA está procesando la imagen"}
              </p>
            </div>
          </div>
        )}

        {state === "error" && (
          <div className="flex-1 flex flex-col items-center justify-center gap-6 animate-fade-in">
            <div className="w-20 h-20 rounded-full bg-destructive/20 flex items-center justify-center">
              <AlertTriangle className="w-10 h-10 text-destructive" />
            </div>
            <div className="text-center px-4">
              <p className="text-xl font-semibold text-foreground">
                Error en el análisis
              </p>
              <p className="text-muted-foreground mt-2">
                {errorMessage}
              </p>
            </div>
            <Button
              variant="hero"
              size="hero"
              onClick={handleReset}
              className="w-full max-w-[300px]"
            >
              <Camera className="w-6 h-6" />
              <span>Intentar de nuevo</span>
            </Button>
          </div>
        )}

        {state === "result" && analysis && (
          <AnalysisResults 
            analysis={analysis}
            capturedImage={capturedImage}
            onReset={handleReset}
            onShare={handleShare}
          />
        )}
      </MobileLayout>

      <BottomNav />
    </>
  );
}
