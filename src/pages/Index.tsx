import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { VisionLogo } from "@/components/icons/VisionLogo";
import { useAuth } from "@/hooks/useAuth";

export default function Index() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    // Wait for auth to load, then redirect appropriately
    if (!loading) {
      const timer = setTimeout(() => {
        if (user) {
          navigate("/dashboard");
        } else {
          navigate("/auth");
        }
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [navigate, user, loading]);

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
