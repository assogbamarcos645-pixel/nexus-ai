/**
 * tests/ai-control-center.test.ts
 *
 * Tests unitaires pour le Centre de Contrôle IA de NEXUS AI :
 * Catalogue des fournisseurs, sanitisation des paramètres, assainissement des secrets,
 * métriques de télémétrie, calculs de coûts et gouvernance des états du moteur.
 */

import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  AI_PROVIDERS,
  DEFAULT_AI_SETTINGS,
  getProviderById,
  getModelById,
} from '../src/config/aiProviders.ts';
import {
  sanitizeAdvancedSettings,
  computeEngineStatus,
} from '../src/services/ai/aiConfigService.ts';
import {
  sanitizeErrorMessage,
  calculateEstimatedCost,
  getUsageSummary,
} from '../src/services/ai/aiTelemetryService.ts';
import type { AITelemetryLog, AIControlCenterConfig } from '../src/types/ai.ts';

describe('Centre de Contrôle IA — Catalogue des Fournisseurs', () => {
  test('Contient l’ensemble des fournisseurs requis', () => {
    const expectedIds = ['demo', 'gemini', 'openai', 'anthropic', 'mistral', 'groq', 'ollama'];
    const currentIds = AI_PROVIDERS.map((p) => p.id);

    for (const id of expectedIds) {
      assert.ok(currentIds.includes(id as any), `Le fournisseur ${id} doit être présent`);
    }
  });

  test('Chaque fournisseur possède des modèles valides et un modèle par défaut existant', () => {
    for (const provider of AI_PROVIDERS) {
      assert.ok(provider.models.length > 0, `${provider.name} doit avoir au moins un modèle`);
      const defaultModel = provider.models.find((m) => m.id === provider.defaultModelId);
      assert.ok(
        defaultModel !== undefined,
        `Le modèle par défaut "${provider.defaultModelId}" doit exister pour ${provider.name}`,
      );

      // Vérification des fenêtres de contexte et tokens de sortie
      for (const model of provider.models) {
        assert.ok(model.contextWindow > 0, `Fenêtre de contexte > 0 pour ${model.id}`);
        assert.ok(model.maxOutputTokens > 0, `Tokens de sortie > 0 pour ${model.id}`);
        assert.ok(model.capabilities.length > 0, `Capacités définies pour ${model.id}`);

        if (model.pricing) {
          assert.ok(model.pricing.inputPerMillionTokens >= 0);
          assert.ok(model.pricing.outputPerMillionTokens >= 0);
        }
      }
    }
  });

  test('getProviderById et getModelById retrouvent correctement les éléments', () => {
    const openai = getProviderById('openai');
    assert.ok(openai);
    assert.strictEqual(openai?.name, 'OpenAI');

    const gpt4o = getModelById('openai', 'gpt-4o');
    assert.ok(gpt4o);
    assert.strictEqual(gpt4o?.name, 'GPT-4o');

    const unknown = getProviderById('inconnu_xyz');
    assert.strictEqual(unknown, undefined);
  });
});

describe('Centre de Contrôle IA — Paramètres Avancés & Validation', () => {
  test('Plafonne et valide maxTokens dans les bornes autorisées [128, 8192]', () => {
    assert.strictEqual(sanitizeAdvancedSettings({ maxTokens: 50 }).maxTokens, 128);
    assert.strictEqual(sanitizeAdvancedSettings({ maxTokens: 20000 }).maxTokens, 8192);
    assert.strictEqual(sanitizeAdvancedSettings({ maxTokens: 4096 }).maxTokens, 4096);
    assert.strictEqual(sanitizeAdvancedSettings({ maxTokens: Number.NaN }).maxTokens, 2048);
  });

  test('Restreint la température dans les bornes [0.0, 2.0]', () => {
    assert.strictEqual(sanitizeAdvancedSettings({ temperature: -0.5 }).temperature, 0.0);
    assert.strictEqual(sanitizeAdvancedSettings({ temperature: 3.5 }).temperature, 2.0);
    assert.strictEqual(sanitizeAdvancedSettings({ temperature: 0.85 }).temperature, 0.85);
  });

  test('Restreint les délais d’attente (timeouts) dans les bornes [5, 120]', () => {
    assert.strictEqual(sanitizeAdvancedSettings({ timeoutSeconds: 2 }).timeoutSeconds, 5);
    assert.strictEqual(sanitizeAdvancedSettings({ timeoutSeconds: 300 }).timeoutSeconds, 120);
    assert.strictEqual(sanitizeAdvancedSettings({ timeoutSeconds: 45 }).timeoutSeconds, 45);
  });

  test('Préserve et valide les fonctionnalités expérimentales et le mode démo', () => {
    const settings = sanitizeAdvancedSettings({
      isDemoMode: false,
      experimentalFeatures: {
        streaming: true,
        reasoningEffort: false,
        visionMultimodal: true,
        toolCalling: false,
      },
    });

    assert.strictEqual(settings.isDemoMode, false);
    assert.strictEqual(settings.experimentalFeatures.streaming, true);
    assert.strictEqual(settings.experimentalFeatures.visionMultimodal, true);
    assert.strictEqual(settings.experimentalFeatures.reasoningEffort, false);
    assert.strictEqual(settings.experimentalFeatures.toolCalling, false);
  });
});

describe('Centre de Contrôle IA — Sécurité & Assainissement des Secrets', () => {
  test('Masque systématiquement les clés secrètes OpenAI (sk-...)', () => {
    const raw = 'Échec de requête avec la clé sk-abcdef12345678901234 sur l’API';
    const sanitized = sanitizeErrorMessage(raw);
    assert.ok(!sanitized.includes('sk-abcdef12345678901234'));
    assert.ok(sanitized.includes('sk-***[MASQUÉ]***'));
  });

  test('Masque systématiquement les clés Google Gemini (AIza...) et Groq (gsk_...)', () => {
    const rawGemini = 'Error 400: Key AIzaSyD123456789012345 is invalid';
    assert.ok(!sanitizeErrorMessage(rawGemini).includes('AIzaSyD123456789012345'));

    const rawGroq = 'Auth failed: token gsk_999888777666555444';
    assert.ok(!sanitizeErrorMessage(rawGroq).includes('gsk_999888777666555444'));
  });

  test('Masque les en-têtes Authorization Bearer', () => {
    const raw = 'Unauthorized: Bearer secret_jwt_token_123456789';
    const sanitized = sanitizeErrorMessage(raw);
    assert.ok(!sanitized.includes('secret_jwt_token_123456789'));
    assert.ok(sanitized.includes('Bearer ***[MASQUÉ]***'));
  });

  test('Tronque les erreurs anormalement longues', () => {
    const longError = 'x'.repeat(450);
    const sanitized = sanitizeErrorMessage(longError);
    assert.ok(sanitized.length <= 305);
    assert.ok(sanitized.endsWith('...'));
  });
});

describe('Centre de Contrôle IA — Métriques d’Utilisation & Coûts', () => {
  test('Calcule le coût exact pour GPT-4o selon la tarification officielle', () => {
    // GPT-4o: 2.50$ / M entrée, 10.00$ / M sortie
    // 1 000 000 tokens entrée = 2.50$, 1 000 000 tokens sortie = 10.00$
    const cost = calculateEstimatedCost('openai', 'gpt-4o', 1_000_000, 1_000_000);
    assert.strictEqual(cost, 12.5);

    // 1 000 entrée, 500 sortie
    // input = 1000/1M * 2.5 = 0.0025, output = 500/1M * 10 = 0.005 => 0.0075$
    const smallCost = calculateEstimatedCost('openai', 'gpt-4o', 1_000, 500);
    assert.strictEqual(smallCost, 0.0075);
  });

  test('Renvoie 0$ pour les modèles gratuits ou locaux (Ollama & Démo)', () => {
    const demoCost = calculateEstimatedCost('demo', 'nexus-simulated-echo', 500, 500);
    assert.strictEqual(demoCost, 0);

    const ollamaCost = calculateEstimatedCost('ollama', 'llama3.2', 10_000, 5_000);
    assert.strictEqual(ollamaCost, 0);
  });

  test('Présente un état vide explicite sans inventer de fausses statistiques', () => {
    const summary = getUsageSummary([]);
    assert.strictEqual(summary.totalRequests, 0);
    assert.strictEqual(summary.successfulRequests, 0);
    assert.strictEqual(summary.failedRequests, 0);
    assert.strictEqual(summary.averageLatencyMs, 0);
    assert.strictEqual(summary.totalTokens, 0);
    assert.strictEqual(summary.estimatedTotalCostUsd, null);
    assert.strictEqual(summary.hasRealData, false);
  });

  test('Agrège fidèlement les requêtes réelles et distingue la simulation', () => {
    const mockLogs: AITelemetryLog[] = [
      {
        id: '1',
        timestamp: '2026-10-30T20:00:00.000Z',
        providerId: 'demo',
        modelId: 'nexus-simulated-echo',
        agentId: 'general',
        durationMs: 150,
        success: true,
        isSimulated: true,
        tokens: { promptTokens: 10, completionTokens: 20, totalTokens: 30 },
      },
      {
        id: '2',
        timestamp: '2026-10-30T20:05:00.000Z',
        providerId: 'openai',
        modelId: 'gpt-4o-mini',
        agentId: 'coder',
        durationMs: 350,
        success: true,
        isSimulated: false,
        tokens: { promptTokens: 100, completionTokens: 50, totalTokens: 150 },
        estimatedCostUsd: 0.000045,
      },
      {
        id: '3',
        timestamp: '2026-10-30T20:10:00.000Z',
        providerId: 'openai',
        modelId: 'gpt-4o-mini',
        agentId: 'coder',
        durationMs: 400,
        success: false,
        isSimulated: false,
        error: 'HTTP 429: Rate limit exceeded',
      },
    ];

    const summary = getUsageSummary(mockLogs);
    assert.strictEqual(summary.totalRequests, 3);
    assert.strictEqual(summary.successfulRequests, 2);
    assert.strictEqual(summary.failedRequests, 1);
    assert.strictEqual(summary.averageLatencyMs, 300); // (150+350+400)/3 = 300
    assert.strictEqual(summary.promptTokens, 110);
    assert.strictEqual(summary.completionTokens, 70);
    assert.strictEqual(summary.totalTokens, 180);
    assert.strictEqual(summary.hasRealData, true);
    assert.strictEqual(summary.byProvider['openai'], 2);
    assert.strictEqual(summary.byProvider['demo'], 1);
  });
});

describe('Centre de Contrôle IA — Détermination des États du Moteur', () => {
  test('Identifie le mode simulation / démo comme opérationnel', () => {
    const config: AIControlCenterConfig = {
      activeProviderId: 'demo',
      activeModelId: 'nexus-simulated-echo',
      settings: { ...DEFAULT_AI_SETTINGS, isDemoMode: true },
    };

    const status = computeEngineStatus(config, false);
    assert.strictEqual(status.status, 'operational');
  });

  test('Passe en état "testing" quand une vérification est en cours', () => {
    const config: AIControlCenterConfig = {
      activeProviderId: 'openai',
      activeModelId: 'gpt-4o',
      settings: { ...DEFAULT_AI_SETTINGS, isDemoMode: false },
    };

    const status = computeEngineStatus(config, true);
    assert.strictEqual(status.status, 'testing');
  });

  test('Reflète l’échec du dernier test de connexion serveur comme indisponible', () => {
    const config: AIControlCenterConfig = {
      activeProviderId: 'openai',
      activeModelId: 'gpt-4o',
      settings: { ...DEFAULT_AI_SETTINGS, isDemoMode: false },
      lastTestResult: {
        providerId: 'openai',
        success: false,
        message: 'Clé OPENAI_API_KEY non définie sur le serveur.',
        latencyMs: 12,
        timestamp: new Date().toISOString(),
      },
    };

    const status = computeEngineStatus(config, false);
    assert.strictEqual(status.status, 'unavailable');
    assert.ok(status.description.includes('Dernier test en échec'));
  });
});

describe('Sécurité de Production & Politiques de Déploiement', () => {
  test('Les fichiers d’hébergement public contiennent les en-têtes HTTP de sécurité obligatoires', async () => {
    const fs = await import('node:fs/promises');
    const path = await import('node:path');

    const headersPath = path.resolve(process.cwd(), 'public/_headers');
    const headersContent = await fs.readFile(headersPath, 'utf-8');

    assert.ok(headersContent.includes('X-Content-Type-Options: nosniff'), 'Doit inclure nosniff');
    assert.ok(headersContent.includes('X-Frame-Options: SAMEORIGIN'), 'Doit inclure SAMEORIGIN');
    assert.ok(headersContent.includes('Content-Security-Policy:'), 'Doit définir une CSP');
    assert.ok(headersContent.includes("object-src 'none'"), 'Doit interdire les objets plugins');
    assert.ok(!headersContent.includes("'unsafe-eval'"), 'Ne doit pas autoriser unsafe-eval');
  });

  test('La configuration robots.txt interdit l’indexation des routes et jetons sensibles', async () => {
    const fs = await import('node:fs/promises');
    const path = await import('node:path');

    const robotsPath = path.resolve(process.cwd(), 'public/robots.txt');
    const robotsContent = await fs.readFile(robotsPath, 'utf-8');

    assert.ok(robotsContent.includes('Disallow: /api/'), 'Doit protéger les API de l’indexation');
    assert.ok(robotsContent.includes('Disallow: /*?*access_token='), 'Doit protéger les jetons');
    assert.ok(robotsContent.includes('Disallow: /*?*type=recovery'), 'Doit protéger les liens de récupération');
  });
});


