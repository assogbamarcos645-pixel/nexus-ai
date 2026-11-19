/**
 * tests/admin-security.test.ts
 *
 * Tests unitaires pour l'Espace Super-Admin & Securite Biometrique (NEXUS AI) :
 * - Verification d'eligibilite par adresse e-mail administrateur
 * - Hachage et controle du code PIN maitre (SHA-256)
 * - Session ephemere et auto-verrouillage
 * - Mode maintenance et Killswitch d'urgence
 * - Gestion des roles utilisateurs et journal d'audit
 */

import test, { describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  getAdminConfig,
  saveAdminConfig,
  isEmailAuthorizedAdmin,
  setMasterAdminPin,
  verifyMasterAdminPin,
  unlockWithFullVerification,
  isVaultUnlocked,
  unlockVaultSession,
  lockVaultSession,
  isMaintenanceModeActive,
  toggleMaintenanceMode,
  triggerEmergencyKillswitch,
  getManagedUsers,
  updateManagedUserRole,
  toggleManagedUserStatus,
  getAdminAuditLogs,
  clearAdminAuditLogs,
} from '../src/services/admin/adminSecurityService.ts';

// Mock localStorage et sessionStorage en mémoire pour l'environnement Node.js
class StorageMock {
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
}

// @ts-expect-error Mock minimal
globalThis.window = globalThis;
// @ts-expect-error Mock minimal
globalThis.localStorage = new StorageMock();
// @ts-expect-error Mock minimal
globalThis.sessionStorage = new StorageMock();
// @ts-expect-error Mock dispatchEvent
globalThis.window.dispatchEvent = () => true;

describe('NEXUS AI — Espace Super-Admin & Securite Biometrique', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  test('Reconnait l e-mail du Super-Administrateur et rejette les autres', () => {
    const defaultEmail = 'marcosassogba645@gmail.com';
    assert.equal(isEmailAuthorizedAdmin(defaultEmail), true);
    assert.equal(isEmailAuthorizedAdmin('MARCOSASSOGBA645@GMAIL.COM'), true);
    assert.equal(isEmailAuthorizedAdmin('hacker@unknown.com'), false);
    assert.equal(isEmailAuthorizedAdmin(''), false);
  });

  test('Configure et verifie le code PIN maitre avec hachage', async () => {
    const success = await setMasterAdminPin('987654');
    assert.equal(success, true);

    const isValid = await verifyMasterAdminPin('987654');
    assert.equal(isValid, true);

    const isWrong = await verifyMasterAdminPin('000000');
    assert.equal(isWrong, false);

    const isShort = await setMasterAdminPin('12');
    assert.equal(isShort, false);
  });

  test('Gere le cycle de session du coffre-fort (Verrouille / Deverrouille)', () => {
    assert.equal(isVaultUnlocked(), false);

    unlockVaultSession();
    assert.equal(isVaultUnlocked(), true);

    lockVaultSession();
    assert.equal(isVaultUnlocked(), false);
  });

  test('Execute la verification triple facteur et gere les rejets', async () => {
    await setMasterAdminPin('123456');

    // 1. Rejet par e-mail inconnu
    const failEmail = await unlockWithFullVerification('inconnu@test.com', '123456');
    assert.equal(failEmail.success, false);
    assert.ok(failEmail.error?.includes('e-mail'));

    // 2. Rejet par mauvais PIN
    const failPin = await unlockWithFullVerification('marcosassogba645@gmail.com', '999999');
    assert.equal(failPin.success, false);
    assert.ok(failPin.error?.includes('PIN'));

    // 3. Succes avec e-mail et PIN valides
    const ok = await unlockWithFullVerification('marcosassogba645@gmail.com', '123456');
    assert.equal(ok.success, true);
    assert.equal(isVaultUnlocked(), true);
  });

  test('Active et desactive le mode maintenance globale', () => {
    assert.equal(isMaintenanceModeActive(), false);

    toggleMaintenanceMode(true, 'Maintenance en cours pour mise a jour.');
    assert.equal(isMaintenanceModeActive(), true);

    const config = getAdminConfig();
    assert.equal(config.maintenanceMode, true);
    assert.ok(config.maintenanceNotice?.includes('mise a jour'));

    toggleMaintenanceMode(false);
    assert.equal(isMaintenanceModeActive(), false);
  });

  test('Declenche le Killswitch d urgence avec verrouillage total', () => {
    unlockVaultSession();
    assert.equal(isVaultUnlocked(), true);

    triggerEmergencyKillswitch();
    assert.equal(isVaultUnlocked(), false);
    assert.equal(isMaintenanceModeActive(), true);
  });

  test('Gere les utilisateurs, attributions de roles et statuts', () => {
    const users = getManagedUsers();
    assert.ok(users.length >= 2, 'Doit contenir les utilisateurs par defaut');

    const guestUser = users.find((u) => u.id === 'user-demo-guest');
    assert.ok(guestUser);
    assert.equal(guestUser?.role, 'user');

    updateManagedUserRole('user-demo-guest', 'admin');
    const updatedUsers = getManagedUsers();
    const updatedGuest = updatedUsers.find((u) => u.id === 'user-demo-guest');
    assert.equal(updatedGuest?.role, 'admin');

    toggleManagedUserStatus('user-demo-guest');
    const suspendedUsers = getManagedUsers();
    const suspendedGuest = suspendedUsers.find((u) => u.id === 'user-demo-guest');
    assert.equal(suspendedGuest?.status, 'suspended');
  });

  test('Enregistre et purge les journaux d audit de securite', () => {
    clearAdminAuditLogs();
    assert.equal(getAdminAuditLogs().length, 0);

    toggleMaintenanceMode(true);
    const logs = getAdminAuditLogs();
    assert.ok(logs.length >= 1);
    assert.equal(logs[0].action, 'maintenance_toggle');
    assert.equal(logs[0].success, true);

    clearAdminAuditLogs();
    assert.equal(getAdminAuditLogs().length, 0);
  });
});
