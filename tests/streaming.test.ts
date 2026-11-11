/**
 * tests/streaming.test.ts
 *
 * Tests unitaires pour le moteur de streaming en direct (SSE / Token-by-token)
 * et la transmission rigoureuse de l'historique conversationnel au modèle réel.
 */

import test, { describe, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { chat } from '../src/services/ai/aiService.ts';
import { requestDevAssistance } from '../src/services/lab/devService.ts';
import type { LabFile } from '../src/types/lab.ts';
import type { ConversationTurn } from '../src/types/index.ts';

describe('Moteur de Streaming et Transmission d’Historique Réel', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  test('Transmet l’historique complet et reprend le sujet précédent sur "tu disais quoi ?"', async () => {
    let capturedUrl = '';
    let capturedBody: any = null;

    const history: ConversationTurn[] = [
      {
        role: 'user',
        content: 'Explique-moi l’architecture des microservices et l’usage de Docker.',
      },
      {
        role: 'assistant',
        content:
          'Une architecture microservices décompose une application en services autonomes empaquetés dans des conteneurs Docker pour garantir la portabilité et l’isolation.',
      },
    ];

    globalThis.fetch = (async (url: string | URL | Request, init?: RequestInit) => {
      capturedUrl = String(url);
      if (init?.body) {
        capturedBody = JSON.parse(String(init.body));
      }

      const encoder = new TextEncoder();
      const chunks = [
        'Je ',
        'parlais ',
        'de ',
        'l’architecture ',
        'microservices ',
        'et ',
        'de ',
        'Docker.',
      ];

      const stream = new ReadableStream({
        start(controller) {
          for (const chunk of chunks) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ chunk })}\n\n`));
          }
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        },
      });

      return new Response(stream, {
        status: 200,
        headers: {
          'Content-Type': 'text/event-stream; charset=utf-8',
        },
      });
    }) as typeof fetch;

    const receivedChunks: string[] = [];

    const response = await chat({
      message: 'tu disais quoi ?',
      agentId: 'coder',
      conversationHistory: history,
      onChunk: (chunk) => {
        receivedChunks.push(chunk);
      },
    });

    // 1. Vérification que l'appel part bien vers l'API et non un simulateur local
    assert.ok(
      capturedUrl.endsWith('/api/chat?stream=true'),
      `L'URL cible doit se terminer par /api/chat?stream=true (reçu: ${capturedUrl})`,
    );

    // 2. Vérification que tout l'historique est transmis au modèle
    assert.ok(capturedBody, 'Le corps de la requête doit être transmis');
    assert.strictEqual(capturedBody.message, 'tu disais quoi ?');
    assert.strictEqual(Array.isArray(capturedBody.conversationHistory), true);
    assert.strictEqual(capturedBody.conversationHistory.length, 2);
    assert.strictEqual(
      capturedBody.conversationHistory[0].content,
      'Explique-moi l’architecture des microservices et l’usage de Docker.',
    );
    assert.strictEqual(
      capturedBody.conversationHistory[1].role,
      'assistant',
    );

    // 3. Vérification du streaming mot à mot et du contenu réel
    assert.strictEqual(
      response.content,
      'Je parlais de l’architecture microservices et de Docker.',
    );
    assert.strictEqual(receivedChunks.join(''), response.content);
    assert.strictEqual(response.isSimulated, false);
    assert.strictEqual(
      response.content.includes("C'est un sujet très intéressant"),
      false,
      'Ne doit jamais contenir de phrase de secours générique',
    );
  });

  test('Émet des fragments (chunks) successifs via le callback onChunk en mode SSE', async () => {
    const streamTokens = ['Exploration ', 'du ', 'DOM ', 'en ', 'JavaScript.'];
    const encoder = new TextEncoder();

    globalThis.fetch = (async () => {
      const stream = new ReadableStream({
        start(controller) {
          for (const token of streamTokens) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ chunk: token })}\n\n`));
          }
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        },
      });

      return new Response(stream, {
        status: 200,
        headers: { 'Content-Type': 'text/event-stream' },
      });
    }) as typeof fetch;

    const receivedChunks: string[] = [];
    const response = await chat({
      message: 'Explique le fonctionnement du DOM en JavaScript',
      agentId: 'coder',
      onChunk: (chunk) => {
        receivedChunks.push(chunk);
      },
    });

    assert.ok(response.content.length > 0);
    assert.strictEqual(receivedChunks.length, streamTokens.length);
    assert.strictEqual(receivedChunks.join(''), response.content);
    assert.strictEqual(response.content, 'Exploration du DOM en JavaScript.');
    assert.strictEqual(response.isSimulated, false);
  });

  test('Renvoie une erreur explicite sans jamais inventer de fausse réponse en cas d’indisponibilité', async () => {
    globalThis.fetch = (async () => {
      return new Response(
        JSON.stringify({ message: 'Fournisseur d’IA indisponible (quota dépassé ou service hors-ligne).' }),
        {
          status: 503,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }) as typeof fetch;

    await assert.rejects(
      async () => {
        await chat({
          message: 'Une question critique',
          agentId: 'general',
        });
      },
      (err: unknown) => {
        assert.ok(err instanceof Error);
        assert.strictEqual(
          err.message.includes("C'est un sujet très intéressant"),
          false,
          'Ne doit JAMAIS inventer une réponse de secours',
        );
        assert.ok(
          err.message.includes('Fournisseur d’IA indisponible') ||
            err.message.includes('Échec de connexion au moteur IA'),
          'Doit renvoyer une erreur explicite',
        );
        return true;
      },
    );
  });

  test('Supporte l’interruption précoce via AbortSignal pendant le streaming', async () => {
    const abortController = new AbortController();
    const encoder = new TextEncoder();

    globalThis.fetch = (async (_url: unknown, init?: RequestInit) => {
      const signal = init?.signal;
      const stream = new ReadableStream({
        async start(controller) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ chunk: 'Premier fragment' })}\n\n`));

          if (signal) {
            signal.addEventListener('abort', () => {
              controller.error(new DOMException('The user aborted a request.', 'AbortError'));
            });
          }
        },
      });

      return new Response(stream, {
        status: 200,
        headers: { 'Content-Type': 'text/event-stream' },
      });
    }) as typeof fetch;

    const receivedChunks: string[] = [];

    const promise = chat(
      {
        message: 'Génère un long script d’analyse de données',
        agentId: 'general',
        onChunk: (chunk) => {
          receivedChunks.push(chunk);
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
