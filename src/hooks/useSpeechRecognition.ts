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

    // 1. Vérification du contexte sécurisé (HTTPS ou localhost)
    if (window.isSecureContext === false) {
      const insecureMsg =
        language === 'fr'
          ? "La reconnaissance vocale nécessite une connexion sécurisée (HTTPS ou localhost)."
          : 'Speech recognition requires a secure context (HTTPS or localhost).';
      setError(insecureMsg);
      onError?.(insecureMsg);
      return;
    }

    // 2. Vérification de la présence d'un périphérique microphone physique
    if (navigator?.mediaDevices?.enumerateDevices) {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const hasAudioInput = devices.some((d) => d.kind === 'audioinput');
        if (!hasAudioInput && devices.length > 0) {
          const noDeviceMsg =
            language === 'fr'
              ? "Aucun microphone physique n'a été détecté sur votre ordinateur. Veuillez brancher un micro ou un casque."
              : 'No physical microphone detected. Please plug in a microphone or headset.';
          setError(noDeviceMsg);
          onError?.(noDeviceMsg);
          return;
        }
      } catch {
        // En cas d'impossibilité d'énumérer, on continue vers getUserMedia
      }
    }

    // 3. Demande d'autorisation explicite via getUserMedia pour déclencher la boîte de dialogue native
    if (navigator?.mediaDevices?.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        // Ferme le flux temporaire dès que l'autorisation est confirmée
        stream.getTracks().forEach((track) => track.stop());
      } catch (mediaErr: any) {
        console.warn('[NEXUS Voice Debug] getUserMedia error:', mediaErr);
        if (
          mediaErr.name === 'NotAllowedError' ||
          mediaErr.name === 'PermissionDeniedError' ||
          mediaErr.name === 'SecurityError'
        ) {
          const deniedMsg =
            language === 'fr'
              ? "Accès au micro refusé. Veuillez : 1) Recharger la page (F5) 2) Vérifier sous Windows 'Autoriser les applications de bureau à accéder au micro'."
              : 'Microphone access denied. Please: 1) Reload page (F5) 2) Check Windows "Allow desktop apps to access your microphone".';
          setError(deniedMsg);
          onError?.(deniedMsg);
          setIsListening(false);
          return;
        } else if (mediaErr.name === 'NotFoundError' || mediaErr.name === 'DevicesNotFoundError') {
          const notFoundMsg =
            language === 'fr'
              ? "Aucun périphérique microphone branché ou activé dans les paramètres de son Windows."
              : 'No microphone device plugged in or enabled in Windows Sound settings.';
          setError(notFoundMsg);
          onError?.(notFoundMsg);
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
          ? "La reconnaissance vocale n'est pas prise en charge par ce navigateur (ex: Firefox ou Brave avec boucliers stricts). Veuillez utiliser Google Chrome ou Microsoft Edge."
          : 'Speech recognition is not supported in this browser. Please use Google Chrome or Microsoft Edge.';
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
        console.warn('[NEXUS Voice Debug] recognition error event:', event.error, event);
        let msg = '';
        switch (event.error) {
          case 'not-allowed':
          case 'permission-denied':
            msg =
              language === 'fr'
                ? "Microphone bloqué : rechargez la page (F5) ou vérifiez les autorisations Windows (applications de bureau)."
                : 'Microphone blocked: please reload page (F5) or verify Windows desktop app permissions.';
            break;
          case 'audio-capture':
            msg =
              language === 'fr'
                ? "Aucun signal audio détecté ou le micro est utilisé en exclusivité par une autre application (Zoom, Teams, etc.)."
                : 'No audio capture: microphone is either unplugged or used exclusively by another app.';
            break;
          case 'no-speech':
            // Simple absence de parole détectée, pas une erreur bloquante
            return;
          case 'network':
            msg =
              language === 'fr'
                ? 'Erreur réseau lors de la reconnaissance vocale (vérifiez votre connexion internet pour le service vocal).'
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
      console.warn('[NEXUS Voice Debug] recognition.start exception:', err);
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
