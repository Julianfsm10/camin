import { useState, useEffect, useRef, useCallback } from "react";
import { AlertTriangle, StopCircle, Volume2, VolumeX, Loader2, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useVoice } from "@/hooks/useVoice";
import { useCamera } from "@/hooks/useCamera";
import { useObjectDetection, Detection, DETECTION_CONFIG } from "@/hooks/useObjectDetection";

export default function ActiveRoute() {
  const navigate = useNavigate();
  const { speak, speakObstacle, stop: stopSpeech } = useVoice();
  const { videoRef, isReady: cameraReady, error: cameraError, startCamera, stopCamera } = useCamera();
  const { isModelLoaded, isLoading: modelLoading, detections, startDetection, stopDetection } = useObjectDetection();
  
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [isActive, setIsActive] = useState(false);
  const lastAnnouncedRef = useRef<string>("");
  const announceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastAnnouncementTime = useRef<number>(0);
  const ANNOUNCEMENT_INTERVAL = 2000; // Announce every 2 seconds max

  // Start camera on mount
  useEffect(() => {
    speak("Iniciando cámara", { priority: true });
    startCamera();
    
    return () => {
      stopCamera();
      stopDetection();
      stopSpeech();
      if (announceTimeoutRef.current) {
        clearTimeout(announceTimeoutRef.current);
      }
    };
  }, []);

  // Start detection when camera and model are ready
  useEffect(() => {
    if (cameraReady && isModelLoaded && videoRef.current) {
      speak("Cámara lista. Modelo cargado. Detectando zona frontal: 2 metros adelante.", { priority: true });
      setIsActive(true);
      startDetection(videoRef.current);
    }
  }, [cameraReady, isModelLoaded]);

  // Announce camera error
  useEffect(() => {
    if (cameraError) {
      speak(cameraError, { priority: true });
    }
  }, [cameraError]);

  // Announce detections with throttling
  useEffect(() => {
    if (!audioEnabled || !isActive || detections.length === 0) return;

    const now = Date.now();
    if (now - lastAnnouncementTime.current < ANNOUNCEMENT_INTERVAL) return;

    const closest = detections[0];
    const announcementKey = `${closest.class}-${closest.distance}-${closest.position}`;
    
    // Only announce if it's a different detection
    if (announcementKey !== lastAnnouncedRef.current) {
      lastAnnouncedRef.current = announcementKey;
      lastAnnouncementTime.current = now;
      
      // Clear previous timeout
      if (announceTimeoutRef.current) {
        clearTimeout(announceTimeoutRef.current);
      }
      
      // Announce immediately
      speakObstacle(closest.class, closest.distance, closest.positionX);
      
      // Vibration proportional to distance
      if (navigator.vibrate) {
        if (closest.distance < 1) {
          // Very close - urgent pattern
          navigator.vibrate([300, 100, 300, 100, 300]);
        } else if (closest.distance < 2) {
          // Medium distance - warning pattern
          navigator.vibrate([200, 100, 200]);
        } else {
          // Farther - gentle notification
          navigator.vibrate(150);
        }
      }
    }
  }, [detections, audioEnabled, isActive, speakObstacle]);

  const handleStop = () => {
    speak("Recorrido detenido", { priority: true });
    setIsActive(false);
    stopDetection();
    stopCamera();
    setTimeout(() => navigate("/dashboard"), 500);
  };

  const toggleAudio = () => {
    const newState = !audioEnabled;
    setAudioEnabled(newState);
    speak(newState ? "Audio activado" : "Audio desactivado", { priority: true });
  };

  const getSeverityFromDistance = (distance: number): "low" | "medium" | "high" => {
    if (distance < 1) return "high";
    if (distance < 2) return "medium";
    return "low";
  };

  const getSeverityColor = (severity: "low" | "medium" | "high") => {
    switch (severity) {
      case "high":
        return "border-destructive bg-destructive/20 text-destructive";
      case "medium":
        return "border-warning bg-warning/20 text-warning";
      case "low":
        return "border-success bg-success/20 text-success";
    }
  };

  const getObjectLabel = (className: string): string => {
    const labels: Record<string, string> = {
      'person': 'Persona',
      'car': 'Auto',
      'truck': 'Camión',
      'bus': 'Autobús',
      'bicycle': 'Bicicleta',
      'motorcycle': 'Moto',
      'dog': 'Perro',
      'cat': 'Gato',
      'chair': 'Silla',
      'couch': 'Sofá',
      'potted plant': 'Planta',
      'dining table': 'Mesa',
      'bottle': 'Botella',
      'cup': 'Taza',
      'backpack': 'Mochila',
      'umbrella': 'Paraguas',
      'handbag': 'Bolso',
      'suitcase': 'Maleta',
      'bench': 'Banca',
      'stop sign': 'Señal de alto',
      'traffic light': 'Semáforo',
      'fire hydrant': 'Hidrante'
    };
    return labels[className.toLowerCase()] || className;
  };

  const getDirectionLabel = (position: string): string => {
    return position;
  };

  return (
    <div className="fixed inset-0 bg-background flex flex-col">
      {/* Camera View */}
      <div className="flex-1 relative bg-muted overflow-hidden">
        {/* Video element */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Loading overlay */}
        {(!cameraReady || !isModelLoaded) && !cameraError && (
          <div className="absolute inset-0 bg-background/80 flex flex-col items-center justify-center gap-4 z-10">
            <Loader2 className="w-12 h-12 text-primary animate-spin" />
            <div className="text-center px-8">
              <p className="text-lg font-semibold text-foreground">
                {!cameraReady ? "Iniciando cámara..." : "Cargando modelo de detección..."}
              </p>
              {modelLoading && (
                <p className="text-sm text-muted-foreground mt-2">
                  Esto puede tomar unos segundos la primera vez
                </p>
              )}
            </div>
          </div>
        )}

        {/* Error overlay */}
        {cameraError && (
          <div className="absolute inset-0 bg-background flex flex-col items-center justify-center gap-4 z-10 px-8">
            <AlertTriangle className="w-16 h-16 text-destructive" />
            <div className="text-center">
              <p className="text-lg font-semibold text-foreground mb-2">Error de cámara</p>
              <p className="text-muted-foreground">{cameraError}</p>
            </div>
            <Button variant="hero" onClick={() => navigate("/dashboard")}>
              Volver al inicio
            </Button>
          </div>
        )}

        {/* ROI Overlay - Visual guide for detection zone */}
        {cameraReady && (
          <div className="absolute inset-0 pointer-events-none z-5">
            {/* Darkened areas outside ROI */}
            <div 
              className="absolute top-0 left-0 right-0 bg-black/30"
              style={{ height: `${DETECTION_CONFIG.ROI.yStart * 100}%` }}
            />
            <div 
              className="absolute bottom-0 left-0 right-0 bg-black/30"
              style={{ height: `${(1 - DETECTION_CONFIG.ROI.yEnd) * 100}%` }}
            />
            <div 
              className="absolute bg-black/30"
              style={{ 
                top: `${DETECTION_CONFIG.ROI.yStart * 100}%`,
                bottom: `${(1 - DETECTION_CONFIG.ROI.yEnd) * 100}%`,
                left: 0,
                width: `${DETECTION_CONFIG.ROI.xStart * 100}%`
              }}
            />
            <div 
              className="absolute bg-black/30"
              style={{ 
                top: `${DETECTION_CONFIG.ROI.yStart * 100}%`,
                bottom: `${(1 - DETECTION_CONFIG.ROI.yEnd) * 100}%`,
                right: 0,
                width: `${(1 - DETECTION_CONFIG.ROI.xEnd) * 100}%`
              }}
            />
            
            {/* ROI border */}
            <div 
              className="absolute border-2 border-dashed border-success/50 rounded-lg"
              style={{ 
                top: `${DETECTION_CONFIG.ROI.yStart * 100}%`,
                bottom: `${(1 - DETECTION_CONFIG.ROI.yEnd) * 100}%`,
                left: `${DETECTION_CONFIG.ROI.xStart * 100}%`,
                right: `${(1 - DETECTION_CONFIG.ROI.xEnd) * 100}%`
              }}
            />
          </div>
        )}

        {/* Bounding boxes overlay */}
        {cameraReady && videoRef.current && (
          <svg 
            className="absolute inset-0 w-full h-full pointer-events-none z-6"
            viewBox={`0 0 ${videoRef.current.videoWidth || 1280} ${videoRef.current.videoHeight || 720}`}
            preserveAspectRatio="xMidYMid slice"
          >
            {detections.map((det, i) => {
              const severity = getSeverityFromDistance(det.distance);
              const strokeColor = severity === 'high' ? '#EF4444' : severity === 'medium' ? '#F59E0B' : '#10B981';
              
              return (
                <g key={i}>
                  <rect
                    x={det.bbox[0]}
                    y={det.bbox[1]}
                    width={det.bbox[2]}
                    height={det.bbox[3]}
                    fill="none"
                    stroke={strokeColor}
                    strokeWidth="4"
                    rx="8"
                  />
                  <rect
                    x={det.bbox[0]}
                    y={det.bbox[1] - 32}
                    width={Math.max(det.bbox[2], 140)}
                    height="28"
                    fill={strokeColor}
                    rx="4"
                  />
                  <text
                    x={det.bbox[0] + 8}
                    y={det.bbox[1] - 12}
                    fill="#FFFFFF"
                    fontSize="14"
                    fontWeight="bold"
                  >
                    {getObjectLabel(det.class)} • {det.distance}m • {det.position}
                  </text>
                </g>
              );
            })}
          </svg>
        )}

        {/* Status indicator */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-20">
          <div className="px-4 py-2 bg-card/90 backdrop-blur-sm rounded-full flex items-center gap-2">
            {isActive ? (
              <>
                <div className="w-3 h-3 rounded-full bg-success animate-pulse" />
                <span className="text-sm font-medium text-foreground">
                  Zona frontal ({detections.length} objetos)
                </span>
              </>
            ) : (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                <span className="text-sm font-medium text-foreground">Iniciando...</span>
              </>
            )}
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={toggleAudio}
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

        {/* Detection alerts - Only show top 2 closest */}
        {isActive && detections.length > 0 && (
          <div className="absolute top-20 left-4 right-4 space-y-2 z-20">
            {detections.slice(0, 2).map((detection, index) => {
              const severity = getSeverityFromDistance(detection.distance);
              return (
                <div
                  key={index}
                  className={cn(
                    "px-4 py-3 rounded-2xl border-2 backdrop-blur-sm animate-fade-in flex items-center gap-3",
                    getSeverityColor(severity)
                  )}
                  role="alert"
                  aria-live="assertive"
                >
                  <AlertTriangle className="w-6 h-6 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-semibold text-lg">
                      {getObjectLabel(detection.class)}
                    </p>
                    <p className="text-sm opacity-80">
                      {detection.distance < 1 ? 'Muy cerca' : `${detection.distance}m`} • {getDirectionLabel(detection.position)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* All clear message */}
        {isActive && detections.length === 0 && (
          <div className="absolute top-20 left-4 right-4 z-20">
            <div className="px-4 py-3 rounded-2xl bg-success/20 border-2 border-success text-success flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 flex-shrink-0" />
              <div>
                <p className="font-semibold text-lg">Zona despejada</p>
                <p className="text-sm opacity-80">No hay obstáculos en tu camino</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Controls */}
      <div 
        className="bg-card border-t border-border p-4"
        style={{ paddingBottom: "max(env(safe-area-inset-bottom), 16px)" }}
      >
        <Button
          variant="destructive"
          size="hero"
          onClick={handleStop}
          onMouseEnter={() => speak("Botón detener recorrido")}
          className="gap-3"
        >
          <StopCircle className="w-7 h-7" />
          <span>Detener Recorrido</span>
        </Button>
      </div>
    </div>
  );
}
