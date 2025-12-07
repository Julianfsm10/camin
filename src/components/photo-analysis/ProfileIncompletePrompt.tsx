import { useNavigate } from "react-router-dom";
import { UserCog, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useVoice } from "@/hooks/useVoice";

interface ProfileIncompletePromptProps {
  missingFields: string[];
}

export function ProfileIncompletePrompt({ missingFields }: ProfileIncompletePromptProps) {
  const navigate = useNavigate();
  const { speak } = useVoice();

  const handleGoToProfile = () => {
    speak("Ir a personalización de perfil");
    navigate("/personalizacion");
  };

  if (missingFields.length === 0) return null;

  return (
    <div className="bg-info/10 border border-info/30 rounded-2xl p-4 mb-4">
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-info flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm text-foreground mb-2">
            Completa tu perfil para recibir alertas personalizadas sobre alergias, 
            condiciones médicas y preferencias alimentarias.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={handleGoToProfile}
            className="gap-2"
          >
            <UserCog className="w-4 h-4" />
            Completar perfil
          </Button>
        </div>
      </div>
    </div>
  );
}
