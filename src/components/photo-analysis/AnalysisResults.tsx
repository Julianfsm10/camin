import { useEffect } from "react";
import { Volume2, Camera, AlertTriangle, AlertCircle, Info, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useVoice } from "@/hooks/useVoice";

interface Alert {
  type: "critical" | "warning" | "info";
  category: string;
  message: string;
}

interface AnalysisData {
  description: string;
  alerts: Alert[];
  safeToConsume: boolean | null;
  recommendations: string[];
}

interface AnalysisResultsProps {
  analysis: AnalysisData;
  capturedImage: string | null;
  onReset: () => void;
  onShare: () => void;
}

export function AnalysisResults({ analysis, capturedImage, onReset, onShare }: AnalysisResultsProps) {
  const { speak } = useVoice();

  useEffect(() => {
    const criticalAlerts = analysis.alerts.filter(a => a.type === "critical");
    const warnings = analysis.alerts.filter(a => a.type === "warning");

    // Critical alerts first with emergency vibration
    if (criticalAlerts.length > 0) {
      speak(`ALERTA CRÍTICA: ${criticalAlerts.map(a => a.message).join('. ')}`, { priority: true });
      if (navigator.vibrate) {
        navigator.vibrate([500, 200, 500, 200, 500]); // Emergency pattern
      }
    }

    // Then description
    setTimeout(() => {
      speak(analysis.description);
    }, criticalAlerts.length > 0 ? 3000 : 0);

    // Then warnings with medium vibration
    if (warnings.length > 0) {
      setTimeout(() => {
        speak(`Advertencias: ${warnings.map(a => a.message).join('. ')}`);
        if (navigator.vibrate) {
          navigator.vibrate([300, 100, 300]); // Warning pattern
        }
      }, criticalAlerts.length > 0 ? 6000 : 3000);
    }

    // Info alerts with simple vibration
    const infoAlerts = analysis.alerts.filter(a => a.type === "info");
    if (infoAlerts.length > 0) {
      setTimeout(() => {
        speak(`Información: ${infoAlerts.map(a => a.message).join('. ')}`);
        if (navigator.vibrate) {
          navigator.vibrate(100); // Simple vibration
        }
      }, criticalAlerts.length > 0 ? 9000 : warnings.length > 0 ? 6000 : 3000);
    }
  }, [analysis]);

  const handleSpeak = () => {
    speak(analysis.description, { priority: true });
  };

  const criticalAlerts = analysis.alerts.filter(a => a.type === "critical");
  const warningAlerts = analysis.alerts.filter(a => a.type === "warning");
  const infoAlerts = analysis.alerts.filter(a => a.type === "info");

  return (
    <div className="flex-1 flex flex-col gap-4 animate-fade-in overflow-y-auto pb-4">
      {/* Critical Alerts */}
      {criticalAlerts.map((alert, i) => (
        <div 
          key={`critical-${i}`} 
          className="bg-destructive/20 border-2 border-destructive rounded-2xl p-4 animate-pulse"
          role="alert"
          aria-live="assertive"
        >
          <div className="flex items-center gap-3 mb-2">
            <AlertTriangle className="w-7 h-7 text-destructive flex-shrink-0" />
            <h3 className="text-destructive text-lg font-bold uppercase">ALERTA CRÍTICA</h3>
          </div>
          <p className="text-foreground text-body">{alert.message}</p>
        </div>
      ))}

      {/* Warning Alerts */}
      {warningAlerts.map((alert, i) => (
        <div 
          key={`warning-${i}`} 
          className="bg-warning/20 border-2 border-warning rounded-2xl p-4"
          role="alert"
        >
          <div className="flex items-center gap-3 mb-2">
            <AlertCircle className="w-6 h-6 text-warning flex-shrink-0" />
            <h3 className="text-warning text-lg font-bold">Advertencia</h3>
          </div>
          <p className="text-foreground text-body">{alert.message}</p>
        </div>
      ))}

      {/* Info Alerts */}
      {infoAlerts.map((alert, i) => (
        <div 
          key={`info-${i}`} 
          className="bg-info/20 border-2 border-info rounded-2xl p-4"
          role="status"
        >
          <div className="flex items-center gap-3 mb-2">
            <Info className="w-6 h-6 text-info flex-shrink-0" />
            <h3 className="text-info text-lg font-bold">Información</h3>
          </div>
          <p className="text-foreground text-body">{alert.message}</p>
        </div>
      ))}

      {/* Captured Image */}
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
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            📝 Descripción
          </h3>
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
          {analysis.description}
        </p>
      </div>

      {/* Safe to Consume Indicator */}
      {analysis.safeToConsume !== null && (
        <div className={`rounded-2xl p-4 border-2 flex items-center gap-3 ${
          analysis.safeToConsume 
            ? 'bg-success/20 border-success'
            : 'bg-destructive/20 border-destructive'
        }`}>
          {analysis.safeToConsume ? (
            <CheckCircle className="w-7 h-7 text-success flex-shrink-0" />
          ) : (
            <XCircle className="w-7 h-7 text-destructive flex-shrink-0" />
          )}
          <p className={`text-lg font-bold ${
            analysis.safeToConsume ? 'text-success' : 'text-destructive'
          }`}>
            {analysis.safeToConsume 
              ? 'Seguro para ti según tu perfil'
              : 'NO seguro según tu perfil'}
          </p>
        </div>
      )}

      {/* Recommendations */}
      {analysis.recommendations && analysis.recommendations.length > 0 && (
        <div className="card-elevated">
          <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
            💡 Recomendaciones
          </h3>
          <ul className="space-y-2">
            {analysis.recommendations.map((rec, i) => (
              <li key={i} className="text-foreground text-body flex items-start gap-2">
                <span className="text-primary text-xl">•</span>
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Actions */}
      <div className="space-y-3 mt-auto pt-2">
        <Button
          variant="hero"
          size="hero-secondary"
          onClick={onReset}
          className="w-full"
        >
          <Camera className="w-6 h-6" />
          <span>Nueva Foto</span>
        </Button>

        <Button
          variant="hero-outline"
          size="hero-secondary"
          onClick={onShare}
          className="w-full"
        >
          <Volume2 className="w-6 h-6" />
          <span>Repetir Descripción</span>
        </Button>
      </div>
    </div>
  );
}
