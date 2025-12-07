import { useState, useEffect, useRef } from "react";
import { AlertTriangle, StopCircle, Volume2, VolumeX, Loader2, CheckCircle2, ArrowDownFromLine, AlertOctagon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useVoice } from "@/hooks/useVoice";
import { useCamera } from "@/hooks/useCamera";
import { useHybridDetection, DETECTION_CONFIG, EnhancedDetection } from "@/hooks/useHybridDetection";

export default function ActiveRoute() {
  const navigate = useNavigate();
  const { speak, stop: stopSpeech } = useVoice();
  const { videoRef, isReady: cameraReady, error: cameraError, startCamera, stopCamera } = useCamera();
  const { 
    isModelLoaded, 
    isLoading: modelLoading, 
    detections, 
    startDetection, 
    stopDetection,
    canvasRef 
  } = useHybridDetection({ levelDetectionEnabled: true });
  
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [isActive, setIsActive] = useState(false);
  const lastAnnouncedRef = useRef<string>("");
  const lastAnnouncementTime = useRef<number>(0);
  const ANNOUNCEMENT_INTERVAL = 1800; // Slightly faster for critical alerts

  // Start camera on mount
  useEffect(() => {
    speak("Iniciando cámara", { priority: true });
    startCamera();
    
    return () => {
      stopCamera();
      stopDetection();
      stopSpeech();
    };
  }, []);

  // Start detection when camera and model are ready
  useEffect(() => {
    if (cameraReady && isModelLoaded && videoRef.current) {
      speak("Cámara lista. Detección híbrida activa. Analizando obstáculos, escaleras y desniveles.", { priority: true });
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

  // Announce detections with throttling and type-specific messages
  useEffect(() => {
    if (!audioEnabled || !isActive || detections.length === 0) return;

    const now = Date.now();
    
    // Critical alerts bypass normal throttling
    const hasCritical = detections.some(d => d.priority === 'critical');
    const interval = hasCritical ? 1200 : ANNOUNCEMENT_INTERVAL;
    
    if (now - lastAnnouncementTime.current < interval) return;

    const detection = detections[0];
    const announcementKey = `${detection.type}-${detection.label}-${Math.round(detection.distance)}`;
    
    // Only announce if it's a different detection
    if (announcementKey !== lastAnnouncedRef.current) {
      lastAnnouncedRef.current = announcementKey;
      lastAnnouncementTime.current = now;
      
      // Build announcement based on detection type
      const announcement = buildAnnouncement(detection);
      speak(announcement, { priority: detection.priority === 'critical' });
      
      // Type-specific vibration patterns
      triggerVibration(detection);
    }
  }, [detections, audioEnabled, isActive, speak]);

  // Build announcement message based on detection type
  const buildAnnouncement = (detection: EnhancedDetection): string => {
    const distanceText = detection.distance < 1 ? 'muy cerca' : `${detection.distance} metros`;
    const posText = detection.position === 'centro' ? 'adelante' : detection.position;
    
    switch (detection.type) {
      case 'stair_down':
        return `PELIGRO: ${detection.label} ${posText}. Detente.`;
      case 'stair_up':
        return `Cuidado: ${detection.label} ${posText}, ${distanceText}.`;
      case 'curb':
        return `ALERTA: ${detection.label} ${posText}. Cuidado con el desnivel.`;
      case 'fence':
        return `${detection.label} ${posText}, ${distanceText}.`;
      default:
        return `${detection.label} ${posText}, ${distanceText}.`;
    }
  };

  // Trigger vibration based on detection type and priority
  const triggerVibration = (detection: EnhancedDetection) => {
    if (!navigator.vibrate) return;
    
    switch (detection.type) {
      case 'stair_down':
        // Urgent stair down - long repeating pattern
        navigator.vibrate([500, 150, 500, 150, 500, 150, 500]);
        break;
      case 'curb':
        // Curb alert - urgent pattern
        navigator.vibrate([400, 100, 400, 100, 400]);
        break;
      case 'stair_up':
        // Stair up - warning pattern
        navigator.vibrate([300, 150, 300]);
        break;
      case 'fence':
        // Fence - simple notification
        navigator.vibrate(200);
        break;
      default:
        // Known objects - distance-based
        if (detection.distance < 1) {
          navigator.vibrate([300, 100, 300, 100, 300]);
        } else if (detection.distance < 2) {
          navigator.vibrate([200, 100, 200]);
        } else {
          navigator.vibrate(150);
        }
    }
  };

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

  const getPriorityColor = (priority: EnhancedDetection['priority']) => {
    switch (priority) {
      case "critical":
        return "border-destructive bg-destructive/20 text-destructive animate-pulse";
      case "high":
        return "border-warning bg-warning/20 text-warning";
      case "medium":
        return "border-info bg-info/20 text-info";
      case "low":
        return "border-success bg-success/20 text-success";
    }
  };

  const getDetectionIcon = (type: EnhancedDetection['type']) => {
    switch (type) {
      case 'stair_down':
      case 'stair_up':
        return <ArrowDownFromLine className="w-6 h-6 flex-shrink-0" />;
      case 'curb':
        return <AlertOctagon className="w-6 h-6 flex-shrink-0" />;
      default:
        return <AlertTriangle className="w-6 h-6 flex-shrink-0" />;
    }
  };

  const getTypeLabel = (detection: EnhancedDetection): string => {
    if (detection.type === 'stair_down') return '🚨 ESCALERA BAJANDO';
    if (detection.type === 'stair_up') return '⚠️ Escalera subiendo';
    if (detection.type === 'curb') return '🚨 DESNIVEL';
    if (detection.type === 'fence') return 'Reja/Baranda';
    return detection.label;
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
        
        {/* Hidden canvas for image processing */}
        <canvas
          ref={canvasRef}
          className="hidden"
          width={1280}
          height={720}
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
            {detections.filter(det => det.bbox).map((det, i) => {
              const strokeColor = det.priority === 'critical' ? '#EF4444' : 
                                  det.priority === 'high' ? '#F59E0B' : 
                                  det.priority === 'medium' ? '#6366F1' : '#10B981';
              const bbox = det.bbox!;
              
              return (
                <g key={i}>
                  <rect
                    x={bbox[0]}
                    y={bbox[1]}
                    width={bbox[2]}
                    height={bbox[3]}
                    fill="none"
                    stroke={strokeColor}
                    strokeWidth="4"
                    rx="8"
                    className={det.priority === 'critical' ? 'animate-pulse' : ''}
                  />
                  <rect
                    x={bbox[0]}
                    y={bbox[1] - 32}
                    width={Math.max(bbox[2], 160)}
                    height="28"
                    fill={strokeColor}
                    rx="4"
                  />
                  <text
                    x={bbox[0] + 8}
                    y={bbox[1] - 12}
                    fill="#FFFFFF"
                    fontSize="14"
                    fontWeight="bold"
                  >
                    {det.label} • {det.distance}m • {det.position}
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

        {/* Detection alerts - Show top 3 with priority styling */}
        {isActive && detections.length > 0 && (
          <div className="absolute top-20 left-4 right-4 space-y-2 z-20">
            {detections.slice(0, 3).map((detection, index) => (
              <div
                key={index}
                className={cn(
                  "px-4 py-3 rounded-2xl border-2 backdrop-blur-sm animate-fade-in flex items-center gap-3",
                  getPriorityColor(detection.priority)
                )}
                role="alert"
                aria-live={detection.priority === 'critical' ? 'assertive' : 'polite'}
              >
                {getDetectionIcon(detection.type)}
                <div className="flex-1">
                  <p className="font-semibold text-lg">
                    {getTypeLabel(detection)}
                  </p>
                  <p className="text-sm opacity-80">
                    {detection.distance < 1 ? 'Muy cerca' : `${detection.distance}m`} • {detection.position === 'centro' ? 'adelante' : detection.position}
                  </p>
                </div>
              </div>
            ))}
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
