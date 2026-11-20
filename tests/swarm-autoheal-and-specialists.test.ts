/**
 * tests/swarm-autoheal-and-specialists.test.ts
 *
 * Tests unitaires pour les spécialistes modulaires du Swarm 2.0,
 * la recherche RAG et la boucle d'Auto-Heal (NEXUS LAB).
 */

import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  SWARM_SPECIALISTS,
  runSwarmSession,
  runSwarmAutoHeal,
} from '../src/services/lab/swarmService.ts';
import type { LabProject } from '../src/types/lab.ts';

describe('Multi-Agents Swarm 2.0 — Spécialistes Étendus & Modulaires', () => {
  test('Le catalogue contient les nouveaux spécialistes : database, security et devops', () => {
    assert.ok(SWARM_SPECIALISTS.database, "L'Architecte Données doit être défini");
    assert.ok(SWARM_SPECIALISTS.security, "L'Auditeur Sécurité doit être défini");
    assert.ok(SWARM_SPECIALISTS.devops, "L'Ingénieur DevOps doit être défini");

    assert.strictEqual(SWARM_SPECIALISTS.database.name, "L'Architecte Données");
    assert.ok(SWARM_SPECIALISTS.database.tagline.includes('Supabase'));

    assert.strictEqual(SWARM_SPECIALISTS.security.name, "L'Auditeur Sécurité");
    assert.ok(SWARM_SPECIALISTS.security.tagline.includes('Cybersécurité'));

    assert.strictEqual(SWARM_SPECIALISTS.devops.name, "L'Ingénieur DevOps");
    assert.ok(SWARM_SPECIALISTS.devops.tagline.includes('CI/CD'));
  });

  test('Permet de restreindre ou personnaliser les spécialistes participant au Swarm', async () => {
    const states: any[] = [];
    const finalState = await runSwarmSession({
      taskPrompt: 'Créer un contrat d’interface pour un profil utilisateur',
      specialists: ['architect'], // Uniquement l'architecte
      stepDelayMs: 5,
      onUpdate: (st) => states.push(st),
    });

    assert.strictEqual(finalState.status, 'converged');
    assert.strictEqual(finalState.messages.length, 1);
    assert.strictEqual(finalState.messages[0].specialistRole, 'architect');
  });

  test('runSwarmAutoHeal diagnostique et répare automatiquement les erreurs de code', async () => {
    const project: LabProject = {
      id: 'proj-autoheal',
      name: 'Test Project',
      description: 'App test',
      template: 'react-vite',
      createdAt: new Date(),
      updatedAt: new Date(),
      files: [
        {
          id: 'app-tsx',
          name: 'App.tsx',
          path: 'src/App.tsx',
          language: 'typescript',
          content: '<div class="container"><label for="email">Email</label></div>',
          isModified: false,
        },
      ],
    };

    const healResult = await runSwarmAutoHeal({
      project,
      issues: [
        {
          filePath: 'src/App.tsx',
          message: 'Utilisation de "class=" au lieu de "className="',
          severity: 'error',
          source: 'lint',
          line: 1,
        },
      ],
      stepDelayMs: 5,
      onUpdate: () => {},
    });

    assert.strictEqual(healResult.success, true);
    assert.strictEqual(healResult.fixedFilePath, 'src/App.tsx');
    assert.ok(healResult.repairedCode.includes('className="container"'));
    assert.ok(healResult.repairedCode.includes('htmlFor="email"'));
  });
});
