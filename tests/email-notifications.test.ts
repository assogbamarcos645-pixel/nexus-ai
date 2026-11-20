/**
 * tests/email-notifications.test.ts
 *
 * Tests unitaires pour le service d'envoi et de génération d'e-mails
 * de release pour NEXUS AI.
 */

import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  generateReleaseNotificationHtml,
  getAllUserEmails,
  exportUsersCsv,
  sendBroadcastEmail,
} from '../src/services/admin/adminEmailNotificationService.ts';

describe('NEXUS AI — Service de Notification Externe par E-mail', () => {
  test('Génère un template HTML valide avec la version, logo et boutons CTA', () => {
    const html = generateReleaseNotificationHtml({
      userName: 'Jean Dupont',
      version: '0.4.0',
      appUrl: 'https://nexus-ai.local',
    });

    assert.ok(html.includes('NEXUS AI • v0.4.0'));
    assert.ok(html.includes('Jean Dupont'));
    assert.ok(html.includes('WebContainers'));
    assert.ok(html.includes('Swarm 2.0'));
    assert.ok(html.includes('Codebase Search'));
    assert.ok(html.includes('href="https://nexus-ai.local"'));
  });

  test('getAllUserEmails extrait la liste des adresses utilisateurs gérées', () => {
    const emails = getAllUserEmails();
    assert.ok(Array.isArray(emails));
    assert.ok(emails.length >= 1);
    assert.ok(emails.some((e) => e.includes('@')));
  });

  test('exportUsersCsv produit un format tabulaire CSV conforme avec en-têtes', () => {
    const csv = exportUsersCsv();
    assert.ok(csv.startsWith('Email,Nom,Role,Statut,DerniereConnexion'));
    assert.ok(csv.includes('@'));
  });

  test('sendBroadcastEmail simule l’envoi avec succès en l’absence de clé API externe', async () => {
    const res = await sendBroadcastEmail({
      subject: 'Test Notification v0.4.0',
    });

    assert.strictEqual(res.success, true);
    assert.strictEqual(res.simulated, true);
    assert.ok(res.totalSent >= 1);
    assert.strictEqual(res.totalFailed, 0);
  });
});
