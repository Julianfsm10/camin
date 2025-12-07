import { useState, useEffect } from "react";
import { Camera, Mic, MapPin, Volume2, Vibrate, ArrowRight, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CaminAILogo } from "@/components/icons/CaminAILogo";
import { useVoice } from "@/hooks/useVoice";
import { cn } from "@/lib/utils";

interface OnboardingStep {
  icon: React.ReactNode;
  title: string;
  description: string;
  voiceDescription: string;
  action?: string;
  permission?: "camera" | "microphone" | "location";
}

const steps: OnboardingStep[] = [
  {
    icon: <CaminAILogo size={80} />,
    title: "Bienvenido a CaminAI",
    description: "Tu asistente de movilidad con IA que te ayuda a navegar el mundo con confianza.",
    voiceDescription: "Bienvenido a CaminAI. Tu asistente de movilidad con inteligencia artificial que te ayuda a navegar el mundo con confianza.",
  },
  {
    icon: <Camera className="w-16 h-16" />,
    title: "Acceso a la cámara",
    description: "Necesitamos tu cámara para detectar obstáculos y analizar imágenes en tiempo real.",
    voiceDescription: "Paso 2. Acceso a la cámara. Necesitamos tu cámara para detectar obstáculos. Toca el botón para permitir.",
    action: "Permitir cámara",
    permission: "camera",
  },
  {
    icon: <Mic className="w-16 h-16" />,
    title: "Acceso al micrófono",
    description: "El micrófono nos permite escuchar comandos de voz para una experiencia manos libres.",
    voiceDescription: "Paso 3. Acceso al micrófono. Permite el micrófono para comandos de voz.",
    action: "Permitir micrófono",
    permission: "microphone",
  },
  {
    icon: <MapPin className="w-16 h-16" />,
    title: "Ubicación (opcional)",
    description: "Tu ubicación mejora la precisión de las indicaciones y ayuda en emergencias.",
    voiceDescription: "Paso 4. Ubicación opcional. Mejora la precisión y ayuda en emergencias. Puedes omitir este paso.",
    action: "Permitir ubicación",
    permission: "location",
  },
  {
    icon: (
      <div className="flex gap-4">
        <Volume2 className="w-12 h-12" />
        <Vibrate className="w-12 h-12" />
      </div>
    ),
    title: "Alertas inteligentes",
    description: "Recibirás alertas por voz y vibración cuando detectemos obstáculos cerca de ti.",
    voiceDescription: "Paso 5. Alertas inteligentes. Recibirás alertas por voz y vibración cuando detectemos obstáculos.",
  },
  {
    icon: <Check className="w-16 h-16" />,
    title: "¡Todo listo!",
    description: "Ya puedes comenzar a usar CaminAI. Tu seguridad es nuestra prioridad.",
    voiceDescription: "¡Todo listo! Ya puedes comenzar a usar CaminAI. Toca comenzar para ir al panel principal.",
  },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const { speak } = useVoice();
  const [currentStep, setCurrentStep] = useState(0);
  const [permissions, setPermissions] = useState({
    camera: false,
    microphone: false,
    location: false,
  });

  const step = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  const progress = ((currentStep + 1) / steps.length) * 100;

  // Announce step on change
  useEffect(() => {
    const timer = setTimeout(() => {
      speak(step.voiceDescription);
    }, 500);
    return () => clearTimeout(timer);
  }, [currentStep]);

  const handlePermission = async (type: "camera" | "microphone" | "location") => {
    speak("Solicitando permiso", { priority: true });
    try {
      if (type === "camera") {
        await navigator.mediaDevices.getUserMedia({ video: true });
        speak("Cámara permitida");
      } else if (type === "microphone") {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        speak("Micrófono permitido");
      } else if (type === "location") {
        await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject);
        });
        speak("Ubicación permitida");
      }
      setPermissions((prev) => ({ ...prev, [type]: true }));
    } catch (error) {
      speak("Permiso no otorgado. Continuando.");
    }
    if (navigator.vibrate) navigator.vibrate(100);
    setTimeout(() => handleNext(), 500);
  };

  const handleNext = () => {
    if (isLastStep) {
      speak("Iniciando CaminAI", { priority: true });
      navigate("/dashboard");
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleSkip = () => {
    speak("Omitiendo paso");
    if (navigator.vibrate) navigator.vibrate(50);
    handleNext();
  };

  return (
    <div className="min-h-screen bg-background flex flex-col px-6 py-8">
      <div className="w-full h-1 bg-muted rounded-full mb-8">
        <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
      </div>

      <div className="flex justify-center gap-2 mb-8">
        {steps.map((_, index) => (
          <div
            key={index}
            className={cn(
              "w-2 h-2 rounded-full transition-colors duration-300",
              index === currentStep ? "bg-primary w-6" : index < currentStep ? "bg-primary/50" : "bg-muted"
            )}
          />
        ))}
      </div>

      <div className="flex-1 flex flex-col items-center justify-center text-center animate-fade-in">
        <div className="w-24 h-24 flex items-center justify-center text-primary mb-8">{step.icon}</div>
        <h1 className="text-2xl font-bold text-foreground mb-4">{step.title}</h1>
        <p className="text-lg text-muted-foreground max-w-[280px] leading-relaxed">{step.description}</p>
      </div>

      <div className="space-y-3 mt-8">
        {step.permission ? (
          <>
            <Button
              variant="hero"
              size="hero"
              onClick={() => handlePermission(step.permission!)}
              onMouseEnter={() => speak(`Botón ${step.action}`)}
              className={cn(permissions[step.permission] && "bg-success hover:bg-success")}
            >
              {permissions[step.permission] ? (
                <>
                  <Check className="w-6 h-6" />
                  <span>Permitido</span>
                </>
              ) : (
                <span>{step.action}</span>
              )}
            </Button>
            <Button variant="ghost" size="lg" onClick={handleSkip} onMouseEnter={() => speak("Botón omitir")} className="w-full text-muted-foreground">
              {step.permission === "location" ? "Omitir" : "Más tarde"}
            </Button>
          </>
        ) : (
          <Button variant="hero" size="hero" onClick={handleNext} onMouseEnter={() => speak(isLastStep ? "Botón comenzar" : "Botón continuar")}>
            <span>{isLastStep ? "Comenzar" : "Continuar"}</span>
            <ArrowRight className="w-6 h-6" />
          </Button>
        )}
      </div>
    </div>
  );
}
