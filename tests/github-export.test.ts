/**
 * tests/github-export.test.ts
 *
 * Tests unitaires pour l'export direct vers GitHub (One-Click Push).
 */

import test, { describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  getSavedGitHubToken,
  saveGitHubToken,
  exportProjectToGitHub,
} from '../src/services/lab/githubExportService.ts';
import type { LabProject } from '../src/types/lab.ts';

// Mock localStorage minimal
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

describe('NEXUS LAB — Export Direct vers GitHub (githubExportService)', () => {
  const dummyProject: LabProject = {
    id: 'proj-gh-1',
    name: 'Mon Portfolio IA',
    template: 'html-css-js',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    files: [
      {
        id: 'f1',
        name: 'index.html',
        path: 'index.html',
        content: '<h1>Portfolio</h1>',
        language: 'html',
        isModified: false,
      },
    ],
  };

  beforeEach(() => {
    saveGitHubToken('');
  });

  test('Mémorise et restitue le token GitHub de manière sécurisée', () => {
    assert.strictEqual(getSavedGitHubToken(), '');
    saveGitHubToken('ghp_testToken123456');
    assert.strictEqual(getSavedGitHubToken(), 'ghp_testToken123456');
    saveGitHubToken('');
    assert.strictEqual(getSavedGitHubToken(), '');
  });

  test('Refuse l’export si le token est manquant', async () => {
    const result = await exportProjectToGitHub({
      token: '',
      repoName: 'mon-projet',
      project: dummyProject,
    });

    assert.strictEqual(result.success, false);
    assert.ok(result.error?.includes('manquant'));
  });

  test('Refuse l’export si le nom de dépôt devient vide après nettoyage', async () => {
    const result = await exportProjectToGitHub({
      token: 'ghp_validToken',
      repoName: '   ***???   ',
      project: dummyProject,
    });

    assert.strictEqual(result.success, false);
    assert.ok(result.error?.includes('invalide'));
  });

  test('Simule un export complet avec succès et retourne l’URL du dépôt', async () => {
    const originalFetch = globalThis.fetch;
    const progressSteps: string[] = [];

    // Mock fetch pour émuler l'API GitHub
    globalThis.fetch = async (url: string | URL | Request, init?: RequestInit): Promise<Response> => {
      const urlStr = String(url);

      if (urlStr.includes('/user/repos')) {
        return new Response(
          JSON.stringify({
            full_name: 'octocat/mon-portfolio-ia',
            html_url: 'https://github.com/octocat/mon-portfolio-ia',
          }),
          { status: 201, headers: { 'Content-Type': 'application/json' } },
        );
      }

      if (urlStr.endsWith('/user')) {
        return new Response(
          JSON.stringify({ login: 'octocat' }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        );
      }

      if (urlStr.includes('/contents/')) {
        return new Response(
          JSON.stringify({ content: { sha: 'sha123' } }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        );
      }

      return new Response('Not found', { status: 404 });
    };

    try {
      const result = await exportProjectToGitHub({
        token: 'ghp_validMockToken',
        repoName: 'mon-portfolio-ia',
        description: 'Portfolio moderne',
        project: dummyProject,
        onProgress: (step) => progressSteps.push(step),
      });

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.repoFullName, 'octocat/mon-portfolio-ia');
      assert.strictEqual(result.repoUrl, 'https://github.com/octocat/mon-portfolio-ia');
      assert.ok(progressSteps.length >= 3, 'Plusieurs étapes de progression doivent être émises');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
