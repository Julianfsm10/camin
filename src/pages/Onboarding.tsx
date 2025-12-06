import { useState } from "react";
import { Camera, Mic, MapPin, Volume2, Vibrate, ArrowRight, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { VisionLogo } from "@/components/icons/VisionLogo";
import { cn } from "@/lib/utils";

interface OnboardingStep {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: string;
  permission?: "camera" | "microphone" | "location";
}

const steps: OnboardingStep[] = [
  {
    icon: <VisionLogo size={80} />,
    title: "Bienvenido a Vision AI",
    description: "Tu asistente visual inteligente que te ayuda a navegar el mundo con confianza.",
  },
  {
    icon: <Camera className="w-16 h-16" />,
    title: "Acceso a la cámara",
    description: "Necesitamos tu cámara para detectar obstáculos y analizar imágenes en tiempo real.",
    action: "Permitir cámara",
    permission: "camera",
  },
  {
    icon: <Mic className="w-16 h-16" />,
    title: "Acceso al micrófono",
    description: "El micrófono nos permite escuchar comandos de voz para una experiencia manos libres.",
    action: "Permitir micrófono",
    permission: "microphone",
  },
  {
    icon: <MapPin className="w-16 h-16" />,
    title: "Ubicación (opcional)",
    description: "Tu ubicación mejora la precisión de las indicaciones y ayuda en emergencias.",
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
  },
  {
    icon: <Check className="w-16 h-16" />,
    title: "¡Todo listo!",
    description: "Ya puedes comenzar a usar Vision AI. Tu seguridad es nuestra prioridad.",
  },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [permissions, setPermissions] = useState({
    camera: false,
    microphone: false,
    location: false,
  });

  const step = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  const progress = ((currentStep + 1) / steps.length) * 100;

  const handlePermission = async (type: "camera" | "microphone" | "location") => {
    try {
      if (type === "camera") {
        await navigator.mediaDevices.getUserMedia({ video: true });
      } else if (type === "microphone") {
        await navigator.mediaDevices.getUserMedia({ audio: true });
      } else if (type === "location") {
        await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject);
        });
      }
      setPermissions((prev) => ({ ...prev, [type]: true }));
    } catch (error) {
      console.log("Permission denied or not available");
    }
    // Move to next step regardless
    handleNext();
  };

  const handleNext = () => {
    if (isLastStep) {
      navigate("/dashboard");
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleSkip = () => {
    handleNext();
  };

  return (
    <div className="min-h-screen bg-background flex flex-col px-6 py-8">
      {/* Progress bar */}
      <div className="w-full h-1 bg-muted rounded-full mb-8">
        <div
          className="h-full bg-primary rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Step indicators */}
      <div className="flex justify-center gap-2 mb-8">
        {steps.map((_, index) => (
          <div
            key={index}
            className={cn(
              "w-2 h-2 rounded-full transition-colors duration-300",
              index === currentStep
                ? "bg-primary w-6"
                : index < currentStep
                ? "bg-primary/50"
                : "bg-muted"
            )}
          />
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center text-center animate-fade-in">
        {/* Icon */}
        <div className="w-24 h-24 flex items-center justify-center text-primary mb-8">
          {step.icon}
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-foreground mb-4">{step.title}</h1>

        {/* Description */}
        <p className="text-lg text-muted-foreground max-w-[280px] leading-relaxed">
          {step.description}
        </p>
      </div>

      {/* Actions */}
      <div className="space-y-3 mt-8">
        {step.permission ? (
          <>
            <Button
              variant="hero"
              size="hero"
              onClick={() => handlePermission(step.permission!)}
              className={cn(
                permissions[step.permission] && "bg-success hover:bg-success"
              )}
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
            <Button
              variant="ghost"
              size="lg"
              onClick={handleSkip}
              className="w-full text-muted-foreground"
            >
              {step.permission === "location" ? "Omitir" : "Más tarde"}
            </Button>
          </>
        ) : (
          <Button variant="hero" size="hero" onClick={handleNext}>
            <span>{isLastStep ? "Comenzar" : "Continuar"}</span>
            <ArrowRight className="w-6 h-6" />
          </Button>
        )}
      </div>
    </div>
  );
}
