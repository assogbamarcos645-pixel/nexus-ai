/**
 * tests/code-completion.test.ts
 *
 * Tests unitaires pour le moteur d'autocomplétion intelligente et de snippets de NEXUS LAB.
 */

import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  registerNexusCompletions,
  registerInlineGhostTextProvider,
  predictInstantGhostText,
  generateAICompletion,
  getGhostTextStats,
  setGhostTextEnabled,
} from '../src/services/lab/codeCompletionService.ts';
import type { LabFile } from '../src/types/lab.ts';

describe('NEXUS LAB — Autocomplétion & Snippets de Langage', () => {
  test('Enregistre correctement les fournisseurs de complétion sur les langages cibles', () => {
    const registeredLangs: string[] = [];
    const fakeMonaco = {
      languages: {
        CompletionItemKind: { Snippet: 27 },
        CompletionItemInsertTextRule: { InsertAsSnippet: 4 },
        registerCompletionItemProvider: (language: string, provider: any) => {
          registeredLangs.push(language);
          assert.ok(typeof provider.provideCompletionItems === 'function');
        },
      },
    };

    registerNexusCompletions(fakeMonaco, true);

    assert.ok(registeredLangs.includes('html'));
    assert.ok(registeredLangs.includes('css'));
    assert.ok(registeredLangs.includes('javascript'));
    assert.ok(registeredLangs.includes('typescript'));
    assert.ok(registeredLangs.includes('python'));
    assert.ok(registeredLangs.includes('php'));
  });

  test('Génère une complétion heuristique contextuelle pour HTML', async () => {
    const file: LabFile = {
      id: 'test-1',
      name: 'index.html',
      path: 'index.html',
      language: 'html',
      content: '<div class="container"',
      isModified: false,
    };

    const completion = await generateAICompletion({
      file,
      codeBeforeCursor: '<button class="btn"',
      codeAfterCursor: '',
    });

    assert.ok(completion !== null);
    assert.ok(completion.includes('>'));
  });

  test('Génère une complétion contextuelle pour JavaScript sur point d’accès d’objet', async () => {
    const file: LabFile = {
      id: 'test-2',
      name: 'app.js',
      path: 'app.js',
      language: 'javascript',
      content: '',
      isModified: false,
    };

    const completion = await generateAICompletion({
      file,
      codeBeforeCursor: 'console.',
      codeAfterCursor: '',
    });

    assert.strictEqual(completion, 'log()');
  });

  test('Génère une complétion contextuelle pour JSON.stringify', async () => {
    const file: LabFile = {
      id: 'test-3',
      name: 'utils.ts',
      path: 'utils.ts',
      language: 'typescript',
      content: '',
      isModified: false,
    };

    const completion = await generateAICompletion({
      file,
      codeBeforeCursor: 'const str = JSON.',
      codeAfterCursor: '',
    });

    assert.strictEqual(completion, 'stringify()');
  });
});

describe('Monaco Copilot — Moteur Ghost Text (< 200 ms & Tab/Échap)', () => {
  test('Prédit instantanément les hooks React et déduit les setters', () => {
    // Cas 1 : Déduction automatique du setter React
    const customState = predictInstantGhostText('typescript', 'const [userData,');
    assert.strictEqual(customState, ' setUserData] = useState(null);');

    // Cas 2 : useState booléen
    const isOpenState = predictInstantGhostText('typescript', 'const [isOpen,');
    assert.strictEqual(isOpenState, ' setIsOpen] = useState(false);');

    // Cas 3 : useEffect hook
    const effectHook = predictInstantGhostText('typescript', 'useEffect(');
    assert.ok(effectHook !== null && effectHook.includes('return () => {};'));

    // Cas 4 : Imports ES6
    const reactImport = predictInstantGhostText('typescript', 'import React');
    assert.strictEqual(reactImport, " from 'react';");
  });

  test('Prédit les patterns CSS, HTML, Python et PHP en continu', () => {
    // CSS Flexbox & Glassmorphism
    const cssDisplay = predictInstantGhostText('css', 'display:');
    assert.strictEqual(cssDisplay, ' flex;');

    const cssBackdrop = predictInstantGhostText('css', 'backdrop-filter:');
    assert.ok(cssBackdrop !== null && cssBackdrop.includes('blur'));

    // HTML structure
    const htmlBtn = predictInstantGhostText('html', '<button');
    assert.ok(htmlBtn !== null && htmlBtn.includes('type="button"'));

    // Python entrypoint
    const pyMain = predictInstantGhostText('python', 'if __name__');
    assert.strictEqual(pyMain, ' == "__main__":\n    main()');

    // PHP Header
    const phpHeader = predictInstantGhostText('php', 'header(');
    assert.ok(phpHeader !== null && phpHeader.includes('application/json'));
  });

  test('Enregistre le fournisseur Inline Completions Monaco pour tous les langages', () => {
    const registeredInlineLangs: string[] = [];
    const providers: Record<string, any> = {};

    class FakeRange {
      startLineNumber: number;
      startColumn: number;
      endLineNumber: number;
      endColumn: number;
      constructor(startLineNumber: number, startColumn: number, endLineNumber: number, endColumn: number) {
        this.startLineNumber = startLineNumber;
        this.startColumn = startColumn;
        this.endLineNumber = endLineNumber;
        this.endColumn = endColumn;
      }
    }

    const fakeMonaco = {
      Range: FakeRange,
      languages: {
        registerInlineCompletionsProvider: (language: string, provider: any) => {
          registeredInlineLangs.push(language);
          providers[language] = provider;
          return { dispose: () => {} };
        },
      },
    };

    const registration = registerInlineGhostTextProvider(fakeMonaco);
    assert.ok(typeof registration.dispose === 'function');
    assert.ok(registeredInlineLangs.includes('typescript'));
    assert.ok(registeredInlineLangs.includes('javascript'));
    assert.ok(registeredInlineLangs.includes('html'));
    assert.ok(registeredInlineLangs.includes('css'));
    assert.ok(registeredInlineLangs.includes('python'));
  });

  test('Garantit une latence ultra-rapide (< 200 ms) et fournit les items d\'insertion pour Tab', async () => {
    class FakeRange {
      startLineNumber: number;
      startColumn: number;
      endLineNumber: number;
      endColumn: number;
      constructor(startLineNumber: number, startColumn: number, endLineNumber: number, endColumn: number) {
        this.startLineNumber = startLineNumber;
        this.startColumn = startColumn;
        this.endLineNumber = endLineNumber;
        this.endColumn = endColumn;
      }
    }

    let capturedProvider: any = null;
    const fakeMonaco = {
      Range: FakeRange,
      languages: {
        registerInlineCompletionsProvider: (lang: string, p: any) => {
          if (lang === 'typescript') {
            capturedProvider = p;
          }
          return { dispose: () => {} };
        },
      },
    };

    // Forcer le ré-enregistrement pour le test
    setGhostTextEnabled(true);
    registerInlineGhostTextProvider(fakeMonaco, {}, true);

    assert.ok(capturedProvider !== null);

    const fakeModel = {
      getLineContent: () => 'const [counter,',
      getOffsetAt: () => 15,
      getValue: () => 'const [counter,',
    };

    const position = { lineNumber: 1, column: 16 };
    const context = { triggerKind: 0 };
    const token = { isCancellationRequested: false };

    const tStart = performance.now();
    const result = await capturedProvider.provideInlineCompletions(fakeModel, position, context, token);
    const duration = performance.now() - tStart;

    // Vérification du critère de performance strict : < 200 ms
    assert.ok(duration < 200, `La complétion Ghost Text a mis ${duration} ms (doit être < 200 ms)`);
    assert.ok(result.items.length > 0, 'Une complétion inline doit être retournée');
    assert.strictEqual(result.items[0].insertText, ' setCounter] = useState(null);');
    assert.strictEqual(result.items[0].range.startLineNumber, 1);
    assert.strictEqual(result.items[0].range.startColumn, 16);

    const stats = getGhostTextStats();
    assert.ok(stats.totalSuggestions > 0);
  });
});
