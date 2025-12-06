import { useEffect, useCallback, useRef } from "react";

interface SpeakOptions {
  rate?: number;
  pitch?: number;
  volume?: number;
  priority?: boolean;
}

export function useVoice() {
  const isInitialized = useRef(false);

  // Initialize speech synthesis
  useEffect(() => {
    if (!isInitialized.current && 'speechSynthesis' in window) {
      // Warm up the speech synthesis
      const warmUp = new SpeechSynthesisUtterance('');
      warmUp.volume = 0;
      window.speechSynthesis.speak(warmUp);
      isInitialized.current = true;
    }

    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const speak = useCallback((text: string, options: SpeakOptions = {}) => {
    if (!('speechSynthesis' in window)) {
      console.warn('Speech synthesis not supported');
      return;
    }

    // Cancel previous speech if priority or if speaking same message
    if (options.priority || window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-ES';
    utterance.rate = options.rate ?? 1.0;
    utterance.pitch = options.pitch ?? 1.0;
    utterance.volume = options.volume ?? 1.0;

    // Try to get a Spanish voice
    const voices = window.speechSynthesis.getVoices();
    const spanishVoice = voices.find(v => v.lang.startsWith('es'));
    if (spanishVoice) {
      utterance.voice = spanishVoice;
    }

    window.speechSynthesis.speak(utterance);
  }, []);

  const speakOnMount = useCallback((text: string, delay: number = 500) => {
    const timeoutId = setTimeout(() => {
      speak(text);
    }, delay);

    return () => clearTimeout(timeoutId);
  }, [speak]);

  const speakOnClick = useCallback((text: string) => {
    return () => {
      // Haptic feedback
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
      speak(text, { priority: true });
    };
  }, [speak]);

  const speakObstacle = useCallback((
    object: string, 
    distance: number, 
    positionX: number
  ) => {
    let direction = 'adelante';
    if (positionX < 0.33) direction = 'a tu izquierda';
    else if (positionX > 0.66) direction = 'a tu derecha';

    const objectNames: Record<string, string> = {
      'person': 'Persona',
      'car': 'Auto',
      'truck': 'Camión',
      'bus': 'Autobús',
      'bicycle': 'Bicicleta',
      'motorcycle': 'Moto',
      'dog': 'Perro',
      'cat': 'Gato',
      'chair': 'Silla',
      'couch': 'Sofá',
      'potted plant': 'Planta',
      'bed': 'Cama',
      'dining table': 'Mesa',
      'toilet': 'Baño',
      'tv': 'Televisor',
      'laptop': 'Computadora',
      'cell phone': 'Teléfono',
      'book': 'Libro',
      'bottle': 'Botella',
      'cup': 'Taza',
      'fork': 'Tenedor',
      'knife': 'Cuchillo',
      'spoon': 'Cuchara',
      'bowl': 'Tazón',
      'banana': 'Plátano',
      'apple': 'Manzana',
      'sandwich': 'Sándwich',
      'backpack': 'Mochila',
      'umbrella': 'Paraguas',
      'handbag': 'Bolso',
      'suitcase': 'Maleta',
      'door': 'Puerta'
    };

    const translatedObject = objectNames[object.toLowerCase()] || object;
    const message = `${translatedObject} ${direction}, ${distance} metros`;
    
    speak(message, { rate: 1.2, priority: true });
  }, [speak]);

  const stop = useCallback(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }, []);

  return {
    speak,
    speakOnMount,
    speakOnClick,
    speakObstacle,
    stop
  };
}
