/**
 * tests/swarm.test.ts
 *
 * Tests unitaires pour le moteur Multi-Agents « Swarm » (Intelligence Collective).
 */

import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import { SWARM_SPECIALISTS, runSwarmSession } from '../src/services/lab/swarmService.ts';
import type { SwarmSessionState } from '../src/types/swarm.ts';
import type { LabFile } from '../src/types/lab.ts';

describe('Multi-Agents Swarm — Trio de Spécialistes', () => {
  test('Le catalogue contient strictement les 3 spécialistes attendus', () => {
    assert.ok(SWARM_SPECIALISTS.architect, "L'Architecte doit être défini");
    assert.ok(SWARM_SPECIALISTS.frontend, 'Le Frontend UI doit être défini');
    assert.ok(SWARM_SPECIALISTS.qa, "L'Auditeur QA doit être défini");

    // L'Architecte (structure & API)
    assert.strictEqual(SWARM_SPECIALISTS.architect.name, "L'Architecte");
    assert.ok(SWARM_SPECIALISTS.architect.tagline.includes('API'));

    // Le Frontend UI (React & Tailwind)
    assert.strictEqual(SWARM_SPECIALISTS.frontend.name, 'Le Frontend UI');
    assert.ok(SWARM_SPECIALISTS.frontend.tagline.includes('React 19'));
    assert.ok(SWARM_SPECIALISTS.frontend.tagline.includes('Tailwind'));

    // L'Auditeur QA (tests & accessibilité)
    assert.strictEqual(SWARM_SPECIALISTS.qa.name, "L'Auditeur QA");
    assert.ok(SWARM_SPECIALISTS.qa.tagline.includes('Tests'));
    assert.ok(SWARM_SPECIALISTS.qa.tagline.includes('Accessibilité'));
  });
});

describe('Multi-Agents Swarm — Pipeline d’Échanges & Convergence', () => {
  test('Exécute le cycle complet des 3 spécialistes et atteint la convergence à 100%', async () => {
    const states: SwarmSessionState[] = [];
    const dummyFile: LabFile = {
      id: 'test-widget',
      name: 'AuthModal.tsx',
      path: 'src/AuthModal.tsx',
      content: '// code initial',
      language: 'typescript',
      isModified: false,
    };

    const finalState = await runSwarmSession({
      taskPrompt: 'Créer une modale d’authentification avec validation et focus trap',
      contextFile: dummyFile,
      stepDelayMs: 5, // Exécution rapide pour les tests unitaires
      onUpdate: (state) => {
        states.push({ ...state, messages: [...state.messages] });
      },
    });

    // 1. Progression et convergence
    assert.strictEqual(finalState.status, 'converged');
    assert.strictEqual(finalState.convergencePercent, 100);
    assert.strictEqual(finalState.messages.length, 3);

    // 2. Vérification des interventions séquentielles
    const [msgArch, msgFront, msgQa] = finalState.messages;
    assert.strictEqual(msgArch.specialistRole, 'architect');
    assert.strictEqual(msgArch.phase, 'conception');
    assert.ok(msgArch.codeArtifact?.code.includes('export interface'));

    assert.strictEqual(msgFront.specialistRole, 'frontend');
    assert.strictEqual(msgFront.phase, 'development');
    assert.ok(msgFront.codeArtifact?.code.includes('export function'));
    assert.ok(msgFront.codeArtifact?.code.includes('className='));

    assert.strictEqual(msgQa.specialistRole, 'qa');
    assert.strictEqual(msgQa.phase, 'audit');
    assert.ok(msgQa.codeArtifact?.code.includes('describe('));
    assert.ok(msgQa.codeArtifact?.code.includes('it('));

    // 3. Synthèse finale consolidée
    assert.ok(finalState.finalSynthesis !== null);
    assert.strictEqual(finalState.finalSynthesis.a11yCompliance.wcagLevel, 'AA');
    assert.ok(finalState.finalSynthesis.productionCode.length > 0);
    assert.ok(finalState.finalSynthesis.testsCode.length > 0);

    // 4. Flux en direct notifié à l'appelant
    assert.ok(states.length >= 4, "L'UI doit recevoir des mises à jour au fil des étapes");
  });

  test('Supporte l’interruption précoce via AbortSignal', async () => {
    const abortController = new AbortController();

    // Avortement immédiat
    abortController.abort();

    const state = await runSwarmSession({
      taskPrompt: 'Tâche interrompue',
      stepDelayMs: 50,
      signal: abortController.signal,
      onUpdate: () => {},
    });

    assert.strictEqual(state.status, 'stopped');
  });

  test('Injecte les sorties personnalisées lorsqu’un aiCaller est fourni', async () => {
    const customAiCalls: string[] = [];
    const customAiCaller = async (prompt: string) => {
      customAiCalls.push(prompt);
      return `Réponse IA personnalisée pour prompt #${customAiCalls.length}`;
    };

    const finalState = await runSwarmSession({
      taskPrompt: 'Créer un toggle switch accessible',
      stepDelayMs: 2,
      aiCaller: customAiCaller,
      onUpdate: () => {},
    });

    assert.strictEqual(finalState.status, 'converged');
    assert.strictEqual(customAiCalls.length, 3, 'Les 3 spécialistes doivent appeler aiCaller');
    assert.ok(finalState.messages[0].content.includes('Réponse IA personnalisée'));
    assert.ok(finalState.messages[1].content.includes('Réponse IA personnalisée'));
    assert.ok(finalState.messages[2].content.includes('Réponse IA personnalisée'));
  });
});
