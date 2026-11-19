/**
 * tests/auto-heal.test.ts
 *
 * Tests unitaires pour le moteur d'Auto-Heal et diagnostic automatique d'erreurs runtime.
 */

import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import { identifyFailingFile, diagnoseAndHealError } from '../src/services/lab/autoHealService.ts';
import type { LabProject } from '../src/types/lab.ts';

describe('NEXUS LAB — Auto-Heal & Diagnostic Runtime Autonome', () => {
  const dummyProject: LabProject = {
    id: 'proj-heal-1',
    name: 'Application Test',
    description: 'Projet de test pour Auto-Heal',
    templateId: 'react-vite',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    files: [
      {
        id: 'f1',
        name: 'index.html',
        path: 'index.html',
        content: '<!DOCTYPE html><html><body><div id="root"></div></body></html>',
        language: 'html',
      },
      {
        id: 'f2',
        name: 'App.tsx',
        path: 'src/App.tsx',
        content: 'import React from "react";\nexport function App() { return <div>Hello World</div>; }',
        language: 'typescript',
      },
      {
        id: 'f3',
        name: 'Navbar.tsx',
        path: 'src/components/Navbar.tsx',
        content: 'export function Navbar() { return <nav>Menu</nav>; }',
        language: 'typescript',
      },
    ],
  };

  test('Identifie le fichier source incriminé à partir de la stack trace', () => {
    const errorWithStack = {
      message: 'Cannot read properties of undefined (reading "map")',
      stack: 'TypeError: at Navbar (src/components/Navbar.tsx:12:15)\n at App (src/App.tsx:8:10)',
    };

    const target = identifyFailingFile(dummyProject, errorWithStack);
    assert.strictEqual(target.name, 'Navbar.tsx', 'Doit cibler le composant Navbar.tsx mentionné en premier');
  });

  test('Identifie le fichier source incriminé à partir du nom de fichier fourni', () => {
    const errorWithFilename = {
      message: 'SyntaxError: Unexpected token',
      filename: 'https://preview.local/src/App.tsx?t=12345',
      lineno: 24,
    };

    const target = identifyFailingFile(dummyProject, errorWithFilename);
    assert.strictEqual(target.name, 'App.tsx', 'Doit cibler App.tsx');
  });

  test('Repli gracieux sur le composant principal si la stack ne mentionne aucun fichier', () => {
    const genericError = {
      message: 'Unknown runtime crash in root container',
    };

    const target = identifyFailingFile(dummyProject, genericError);
    assert.strictEqual(target.path, 'src/App.tsx', 'Doit se replier sur le composant principal App.tsx');
  });

  test('diagnoseAndHealError génère une proposition de correction structurée', async () => {
    const errorToHeal = {
      message: 'ReferenceError: userData is not defined',
      filename: 'src/App.tsx',
      lineno: 14,
    };

    const result = await diagnoseAndHealError(dummyProject, errorToHeal);
    assert.ok(result.targetFile, 'Le fichier cible doit être présent');
    assert.strictEqual(result.targetFile.name, 'App.tsx');
    assert.ok(result.proposal, 'Une proposition DevProposal doit être produite');
    assert.ok(result.proposal.suggestedCode.length > 0, 'Le code suggéré ne doit pas être vide');
    assert.ok(result.proposal.explanation.includes('Auto-Heal'), 'L’explication doit mentionner Auto-Heal');
  });
});
