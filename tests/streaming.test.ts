/**
 * tests/streaming.test.ts
 *
 * Tests unitaires pour le moteur de Streaming en direct mot à mot (SSE / Token-by-token).
 */

import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import { chat } from '../src/services/ai/aiService.ts';
import { requestDevAssistance } from '../src/services/lab/devService.ts';
import type { LabFile } from '../src/types/lab.ts';

describe('Moteur de Streaming en Direct (Token-by-token & SSE)', () => {
  test('Émet des fragments (chunks) successifs via le callback onChunk en mode chat', async () => {
    const receivedChunks: string[] = [];

    const response = await chat({
      message: 'Explique le fonctionnement du DOM en JavaScript',
      agentId: 'coder',
      providerId: 'demo',
      onChunk: (chunk) => {
        receivedChunks.push(chunk);
      },
    });

    assert.ok(response.content.length > 0, 'La réponse finale doit contenir du contenu');
    assert.ok(receivedChunks.length >= 2, 'Plusieurs fragments doivent être émis au fil de l’eau');
    assert.strictEqual(
      receivedChunks.join(''),
      response.content,
      'La concaténation de tous les fragments doit correspondre exactement au contenu final',
    );
  });

  test('Supporte l’interruption précoce via AbortSignal pendant le streaming', async () => {
    const abortController = new AbortController();
    const receivedChunks: string[] = [];

    const promise = chat(
      {
        message: 'Génère un long script d’analyse de données',
        agentId: 'general',
        providerId: 'demo',
        onChunk: (chunk) => {
          receivedChunks.push(chunk);
          // Avortement dès le premier fragment reçu
          abortController.abort();
        },
      },
      abortController.signal,
    );

    await assert.rejects(
      promise,
      (err: unknown) => {
        return err instanceof DOMException && err.name === 'AbortError';
      },
      'La requête en cours de streaming doit être rejetée avec AbortError',
    );
  });

  test('Transmet les fragments de streaming dans NEXUS DEV (requestDevAssistance)', async () => {
    const dummyFile: LabFile = {
      id: 'f-stream-1',
      name: 'Button.tsx',
      path: 'src/Button.tsx',
      content: 'export function Button() { return <button>Click</button>; }',
      language: 'typescript',
      isModified: false,
    };

    const chunks: string[] = [];
    const proposal = await requestDevAssistance({
      file: dummyFile,
      prompt: 'Ajoute une prop variant et un aria-label',
      onChunk: (chunk) => {
        chunks.push(chunk);
      },
    });

    assert.ok(proposal.explanation.length > 0);
    assert.ok(chunks.length > 0, 'NEXUS DEV doit relayer le streaming');
  });
});
