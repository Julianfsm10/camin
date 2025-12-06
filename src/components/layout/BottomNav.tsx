import { Camera, Image, User } from "lucide-react";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";

const navItems = [
  {
    to: "/dashboard",
    icon: Camera,
    label: "Recorrido",
  },
  {
    to: "/analyze",
    icon: Image,
    label: "Analizar",
  },
  {
    to: "/profile",
    icon: User,
    label: "Perfil",
  },
];

export function BottomNav() {
  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 h-[70px] bg-card/95 backdrop-blur-md border-t border-border flex items-center justify-around px-4 z-50"
      style={{ paddingBottom: "max(env(safe-area-inset-bottom), 8px)" }}
      role="navigation"
      aria-label="Navegación principal"
    >
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            cn(
              "flex flex-col items-center justify-center gap-1 px-6 py-2 min-h-[48px] rounded-xl transition-colors duration-200",
              isActive
                ? "text-primary"
                : "text-muted-foreground active:bg-primary/10"
            )
          }
          aria-label={item.label}
        >
          <item.icon className="w-6 h-6" aria-hidden="true" />
          <span className="text-xs font-medium">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
