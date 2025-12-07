import { useState, useEffect } from "react";
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { VisionLogo } from "@/components/icons/VisionLogo";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { useToast } from "@/hooks/use-toast";
import { useVoice } from "@/hooks/useVoice";
import { cn } from "@/lib/utils";

type AuthMode = "login" | "register" | "forgot";

export default function Auth() {
  const [mode, setMode] = useState<AuthMode>("login");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { speak } = useVoice();

  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");

  // Announce page on mount and mode change
  useEffect(() => {
    const timer = setTimeout(() => {
      if (mode === "login") {
        speak("Pantalla de inicio de sesión. Ingresa tu email y contraseña.");
      } else if (mode === "register") {
        speak("Crear cuenta nueva. Completa los siguientes campos: nombre, email y contraseña.");
      } else {
        speak("Recuperar contraseña. Ingresa tu email para recibir un enlace.");
      }
    }, 500);
    
    return () => clearTimeout(timer);
  }, [mode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    speak("Procesando", { priority: true });

    // Simulate auth delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    if (mode === "login") {
      speak("¡Bienvenido de vuelta! Iniciando sesión.");
      toast({
        title: "¡Bienvenido de vuelta!",
        description: "Iniciando sesión...",
      });
      navigate("/dashboard");
    } else if (mode === "register") {
      if (password !== confirmPassword) {
        speak("Error: Las contraseñas no coinciden.");
        toast({
          title: "Las contraseñas no coinciden",
          description: "Por favor, verifica que las contraseñas sean iguales",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }
      speak("¡Cuenta creada exitosamente! Bienvenido a Vision AI.");
      toast({
        title: "¡Cuenta creada!",
        description: "Bienvenido a Vision AI",
      });
      navigate("/onboarding");
    } else if (mode === "forgot") {
      speak("Correo de recuperación enviado. Revisa tu bandeja de entrada.");
      toast({
        title: "Correo enviado",
        description: "Revisa tu bandeja de entrada para restablecer tu contraseña",
      });
      setMode("login");
    }

    setIsLoading(false);
  };

  const getPasswordStrength = (pwd: string): { strength: number; label: string; color: string } => {
    let strength = 0;
    if (pwd.length >= 8) strength++;
    if (/[A-Z]/.test(pwd)) strength++;
    if (/[0-9]/.test(pwd)) strength++;
    if (/[^A-Za-z0-9]/.test(pwd)) strength++;

    const labels = ["Muy débil", "Débil", "Regular", "Fuerte", "Muy fuerte"];
    const colors = ["bg-destructive", "bg-destructive", "bg-warning", "bg-success", "bg-success"];
    
    return {
      strength,
      label: labels[strength],
      color: colors[strength],
    };
  };

  const passwordStrength = getPasswordStrength(password);

  const handleModeChange = (newMode: AuthMode) => {
    setMode(newMode);
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
  };

  return (
    <MobileLayout className="flex flex-col justify-center py-8">
      {/* Logo Section */}
      <div className="flex flex-col items-center mb-8 animate-fade-in">
        <VisionLogo size={80} className="mb-4" />
        <h1 className="text-2xl font-bold text-foreground">VISION AI</h1>
        <p className="text-muted-foreground text-sm mt-1">Tu asistente visual inteligente</p>
      </div>

      {/* Form Card */}
      <div className="card-elevated animate-fade-in" style={{ animationDelay: "100ms" }}>
        <h2 className="text-xl font-semibold text-foreground mb-6 text-center">
          {mode === "login" && "Iniciar Sesión"}
          {mode === "register" && "Crear Cuenta"}
          {mode === "forgot" && "Recuperar Contraseña"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "register" && (
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium text-foreground">
                Nombre completo
              </label>
              <Input
                id="name"
                type="text"
                placeholder="Tu nombre"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onFocus={() => speak("Campo nombre completo")}
                icon={<User className="w-5 h-5" />}
                required
                autoComplete="name"
              />
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-foreground">
              Correo electrónico
            </label>
            <Input
              id="email"
              type="email"
              placeholder="correo@ejemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onFocus={() => speak("Campo correo electrónico")}
              icon={<Mail className="w-5 h-5" />}
              required
              autoComplete="email"
            />
          </div>

          {mode !== "forgot" && (
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-foreground">
                Contraseña
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => speak("Campo contraseña")}
                  icon={<Lock className="w-5 h-5" />}
                  required
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  className="pr-12"
                />
                <button
                  type="button"
                  onClick={() => {
                    setShowPassword(!showPassword);
                    speak(showPassword ? "Contraseña oculta" : "Contraseña visible");
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground p-2 min-h-[44px] min-w-[44px] flex items-center justify-center"
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              
              {mode === "register" && password && (
                <div className="space-y-1">
                  <div className="flex gap-1">
                    {[...Array(4)].map((_, i) => (
                      <div
                        key={i}
                        className={cn(
                          "h-1 flex-1 rounded-full transition-colors",
                          i < passwordStrength.strength ? passwordStrength.color : "bg-muted"
                        )}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Mínimo 8 caracteres • {passwordStrength.label}
                  </p>
                </div>
              )}
            </div>
          )}

          {mode === "register" && (
            <>
              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="text-sm font-medium text-foreground">
                  Confirmar contraseña
                </label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    onFocus={() => speak("Campo confirmar contraseña")}
                    icon={<Lock className="w-5 h-5" />}
                    error={confirmPassword.length > 0 && password !== confirmPassword}
                    required
                    autoComplete="new-password"
                    className="pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setShowConfirmPassword(!showConfirmPassword);
                      speak(showConfirmPassword ? "Contraseña oculta" : "Contraseña visible");
                    }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground p-2 min-h-[44px] min-w-[44px] flex items-center justify-center"
                    aria-label={showConfirmPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {confirmPassword && password !== confirmPassword && (
                  <p className="text-xs text-destructive">Las contraseñas no coinciden</p>
                )}
              </div>

              <button
                type="button"
                onClick={() => {
                  setAcceptedTerms(!acceptedTerms);
                  speak(acceptedTerms ? "Términos desmarcados" : "Términos aceptados");
                  if (navigator.vibrate) navigator.vibrate(50);
                }}
                className="flex items-start gap-3 w-full py-2 text-left min-h-[48px]"
                aria-pressed={acceptedTerms}
              >
                <div
                  className={cn(
                    "w-6 h-6 min-w-[24px] rounded-md border-2 flex items-center justify-center transition-colors mt-0.5",
                    acceptedTerms
                      ? "bg-primary border-primary"
                      : "border-border bg-transparent"
                  )}
                >
                  {acceptedTerms && <Check className="w-4 h-4 text-primary-foreground" />}
                </div>
                <span className="text-sm text-muted-foreground">
                  Acepto los{" "}
                  <span className="text-primary underline">términos y condiciones</span>
                </span>
              </button>
            </>
          )}

          {mode === "login" && (
            <button
              type="button"
              onClick={() => handleModeChange("forgot")}
              onFocus={() => speak("Enlace olvidaste tu contraseña")}
              className="text-sm text-primary hover:underline block w-full text-right min-h-[44px] flex items-center justify-end"
            >
              ¿Olvidaste tu contraseña?
            </button>
          )}

          <Button
            type="submit"
            variant="hero"
            size="hero"
            disabled={isLoading || (mode === "register" && !acceptedTerms)}
            onMouseEnter={() => {
              if (mode === "login") speak("Botón iniciar sesión");
              else if (mode === "register") speak("Botón crear cuenta");
              else speak("Botón enviar correo");
            }}
            className="mt-6"
          >
            {isLoading ? (
              <div className="w-6 h-6 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
            ) : (
              <>
                {mode === "login" && "Iniciar Sesión"}
                {mode === "register" && "Crear Cuenta"}
                {mode === "forgot" && "Enviar correo"}
                <ArrowRight className="w-6 h-6" />
              </>
            )}
          </Button>
        </form>
      </div>

      {/* Switch Mode */}
      <div className="mt-6 text-center animate-fade-in" style={{ animationDelay: "200ms" }}>
        {mode === "login" && (
          <p className="text-muted-foreground">
            ¿No tienes cuenta?{" "}
            <button
              onClick={() => handleModeChange("register")}
              onFocus={() => speak("Enlace crear cuenta")}
              className="text-primary font-semibold hover:underline min-h-[44px] px-2"
            >
              Crear cuenta
            </button>
          </p>
        )}
        {mode === "register" && (
          <p className="text-muted-foreground">
            ¿Ya tienes cuenta?{" "}
            <button
              onClick={() => handleModeChange("login")}
              onFocus={() => speak("Enlace iniciar sesión")}
              className="text-primary font-semibold hover:underline min-h-[44px] px-2"
            >
              Iniciar sesión
            </button>
          </p>
        )}
        {mode === "forgot" && (
          <button
            onClick={() => handleModeChange("login")}
            onFocus={() => speak("Enlace volver al inicio de sesión")}
            className="text-primary font-semibold hover:underline min-h-[44px] px-2"
          >
            Volver al inicio de sesión
          </button>
        )}
      </div>
    </MobileLayout>
  );
}
