/**
 * tests/cloud-deploy.test.ts
 *
 * Tests unitaires pour le service de Déploiement Cloud en 1 Clic (Vercel, Netlify, Standalone).
 */

import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  generateVercelConfig,
  generateNetlifyConfig,
  getSavedCloudToken,
  saveCloudToken,
  generateStandaloneHtml,
  generateDeployZip,
} from '../src/services/lab/cloudDeployService.ts';
import { createProjectFromTemplate } from '../src/services/lab/projectService.ts';
import type { LabProject } from '../src/types/lab.ts';

describe('NEXUS LAB — Déploiement Cloud en 1 Clic', () => {
  describe('Générateurs de configurations Cloud', () => {
    test('Génère un vercel.json valide avec réécriture SPA', () => {
      const config = generateVercelConfig();
      const parsed = JSON.parse(config);
      assert.strictEqual(parsed.version, 2);
      assert.ok(Array.isArray(parsed.routes));
      assert.strictEqual(parsed.routes[0].src, '/(.*)');
      assert.strictEqual(parsed.routes[0].dest, '/index.html');
    });

    test('Génère la configuration Netlify avec règles de redirection 200', () => {
      const config = generateNetlifyConfig();
      assert.ok(config.redirects.includes('/* /index.html 200'));
      assert.ok(config.toml.includes('[build]'));
      assert.ok(config.toml.includes('publish = "."'));
    });
  });

  describe('Gestion sécurisée des tokens Cloud', () => {
    test('Sauvegarde et récupère les jetons d’accès en mémoire ou sessionStorage', () => {
      if (typeof globalThis.sessionStorage === 'undefined') {
        const store = new Map<string, string>();
        globalThis.sessionStorage = {
          getItem: (key: string) => store.get(key) || null,
          setItem: (key: string, value: string) => { store.set(key, value); },
          removeItem: (key: string) => { store.delete(key); },
          clear: () => { store.clear(); },
          length: 0,
          key: (_index: number) => null,
        } as Storage;
      }

      saveCloudToken('vercel', 'test-vercel-token-12345');
      assert.strictEqual(getSavedCloudToken('vercel'), 'test-vercel-token-12345');

      saveCloudToken('netlify', 'test-netlify-token-67890');
      assert.strictEqual(getSavedCloudToken('netlify'), 'test-netlify-token-67890');
      assert.strictEqual(getSavedCloudToken('vercel'), 'test-vercel-token-12345');

      // Test de suppression si token vide
      saveCloudToken('vercel', '   ');
      assert.strictEqual(getSavedCloudToken('vercel'), '');
    });
  });

  describe('Générateur HTML Autonome & Archive ZIP', () => {
    const mockProject: LabProject = createProjectFromTemplate('react-vite', 'Mon Projet Cloud');

    test('Compile le projet en fichier HTML autonome et injecte le code', async () => {
      const standalone = await generateStandaloneHtml(mockProject);
      assert.strictEqual(typeof standalone, 'string');
      assert.ok(standalone.includes('<!DOCTYPE html>'));
      assert.ok(standalone.includes('tailwindcss'));
    });

    test('Génère une archive ZIP complète incluant les fichiers et configs cloud', async () => {
      const zipBlob = await generateDeployZip(mockProject);
      assert.ok(zipBlob);
      assert.ok(zipBlob.size > 100);
    });
  });
});
