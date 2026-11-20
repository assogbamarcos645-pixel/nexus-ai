/**
 * tests/codebase-search.test.ts
 *
 * Tests unitaires pour le moteur de Recherche Sémantique,
 * RAG Vectoriel et Indexation de Codebase (NEXUS LAB).
 */

import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  tokenizeText,
  chunkFile,
  searchCodebase,
  buildAugmentedContext,
} from '../src/services/lab/codebaseSearchService.ts';
import type { LabProject, LabFile } from '../src/types/lab.ts';

describe('NEXUS LAB — Recherche Sémantique & Codebase Search', () => {
  test('Tokenise et normalise le texte technique (camelCase, snake_case et stop words)', () => {
    const tokens = tokenizeText('function handleUserAuth_Submit(authToken: string) { return null; }');
    assert.ok(tokens.includes('user'));
    assert.ok(tokens.includes('auth'));
    assert.ok(tokens.includes('submit'));
    assert.ok(tokens.includes('token'));
    // Les stop words 'return' ou 'null' sont filtrés
    assert.ok(!tokens.includes('null'));
  });

  test('Découpe un fichier court en un seul chunk de code', () => {
    const file: LabFile = {
      id: 'f-1',
      name: 'types.ts',
      path: 'src/types.ts',
      language: 'typescript',
      content: 'export interface User { id: string; name: string; }',
      isModified: false,
    };

    const chunks = chunkFile(file);
    assert.strictEqual(chunks.length, 1);
    assert.strictEqual(chunks[0].filePath, 'src/types.ts');
    assert.ok(chunks[0].keywords.includes('user'));
  });

  test('Découpe un fichier plus dense en chunks modulaires', () => {
    const lines: string[] = [];
    for (let i = 0; i < 60; i++) {
      if (i === 10) lines.push('export function useAuthentication() {');
      else if (i === 35) lines.push('export function AuthProfileCard() {');
      else lines.push(`  const x_${i} = ${i};`);
    }

    const file: LabFile = {
      id: 'f-dense',
      name: 'auth.tsx',
      path: 'src/auth.tsx',
      language: 'typescript',
      content: lines.join('\n'),
      isModified: false,
    };

    const chunks = chunkFile(file);
    assert.ok(chunks.length >= 2, 'Doit segmenter en plusieurs chunks');
  });

  test('searchCodebase retrouve et classe les fichiers les plus pertinents', () => {
    const project: LabProject = {
      id: 'proj-search',
      name: 'E-Commerce App',
      description: 'App test',
      template: 'react-vite',
      createdAt: new Date(),
      updatedAt: new Date(),
      files: [
        {
          id: 'cart-file',
          name: 'CartService.ts',
          path: 'src/services/CartService.ts',
          language: 'typescript',
          content: `export function calculateTotal(cartItems: Array<{ price: number; quantity: number }>) {
  return cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
}`,
          isModified: false,
        },
        {
          id: 'auth-file',
          name: 'AuthService.ts',
          path: 'src/services/AuthService.ts',
          language: 'typescript',
          content: `export function loginUser(email: string, passwordHash: string) {
  return { success: true, token: 'jwt-xyz' };
}`,
          isModified: false,
        },
      ],
    };

    const results = searchCodebase(project, 'calculate total price for cart items');
    assert.ok(results.length > 0);
    assert.strictEqual(results[0].chunk.fileName, 'CartService.ts');
    assert.ok(results[0].score > 0);
  });

  test('buildAugmentedContext produit un extrait formaté pour injection LLM/Swarm', () => {
    const project: LabProject = {
      id: 'proj-rag',
      name: 'SaaS Platform',
      description: 'App test',
      template: 'react-vite',
      createdAt: new Date(),
      updatedAt: new Date(),
      files: [
        {
          id: 'btn-file',
          name: 'Button.tsx',
          path: 'src/components/Button.tsx',
          language: 'typescript',
          content: `export function PrimaryButton({ label, onClick }: { label: string; onClick: () => void }) {
  return <button onClick={onClick} className="btn-primary">{label}</button>;
}`,
          isModified: false,
        },
      ],
    };

    const context = buildAugmentedContext(project, 'PrimaryButton component', 1000);
    assert.ok(context.includes('Button.tsx'));
    assert.ok(context.includes('PrimaryButton'));
  });
});
