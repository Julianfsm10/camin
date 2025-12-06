import { ArrowLeft, MoreVertical } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  title?: string;
  showBack?: boolean;
  showMenu?: boolean;
  onMenuClick?: () => void;
}

export function Header({ title, showBack = false, showMenu = false, onMenuClick }: HeaderProps) {
  const navigate = useNavigate();

  return (
    <header 
      className="sticky top-0 z-40 h-[60px] bg-background/95 backdrop-blur-md border-b border-border/50 flex items-center justify-between px-4"
      style={{ paddingTop: "max(env(safe-area-inset-top), 0px)" }}
    >
      <div className="flex items-center gap-3">
        {showBack && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            aria-label="Volver atrás"
            className="min-h-[48px] min-w-[48px]"
          >
            <ArrowLeft className="w-6 h-6" />
          </Button>
        )}
        {title && (
          <h1 className="text-lg font-semibold text-foreground">{title}</h1>
        )}
      </div>
      
      {showMenu && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuClick}
          aria-label="Abrir menú"
          className="min-h-[48px] min-w-[48px]"
        >
          <MoreVertical className="w-6 h-6" />
        </Button>
      )}
    </header>
  );
}
