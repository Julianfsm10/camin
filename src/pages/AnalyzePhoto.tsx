import { useState, useEffect } from "react";
import { Camera, RotateCcw, Share2, Volume2, Loader2, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { BottomNav } from "@/components/layout/BottomNav";
import { Header } from "@/components/layout/Header";
import { useVoice } from "@/hooks/useVoice";
import { useCamera } from "@/hooks/useCamera";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type AnalysisState = "ready" | "capturing" | "analyzing" | "result" | "error";

export default function AnalyzePhoto() {
  const navigate = useNavigate();
  const { speak, speakOnClick } = useVoice();
  const { videoRef, isReady: cameraReady, error: cameraError, startCamera, stopCamera, captureFrame } = useCamera();
  
  const [state, setState] = useState<AnalysisState>("ready");
  const [description, setDescription] = useState("");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

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
    
    // Capture frame
    const imageData = captureFrame();
    if (!imageData) {
      speak("Error al capturar la imagen");
      setState("error");
      setErrorMessage("No se pudo capturar la imagen. Intenta de nuevo.");
      return;
    }
    
    setCapturedImage(imageData);
    stopCamera();
    
    // Analyze with AI
    setState("analyzing");
    speak("Analizando imagen. Por favor espera.");
    
    try {
      const { data, error } = await supabase.functions.invoke('analyze-image', {
        body: { imageBase64: imageData }
      });

      if (error) {
        throw error;
      }

      if (data.error) {
        throw new Error(data.error);
      }

      const aiDescription = data.description;
      setDescription(aiDescription);
      setState("result");
      
      // Auto-speak the description
      setTimeout(() => {
        speak(`Descripción de la imagen: ${aiDescription}`);
      }, 300);
      
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
    setDescription("");
    setCapturedImage(null);
    setErrorMessage("");
    startCamera();
  };

  const handleSpeak = () => {
    if (description) {
      speak(description, { priority: true });
    }
  };

  const handleShare = async () => {
    if (!description) return;
    
    speak("Compartiendo descripción");
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Descripción de imagen - CaminAI',
          text: description
        });
      } catch (err) {
        // User cancelled or error
        console.log('Share cancelled');
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(description);
        toast.success("Descripción copiada al portapapeles");
        speak("Descripción copiada al portapapeles");
      } catch (err) {
        toast.error("No se pudo copiar");
      }
    }
  };

  return (
    <>
      <Header title="Analizar Foto" showBack />
      
      <MobileLayout showBottomNav className="flex flex-col py-6">
        {(state === "ready" || state === "capturing") && (
          <div className="flex-1 flex flex-col items-center justify-center gap-6 animate-fade-in">
            {/* Camera viewfinder */}
            <div className="relative w-full aspect-[3/4] max-w-[300px] bg-muted rounded-3xl overflow-hidden border-2 border-border">
              {/* Video element */}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="absolute inset-0 w-full h-full object-cover"
              />
              
              {/* Loading overlay */}
              {!cameraReady && !cameraError && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/60">
                  <Loader2 className="w-10 h-10 text-primary animate-spin" />
                </div>
              )}
              
              {/* Error overlay */}
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

              {/* Capture indicator */}
              {state === "capturing" && (
                <div className="absolute inset-0 bg-white/50 animate-pulse" />
              )}
            </div>

            <p className="text-center text-muted-foreground px-8">
              Centra el objeto y toca el botón para capturar
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
            {/* Show captured image */}
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
                La IA está procesando la imagen
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
              <RotateCcw className="w-6 h-6" />
              <span>Intentar de nuevo</span>
            </Button>
          </div>
        )}

        {state === "result" && (
          <div className="flex-1 flex flex-col gap-6 animate-fade-in">
            {/* Result image */}
            {capturedImage && (
              <div className="w-full aspect-[4/3] rounded-2xl overflow-hidden border-2 border-border">
                <img 
                  src={capturedImage} 
                  alt="Imagen analizada" 
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Description */}
            <div className="card-elevated">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-foreground">Descripción</h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleSpeak}
                  onMouseEnter={() => speak("Botón escuchar descripción")}
                  aria-label="Escuchar descripción"
                >
                  <Volume2 className="w-5 h-5" />
                </Button>
              </div>
              <p className="text-body text-foreground leading-relaxed">
                {description}
              </p>
            </div>

            {/* Actions */}
            <div className="space-y-3 mt-auto">
              <Button
                variant="hero"
                size="hero-secondary"
                onClick={handleReset}
                onMouseEnter={() => speak("Botón nueva foto")}
                className="w-full"
              >
                <RotateCcw className="w-6 h-6" />
                <span>Nueva Foto</span>
              </Button>

              <Button
                variant="hero-outline"
                size="hero-secondary"
                onClick={handleShare}
                onMouseEnter={() => speak("Botón compartir descripción")}
                className="w-full"
              >
                <Share2 className="w-6 h-6" />
                <span>Compartir Descripción</span>
              </Button>
            </div>
          </div>
        )}
      </MobileLayout>

      <BottomNav />
    </>
  );
}
