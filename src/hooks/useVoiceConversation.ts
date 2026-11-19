/**
 * src/hooks/useVoiceConversation.ts
 *
 * Moteur de conversation vocale bidirectionnelle continue (Voice-to-Voice) pour NEXUS AI.
 * Orchestre la boucle fluide :
 *  1. Écoute active (STT) avec détection de fin de phrase / silence.
 *  2. Traitement IA via la couche de service universelle (aiService).
 *  3. Synthèse vocale naturelle (TTS) de la réponse avec animations de l'orbe.
 *  4. Interruption instantanée si l'utilisateur reprend la parole.
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { useSpeechRecognition } from './useSpeechRecognition';
import { voiceSynthesisService } from '../services/voice/voiceSynthesisService';
import { chat } from '../services/ai/aiService';

export type VoiceState = 'idle' | 'listening' | 'thinking' | 'speaking';

export interface UseVoiceConversationOptions {
  agentId?: string;
  contextPrompt?: string;
  silenceThresholdMs?: number;
  onStateChange?: (state: VoiceState) => void;
}

export interface UseVoiceConversationReturn {
  state: VoiceState;
  isActive: boolean;
  transcript: string;
  lastAiResponse: string;
  isMuted: boolean;
  start: () => Promise<void>;
  stop: () => void;
  toggleMute: () => void;
  interrupt: () => void;
  error: string | null;
}

export function useVoiceConversation({
  agentId = 'codex',
  contextPrompt,
  silenceThresholdMs = 1500,
  onStateChange,
}: UseVoiceConversationOptions = {}): UseVoiceConversationReturn {
  const [state, setState] = useState<VoiceState>('idle');
  const [lastAiResponse, setLastAiResponse] = useState<string>('');
  const [isMuted, setIsMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const silenceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isComponentMounted = useRef(true);
  const stateRef = useRef<VoiceState>('idle');

  const updateState = useCallback(
    (newState: VoiceState) => {
      stateRef.current = newState;
      setState(newState);
      onStateChange?.(newState);
    },
    [onStateChange],
  );

  const handleProcessUserQuery = useCallback(
    async (userText: string) => {
      const cleanPrompt = userText.trim();
      if (!cleanPrompt) {
        updateState('listening');
        return;
      }

      updateState('thinking');
      abortControllerRef.current = new AbortController();

      try {
        const fullPrompt = contextPrompt
          ? `[Contexte : ${contextPrompt}]\n\nQuestion de l'utilisateur : ${cleanPrompt}\n\nRéponds de manière concise, directe et naturelle en 2 ou 3 phrases pour une conversation orale fluide.`
          : `${cleanPrompt}\n\n(Réponds de manière concise et naturelle adaptée à une écoute orale).`;

        const response = await chat(
          {
            message: fullPrompt,
            agentId,
          },
          abortControllerRef.current.signal,
        );

        if (!isComponentMounted.current) return;

        const aiText = response.content || 'Je n\'ai pas pu formuler de réponse.';
        setLastAiResponse(aiText);
        updateState('speaking');

        // Prononciation orale
        await voiceSynthesisService.speak(aiText, {
          onEnd: () => {
            if (isComponentMounted.current && stateRef.current === 'speaking') {
              updateState('listening');
            }
          },
          onError: () => {
            if (isComponentMounted.current) {
              updateState('listening');
            }
          },
        });
      } catch (err: unknown) {
        if (!isComponentMounted.current) return;
        if (err instanceof DOMException && err.name === 'AbortError') {
          return;
        }
        setError(err instanceof Error ? err.message : 'Erreur de communication vocale.');
        updateState('listening');
      }
    },
    [agentId, contextPrompt, updateState],
  );

  const {
    transcript,
    isListening,
    startListening,
    stopListening,
    error: sttError,
  } = useSpeechRecognition({
    language: 'fr-FR',
    onTranscript: (liveText) => {
      // Si l'utilisateur parle pendant que l'IA parle, interruption immédiate
      if (stateRef.current === 'speaking') {
        voiceSynthesisService.stop();
        updateState('listening');
      }

      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
      }

      // Détection de la fin de parole après silenceThresholdMs
      if (liveText.trim().length > 2) {
        silenceTimeoutRef.current = setTimeout(() => {
          if (stateRef.current === 'listening') {
            handleProcessUserQuery(liveText);
          }
        }, silenceThresholdMs);
      }
    },
    onError: (err) => {
      setError(err);
    },
  });

  // Gestion du cycle start/stop de reconnaissance selon l'état de la boucle
  useEffect(() => {
    if (state === 'listening' && !isMuted && !isListening) {
      startListening().catch(() => {});
    } else if (state !== 'listening' && isListening) {
      stopListening();
    }
  }, [state, isMuted, isListening, startListening, stopListening]);

  const start = useCallback(async () => {
    setError(null);
    updateState('listening');
    await startListening();
  }, [startListening, updateState]);

  const stop = useCallback(() => {
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    voiceSynthesisService.stop();
    stopListening();
    updateState('idle');
  }, [stopListening, updateState]);

  const interrupt = useCallback(() => {
    if (stateRef.current === 'speaking') {
      voiceSynthesisService.stop();
      updateState('listening');
    }
  }, [updateState]);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      if (next) {
        voiceSynthesisService.stop();
        stopListening();
      } else if (stateRef.current === 'listening') {
        startListening().catch(() => {});
      }
      return next;
    });
  }, [startListening, stopListening]);

  useEffect(() => {
    isComponentMounted.current = true;
    return () => {
      isComponentMounted.current = false;
      if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
      if (abortControllerRef.current) abortControllerRef.current.abort();
      voiceSynthesisService.stop();
    };
  }, []);

  return {
    state,
    isActive: state !== 'idle',
    transcript,
    lastAiResponse,
    isMuted,
    start,
    stop,
    toggleMute,
    interrupt,
    error: error || sttError,
  };
}
