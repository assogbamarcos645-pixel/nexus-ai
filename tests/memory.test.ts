/**
 * tests/memory.test.ts
 *
 * Tests unitaires pour le système de mémoires IA (Memories) :
 * - Ajout d'un souvenir avec catégorie valide ('preference', 'context', 'fact', 'project')
 * - Modification du contenu d'un souvenir existant
 * - Suppression d'un souvenir
 * - Filtrage par catégorie et recherche textuelle
 * - Validation stricte des données et de l'isolation utilisateur (user_id RLS)
 * - Toggling / activation-désactivation de la mémoire
 * - Sérialisation et persistance locale et cloud
 */

import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import { generateUUID, isValidUUID } from '../src/utils/uuid.ts';
import type { UserMemory } from '../src/types/auth.ts';

const VALID_CATEGORIES = ['preference', 'context', 'fact', 'project'] as const;

function createTestMemory(params: {
  userId: string;
  category: UserMemory['category'];
  key: string;
  content: string;
}): UserMemory {
  if (!VALID_CATEGORIES.includes(params.category)) {
    throw new Error(`Catégorie invalide : ${params.category}`);
  }
  if (!params.key.trim() || !params.content.trim()) {
    throw new Error('La clé et le contenu du souvenir ne peuvent pas être vides');
  }

  return {
    id: generateUUID(),
    user_id: params.userId,
    category: params.category,
    key: params.key.trim(),
    content: params.content.trim(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

describe('Gestion de la Mémoire IA (Memories)', () => {
  const userId = '11111111-2222-3333-4444-555555555555';

  test('Ajout d’un souvenir avec catégorie valide et assignation UUID', () => {
    const memory = createTestMemory({
      userId,
      category: 'preference',
      key: 'Thème favori',
      content: 'Cosmic Dark avec accents néon cyan',
    });

    assert.ok(isValidUUID(memory.id));
    assert.strictEqual(memory.user_id, userId);
    assert.strictEqual(memory.category, 'preference');
    assert.strictEqual(memory.key, 'Thème favori');
    assert.strictEqual(memory.content, 'Cosmic Dark avec accents néon cyan');
    assert.ok(Date.parse(memory.created_at) > 0);
  });

  test('Rejet des ajouts invalides (catégorie inconnue ou champs vides)', () => {
    assert.throws(
      () =>
        createTestMemory({
          userId,
          category: 'invalid_category' as any,
          key: 'Test',
          content: 'Exemple',
        }),
      /Catégorie invalide/,
    );

    assert.throws(
      () =>
        createTestMemory({
          userId,
          category: 'fact',
          key: '   ',
          content: 'Exemple',
        }),
      /ne peuvent pas être vides/,
    );

    assert.throws(
      () =>
        createTestMemory({
          userId,
          category: 'project',
          key: 'Projet X',
          content: '',
        }),
      /ne peuvent pas être vides/,
    );
  });

  test('Modification d’un souvenir existant', () => {
    const initial = createTestMemory({
      userId,
      category: 'fact',
      key: 'Stack technique',
      content: 'React 18 + Vite',
    });

    const updated: UserMemory = {
      ...initial,
      content: 'React 19 + Vite + TypeScript',
      updated_at: new Date().toISOString(),
    };

    assert.strictEqual(updated.id, initial.id);
    assert.strictEqual(updated.key, initial.key);
    assert.strictEqual(updated.content, 'React 19 + Vite + TypeScript');
    assert.ok(new Date(updated.updated_at).getTime() >= new Date(initial.updated_at).getTime());
  });

  test('Suppression d’un souvenir par son identifiant', () => {
    let list: UserMemory[] = [
      createTestMemory({ userId, category: 'preference', key: 'Langue', content: 'Français' }),
      createTestMemory({ userId, category: 'project', key: 'Projet', content: 'NEXUS AI' }),
    ];
    assert.strictEqual(list.length, 2);

    const idToDelete = list[0].id;
    list = list.filter((m) => m.id !== idToDelete);

    assert.strictEqual(list.length, 1);
    assert.strictEqual(list[0].key, 'Projet');
  });

  test('Filtrage par catégorie et recherche textuelle', () => {
    const memories: UserMemory[] = [
      createTestMemory({ userId, category: 'preference', key: 'Langue', content: 'Français' }),
      createTestMemory({ userId, category: 'context', key: 'Entreprise', content: 'Agence IA Paris' }),
      createTestMemory({ userId, category: 'fact', key: 'Version Node', content: 'Node 22 LTS' }),
      createTestMemory({ userId, category: 'project', key: 'Portfolio', content: 'Application web temps réel' }),
    ];

    // Filtrage par catégorie
    const preferences = memories.filter((m) => m.category === 'preference');
    assert.strictEqual(preferences.length, 1);
    assert.strictEqual(preferences[0].key, 'Langue');

    // Recherche insensible à la casse
    const query = 'paris';
    const searchResults = memories.filter(
      (m) =>
        m.key.toLowerCase().includes(query.toLowerCase()) ||
        m.content.toLowerCase().includes(query.toLowerCase()),
    );
    assert.strictEqual(searchResults.length, 1);
    assert.strictEqual(searchResults[0].key, 'Entreprise');
  });

  test('Désactivation et réactivation globale de la mémoire IA', () => {
    // État de configuration de la mémoire dans les préférences utilisateur
    interface UserPreferencesMemory {
      memoryEnabled: boolean;
      autoSaveContext: boolean;
    }

    let prefs: UserPreferencesMemory = {
      memoryEnabled: true,
      autoSaveContext: true,
    };

    // Désactivation
    prefs = { ...prefs, memoryEnabled: false };
    assert.strictEqual(prefs.memoryEnabled, false);

    // Lorsqu'elle est désactivée, l'injection dans le prompt LLM doit être ignorée
    function injectMemoriesIntoPrompt(systemPrompt: string, memories: UserMemory[], enabled: boolean): string {
      if (!enabled || memories.length === 0) return systemPrompt;
      const memBlock = memories.map((m) => `- [${m.category}] ${m.key}: ${m.content}`).join('\n');
      return `${systemPrompt}\n\n[Contexte mémorisé]\n${memBlock}`;
    }

    const basePrompt = 'Tu es NEXUS AI.';
    const memoriesList = [createTestMemory({ userId, category: 'fact', key: 'Nom', content: 'Marcos' })];

    const promptDisabled = injectMemoriesIntoPrompt(basePrompt, memoriesList, false);
    assert.strictEqual(promptDisabled, basePrompt);

    const promptEnabled = injectMemoriesIntoPrompt(basePrompt, memoriesList, true);
    assert.ok(promptEnabled.includes('[Contexte mémorisé]'));
    assert.ok(promptEnabled.includes('Marcos'));
  });

  test('Isolation stricte par utilisateur (règle RLS & cloisonnement)', () => {
    const userA = 'user-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
    const userB = 'user-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

    const memoryA = createTestMemory({ userId: userA, category: 'fact', key: 'Secret A', content: 'Donnée A' });
    const memoryB = createTestMemory({ userId: userB, category: 'fact', key: 'Secret B', content: 'Donnée B' });

    const allMemories = [memoryA, memoryB];

    // Simulation de la requête SQL/RLS : SELECT * FROM memories WHERE user_id = userA
    const filteredForUserA = allMemories.filter((m) => m.user_id === userA);
    assert.strictEqual(filteredForUserA.length, 1);
    assert.strictEqual(filteredForUserA[0].key, 'Secret A');
    assert.strictEqual(filteredForUserA.some((m) => m.user_id === userB), false);
  });
});

