import { useState, useCallback, useRef } from 'react';
import type { MessageRole } from '@/types';
import { MAX_MESSAGE_LENGTH } from '@/config/app';
import { chat } from '@/services/ai/aiService';

interface UseChatEngineOptions {
  agentId: string;
  conversationMessages?: { role: MessageRole; content: string }[];
  addMessage: (role: MessageRole, content: string, images?: string[], isStreaming?: boolean) => string | void;
  updateMessage?: (messageId: string, content: string, isStreaming?: boolean) => void;
}

interface UseChatEngineReturn {
  input: string;
  setInput: (value: string) => void;
  attachedImages: string[];
  addAttachedImage: (dataUrl: string) => void;
  removeAttachedImage: (index: number) => void;
  clearAttachedImages: () => void;
  isLoading: boolean;
  sendMessage: (customMessage?: string) => Promise<void>;
  stopGeneration: () => void;
  error: string | null;
}

/**
 * Chat engine hook — gère l'envoi des messages, la réception ultra-rapide des réponses IA
 * avec streaming progressif en temps réel, vision multimodale et journalisation télémétrique.
 */
export function useChatEngine({
  agentId,
  conversationMessages,
  addMessage,
  updateMessage,
}: UseChatEngineOptions): UseChatEngineReturn {
  const [input, setInput] = useState('');
  const [attachedImages, setAttachedImages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const addAttachedImage = useCallback((dataUrl: string) => {
    setAttachedImages((prev) => [...prev, dataUrl]);
  }, []);

  const removeAttachedImage = useCallback((index: number) => {
    setAttachedImages((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const clearAttachedImages = useCallback(() => {
    setAttachedImages([]);
  }, []);

  const sendMessage = useCallback(async (customMessage?: string) => {
    const defaultPromptForImages =
      attachedImages.length > 0
        ? 'Convertis cette maquette en interface web moderne, esthétique et responsive pour NEXUS LAB.'
        : '';
    const textToSend = customMessage !== undefined ? customMessage : input;
    const trimmed = textToSend.trim() || defaultPromptForImages;

    if (!trimmed || isLoading) return;
    if (trimmed.length > MAX_MESSAGE_LENGTH) {
      setError(`Le message est trop long (max ${MAX_MESSAGE_LENGTH} caractères).`);
      return;
    }

    const currentImages = [...attachedImages];
    setInput('');
    setAttachedImages([]);
    setError(null);
    addMessage('user', trimmed, currentImages.length > 0 ? currentImages : undefined);

    abortRef.current = new AbortController();
    setIsLoading(true);

    // Crée immédiatement la bulle de réponse de l'assistant avec flag streaming
    const assistantMsgId = addMessage('assistant', '', undefined, true) || '';
    let accumulatedContent = '';

    const conversationHistory = conversationMessages
      ? conversationMessages
          .filter(
            (m): m is { role: 'user' | 'assistant'; content: string } =>
              (m.role === 'user' || m.role === 'assistant') &&
              Boolean(m.content && m.content.trim().length > 0),
          )
          .slice(-10)
          .map((m) => ({ role: m.role, content: m.content }))
      : undefined;

    try {
      const response = await chat(
        {
          message: trimmed,
          agentId,
          conversationHistory,
          images: currentImages.length > 0 ? currentImages : undefined,
          onChunk: (chunk) => {
            accumulatedContent += chunk;
            if (assistantMsgId && updateMessage) {
              updateMessage(assistantMsgId, accumulatedContent, true);
            }
          },
        },
        abortRef.current.signal,
      );

      // Finalisation : streaming terminé
      if (assistantMsgId && updateMessage) {
        updateMessage(assistantMsgId, response.content, false);
      } else if (!assistantMsgId) {
        addMessage('assistant', response.content, undefined, false);
      }
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        if (assistantMsgId && updateMessage) {
          updateMessage(assistantMsgId, accumulatedContent, false);
        }
        return;
      }
      const message =
        err instanceof Error
          ? err.message
          : 'Une erreur est survenue lors de la communication avec l’agent.';
      setError(message);
      // Si une bulle vide avait été pré-créée, on y place le message d'erreur pour ne pas laisser de bulle orpheline
      if (assistantMsgId && updateMessage) {
        updateMessage(assistantMsgId, `Erreur : ${message}`, false);
      }
      console.error('[ChatEngine]', err);
    } finally {
      setIsLoading(false);
      abortRef.current = null;
    }
  }, [input, attachedImages, isLoading, agentId, conversationMessages, addMessage, updateMessage]);

  const stopGeneration = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  return {
    input,
    setInput,
    attachedImages,
    addAttachedImage,
    removeAttachedImage,
    clearAttachedImages,
    isLoading,
    sendMessage,
    stopGeneration,
    error,
  };
}
