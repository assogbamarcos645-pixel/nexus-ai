/**
 * src/hooks/useSpeechRecognition.ts
 *
 * Hook de reconnaissance vocale Speech-to-Text (STT) haute performance.
 * Utilise l'API native Web Speech (SpeechRecognition / webkitSpeechRecognition).
 *
 * Points clés de robustesse :
 * - Démarrage strictement synchrone dans le geste utilisateur (zéro perte d'activation)
 * - Suppression des boucles de relance timers qui provoquaient de fausses erreurs 'not-allowed'
 * - Diagnostic matériel intelligent : vérifie si le micro physique est accessible avant d'afficher un blocage
 * - Support optimal Chrome, Edge, Safari (iOS 14.5+ & macOS)
 * - Transcription fluide continue sans duplication de texte
 */

import { useState, useRef, useEffect, useCallback } from 'react';

export type MicrophonePermissionState = 'prompt' | 'granted' | 'denied' | 'unsupported';

interface UseSpeechRecognitionOptions {
  language?: string;
  onTranscript?: (transcript: string) => void;
  onError?: (error: string) => void;
  onPermissionBlocked?: () => void;
}

interface UseSpeechRecognitionReturn {
  isListening: boolean;
  isSupported: boolean;
  permissionState: MicrophonePermissionState;
  transcript: string;
  startListening: () => void;
  stopListening: () => void;
  toggleListening: () => void;
  error: string | null;
  clearError: () => void;
}

export function useSpeechRecognition({
  language = 'fr',
  onTranscript,
  onError,
  onPermissionBlocked,
}: UseSpeechRecognitionOptions = {}): UseSpeechRecognitionReturn {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(false);
  const [permissionState, setPermissionState] = useState<MicrophonePermissionState>('prompt');

  const recognitionRef = useRef<any>(null);

  // Vérification de la prise en charge au montage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      setIsSupported(Boolean(SpeechRecognition));

      // Vérifier si l'API Permissions est disponible
      if (navigator?.permissions?.query) {
        navigator.permissions
          .query({ name: 'microphone' as PermissionName })
          .then((res) => {
            setPermissionState(res.state as MicrophonePermissionState);
            res.onchange = () => {
              setPermissionState(res.state as MicrophonePermissionState);
            };
          })
          .catch(() => {
            // Safari ou navigateur ne supportant pas query({ name: 'microphone' })
          });
      }
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Ignorer si déjà arrêté
      }
    }
    setIsListening(false);
  }, []);

  const startListening = useCallback(() => {
    setError(null);

    if (typeof window === 'undefined') return;

    // 1. Contexte sécurisé requis (HTTPS ou localhost)
    if (window.isSecureContext === false) {
      const insecureMsg =
        language === 'fr'
          ? "La reconnaissance vocale nécessite une connexion sécurisée (HTTPS ou localhost)."
          : 'Speech recognition requires a secure context (HTTPS or localhost).';
      setError(insecureMsg);
      onError?.(insecureMsg);
      return;
    }

    // 2. Détection de l'API Web Speech
    const SpeechRecognitionClass =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      const notSupportedMsg =
        language === 'fr'
          ? "La reconnaissance vocale en direct est prise en charge sur Google Chrome, Microsoft Edge, Safari et Opera. Veuillez utiliser l'un de ces navigateurs."
          : 'Speech recognition is supported on Google Chrome, Microsoft Edge, Safari, and Opera. Please use one of these browsers.';
      setError(notSupportedMsg);
      onError?.(notSupportedMsg);
      setPermissionState('unsupported');
      return;
    }

    // Arrêter toute instance précédente en cours sans relance parasite
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {}
      recognitionRef.current = null;
    }

    try {
      const recognition = new SpeechRecognitionClass();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;
      recognition.lang = language === 'fr' ? 'fr-FR' : 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        setPermissionState('granted');
        setError(null);
      };

      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = 0; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            finalTranscript += result[0].transcript;
          } else {
            interimTranscript += result[0].transcript;
          }
        }

        const fullTranscript = (
          finalTranscript + (interimTranscript ? ` ${interimTranscript}` : '')
        ).trim();

        setTranscript(fullTranscript);
        onTranscript?.(fullTranscript);
      };

      recognition.onerror = async (event: any) => {
        console.warn('[NEXUS STT] Erreur capturée :', event.error);

        // Erreur bénigne : absence de parole détectée
        if (event.error === 'no-speech') {
          return;
        }

        // Annulation manuelle ou arrêt normal
        if (event.error === 'aborted') {
          setIsListening(false);
          return;
        }

        // Cas d'erreur d'autorisation ou de refus
        if (event.error === 'not-allowed' || event.error === 'permission-denied') {
          setIsListening(false);

          // Test de diagnostic réel : est-ce que le microphone physique est véritablement bloqué ?
          let hardwareBlocked = false;
          if (navigator?.mediaDevices?.getUserMedia) {
            try {
              const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
              stream.getTracks().forEach((track) => track.stop());
              hardwareBlocked = false;
            } catch (err: any) {
              if (
                err.name === 'NotAllowedError' ||
                err.name === 'PermissionDeniedError' ||
                err.name === 'SecurityError'
              ) {
                hardwareBlocked = true;
              }
            }
          }

          if (hardwareBlocked) {
            setPermissionState('denied');
            const blockedMsg =
              language === 'fr'
                ? "Microphone bloqué dans le navigateur ou dans les paramètres Windows. Cliquez sur le cadenas ou vérifiez les autorisations d'applications de bureau."
                : 'Microphone blocked in browser or Windows settings. Please allow access.';
            setError(blockedMsg);
            onError?.(blockedMsg);
            onPermissionBlocked?.();
          } else {
            // Le micro fonctionne, mais le service cloud de reconnaissance vocale du navigateur est indisponible
            const serviceMsg =
              language === 'fr'
                ? "Microphone opérationnel, mais le service de reconnaissance vocale de votre navigateur a été restreint (désactivez les boucliers Brave / extensions de blocage ou vérifiez votre connexion)."
                : 'Microphone is working, but speech recognition service was restricted (check Brave shields or network).';
            setError(serviceMsg);
            onError?.(serviceMsg);
          }
          return;
        }

        // Micro occupé ou débranché
        if (event.error === 'audio-capture') {
          setIsListening(false);
          const captureMsg =
            language === 'fr'
              ? "Microphone introuvable ou utilisé en exclusivité par une autre application (Zoom, Teams, Discord, etc.)."
              : 'No audio capture: microphone is unplugged or used by another application.';
          setError(captureMsg);
          onError?.(captureMsg);
          return;
        }

        // Erreur réseau
        if (event.error === 'network') {
          setIsListening(false);
          const netMsg =
            language === 'fr'
              ? 'Erreur réseau du service vocal. Vérifiez votre connexion internet.'
              : 'Speech recognition network error. Please check your internet connection.';
          setError(netMsg);
          onError?.(netMsg);
          return;
        }

        // Autre erreur générique
        const genericMsg =
          language === 'fr'
            ? `Erreur microphone (${event.error}).`
            : `Microphone error (${event.error}).`;
        setError(genericMsg);
        onError?.(genericMsg);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;

      // Démarrage immédiat et synchrone dans le cadre du geste utilisateur
      recognition.start();
    } catch (err: any) {
      console.warn('[NEXUS STT] Exception recognition.start :', err);
      setIsListening(false);
      const msg = err?.message || 'Impossible de démarrer la reconnaissance vocale.';
      setError(msg);
      onError?.(msg);
    }
  }, [language, onTranscript, onError, onPermissionBlocked]);

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
        } catch {}
      }
    };
  }, []);

  return {
    isListening,
    isSupported,
    permissionState,
    transcript,
    startListening,
    stopListening,
    toggleListening,
    error,
    clearError,
  };
}
