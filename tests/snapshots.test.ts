/**
 * tests/snapshots.test.ts
 *
 * Tests unitaires pour le moteur d'Instantanés & Rollback de projet (NEXUS LAB).
 */

import test, { describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  loadSnapshots,
  saveSnapshots,
  createSnapshot,
  deleteSnapshot,
  clearAllSnapshots,
} from '../src/services/lab/snapshotService.ts';
import type { LabFile } from '../src/types/lab.ts';

// Mock localStorage minimal en mémoire pour environnement Node.js
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
}

// Assigner au global pour les tests
// @ts-expect-error Mock minimal
globalThis.window = globalThis;
// @ts-expect-error Mock minimal
globalThis.localStorage = new LocalStorageMock();

describe('NEXUS LAB — Gestionnaire d’Instantanés & Rollback (Snapshots)', () => {
  const projectId = 'test-proj-snapshots-1';

  const dummyFiles: LabFile[] = [
    {
      id: 'f-1',
      name: 'index.html',
      path: 'index.html',
      content: '<h1>Hello World</h1>',
      language: 'html',
      isModified: false,
    },
    {
      id: 'f-2',
      name: 'styles.css',
      path: 'styles.css',
      content: 'body { margin: 0; }',
      language: 'css',
      isModified: false,
    },
  ];

  beforeEach(() => {
    clearAllSnapshots(projectId);
  });

  test('Initialise avec une liste vide pour un nouveau projet', () => {
    const list = loadSnapshots(projectId);
    assert.deepStrictEqual(list, []);
  });

  test('Crée un instantané et isole les fichiers par clonage profond', () => {
    const snap = createSnapshot(
      projectId,
      dummyFiles,
      'Avant modification NEXUS DEV',
      'ai-dev',
      'Test snapshot',
    );

    assert.ok(snap.id, 'L’identifiant unique doit être présent');
    assert.strictEqual(snap.projectId, projectId);
    assert.strictEqual(snap.label, 'Avant modification NEXUS DEV');
    assert.strictEqual(snap.author, 'ai-dev');
    assert.strictEqual(snap.fileCount, 2);
    assert.strictEqual(snap.files.length, 2);

    // Vérifier le clonage profond : modifier dummyFiles ne doit pas corrompre le snapshot
    dummyFiles[0].content = '<h1>Muté après snapshot</h1>';

    const loaded = loadSnapshots(projectId);
    assert.strictEqual(loaded.length, 1);
    assert.strictEqual(loaded[0].files[0].content, '<h1>Hello World</h1>');
  });

  test('Gère les suppressions ciblées d’instantanés', () => {
    const s1 = createSnapshot(projectId, dummyFiles, 'Snapshot 1', 'user');
    const s2 = createSnapshot(projectId, dummyFiles, 'Snapshot 2', 'auto');

    let current = loadSnapshots(projectId);
    assert.strictEqual(current.length, 2);

    current = deleteSnapshot(projectId, s1.id);
    assert.strictEqual(current.length, 1);
    assert.strictEqual(current[0].id, s2.id);
  });

  test('Plafonne le nombre maximal d’instantanés à 30 par projet', () => {
    for (let i = 1; i <= 35; i++) {
      createSnapshot(projectId, dummyFiles, `Snapshot ${i}`, 'auto');
    }

    const all = loadSnapshots(projectId);
    assert.strictEqual(all.length, 30, 'Le nombre d’instantanés doit être borné à 30');
    assert.strictEqual(all[0].label, 'Snapshot 35', 'Le plus récent doit être en tête de liste');
  });
});
