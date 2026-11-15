/**
 * src/hooks/useSpeechRecognition.ts
 *
 * Hook de reconnaissance vocale Speech-to-Text (STT) utilisant l'API Web Speech
 * (SpeechRecognition / webkitSpeechRecognition).
 *
 * Fonctionnalités :
 * - Support natif Chrome, Edge, Safari et navigateurs mobiles
 * - Transcription fluide en continu avec transcription en temps réel
 * - Sélection automatique de la langue (fr-FR / en-US)
 * - Gestion élégante des autorisations et des erreurs
 */

import { useState, useRef, useEffect, useCallback } from 'react';

interface UseSpeechRecognitionOptions {
  language?: string;
  onTranscript?: (transcript: string) => void;
  onError?: (error: string) => void;
}

interface UseSpeechRecognitionReturn {
  isListening: boolean;
  isSupported: boolean;
  transcript: string;
  startListening: () => void;
  stopListening: () => void;
  toggleListening: () => void;
  error: string | null;
}

export function useSpeechRecognition({
  language = 'fr',
  onTranscript,
  onError,
}: UseSpeechRecognitionOptions = {}): UseSpeechRecognitionReturn {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(false);

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      setIsSupported(Boolean(SpeechRecognition));
    }
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Ignorer si déjà arrêté
      }
      setIsListening(false);
    }
  }, []);

  const startListening = useCallback(async () => {
    setError(null);

    if (typeof window === 'undefined') return;

    // 1. Demande d'autorisation explicite via getUserMedia pour déclencher la boîte de dialogue native
    if (navigator?.mediaDevices?.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        // Ferme le flux temporaire dès que l'autorisation est confirmée
        stream.getTracks().forEach((track) => track.stop());
      } catch (mediaErr: any) {
        if (
          mediaErr.name === 'NotAllowedError' ||
          mediaErr.name === 'PermissionDeniedError' ||
          mediaErr.name === 'SecurityError'
        ) {
          const deniedMsg =
            language === 'fr'
              ? "Accès au microphone refusé. Cliquez sur le cadenas 🔒 à gauche de l'adresse du site et activez « Microphone »."
              : 'Microphone access denied. Click the lock icon 🔒 in your browser address bar and enable "Microphone".';
          setError(deniedMsg);
          onError?.(deniedMsg);
          setIsListening(false);
          return;
        }
      }
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      const notSupportedMsg =
        language === 'fr'
          ? "La reconnaissance vocale n'est pas prise en charge par ce navigateur. Essayez Google Chrome, Microsoft Edge ou Safari."
          : 'Speech recognition is not supported in this browser. Please try Google Chrome, Microsoft Edge, or Safari.';
      setError(notSupportedMsg);
      onError?.(notSupportedMsg);
      return;
    }

    // Arrête toute instance précédente
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Ignorer
      }
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = language === 'fr' ? 'fr-FR' : 'en-US';

      let accumulatedFinal = '';

      recognition.onstart = () => {
        setIsListening(true);
        setError(null);
      };

      recognition.onresult = (event: any) => {
        let interim = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          const text = result[0]?.transcript || '';
          if (result.isFinal) {
            accumulatedFinal += (accumulatedFinal ? ' ' : '') + text.trim();
          } else {
            interim += text;
          }
        }

        const currentFull = accumulatedFinal + (interim ? ` ${interim}` : '');
        setTranscript(currentFull);
        onTranscript?.(currentFull);
      };

      recognition.onerror = (event: any) => {
        let msg = '';
        switch (event.error) {
          case 'not-allowed':
          case 'permission-denied':
            msg =
              language === 'fr'
                ? "Accès au microphone refusé. Cliquez sur le cadenas 🔒 à gauche de l'adresse du site et activez « Microphone »."
                : 'Microphone access denied. Click the lock icon 🔒 in your browser address bar and enable "Microphone".';
            break;
          case 'no-speech':
            // Simple absence de parole détectée, pas une erreur bloquante
            return;
          case 'network':
            msg =
              language === 'fr'
                ? 'Erreur réseau lors de la reconnaissance vocale.'
                : 'Network error during speech recognition.';
            break;
          default:
            msg =
              language === 'fr'
                ? `Erreur de reconnaissance vocale (${event.error}).`
                : `Speech recognition error (${event.error}).`;
            break;
        }

        setError(msg);
        onError?.(msg);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      const msg = err?.message || 'Impossible d’initialiser le microphone.';
      setError(msg);
      onError?.(msg);
      setIsListening(false);
    }
  }, [language, onTranscript, onError]);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  // Nettoyage au démontage
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // Ignorer
        }
      }
    };
  }, []);

  return {
    isListening,
    isSupported,
    transcript,
    startListening,
    stopListening,
    toggleListening,
    error,
  };
}
