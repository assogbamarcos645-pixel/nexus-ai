/**
 * tests/automation.test.ts
 *
 * Tests unitaires pour le moteur d'Automatisation Externe (NEXUS AI) :
 * - Taches programmees (Cron / Timers)
 * - Webhooks sortants (Slack, Discord, Supabase, GitHub Actions)
 * - Declencheurs Webhook entrants
 * - Journal d'audit et persistance
 */

import test, { describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  getAutomationConfig,
  saveAutomationConfig,
  executeScheduledTask,
  sendOutgoingWebhook,
  handleIncomingWebhook,
  clearAutomationLogs,
} from '../src/services/automation/externalAutomationService.ts';

// Mock localStorage en mémoire pour l'environnement Node.js
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

  clear(): void {
    this.store = {};
  }

  get length(): number {
    return Object.keys(this.store).length;
  }

  key(index: number): string | null {
    return Object.keys(this.store)[index] ?? null;
  }
}

// @ts-expect-error Mock minimal
globalThis.window = globalThis;
// @ts-expect-error Mock minimal
globalThis.localStorage = new LocalStorageMock();
// @ts-expect-error Mock dispatchEvent
globalThis.window.dispatchEvent = () => true;

describe('NEXUS AI — Moteur d’Automatisation Externe & Webhooks', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('Fournit une configuration par defaut avec taches cron et webhooks', () => {
    const config = getAutomationConfig();
    assert.ok(Array.isArray(config.tasks), 'Les taches doivent etre un tableau');
    assert.ok(config.tasks.length >= 3, 'Doit contenir au moins 3 taches par defaut');
    assert.ok(
      config.tasks.some((t) => t.id === 'task-tech-watch'),
      'Doit inclure la veille technologique nocturne',
    );
    assert.ok(
      config.tasks.some((t) => t.id === 'task-db-backup'),
      'Doit inclure la sauvegarde de base de donnees',
    );
    assert.ok(
      config.tasks.some((t) => t.id === 'task-system-health'),
      'Doit inclure l audit de sante systeme',
    );

    assert.ok(Array.isArray(config.outgoingWebhooks), 'Les webhooks sortants doivent etre un tableau');
    assert.ok(config.outgoingWebhooks.length >= 3, 'Doit contenir au moins 3 webhooks sortants');

    assert.ok(Array.isArray(config.incomingEndpoints), 'Les endpoints entrants doivent etre un tableau');
    assert.ok(config.incomingEndpoints.length >= 3, 'Doit contenir au moins 3 endpoints entrants');
  });

  test('Execute la routine de veille technologique nocturne avec log d audit', async () => {
    const log = await executeScheduledTask('task-tech-watch');
    assert.equal(log.status, 'success');
    assert.equal(log.type, 'cron');
    assert.ok(log.message.includes('veille technologique'), 'Le message doit confirmer la veille');

    const config = getAutomationConfig();
    const task = config.tasks.find((t) => t.id === 'task-tech-watch');
    assert.ok(task?.lastRun, 'lastRun doit etre renseigne');
    assert.ok(task?.nextRun, 'nextRun doit etre calcule');
    assert.equal(task?.lastStatus, 'success');
    assert.ok(config.logs.length > 0, 'Le log doit etre ajoute au journal');
  });

  test('Execute la sauvegarde automatique et verifie les donnees locales', async () => {
    localStorage.setItem('nexus_lab_projects_v2', JSON.stringify([{ id: 'p1', name: 'Demo' }]));
    localStorage.setItem('nexus_lab_snapshots_p1', JSON.stringify([{ id: 's1' }]));

    const log = await executeScheduledTask('task-db-backup');
    assert.equal(log.status, 'success');
    assert.ok(log.message.includes('Sauvegarde reussie'), 'Le message doit confirmer la sauvegarde');

    const config = getAutomationConfig();
    const task = config.tasks.find((t) => t.id === 'task-db-backup');
    assert.equal(task?.lastStatus, 'success');
  });

  test('Envoie des notifications via webhooks sortants actifs', async () => {
    const initialConfig = getAutomationConfig();
    initialConfig.outgoingWebhooks[0].enabled = true;
    saveAutomationConfig(initialConfig);

    const logs = await sendOutgoingWebhook('on_build_complete', {
      projectName: 'Mon Projet Test',
      deployUrl: 'https://mon-projet.vercel.app',
    });

    assert.ok(logs.length >= 1, 'Au moins un webhook doit etre declenche');
    assert.equal(logs[0].status, 'success');
    assert.equal(logs[0].type, 'outgoing_webhook');

    const config = getAutomationConfig();
    assert.ok(config.outgoingWebhooks[0].lastTriggered, 'lastTriggered doit etre enregistre');
  });

  test('Reçoit et traite un webhook entrant GitHub Actions', async () => {
    const res = await handleIncomingWebhook('endpoint-gh-push', {
      branch: 'main',
      sha: 'a1b2c3d',
      status: 'success',
    });

    assert.equal(res.success, true);
    assert.ok(res.actionTaken.includes('pipeline CI/CD'));
    assert.equal(res.log.status, 'success');
    assert.equal(res.log.type, 'incoming_webhook');

    const config = getAutomationConfig();
    const ep = config.incomingEndpoints.find((e) => e.id === 'endpoint-gh-push');
    assert.equal(ep?.callCount, 1);
    assert.ok(ep?.lastReceived);
  });

  test('Rejette un webhook entrant inexistant', async () => {
    const res = await handleIncomingWebhook('endpoint-inconnu-xyz', {});
    assert.equal(res.success, false);
    assert.equal(res.log.status, 'failure');
  });

  test('Efface le journal d audit lorsque demande', async () => {
    await executeScheduledTask('task-system-health');
    let config = getAutomationConfig();
    assert.ok(config.logs.length > 0, 'Des logs doivent etre presents');

    clearAutomationLogs();
    config = getAutomationConfig();
    assert.equal(config.logs.length, 0, 'Les logs doivent etre vides apres purge');
  });
});
