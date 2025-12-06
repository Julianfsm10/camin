import { useState } from "react";
import { Camera, RotateCcw, Share2, Volume2, ArrowLeft, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { BottomNav } from "@/components/layout/BottomNav";
import { Header } from "@/components/layout/Header";

type AnalysisState = "ready" | "capturing" | "analyzing" | "result";

export default function AnalyzePhoto() {
  const navigate = useNavigate();
  const [state, setState] = useState<AnalysisState>("ready");
  const [description, setDescription] = useState("");

  const handleCapture = async () => {
    setState("capturing");
    
    // Simulate capture delay
    await new Promise((resolve) => setTimeout(resolve, 500));
    setState("analyzing");

    // Simulate AI analysis
    await new Promise((resolve) => setTimeout(resolve, 2000));
    
    setDescription(
      "Una taza de café blanca sobre una mesa de madera clara. " +
      "Al fondo se ve una ventana con luz natural entrando. " +
      "Junto a la taza hay un libro abierto con páginas amarillentas. " +
      "El ambiente transmite tranquilidad y un momento de lectura relajada."
    );
    setState("result");
  };

  const handleReset = () => {
    setState("ready");
    setDescription("");
  };

  const handleSpeak = () => {
    if ('speechSynthesis' in window && description) {
      const utterance = new SpeechSynthesisUtterance(description);
      utterance.lang = 'es-ES';
      utterance.rate = 0.9;
      speechSynthesis.speak(utterance);
    }
  };

  return (
    <>
      <Header title="Analizar Foto" showBack />
      
      <MobileLayout showBottomNav className="flex flex-col py-6">
        {state === "ready" && (
          <div className="flex-1 flex flex-col items-center justify-center gap-8 animate-fade-in">
            {/* Camera viewfinder */}
            <div className="relative w-full aspect-[3/4] max-w-[300px] bg-muted rounded-3xl overflow-hidden border-2 border-border">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-32 h-32 border-2 border-dashed border-primary/50 rounded-2xl flex items-center justify-center">
                  <Camera className="w-12 h-12 text-primary/50" />
                </div>
              </div>
              
              {/* Guide corners */}
              <div className="absolute top-4 left-4 w-8 h-8 border-l-4 border-t-4 border-primary rounded-tl-lg" />
              <div className="absolute top-4 right-4 w-8 h-8 border-r-4 border-t-4 border-primary rounded-tr-lg" />
              <div className="absolute bottom-4 left-4 w-8 h-8 border-l-4 border-b-4 border-primary rounded-bl-lg" />
              <div className="absolute bottom-4 right-4 w-8 h-8 border-r-4 border-b-4 border-primary rounded-br-lg" />
            </div>

            <p className="text-center text-muted-foreground px-8">
              Centra el objeto y toca el botón para capturar
            </p>

            <Button
              variant="hero"
              size="hero"
              onClick={handleCapture}
              className="w-full max-w-[300px]"
            >
              <Camera className="w-7 h-7" />
              <span>Capturar Foto</span>
            </Button>
          </div>
        )}

        {(state === "capturing" || state === "analyzing") && (
          <div className="flex-1 flex flex-col items-center justify-center gap-6 animate-fade-in">
            <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center">
              <Loader2 className="w-10 h-10 text-primary animate-spin" />
            </div>
            <div className="text-center">
              <p className="text-xl font-semibold text-foreground">
                {state === "capturing" ? "Capturando..." : "Analizando imagen..."}
              </p>
              <p className="text-muted-foreground mt-2">
                {state === "analyzing" && "La IA está procesando la imagen"}
              </p>
            </div>
          </div>
        )}

        {state === "result" && (
          <div className="flex-1 flex flex-col gap-6 animate-fade-in">
            {/* Result image placeholder */}
            <div className="w-full aspect-[4/3] bg-muted rounded-2xl flex items-center justify-center">
              <Camera className="w-16 h-16 text-muted-foreground/30" />
            </div>

            {/* Description */}
            <div className="card-elevated">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-foreground">Descripción</h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleSpeak}
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
                className="w-full"
              >
                <RotateCcw className="w-6 h-6" />
                <span>Nueva Foto</span>
              </Button>

              <Button
                variant="hero-outline"
                size="hero-secondary"
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
