import { useEffect, useState } from "react";
import { User, Bell, Volume2, Vibrate, Shield, HelpCircle, LogOut, ChevronRight, Moon, Phone } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { BottomNav } from "@/components/layout/BottomNav";
import { Header } from "@/components/layout/Header";
import { useVoice } from "@/hooks/useVoice";
import { cn } from "@/lib/utils";

interface SettingItemProps {
  icon: React.ReactNode;
  label: string;
  description?: string;
  onClick?: () => void;
  toggle?: boolean;
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  onSpeak?: () => void;
}

function SettingItem({ icon, label, description, onClick, toggle, checked, onCheckedChange, onSpeak }: SettingItemProps) {
  const content = (
    <>
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">{icon}</div>
        <div className="flex-1">
          <p className="font-medium text-foreground">{label}</p>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
      </div>
      {toggle ? <Switch checked={checked} onCheckedChange={onCheckedChange} /> : <ChevronRight className="w-5 h-5 text-muted-foreground" />}
    </>
  );

  if (toggle) {
    return (
      <div className="flex items-center justify-between py-3 px-1 min-h-[60px]" onMouseEnter={onSpeak} onFocus={onSpeak}>
        {content}
      </div>
    );
  }

  return (
    <button onClick={onClick} onMouseEnter={onSpeak} onFocus={onSpeak} className="flex items-center justify-between w-full py-3 px-1 min-h-[60px] text-left active:bg-muted/50 rounded-xl transition-colors">
      {content}
    </button>
  );
}

export default function Profile() {
  const navigate = useNavigate();
  const { speak } = useVoice();
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);
  const [highContrast, setHighContrast] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      speak("Pantalla de perfil y configuración. Ajusta tus preferencias de accesibilidad.");
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const handleToggle = (setting: string, value: boolean) => {
    speak(value ? `${setting} activado` : `${setting} desactivado`);
    if (navigator.vibrate) navigator.vibrate(50);
  };

  return (
    <>
      <Header title="Perfil" />
      <MobileLayout showBottomNav className="py-6 space-y-6">
        <div className="card-elevated flex items-center gap-4 animate-fade-in">
          <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
            <User className="w-8 h-8 text-primary" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-foreground">Usuario</h2>
            <p className="text-muted-foreground">usuario@email.com</p>
          </div>
        </div>

        <div className="space-y-6 animate-fade-in" style={{ animationDelay: "100ms" }}>
          <section>
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3 px-1">Accesibilidad</h3>
            <div className="card-elevated divide-y divide-border">
              <SettingItem icon={<Volume2 className="w-5 h-5" />} label="Audio de voz" description="Descripciones habladas" toggle checked={audioEnabled} onCheckedChange={(v) => { setAudioEnabled(v); handleToggle("Audio de voz", v); }} onSpeak={() => speak("Audio de voz. Descripciones habladas.")} />
              <SettingItem icon={<Vibrate className="w-5 h-5" />} label="Vibración" description="Alertas táctiles" toggle checked={vibrationEnabled} onCheckedChange={(v) => { setVibrationEnabled(v); handleToggle("Vibración", v); }} onSpeak={() => speak("Vibración. Alertas táctiles.")} />
              <SettingItem icon={<Moon className="w-5 h-5" />} label="Alto contraste" description="Mejora la visibilidad" toggle checked={highContrast} onCheckedChange={(v) => { setHighContrast(v); handleToggle("Alto contraste", v); }} onSpeak={() => speak("Alto contraste. Mejora la visibilidad.")} />
            </div>
          </section>

          <section>
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3 px-1">Seguridad</h3>
            <div className="card-elevated divide-y divide-border">
              <SettingItem icon={<Phone className="w-5 h-5" />} label="Contacto de emergencia" description="No configurado" onClick={() => speak("Función próximamente disponible")} onSpeak={() => speak("Contacto de emergencia")} />
              <SettingItem icon={<Bell className="w-5 h-5" />} label="Notificaciones" onClick={() => speak("Función próximamente disponible")} onSpeak={() => speak("Notificaciones")} />
              <SettingItem icon={<Shield className="w-5 h-5" />} label="Privacidad" onClick={() => speak("Función próximamente disponible")} onSpeak={() => speak("Privacidad")} />
            </div>
          </section>

          <section>
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3 px-1">Ayuda</h3>
            <div className="card-elevated divide-y divide-border">
              <SettingItem icon={<HelpCircle className="w-5 h-5" />} label="Tutorial" description="Volver a ver la guía" onClick={() => { speak("Abriendo tutorial"); navigate("/onboarding"); }} onSpeak={() => speak("Tutorial. Volver a ver la guía.")} />
            </div>
          </section>
        </div>

        <Button variant="ghost" className="w-full text-destructive hover:text-destructive hover:bg-destructive/10 min-h-[56px]" onClick={() => { speak("Cerrando sesión"); navigate("/auth"); }} onMouseEnter={() => speak("Botón cerrar sesión")}>
          <LogOut className="w-5 h-5 mr-2" />
          Cerrar sesión
        </Button>

        <p className="text-center text-sm text-muted-foreground">Vision AI v1.0.0</p>
      </MobileLayout>
      <BottomNav />
    </>
  );
}
