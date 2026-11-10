/**
 * tests/quota.test.ts
 *
 * Tests unitaires pour le moteur de Quotas et Suivi de Jetons (quotaService).
 */

import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  getDailyQuotaStatus,
  formatTokenCount,
  DAILY_QUOTA_ANONYMOUS,
  DAILY_QUOTA_AUTHENTICATED,
} from '../src/services/ai/quotaService.ts';

// Mock minimal localStorage pour les tests Node.js
class LocalStorageMock {
  private store: Record<string, string> = {};
  getItem(key: string): string | null {
    return this.store[key] ?? null;
  }
  setItem(key: string, value: string): void {
    this.store[key] = String(value);
  }
  removeItem(key: string): void {
    delete this.store[key];
  }
}

// @ts-expect-error Mock minimal
globalThis.window = globalThis;
// @ts-expect-error Mock minimal
globalThis.localStorage = new LocalStorageMock();

describe('Moteur de Quotas & Suivi des Jetons (quotaService)', () => {
  test('Attribue 50k tokens quotidiens pour un utilisateur non authentifié', () => {
    const quota = getDailyQuotaStatus(false);
    assert.strictEqual(quota.maxTokens, DAILY_QUOTA_ANONYMOUS);
    assert.strictEqual(quota.tier, 'free');
    assert.strictEqual(quota.isExceeded, false);
    assert.ok(quota.remainingTokens <= DAILY_QUOTA_ANONYMOUS);
    assert.ok(quota.resetsAt.length > 0);
  });

  test('Débloque 500k tokens quotidiens pour un utilisateur connecté', () => {
    const quota = getDailyQuotaStatus(true);
    assert.strictEqual(quota.maxTokens, DAILY_QUOTA_AUTHENTICATED);
    assert.strictEqual(quota.tier, 'cloud-pro');
    assert.strictEqual(quota.isExceeded, false);
  });

  test('Formate les volumes de jetons de manière lisible et concise', () => {
    assert.strictEqual(formatTokenCount(450), '450');
    assert.strictEqual(formatTokenCount(1200), '1k');
    assert.strictEqual(formatTokenCount(48500), '49k');
    assert.strictEqual(formatTokenCount(1500000), '1.5M');
  });
});
