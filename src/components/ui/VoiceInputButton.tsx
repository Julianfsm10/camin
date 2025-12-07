import { Mic, MicOff } from "lucide-react";
import { useEffect } from "react";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useVoice } from "@/hooks/useVoice";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
    processEmailTranscript,
    processPasswordTranscript,
    processNameTranscript
} from "@/lib/voiceTranscriptProcessor";

interface VoiceInputButtonProps {
    onTranscript: (text: string) => void;
    fieldName?: string;
    fieldType?: "email" | "password" | "name" | "text";
    className?: string;
}

export function VoiceInputButton({
    onTranscript,
    fieldName = "campo",
    fieldType = "text",
    className,
}: VoiceInputButtonProps) {
    const {
        transcript,
        isListening,
        isSupported,
        error,
        startListening,
        stopListening,
        resetTranscript,
    } = useSpeechRecognition({
        lang: "es-ES",
        continuous: false,
        interimResults: true, // Enable interim results to capture speech as it happens
    });

    const { speak } = useVoice();
    const { toast } = useToast();

    // Handle transcript changes
    useEffect(() => {
        console.log("Transcript updated:", transcript, "isListening:", isListening);
        if (transcript && !isListening) {
            // Process transcript based on field type
            let processedText = transcript;

            switch (fieldType) {
                case "email":
                    processedText = processEmailTranscript(transcript);
                    console.log("Email processed:", transcript, "->", processedText);
                    break;
                case "password":
                    processedText = processPasswordTranscript(transcript);
                    console.log("Password processed:", transcript, "->", processedText);
                    break;
                case "name":
                    processedText = processNameTranscript(transcript);
                    console.log("Name processed:", transcript, "->", processedText);
                    break;
                default:
                    // For generic text fields, just trim
                    processedText = transcript.trim();
            }

            console.log("Sending transcript to parent:", processedText);
            onTranscript(processedText);
            resetTranscript();
        }
    }, [transcript, isListening, onTranscript, resetTranscript, fieldType]);

    // Handle errors
    useEffect(() => {
        if (error) {
            speak(error);
            toast({
                title: "Error de reconocimiento de voz",
                description: error,
                variant: "destructive",
            });
        }
    }, [error, speak, toast]);

    const handleClick = () => {
        if (!isSupported) {
            const message = "Tu navegador no soporta reconocimiento de voz. Usa Chrome, Edge o Safari.";
            speak(message);
            toast({
                title: "Función no disponible",
                description: message,
                variant: "destructive",
            });
            return;
        }

        if (isListening) {
            stopListening();
            speak("Grabación detenida");
        } else {
            startListening();
            speak(`Dictando ${fieldName}. Habla ahora.`, { priority: true });

            // Haptic feedback
            if (navigator.vibrate) {
                navigator.vibrate(50);
            }
        }
    };

    if (!isSupported) {
        return null; // Don't render button if not supported
    }

    return (
        <button
            type="button"
            onClick={handleClick}
            className={cn(
                "absolute right-4 top-1/2 -translate-y-1/2 p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg transition-all",
                isListening
                    ? "text-destructive animate-pulse bg-destructive/10"
                    : "text-muted-foreground hover:text-primary hover:bg-primary/10",
                className
            )}
            aria-label={isListening ? `Detener dictado de ${fieldName}` : `Dictar ${fieldName} por voz`}
            title={isListening ? "Detener grabación" : "Dictar por voz"}
        >
            {isListening ? (
                <MicOff className="w-5 h-5" />
            ) : (
                <Mic className="w-5 h-5" />
            )}
        </button>
    );
}
