/**
 * src/hooks/useSpeechRecognition.ts
 *
 * Hook de reconnaissance vocale Speech-to-Text (STT) haute performance.
 * Utilise l'API native Web Speech (SpeechRecognition / webkitSpeechRecognition).
 *
 * Points forts :
 * - Déclenchement direct dans le geste utilisateur (zéro perte d'activation iOS/Safari)
 * - Aucune dépendance matérielle parasite (évite les verrous audio de getUserMedia)
 * - Support natif Chrome, Edge, Safari (iOS 14.5+ & macOS) et navigateurs mobiles
 * - Transcription fluide en continu sans duplication de mots
 * - Gestion automatique de la reprise sur pause iOS
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
  const shouldListenRef = useRef(false);
  const restartTimerRef = useRef<any>(null);

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
    shouldListenRef.current = false;
    if (restartTimerRef.current) {
      clearTimeout(restartTimerRef.current);
      restartTimerRef.current = null;
    }

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

    // Arrêter toute instance précédente en cours
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {}
      recognitionRef.current = null;
    }

    shouldListenRef.current = true;

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

      recognition.onerror = (event: any) => {
        console.warn('[NEXUS STT] Erreur capturée :', event.error);

        // Erreur bénigne : simple absence de parole momentanée
        if (event.error === 'no-speech') {
          return;
        }

        // Annulation manuelle
        if (event.error === 'aborted') {
          return;
        }

        // Permission refusée ou bloquée par l'utilisateur
        if (event.error === 'not-allowed' || event.error === 'permission-denied') {
          shouldListenRef.current = false;
          setIsListening(false);
          setPermissionState('denied');
          const blockedMsg =
            language === 'fr'
              ? "Microphone bloqué : veuillez autoriser le micro dans la barre d'adresse de votre navigateur."
              : 'Microphone blocked: please allow microphone in your browser address bar.';
          setError(blockedMsg);
          onError?.(blockedMsg);
          onPermissionBlocked?.();
          return;
        }

        // Problème matériel ou micro en cours d'utilisation par une autre app
        if (event.error === 'audio-capture') {
          shouldListenRef.current = false;
          setIsListening(false);
          const captureMsg =
            language === 'fr'
              ? "Aucun signal audio détecté ou le micro est utilisé par une autre application (Teams, Zoom, etc.)."
              : 'No audio capture: microphone is unplugged or used by another application.';
          setError(captureMsg);
          onError?.(captureMsg);
          return;
        }

        // Erreur réseau (serveur de reconnaissance vocale de Google/Apple)
        if (event.error === 'network') {
          shouldListenRef.current = false;
          setIsListening(false);
          const netMsg =
            language === 'fr'
              ? 'Erreur réseau du service vocal. Vérifiez votre connexion internet.'
              : 'Speech recognition network error. Please check your internet connection.';
          setError(netMsg);
          onError?.(netMsg);
          return;
        }

        // Autre erreur
        const genericMsg =
          language === 'fr'
            ? `Erreur microphone (${event.error}).`
            : `Microphone error (${event.error}).`;
        setError(genericMsg);
        onError?.(genericMsg);
        setIsListening(false);
      };

      recognition.onend = () => {
        // Sur iOS / Safari ou après une pause, Web Speech API coupe souvent la session.
        // Si l'utilisateur n'a pas appuyé sur Stop, on relance en douceur.
        if (shouldListenRef.current) {
          restartTimerRef.current = setTimeout(() => {
            if (shouldListenRef.current) {
              try {
                recognition.start();
              } catch {
                setIsListening(false);
              }
            }
          }, 150);
        } else {
          setIsListening(false);
        }
      };

      recognitionRef.current = recognition;

      // Démarrage immédiat et synchrone dans le cadre du geste utilisateur
      recognition.start();
    } catch (err: any) {
      console.warn('[NEXUS STT] Exception recognition.start :', err);
      shouldListenRef.current = false;
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
      shouldListenRef.current = false;
      if (restartTimerRef.current) {
        clearTimeout(restartTimerRef.current);
      }
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
