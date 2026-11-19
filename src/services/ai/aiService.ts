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
import type { AttachedDocument } from '../../types/documents.ts';

export interface ChatRequest {
  message: string;
  agentId: string;
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
  providerId?: AIProviderId;
  modelId?: string;
  systemPrompt?: string;
  images?: string[]; // Images en base64 Data-URI pour vision multimodale (Gemini 2.5)
  documents?: AttachedDocument[]; // Documents complets pour analyse (PDF, code, données)
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

  const MAX_RETRIES = 2;
  let lastError: unknown = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    // Si nouvel essai après échec transitoire, pause avec backoff (500ms puis 1000ms)
    if (attempt > 0) {
      if (signal?.aborted) throw new DOMException('Requête annulée', 'AbortError');
      await new Promise((resolve) => setTimeout(resolve, attempt * 500));
      if (signal?.aborted) throw new DOMException('Requête annulée', 'AbortError');
    }

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
          systemPrompt: request.systemPrompt,
          images: request.images,
          documents: request.documents,
          stream: isStream,
          settings: {
            maxTokens: config.settings.maxTokens,
            temperature: config.settings.temperature,
            timeoutSeconds: config.settings.timeoutSeconds,
          },
        }),
        signal,
      });

      // Si erreur transitoire (404 pendant redéploiement Vercel, 429 pic de trafic, ou 502/503/504)
      if (!response.ok && (response.status === 404 || response.status === 429 || response.status >= 502)) {
        if (attempt < MAX_RETRIES) {
          continue; // Réessaie automatiquement de manière transparente sans alerte utilisateur
        }

        const durationMs = Math.round(performance.now() - startTime);
        let rawError = `Erreur HTTP ${response.status}`;
        try {
          const errorJson = await response.json();
          if (errorJson.message) rawError = errorJson.message;
        } catch {
          // Ignorer
        }

        if (response.status === 404) {
          rawError = 'Service temporairement indisponible (404). Une synchronisation réseau ou une mise à jour de la plateforme est en cours. Veuillez réessayer dans quelques instants.';
        } else if (response.status === 429) {
          rawError = 'Limite temporaire de requêtes atteinte (429). Veuillez patienter quelques secondes avant d’envoyer un nouveau message.';
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

      if (!response.ok) {
        const durationMs = Math.round(performance.now() - startTime);
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

      // Si erreur réseau (TypeError fetch failed) et qu'il reste des essais
      if (attempt < MAX_RETRIES && (err instanceof TypeError || String(err).includes('fetch'))) {
        lastError = err;
        continue;
      }

      const durationMs = Math.round(performance.now() - startTime);
      const errMessage = err instanceof Error ? err.message : String(err);

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

  throw (lastError || new Error('Échec de communication avec le moteur IA après plusieurs tentatives.'));
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
