import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { VisionLogo } from "@/components/icons/VisionLogo";

export default function Index() {
  const navigate = useNavigate();

  useEffect(() => {
    // Simulate splash screen, then redirect to auth
    const timer = setTimeout(() => {
      navigate("/auth");
    }, 2000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center">
      <div className="animate-fade-in flex flex-col items-center">
        <VisionLogo size={100} className="animate-pulse-soft" />
        <h1 className="text-3xl font-bold text-foreground mt-6">VISION AI</h1>
        <p className="text-muted-foreground mt-2">Tu asistente visual inteligente</p>
      </div>
      
      {/* Loading indicator */}
      <div className="absolute bottom-20 flex gap-1">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-2 h-2 rounded-full bg-primary animate-pulse"
            style={{ animationDelay: `${i * 200}ms` }}
          />
        ))}
      </div>
    </div>
  );
}
