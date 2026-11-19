/**
 * tests/test-generator.test.ts
 *
 * Tests unitaires pour le Générateur Automatique de Tests (#6).
 */

import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  generateProjectTestSuite,
  generateComponentTest,
  generatePlaywrightSmokeTest,
  injectTestSuiteIntoProject,
} from '../src/services/lab/testGeneratorService.ts';
import type { LabProject, LabFile } from '../src/types/lab.ts';

describe('NEXUS LAB — Générateur de Tests Automatiques 1-Clic (#6)', () => {
  const dummyComponentFile: LabFile = {
    id: 'comp-1',
    name: 'Navbar.tsx',
    path: 'src/components/Navbar.tsx',
    content: `import React from 'react';
export function Navbar() {
  return (
    <header>
      <h1>CyberNexus</h1>
      <button onClick={() => alert('clic')}>Action</button>
      <input type="text" placeholder="Recherche..." />
      <img src="logo.png" alt="Logo de l'application" />
    </header>
  );
}`,
    language: 'typescript',
  };

  const dummyProject: LabProject = {
    id: 'proj-test-1',
    name: 'Application Test Suite',
    description: 'Projet de test pour génération',
    templateId: 'react-vite',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    files: [
      dummyComponentFile,
      {
        id: 'pkg-1',
        name: 'package.json',
        path: 'package.json',
        content: JSON.stringify({ name: 'test-app', scripts: { dev: 'vite' } }),
        language: 'json',
      },
    ],
  };

  test('generateComponentTest génère une suite de tests Vitest complète', () => {
    const testFile = generateComponentTest(dummyComponentFile);

    assert.strictEqual(testFile.name, 'Navbar.test.tsx');
    assert.ok(testFile.content.includes("import { describe, it, expect, beforeEach } from 'vitest';"));
    assert.ok(testFile.content.includes("import { Navbar } from './Navbar';"));
    assert.ok(testFile.content.includes('se monte sans erreur'));
    assert.ok(testFile.content.includes('réagit aux interactions utilisateur'));
    assert.ok(testFile.content.includes('accessibilité'));
  });

  test('generatePlaywrightSmokeTest génère un smoke test E2E valide', () => {
    const smokeTest = generatePlaywrightSmokeTest(dummyProject);

    assert.strictEqual(smokeTest.name, 'app.smoke.spec.ts');
    assert.ok(smokeTest.content.includes("import { test, expect } from '@playwright/test';"));
    assert.ok(smokeTest.content.includes("await page.goto('/');"));
    assert.ok(smokeTest.content.includes('root'));
  });

  test('generateProjectTestSuite analyse et agrège tous les composants et fichiers de config', () => {
    const suite = generateProjectTestSuite(dummyProject);

    assert.ok(suite.files.length >= 3); // Component test + E2E test + vitest.config.ts
    assert.ok(suite.summary.componentsCount >= 1);
    assert.ok(suite.summary.testCasesCount >= 4);

    const vitestConfig = suite.files.find((f) => f.path === 'vitest.config.ts');
    assert.ok(vitestConfig);
    assert.ok(vitestConfig.content.includes('defineConfig'));
  });

  test('injectTestSuiteIntoProject ajoute les fichiers et met à jour package.json', () => {
    const suite = generateProjectTestSuite(dummyProject);
    const updated = injectTestSuiteIntoProject(dummyProject, suite);

    assert.ok(updated.files.some((f) => f.path.includes('.test.tsx')));
    assert.ok(updated.files.some((f) => f.path === 'vitest.config.ts'));

    const pkg = updated.files.find((f) => f.path === 'package.json');
    assert.ok(pkg);
    const parsedPkg = JSON.parse(pkg.content);
    assert.strictEqual(parsedPkg.scripts.test, 'vitest run');
    assert.ok(parsedPkg.devDependencies.vitest);
  });
});
