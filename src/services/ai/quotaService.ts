/**
 * src/services/ai/quotaService.ts
 *
 * Service de calcul et de suivi des quotas de jetons (Token Allowance) pour NEXUS AI.
 * Calcule l'utilisation quotidienne des tokens à partir de la télémétrie locale
 * et détermine le volume restant selon le statut de l'utilisateur (anonyme / connecté).
 */

import { getTelemetryLogs } from './aiTelemetryService.ts';

export interface QuotaStatus {
  usedTokens: number;
  maxTokens: number;
  remainingTokens: number;
  percentUsed: number;
  requestsCount: number;
  isExceeded: boolean;
  resetsAt: string;
  tier: 'free' | 'cloud-pro';
}

export const DAILY_QUOTA_ANONYMOUS = 50_000; // 50k tokens / jour
export const DAILY_QUOTA_AUTHENTICATED = 500_000; // 500k tokens / jour

/**
 * Calcule le statut du quota pour la journée en cours (depuis minuit).
 */
export function getDailyQuotaStatus(isAuthenticated = false): QuotaStatus {
  const maxTokens = isAuthenticated ? DAILY_QUOTA_AUTHENTICATED : DAILY_QUOTA_ANONYMOUS;
  const tier = isAuthenticated ? 'cloud-pro' : 'free';

  // Calcul du début de journée locale (00:00:00)
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString();

  let usedTokens = 0;
  let requestsCount = 0;

  try {
    const logs = getTelemetryLogs();
    for (const log of logs) {
      const logTime = new Date(log.timestamp).getTime();
      if (logTime >= startOfDay) {
        requestsCount++;
        if (log.tokens) {
          const prompt = log.tokens.promptTokens || 0;
          const comp = log.tokens.completionTokens || 0;
          usedTokens += prompt + comp;
        }
      }
    }
  } catch (err) {
    console.warn('[QuotaService] Erreur calcul du quota:', err);
  }

  const remainingTokens = Math.max(0, maxTokens - usedTokens);
  const percentUsed = Math.min(100, Math.round((usedTokens / maxTokens) * 100));
  const isExceeded = usedTokens >= maxTokens;

  return {
    usedTokens,
    maxTokens,
    remainingTokens,
    percentUsed,
    requestsCount,
    isExceeded,
    resetsAt: endOfDay,
    tier,
  };
}

/**
 * Formate un nombre de jetons avec notation abrégée (ex: 42.5k, 1.2M).
 */
export function formatTokenCount(num: number): string {
  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(1)}M`;
  }
  if (num >= 1_000) {
    return `${(num / 1_000).toFixed(0)}k`;
  }
  return String(num);
}
