import { useState, useEffect } from "react";
import { AlertTriangle, StopCircle, Volume2, VolumeX, Vibrate } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Detection {
  type: string;
  distance: number;
  direction: string;
  severity: "low" | "medium" | "high";
}

export default function ActiveRoute() {
  const navigate = useNavigate();
  const [isActive, setIsActive] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [detections, setDetections] = useState<Detection[]>([]);

  // Simulate detections
  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      const types = ["Persona", "Vehículo", "Obstáculo", "Escalón", "Puerta"];
      const directions = ["adelante", "izquierda", "derecha"];
      const distances = [1, 2, 3, 4, 5];
      
      const newDetection: Detection = {
        type: types[Math.floor(Math.random() * types.length)],
        distance: distances[Math.floor(Math.random() * distances.length)],
        direction: directions[Math.floor(Math.random() * directions.length)],
        severity: Math.random() > 0.7 ? "high" : Math.random() > 0.4 ? "medium" : "low",
      };

      setDetections([newDetection]);

      // Vibration feedback
      if (navigator.vibrate) {
        if (newDetection.severity === "high") {
          navigator.vibrate([100, 50, 100]);
        } else if (newDetection.severity === "medium") {
          navigator.vibrate(100);
        } else {
          navigator.vibrate(50);
        }
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [isActive]);

  const handleStop = () => {
    setIsActive(false);
    navigate("/dashboard");
  };

  const getSeverityColor = (severity: Detection["severity"]) => {
    switch (severity) {
      case "high":
        return "border-destructive bg-destructive/20 text-destructive";
      case "medium":
        return "border-warning bg-warning/20 text-warning";
      case "low":
        return "border-success bg-success/20 text-success";
    }
  };

  return (
    <div className="fixed inset-0 bg-background flex flex-col">
      {/* Camera View Placeholder */}
      <div className="flex-1 relative bg-muted flex items-center justify-center">
        {/* Simulated camera view */}
        <div className="absolute inset-0 bg-gradient-to-b from-background/20 to-background/60" />
        
        {/* Scanning overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-64 h-64 border-2 border-primary/50 rounded-3xl animate-pulse" />
        </div>

        {/* Status indicator */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
          <div className="px-4 py-2 bg-card/90 backdrop-blur-sm rounded-full flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-success animate-pulse" />
            <span className="text-sm font-medium text-foreground">Detectando...</span>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setAudioEnabled(!audioEnabled)}
            className="bg-card/90 backdrop-blur-sm"
            aria-label={audioEnabled ? "Silenciar audio" : "Activar audio"}
          >
            {audioEnabled ? (
              <Volume2 className="w-5 h-5" />
            ) : (
              <VolumeX className="w-5 h-5" />
            )}
          </Button>
        </div>

        {/* Detection alerts */}
        {detections.length > 0 && (
          <div className="absolute top-20 left-4 right-4 space-y-3">
            {detections.map((detection, index) => (
              <div
                key={index}
                className={cn(
                  "px-4 py-3 rounded-2xl border-2 backdrop-blur-sm animate-fade-in flex items-center gap-3",
                  getSeverityColor(detection.severity)
                )}
                role="alert"
                aria-live="assertive"
              >
                <AlertTriangle className="w-6 h-6 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-semibold text-lg">
                    {detection.type}
                  </p>
                  <p className="text-sm opacity-80">
                    {detection.distance}m • {detection.direction}
                  </p>
                </div>
                <Vibrate className="w-5 h-5 opacity-60" />
              </div>
            ))}
          </div>
        )}

        {/* Center guide text */}
        <p className="text-foreground/60 text-center px-8 mt-32">
          Apunta la cámara hacia adelante para detectar obstáculos
        </p>
      </div>

      {/* Bottom Controls */}
      <div 
        className="bg-card border-t border-border p-4 space-y-4"
        style={{ paddingBottom: "max(env(safe-area-inset-bottom), 16px)" }}
      >
        {/* Quick info */}
        {detections.length === 0 && (
          <div className="text-center py-2">
            <p className="text-success font-medium text-lg">Todo despejado</p>
            <p className="text-muted-foreground text-sm">No se detectan obstáculos cercanos</p>
          </div>
        )}

        {/* Stop button */}
        <Button
          variant="destructive"
          size="hero"
          onClick={handleStop}
          className="gap-3"
        >
          <StopCircle className="w-7 h-7" />
          <span>Detener Recorrido</span>
        </Button>
      </div>
    </div>
  );
}
