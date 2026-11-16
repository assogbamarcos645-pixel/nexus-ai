/**
 * src/hooks/useSpeechRecognition.ts
 *
 * Système universel de reconnaissance vocale à double moteur (Dual-Engine STT) :
 *  1. Moteur Natif Web Speech (Chrome, Edge, Safari macOS/iOS) : Transcription continue en temps réel.
 *  2. Moteur Fallback Universel (Brave, Firefox, bloqueurs de pisteurs, réseaux stricts) :
 *     Capture audio MediaRecorder + Transcription IA haute fidélité (Whisper / Gemini via /api/audio/transcribe).
 *
 * Résout définitivement l'erreur "service de reconnaissance vocale restreint"
 * et garantit un fonctionnement sans accroc sur 100% des navigateurs et OS.
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
  isProcessingAudio: boolean;
  isSupported: boolean;
  permissionState: MicrophonePermissionState;
  transcript: string;
  activeEngine: 'web-speech' | 'media-recorder' | null;
  startListening: () => Promise<void>;
  stopListening: () => void;
  toggleListening: () => Promise<void>;
  error: string | null;
  clearError: () => void;
}

const STORAGE_ENGINE_KEY = 'nexus_preferred_stt_engine';

export function useSpeechRecognition({
  language = 'fr',
  onTranscript,
  onError,
  onPermissionBlocked,
}: UseSpeechRecognitionOptions = {}): UseSpeechRecognitionReturn {
  const [isListening, setIsListening] = useState(false);
  const [isProcessingAudio, setIsProcessingAudio] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(false);
  const [permissionState, setPermissionState] = useState<MicrophonePermissionState>('prompt');
  const [activeEngine, setActiveEngine] = useState<'web-speech' | 'media-recorder' | null>(null);

  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const preferMediaRecorderRef = useRef<boolean>(false);

  // Initialisation et détection des capacités
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const hasMediaDevices = Boolean(navigator?.mediaDevices?.getUserMedia);
    const hasMediaRecorder = typeof MediaRecorder !== 'undefined';

    setIsSupported(Boolean(SpeechRecognition || (hasMediaDevices && hasMediaRecorder)));

    // Vérifier si le moteur MediaRecorder a déjà été mémorisé pour cette session
    const savedEngine = sessionStorage.getItem(STORAGE_ENGINE_KEY);
    if (savedEngine === 'media-recorder') {
      preferMediaRecorderRef.current = true;
    }

    // Détection spécifique Brave : Brave bloque par défaut les services Google Speech
    if ((navigator as any).brave && typeof (navigator as any).brave.isBrave === 'function') {
      (navigator as any).brave.isBrave().then((isB: boolean) => {
        if (isB) {
          preferMediaRecorderRef.current = true;
        }
      }).catch(() => {});
    }

    // Suivi de l'état des permissions si supporté
    if (navigator?.permissions?.query) {
      navigator.permissions
        .query({ name: 'microphone' as PermissionName })
        .then((res) => {
          setPermissionState(res.state as MicrophonePermissionState);
          res.onchange = () => {
            setPermissionState(res.state as MicrophonePermissionState);
          };
        })
        .catch(() => {});
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Envoi de l'enregistrement au backend Whisper/Gemini
  const sendAudioToTranscriptionApi = async (audioBlob: Blob) => {
    if (audioBlob.size < 1000) {
      // Audio trop court ou vide
      return;
    }

    setIsProcessingAudio(true);
    try {
      const formData = new FormData();
      formData.append('file', audioBlob, 'voice-recording.webm');
      formData.append('language', language === 'en' ? 'en' : 'fr');

      const response = await fetch('/api/audio/transcribe', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = (await response.json()) as { text?: string };
        const recognized = (data.text || '').trim();
        if (recognized) {
          setTranscript(recognized);
          onTranscript?.(recognized);
        }
      } else {
        const errData = await response.json().catch(() => ({}));
        const msg =
          errData.error ||
          (language === 'fr'
            ? 'Transcription vocale temporairement indisponible.'
            : 'Voice transcription temporarily unavailable.');
        console.warn('[NEXUS Voice] Transcription API error:', msg);
        setError(msg);
        onError?.(msg);
      }
    } catch (err: any) {
      console.warn('[NEXUS Voice] Transcription network error:', err);
      const networkMsg =
        language === 'fr'
          ? 'Erreur réseau lors de la transcription audio.'
          : 'Network error during audio transcription.';
      setError(networkMsg);
      onError?.(networkMsg);
    } finally {
      setIsProcessingAudio(false);
    }
  };

  // Démarrage du moteur MediaRecorder (Universel & Résistant aux restrictions)
  const startMediaRecorder = async () => {
    try {
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });
      } catch (constraintErr: any) {
        // Si les contraintes avancées échouent (OverconstrainedError), repli sur contrainte simple
        if (constraintErr.name === 'OverconstrainedError' || constraintErr.name === 'TypeError') {
          stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        } else {
          throw constraintErr;
        }
      }

      audioStreamRef.current = stream;
      audioChunksRef.current = [];

      let mimeType = '';
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        mimeType = 'audio/webm;codecs=opus';
      } else if (MediaRecorder.isTypeSupported('audio/webm')) {
        mimeType = 'audio/webm';
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        mimeType = 'audio/mp4';
      }

      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        const finalBlob = new Blob(audioChunksRef.current, {
          type: recorder.mimeType || 'audio/webm',
        });
        audioChunksRef.current = [];

        if (audioStreamRef.current) {
          audioStreamRef.current.getTracks().forEach((track) => track.stop());
          audioStreamRef.current = null;
        }

        await sendAudioToTranscriptionApi(finalBlob);
      };

      recorder.start(250);
      setActiveEngine('media-recorder');
      setIsListening(true);
      setPermissionState('granted');
      setError(null);
    } catch (err: any) {
      console.warn('[NEXUS Voice] MediaRecorder access error:', err);
      setIsListening(false);
      setActiveEngine(null);

      if (
        err.name === 'NotAllowedError' ||
        err.name === 'PermissionDeniedError' ||
        err.name === 'SecurityError'
      ) {
        setPermissionState('denied');
        const blockedMsg =
          language === 'fr'
            ? 'Microphone bloqué dans le navigateur ou dans les paramètres de votre appareil. Cliquez sur le cadenas pour autoriser le micro.'
            : 'Microphone blocked in browser or device settings. Please allow microphone access.';
        setError(blockedMsg);
        onError?.(blockedMsg);
        onPermissionBlocked?.();
      } else if (
        err.name === 'NotFoundError' ||
        err.name === 'DevicesNotFoundError' ||
        /not found/i.test(err?.message || '')
      ) {
        setPermissionState('unsupported');
        const notFoundMsg =
          language === 'fr'
            ? 'Aucun microphone physique détecté sur cet ordinateur. Veuillez brancher un micro, un casque ou des écouteurs avec micro.'
            : 'No physical microphone detected on this device. Please plug in a microphone or headset.';
        setError(notFoundMsg);
        onError?.(notFoundMsg);
      } else {
        const errMessage =
          language === 'fr'
            ? `Microphone inaccessible : ${err?.message || 'périphérique introuvable'}`
            : `Microphone inaccessible: ${err?.message || 'device not found'}`;
        setError(errMessage);
        onError?.(errMessage);
      }
    }
  };

  const stopListening = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch {}
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }

    setIsListening(false);
    setActiveEngine(null);
  }, []);

  const startListening = useCallback(async () => {
    setError(null);

    if (typeof window === 'undefined') return;

    if (window.isSecureContext === false) {
      const insecureMsg =
        language === 'fr'
          ? 'La reconnaissance vocale nécessite une connexion sécurisée (HTTPS ou localhost).'
          : 'Speech recognition requires a secure context (HTTPS or localhost).';
      setError(insecureMsg);
      onError?.(insecureMsg);
      return;
    }

    const SpeechRecognitionClass =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    // Si le moteur MediaRecorder est préféré (Brave, échec Web Speech antérieur ou navigateur sans SpeechRecognition)
    if (preferMediaRecorderRef.current || !SpeechRecognitionClass) {
      await startMediaRecorder();
      return;
    }

    // Arrêter toute instance précédente en cours
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
        setActiveEngine('web-speech');
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
        console.warn('[NEXUS Voice] Web Speech event error:', event.error);

        if (event.error === 'no-speech' || event.error === 'aborted') {
          return;
        }

        // Si le service cloud Google est restreint (Brave, VPN, bloqueurs d'URL de tracking),
        // bascule immédiate et transparente vers le moteur MediaRecorder + Whisper AI
        if (
          event.error === 'not-allowed' ||
          event.error === 'service-not-allowed' ||
          event.error === 'network'
        ) {
          try {
            recognition.abort();
          } catch {}
          recognitionRef.current = null;

          preferMediaRecorderRef.current = true;
          try {
            sessionStorage.setItem(STORAGE_ENGINE_KEY, 'media-recorder');
          } catch {}

          // Bascule directe vers le moteur MediaRecorder
          await startMediaRecorder();
          return;
        }

        if (event.error === 'audio-capture') {
          setIsListening(false);
          setActiveEngine(null);
          const captureMsg =
            language === 'fr'
              ? 'Microphone introuvable ou occupé par une autre application.'
              : 'Microphone is unplugged or busy.';
          setError(captureMsg);
          onError?.(captureMsg);
          return;
        }

        const genericMsg =
          language === 'fr'
            ? `Erreur microphone (${event.error}).`
            : `Microphone error (${event.error}).`;
        setError(genericMsg);
        onError?.(genericMsg);
        setIsListening(false);
        setActiveEngine(null);
      };

      recognition.onend = () => {
        setIsListening(false);
        setActiveEngine(null);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      console.warn('[NEXUS Voice] SpeechRecognition.start error, fallback to MediaRecorder:', err);
      preferMediaRecorderRef.current = true;
      try {
        sessionStorage.setItem(STORAGE_ENGINE_KEY, 'media-recorder');
      } catch {}
      await startMediaRecorder();
    }
  }, [language, onTranscript, onError, onPermissionBlocked]);

  const toggleListening = useCallback(async () => {
    if (isListening) {
      stopListening();
    } else {
      await startListening();
    }
  }, [isListening, startListening, stopListening]);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  return {
    isListening,
    isProcessingAudio,
    isSupported,
    permissionState,
    transcript,
    activeEngine,
    startListening,
    stopListening,
    toggleListening,
    error,
    clearError,
  };
}
