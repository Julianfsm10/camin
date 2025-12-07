import { useState, useEffect, useCallback, useRef } from "react";

interface UseSpeechRecognitionOptions {
    lang?: string;
    continuous?: boolean;
    interimResults?: boolean;
    maxAlternatives?: number;
}

interface UseSpeechRecognitionReturn {
    transcript: string;
    isListening: boolean;
    isSupported: boolean;
    error: string | null;
    startListening: () => void;
    stopListening: () => void;
    resetTranscript: () => void;
}

// Extend Window interface for webkit prefix
declare global {
    interface Window {
        SpeechRecognition: any;
        webkitSpeechRecognition: any;
    }
}

export function useSpeechRecognition(
    options: UseSpeechRecognitionOptions = {}
): UseSpeechRecognitionReturn {
    const {
        lang = "es-ES",
        continuous = false,
        interimResults = false,
        maxAlternatives = 1,
    } = options;

    const [transcript, setTranscript] = useState("");
    const [isListening, setIsListening] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const recognitionRef = useRef<any>(null);

    // Check if browser supports Speech Recognition
    const isSupported =
        typeof window !== "undefined" &&
        (window.SpeechRecognition || window.webkitSpeechRecognition);

    useEffect(() => {
        if (!isSupported) {
            setError("Tu navegador no soporta reconocimiento de voz");
            return;
        }

        // Initialize Speech Recognition
        const SpeechRecognition =
            window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();

        recognition.lang = lang;
        recognition.continuous = continuous;
        recognition.interimResults = interimResults;
        recognition.maxAlternatives = maxAlternatives;

        recognition.onstart = () => {
            console.log("Speech recognition started");
            setIsListening(true);
            setError(null);
        };

        recognition.onresult = (event: any) => {
            console.log("Speech recognition result event:", event);
            const current = event.resultIndex;
            const result = event.results[current];
            const transcriptResult = result[0].transcript;
            console.log("Transcript result:", transcriptResult, "isFinal:", result.isFinal);
            setTranscript(transcriptResult);
        };

        recognition.onerror = (event: any) => {
            console.error("Speech recognition error:", event.error);
            setIsListening(false);

            switch (event.error) {
                case "no-speech":
                    setError("No se detectó ninguna voz. Intenta de nuevo.");
                    break;
                case "audio-capture":
                    setError("No se pudo acceder al micrófono.");
                    break;
                case "not-allowed":
                    setError("Permiso de micrófono denegado. Por favor, permite el acceso al micrófono.");
                    break;
                case "network":
                    setError("Error de red. Verifica tu conexión a internet.");
                    break;
                case "aborted":
                    // User stopped manually, not an error
                    console.log("Speech recognition aborted by user");
                    setError(null);
                    break;
                default:
                    setError(`Error de reconocimiento de voz: ${event.error}`);
            }
        };

        recognition.onend = () => {
            console.log("Speech recognition ended");
            setIsListening(false);
        };

        recognitionRef.current = recognition;

        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.abort();
            }
        };
    }, [lang, continuous, interimResults, maxAlternatives, isSupported]);

    const startListening = useCallback(() => {
        if (!isSupported) {
            setError("Tu navegador no soporta reconocimiento de voz");
            return;
        }

        if (recognitionRef.current && !isListening) {
            try {
                console.log("Starting speech recognition...");
                setTranscript("");
                setError(null);
                recognitionRef.current.start();
            } catch (err) {
                console.error("Error starting recognition:", err);
                setError("Error al iniciar el reconocimiento de voz");
            }
        } else {
            console.log("Cannot start - already listening or recognition not initialized");
        }
    }, [isListening, isSupported]);

    const stopListening = useCallback(() => {
        if (recognitionRef.current && isListening) {
            recognitionRef.current.stop();
        }
    }, [isListening]);

    const resetTranscript = useCallback(() => {
        setTranscript("");
        setError(null);
    }, []);

    return {
        transcript,
        isListening,
        isSupported,
        error,
        startListening,
        stopListening,
        resetTranscript,
    };
}
