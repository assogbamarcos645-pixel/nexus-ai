/**
 * src/services/ai/aiService.ts
 *
 * Couche de service IA — interface unique pour communiquer avec les modèles d'IA.
 * Intègre la configuration du Centre de Contrôle, la télémétrie sécurisée,
 * la sanitisation des erreurs et la bascule fluide entre simulateur et API réelle.
 */

import { API_BASE_URL } from '../../lib/constants.ts';
import { getAIConfig } from './aiConfigService.ts';
import { logAIRequest, sanitizeErrorMessage } from './aiTelemetryService.ts';
import type { AITokenUsage, AIProviderId } from '../../types/ai.ts';

export interface ChatRequest {
  message: string;
  agentId: string;
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
  providerId?: AIProviderId;
  modelId?: string;
  images?: string[]; // Images en base64 Data-URI pour vision multimodale (Gemini 2.5)
  onChunk?: (chunk: string) => void;
}

export interface ChatResponse {
  content: string;
  agentId: string;
  providerId?: AIProviderId;
  modelId?: string;
  tokens?: AITokenUsage;
  isSimulated?: boolean;
}

// ─── Appel au modèle IA réel (avec historique complet et streaming) ─────────

async function realChat(
  request: ChatRequest,
  signal?: AbortSignal,
): Promise<ChatResponse> {
  const startTime = performance.now();
  const config = getAIConfig();
  const providerId: AIProviderId = request.providerId || config.activeProviderId;
  const modelId = request.modelId || config.activeModelId;
  const isStream = Boolean(request.onChunk);

  const baseUrl = API_BASE_URL || (typeof window !== 'undefined' ? '' : 'http://127.0.0.1:5173');
  const endpoint = `${baseUrl}/api/chat${isStream ? '?stream=true' : ''}`;

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(isStream ? { Accept: 'text/event-stream' } : {}),
      },
      body: JSON.stringify({
        message: request.message,
        agentId: request.agentId,
        conversationHistory: request.conversationHistory,
        providerId,
        modelId,
        images: request.images,
        stream: isStream,
        settings: {
          maxTokens: config.settings.maxTokens,
          temperature: config.settings.temperature,
          timeoutSeconds: config.settings.timeoutSeconds,
        },
      }),
      signal,
    });

    const isSSE = response.headers.get('content-type')?.includes('text/event-stream');

    if (isSSE && response.body && request.onChunk) {
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('data: ')) {
            try {
              const data = JSON.parse(trimmed.slice(6));
              if (data.chunk) {
                fullContent += data.chunk;
                request.onChunk(data.chunk);
              }
            } catch {
              // Ignore non-json lines
            }
          }
        }
      }

      const durationMs = Math.round(performance.now() - startTime);
      const promptTokens = Math.max(1, Math.round(request.message.length / 4));
      const completionTokens = Math.max(1, Math.round(fullContent.length / 4));
      const tokens: AITokenUsage = {
        promptTokens,
        completionTokens,
        totalTokens: promptTokens + completionTokens,
      };

      logAIRequest({
        providerId,
        modelId,
        agentId: request.agentId,
        durationMs,
        success: true,
        statusCode: response.status,
        tokens,
        isSimulated: false,
      });

      return {
        content: fullContent,
        agentId: request.agentId,
        providerId,
        modelId,
        tokens,
        isSimulated: false,
      };
    }

    const durationMs = Math.round(performance.now() - startTime);

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Endpoint /api/chat introuvable (404). Vérifiez que le serveur proxy de développement est démarré.');
      }

      let rawError = `Erreur HTTP ${response.status}`;
      try {
        const errorJson = await response.json();
        if (errorJson.message) rawError = errorJson.message;
      } catch {
        // Ignorer
      }

      logAIRequest({
        providerId,
        modelId,
        agentId: request.agentId,
        durationMs,
        success: false,
        statusCode: response.status,
        error: rawError,
        isSimulated: false,
      });

      throw new Error(sanitizeErrorMessage(rawError));
    }

    const data = await response.json();
    const tokens: AITokenUsage | undefined = data.tokens || (data.usage
      ? {
          promptTokens: data.usage.prompt_tokens,
          completionTokens: data.usage.completion_tokens,
          totalTokens: data.usage.total_tokens,
        }
      : undefined);

    logAIRequest({
      providerId,
      modelId,
      agentId: request.agentId,
      durationMs,
      success: true,
      statusCode: response.status,
      tokens,
      isSimulated: false,
    });

    return {
      content: data.content || data.reply || '',
      agentId: request.agentId,
      providerId,
      modelId,
      tokens,
      isSimulated: false,
    };
  } catch (err: unknown) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw err;
    }

    const durationMs = Math.round(performance.now() - startTime);
    const errMessage = err instanceof Error ? err.message : String(err);

    // Si le proxy local ou distant n'est pas actif, on informe l'utilisateur
    logAIRequest({
      providerId,
      modelId,
      agentId: request.agentId,
      durationMs,
      success: false,
      error: errMessage,
      isSimulated: false,
    });

    throw new Error(
      `Échec de connexion au moteur IA (${sanitizeErrorMessage(errMessage)}). Vérifiez le Centre de Contrôle.`,
    );
  }
}

// ─── Export public ────────────────────────────────────────────────────────────

/**
 * Envoie un message à l'agent IA sélectionné.
 * Exécute l'appel réel au modèle avec le prompt système et l'historique conversationnel complet.
 */
export async function chat(
  request: ChatRequest,
  signal?: AbortSignal,
): Promise<ChatResponse> {
  return realChat(request, signal);
}
