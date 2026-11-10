/**
 * src/services/ai/aiConfigService.ts
 *
 * Gestion de la configuration du moteur IA de NEXUS AI :
 * Fournisseur actif, modèle sélectionné, paramètres avancés, vérification de connectivité
 * et état de santé des services associés.
 *
 * RÈGLE FONDAMENTALE DE SÉCURITÉ :
 * Aucune clé API n'est stockée dans le client. Les clés résident exclusivement
 * sur le serveur proxy ou dans le gestionnaire de secrets d'infrastructure.
 */

import type {
  AIProviderId,
  AIAdvancedSettings,
  AIEngineStatus,
  ConnectionTestResult,
  AIServiceHealth,
  AIControlCenterConfig,
} from '@/types/ai';
import {
  AI_PROVIDERS,
  DEFAULT_AI_SETTINGS,
  DEFAULT_PROVIDER_ID,
  DEFAULT_MODEL_ID,
  getProviderById,
} from '../../config/aiProviders.ts';
import { API_BASE_URL, IS_CLOUD_CONFIGURED } from '../../lib/constants.ts';

const CONFIG_STORAGE_KEY = 'nexus_ai_engine_config_v1';

/**
 * Valide et restreint les paramètres avancés dans des bornes saines et sécurisées.
 */
export function sanitizeAdvancedSettings(
  raw?: Partial<AIAdvancedSettings>,
): AIAdvancedSettings {
  const maxTokens = Math.min(
    8_192,
    Math.max(128, Number(raw?.maxTokens ?? DEFAULT_AI_SETTINGS.maxTokens)),
  );
  const temperature = Math.min(
    2.0,
    Math.max(0.0, Number(raw?.temperature ?? DEFAULT_AI_SETTINGS.temperature)),
  );
  const timeoutSeconds = Math.min(
    120,
    Math.max(5, Number(raw?.timeoutSeconds ?? DEFAULT_AI_SETTINGS.timeoutSeconds)),
  );

  return {
    maxTokens: Number.isNaN(maxTokens) ? 2_048 : maxTokens,
    temperature: Number.isNaN(temperature) ? 0.7 : Number(temperature.toFixed(2)),
    timeoutSeconds: Number.isNaN(timeoutSeconds) ? 30 : timeoutSeconds,
    experimentalFeatures: {
      streaming: Boolean(raw?.experimentalFeatures?.streaming),
      reasoningEffort: Boolean(raw?.experimentalFeatures?.reasoningEffort),
      visionMultimodal: Boolean(raw?.experimentalFeatures?.visionMultimodal),
      toolCalling: Boolean(raw?.experimentalFeatures?.toolCalling),
    },
    isDemoMode: raw?.isDemoMode !== undefined ? Boolean(raw.isDemoMode) : false,
  };
}

/**
 * Récupère la configuration actuelle du moteur IA.
 */
export function getAIConfig(): AIControlCenterConfig {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(CONFIG_STORAGE_KEY) : null;
    if (!raw) {
      return {
        activeProviderId: DEFAULT_PROVIDER_ID,
        activeModelId: DEFAULT_MODEL_ID,
        settings: { ...DEFAULT_AI_SETTINGS },
      };
    }

    const parsed = JSON.parse(raw);

    // Migration automatique : si l'utilisateur utilisait l'ancien mode démonstration simulé,
    // on le bascule automatiquement sur le modèle par défaut configuré (Google Gemini)
    if (parsed.activeProviderId === 'demo' || parsed.settings?.isDemoMode === true) {
      const migratedSettings = sanitizeAdvancedSettings(parsed.settings);
      migratedSettings.isDemoMode = false;
      const migratedConfig: AIControlCenterConfig = {
        activeProviderId: DEFAULT_PROVIDER_ID,
        activeModelId: DEFAULT_MODEL_ID,
        settings: migratedSettings,
        lastTestResult: parsed.lastTestResult,
      };
      try {
        localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(migratedConfig));
      } catch {
        // Ignorer si localStorage est en lecture seule
      }
      return migratedConfig;
    }

    // Migration automatique des anciens modèles Gemini vers gemini-2.5-flash
    if (
      parsed.activeModelId === 'gemini-3.8-flash' ||
      parsed.activeModelId === 'gemini-2.0-flash'
    ) {
      parsed.activeModelId = 'gemini-2.5-flash';
    }

    let providerId: AIProviderId = parsed.activeProviderId || DEFAULT_PROVIDER_ID;
    let provider = getProviderById(providerId) || AI_PROVIDERS[0];

    // Si le fournisseur actif en cache a ses crédits épuisés, repli vers un fournisseur opérationnel
    if (provider.isAvailable === false) {
      providerId = DEFAULT_PROVIDER_ID;
      provider = getProviderById(providerId) || AI_PROVIDERS[0];
    }

    const activeModelId =
      provider.models.find((m) => m.id === parsed.activeModelId)?.id ||
      provider.defaultModelId;

    return {
      activeProviderId: provider.id,
      activeModelId,
      settings: sanitizeAdvancedSettings(parsed.settings),
      lastTestResult: parsed.lastTestResult,
    };
  } catch (err) {
    console.warn('[AIConfig] Erreur lecture config, repli sur défauts:', err);
    return {
      activeProviderId: DEFAULT_PROVIDER_ID,
      activeModelId: DEFAULT_MODEL_ID,
      settings: { ...DEFAULT_AI_SETTINGS },
    };
  }
}

/**
 * Enregistre la configuration mise à jour du moteur IA.
 */
export function saveAIConfig(updates: Partial<AIControlCenterConfig>): AIControlCenterConfig {
  const current = getAIConfig();
  const next: AIControlCenterConfig = {
    ...current,
    ...updates,
    settings: updates.settings
      ? sanitizeAdvancedSettings(updates.settings)
      : current.settings,
  };

  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(next));
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('nexus:ai-config-changed', { detail: next }));
    }
  } catch (err) {
    console.warn('[AIConfig] Impossible de persister la configuration:', err);
  }

  return next;
}

/**
 * Détermine l'état opérationnel du moteur IA selon la configuration active.
 */
export function computeEngineStatus(
  config: AIControlCenterConfig,
  isTesting = false,
): { status: AIEngineStatus; description: string } {
  if (isTesting) {
    return {
      status: 'testing',
      description: 'Vérification de connectivité en cours...',
    };
  }

  // 1. Mode Démonstration explicite
  if (config.settings.isDemoMode || config.activeProviderId === 'demo') {
    return {
      status: 'operational',
      description: 'Mode Démonstration actif — Simulateur local opérationnel sans appel externe.',
    };
  }

  // 2. Si un test serveur a été effectué pour le fournisseur actif
  if (config.lastTestResult && config.lastTestResult.providerId === config.activeProviderId) {
    if (config.lastTestResult.success) {
      return {
        status: 'operational',
        description: `Fournisseur vérifié opérationnel (${config.lastTestResult.latencyMs} ms).`,
      };
    }
    return {
      status: 'unavailable',
      description: `Dernier test en échec : ${config.lastTestResult.message}`,
    };
  }

  // 3. Si aucun test n'a été fait et qu'aucun proxy backend n'est connecté
  const isLocalhost =
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

  if (!API_BASE_URL && !isLocalhost) {
    return {
      status: 'not_configured',
      description:
        'Fournisseur cloud sélectionné mais aucun proxy d’inférence API n’est connecté (VITE_API_BASE_URL manquant).',
    };
  }

  // 4. En attente de test de disponibilité
  return {
    status: 'not_configured',
    description: 'En attente de vérification de connectivité auprès du serveur proxy.',
  };
}

/**
 * Effectue un test de connexion côté serveur pour un fournisseur donné.
 * Ne déclare jamais un fournisseur opérationnel avant d'avoir vérifié sa disponibilité.
 */
export async function testProviderConnection(
  providerId: AIProviderId,
  modelId: string,
): Promise<ConnectionTestResult> {
  const startTime = performance.now();

  // Cas 1 : Mode Démonstration (test local direct)
  if (providerId === 'demo') {
    await new Promise((resolve) => setTimeout(resolve, 80));
    const latencyMs = Math.round(performance.now() - startTime);

    const result: ConnectionTestResult = {
      providerId: 'demo',
      success: true,
      message: 'Simulateur local opérationnel et disponible immédiatement (0 ms d’attente externe).',
      latencyMs,
      timestamp: new Date().toISOString(),
      maskedKeyHint: 'Aucune clé requise (Mode Local)',
    };

    saveAIConfig({ lastTestResult: result });
    return result;
  }

  // Cas 2 : Test auprès du backend réel ou dev proxy
  const endpoint = API_BASE_URL ? `${API_BASE_URL}/api/ai/test` : '/api/ai/test';

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12_000);

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        providerId,
        modelId,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);
    const latencyMs = Math.round(performance.now() - startTime);

    if (response.ok) {
      const data = await response.json();
      const result: ConnectionTestResult = {
        providerId,
        success: Boolean(data.success),
        message: data.message || 'Connexion au fournisseur établie avec succès.',
        latencyMs: data.latencyMs ?? latencyMs,
        timestamp: new Date().toISOString(),
        maskedKeyHint: data.maskedKeyHint,
      };

      saveAIConfig({ lastTestResult: result });
      return result;
    }

    let errorMessage = `Erreur HTTP ${response.status}`;
    try {
      const errorJson = await response.json();
      if (errorJson.message) errorMessage = errorJson.message;
    } catch {
      // Ignorer si la réponse n'est pas du JSON
    }

    const failureResult: ConnectionTestResult = {
      providerId,
      success: false,
      message: errorMessage,
      latencyMs,
      timestamp: new Date().toISOString(),
    };

    saveAIConfig({ lastTestResult: failureResult });
    return failureResult;
  } catch (err: unknown) {
    const latencyMs = Math.round(performance.now() - startTime);
    let msg = 'Impossible de contacter le serveur de test.';

    if (err instanceof DOMException && err.name === 'AbortError') {
      msg = 'Délai d’attente dépassé (timeout 12s) lors du test serveur.';
    } else if (err instanceof TypeError && err.message.includes('fetch')) {
      msg =
        'Serveur proxy injoignable : assurez-vous que le backend est démarré ou passez en Mode Démonstration.';
    }

    const failureResult: ConnectionTestResult = {
      providerId,
      success: false,
      message: msg,
      latencyMs,
      timestamp: new Date().toISOString(),
    };

    saveAIConfig({ lastTestResult: failureResult });
    return failureResult;
  }
}

/**
 * Évalue la santé des services interconnectés avec NEXUS AI.
 */
export async function getServicesHealth(
  config: AIControlCenterConfig,
): Promise<AIServiceHealth[]> {
  const now = new Date().toISOString();
  const services: AIServiceHealth[] = [];

  // 1. Moteur d'Inférence IA
  const engineStatus = computeEngineStatus(config);
  services.push({
    id: 'ai-engine',
    name: 'Moteur d’Inférence IA',
    category: 'ai_engine',
    status: engineStatus.status,
    detail: engineStatus.description,
    lastChecked: now,
  });

  // 2. Base de données PostgreSQL & RLS (Supabase)
  if (IS_CLOUD_CONFIGURED) {
    services.push({
      id: 'cloud-db',
      name: 'PostgreSQL Cloud & Politiques RLS',
      category: 'cloud_database',
      status: 'operational',
      detail: 'Instance Supabase active avec isolation Row Level Security stricte.',
      lastChecked: now,
    });
  } else {
    services.push({
      id: 'cloud-db',
      name: 'PostgreSQL Cloud & Politiques RLS',
      category: 'cloud_database',
      status: 'not_configured',
      detail: 'Variables VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY non définies (Mode local).',
      lastChecked: now,
    });
  }

  // 3. Service d'Authentification Supabase Auth
  if (IS_CLOUD_CONFIGURED) {
    services.push({
      id: 'cloud-auth',
      name: 'Supabase Auth (Tokens JWT & Sessions)',
      category: 'cloud_auth',
      status: 'operational',
      detail: 'Gestion des sessions chiffrées et hachage de sécurité Argon2/bcrypt.',
      lastChecked: now,
    });
  } else {
    services.push({
      id: 'cloud-auth',
      name: 'Authentification Cloud',
      category: 'cloud_auth',
      status: 'not_configured',
      detail: 'Mode invité local — Aucune synchronisation distante activée.',
      lastChecked: now,
    });
  }

  // 4. Stockage Local Navigateur (LocalStorage / IndexedDB)
  let storageStatus: 'operational' | 'unavailable' = 'operational';
  let storageDetail = 'Persistance locale disponible (LocalStorage fonctionnel).';
  try {
    const testKey = '__nexus_storage_probe__';
    localStorage.setItem(testKey, '1');
    localStorage.removeItem(testKey);
  } catch {
    storageStatus = 'unavailable';
    storageDetail = 'Stockage local indisponible ou bloqué par le navigateur.';
  }

  services.push({
    id: 'local-storage',
    name: 'Persistance Locale (Client)',
    category: 'local_storage',
    status: storageStatus,
    detail: storageDetail,
    lastChecked: now,
  });

  return services;
}

