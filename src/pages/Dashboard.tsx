import { Camera, Image, Settings, Wifi, BatteryMedium, Volume2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { BottomNav } from "@/components/layout/BottomNav";
import { VisionLogo } from "@/components/icons/VisionLogo";

export default function Dashboard() {
  const navigate = useNavigate();

  return (
    <MobileLayout showBottomNav className="flex flex-col py-6">
      {/* Header */}
      <header className="flex items-center justify-between mb-8 animate-fade-in">
        <div className="flex items-center gap-3">
          <VisionLogo size={40} />
          <div>
            <h1 className="text-lg font-semibold text-foreground">Vision AI</h1>
            <p className="text-sm text-muted-foreground">¡Hola! ¿Qué necesitas?</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon-lg"
          onClick={() => navigate("/settings")}
          aria-label="Configuración"
        >
          <Settings className="w-6 h-6" />
        </Button>
      </header>

      {/* Main Actions */}
      <div className="flex-1 flex flex-col gap-6">
        {/* Primary Action - Start Route */}
        <div 
          className="flex-[6] animate-fade-in" 
          style={{ animationDelay: "100ms" }}
        >
          <Button
            variant="hero"
            size="hero"
            onClick={() => navigate("/route")}
            className="h-full min-h-[200px] flex-col gap-4 animate-pulse-soft"
          >
            <div className="w-20 h-20 rounded-full bg-primary-foreground/20 flex items-center justify-center">
              <Camera className="w-10 h-10" />
            </div>
            <div className="text-center">
              <span className="block text-2xl font-bold">Iniciar Recorrido</span>
              <span className="block text-base opacity-80 mt-1">
                Detecta obstáculos en tiempo real
              </span>
            </div>
          </Button>
        </div>

        {/* Secondary Action - Analyze Photo */}
        <div 
          className="flex-[3] animate-fade-in" 
          style={{ animationDelay: "200ms" }}
        >
          <Button
            variant="hero-secondary"
            size="hero-secondary"
            onClick={() => navigate("/analyze")}
            className="h-full min-h-[120px] flex-col gap-3"
          >
            <div className="w-14 h-14 rounded-full bg-secondary-foreground/20 flex items-center justify-center">
              <Image className="w-7 h-7" />
            </div>
            <div className="text-center">
              <span className="block text-xl font-semibold">Analizar Foto</span>
              <span className="block text-sm opacity-80 mt-0.5">
                Describe cualquier imagen
              </span>
            </div>
          </Button>
        </div>
      </div>

      {/* Status Bar */}
      <div 
        className="mt-6 flex items-center justify-center gap-6 text-muted-foreground animate-fade-in"
        style={{ animationDelay: "300ms" }}
        role="status"
        aria-label="Estado del sistema"
      >
        <div className="flex items-center gap-2" aria-label="Conexión activa">
          <Wifi className="w-4 h-4 text-success" />
          <span className="text-xs">Conectado</span>
        </div>
        <div className="flex items-center gap-2" aria-label="Batería al 75%">
          <BatteryMedium className="w-4 h-4" />
          <span className="text-xs">75%</span>
        </div>
        <div className="flex items-center gap-2" aria-label="Volumen activado">
          <Volume2 className="w-4 h-4" />
          <span className="text-xs">Audio ON</span>
        </div>
      </div>

      <BottomNav />
    </MobileLayout>
  );
}
