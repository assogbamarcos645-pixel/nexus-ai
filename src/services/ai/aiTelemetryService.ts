/**
 * src/services/ai/aiTelemetryService.ts
 *
 * Système de journalisation et de suivi d'utilisation pour le moteur IA de NEXUS AI.
 *
 * GARANTIES DE SÉCURITÉ ET DE CONFIDENTIALITÉ :
 * 1. N'enregistre JAMAIS le contenu des messages privés des utilisateurs.
 * 2. N'enregistre JAMAIS de clés API ni de jetons d'authentification.
 * 3. Assainit rigoureusement tous les messages d'erreur avant stockage.
 * 4. Distingue strictement les statistiques réelles des simulations.
 */

import type {
  AITelemetryLog,
  AIUsageSummary,
  AIProviderId,
} from '@/types/ai';
import { getModelById } from '../../config/aiProviders.ts';
import { generateUUID } from '../../utils/uuid.ts';

const TELEMETRY_STORAGE_KEY = 'nexus_ai_telemetry_logs_v1';
const MAX_LOGS_RETENTION = 250;

/**
 * Assainit un message d'erreur pour éviter toute fuite de secret,
 * de clé API (sk-..., gsk_..., Bearer...) ou d'en-tête sensible.
 */
export function sanitizeErrorMessage(rawError?: string | null): string {
  if (!rawError) return 'Erreur inconnue';

  let sanitized = String(rawError);

  // Masquage des motifs de clés API courantes
  sanitized = sanitized.replace(/(sk-[a-zA-Z0-9_-]{8,})/gi, 'sk-***[MASQUÉ]***');
  sanitized = sanitized.replace(/(gsk_[a-zA-Z0-9_-]{8,})/gi, 'gsk_***[MASQUÉ]***');
  sanitized = sanitized.replace(/(AIza[a-zA-Z0-9_-]{15,})/gi, 'AIza***[MASQUÉ]***');
  sanitized = sanitized.replace(/(Bearer\s+[a-zA-Z0-9_.-]+)/gi, 'Bearer ***[MASQUÉ]***');
  sanitized = sanitized.replace(/(key=)[a-zA-Z0-9_-]+/gi, '$1***[MASQUÉ]***');

  // Tronquage si message anormalement long
  if (sanitized.length > 300) {
    sanitized = sanitized.slice(0, 297) + '...';
  }

  return sanitized.trim();
}

/**
 * Calcule le coût estimé en dollars USD basé sur la tarification officielle documentée.
 * Renvoie null si le modèle n'a pas de grille tarifaire connue ou si les tokens sont absents.
 */
export function calculateEstimatedCost(
  providerId: AIProviderId,
  modelId: string,
  promptTokens = 0,
  completionTokens = 0,
): number | null {
  const model = getModelById(providerId, modelId);
  if (!model || !model.pricing) {
    return null;
  }

  // Si le modèle est gratuit (local Ollama ou démo)
  if (model.pricing.inputPerMillionTokens === 0 && model.pricing.outputPerMillionTokens === 0) {
    return 0;
  }

  if (promptTokens === 0 && completionTokens === 0) {
    return null;
  }

  const inputCost = (promptTokens / 1_000_000) * model.pricing.inputPerMillionTokens;
  const outputCost = (completionTokens / 1_000_000) * model.pricing.outputPerMillionTokens;

  return Number((inputCost + outputCost).toFixed(6));
}

/**
 * Récupère l'historique complet des journaux de télémétrie depuis le stockage local.
 */
export function getTelemetryLogs(): AITelemetryLog[] {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(TELEMETRY_STORAGE_KEY) : null;
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return [];
  } catch (err) {
    console.warn('[Telemetry] Échec de lecture du journal local:', err);
    return [];
  }
}

/**
 * Enregistre une nouvelle requête dans le journal de télémétrie.
 */
export function logAIRequest(
  entry: Omit<AITelemetryLog, 'id' | 'timestamp'>,
): AITelemetryLog {
  const sanitizedError = entry.error ? sanitizeErrorMessage(entry.error) : undefined;

  let estimatedCostUsd = entry.estimatedCostUsd;
  if (estimatedCostUsd === undefined && entry.tokens) {
    const cost = calculateEstimatedCost(
      entry.providerId,
      entry.modelId,
      entry.tokens.promptTokens,
      entry.tokens.completionTokens,
    );
    if (cost !== null) {
      estimatedCostUsd = cost;
    }
  }

  const newLog: AITelemetryLog = {
    ...entry,
    id: generateUUID(),
    timestamp: new Date().toISOString(),
    error: sanitizedError,
    estimatedCostUsd,
  };

  try {
    const existing = getTelemetryLogs();
    const updated = [newLog, ...existing].slice(0, MAX_LOGS_RETENTION);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(TELEMETRY_STORAGE_KEY, JSON.stringify(updated));
    }
  } catch (err) {
    console.warn('[Telemetry] Impossible d’écrire dans le localStorage:', err);
  }

  return newLog;
}

/**
 * Génère un résumé statistique complet et fiable à partir des journaux réels.
 */
export function getUsageSummary(logs: AITelemetryLog[] = getTelemetryLogs()): AIUsageSummary {
  if (!logs || logs.length === 0) {
    return {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageLatencyMs: 0,
      totalTokens: 0,
      promptTokens: 0,
      completionTokens: 0,
      estimatedTotalCostUsd: null,
      hasRealData: false,
      byProvider: {},
      byModel: {},
    };
  }

  let successfulRequests = 0;
  let failedRequests = 0;
  let totalLatency = 0;
  let promptTokens = 0;
  let completionTokens = 0;
  let totalCostSum: number | null = null;
  let realNonSimulatedCount = 0;

  const byProvider: Record<string, number> = {};
  const byModel: Record<string, number> = {};

  for (const log of logs) {
    if (log.success) {
      successfulRequests++;
    } else {
      failedRequests++;
    }

    if (!log.isSimulated) {
      realNonSimulatedCount++;
    }

    totalLatency += log.durationMs;

    if (log.tokens) {
      promptTokens += log.tokens.promptTokens ?? 0;
      completionTokens += log.tokens.completionTokens ?? 0;
    }

    if (log.estimatedCostUsd !== undefined && log.estimatedCostUsd !== null) {
      totalCostSum = (totalCostSum ?? 0) + log.estimatedCostUsd;
    }

    byProvider[log.providerId] = (byProvider[log.providerId] ?? 0) + 1;
    byModel[log.modelId] = (byModel[log.modelId] ?? 0) + 1;
  }

  const averageLatencyMs =
    logs.length > 0 ? Math.round(totalLatency / logs.length) : 0;

  return {
    totalRequests: logs.length,
    successfulRequests,
    failedRequests,
    averageLatencyMs,
    totalTokens: promptTokens + completionTokens,
    promptTokens,
    completionTokens,
    estimatedTotalCostUsd: totalCostSum !== null ? Number(totalCostSum.toFixed(4)) : null,
    hasRealData: realNonSimulatedCount > 0,
    byProvider,
    byModel,
  };
}

/**
 * Réinitialise complètement le journal local de télémétrie.
 */
export function clearTelemetryLogs(): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(TELEMETRY_STORAGE_KEY);
    }
  } catch (err) {
    console.warn('[Telemetry] Échec de suppression des journaux:', err);
  }
}
