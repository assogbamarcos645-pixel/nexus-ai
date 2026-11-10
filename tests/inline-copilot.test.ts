/**
 * tests/inline-copilot.test.ts
 *
 * Tests unitaires pour l'assistant IA « Copilot Inline » (style Cursor IDE) :
 * - Algorithme de diff LCS ligne par ligne (diffUtils)
 * - Moteur de traitement de commandes naturelles (inlineCopilotService)
 * - Gestion du contexte de sélection et remplacement de code
 */

import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import { computeLineDiff, getDiffStats } from '../src/utils/diffUtils.ts';
import { generateInlineCodeProposal } from '../src/services/lab/inlineCopilotService.ts';
import type { LabFile } from '../src/types/lab.ts';

describe('NEXUS LAB — Diff Visuel Interactif (diffUtils)', () => {
  test('Identifie correctement deux textes identiques comme inchangés', () => {
    const text = 'const a = 1;\nconst b = 2;';
    const diff = computeLineDiff(text, text);

    assert.equal(diff.length, 2);
    assert.equal(diff[0].type, 'unchanged');
    assert.equal(diff[0].oldLineNumber, 1);
    assert.equal(diff[0].newLineNumber, 1);
    assert.equal(diff[1].type, 'unchanged');
    assert.equal(diff[1].oldLineNumber, 2);
    assert.equal(diff[1].newLineNumber, 2);

    const stats = getDiffStats(diff);
    assert.equal(stats.additions, 0);
    assert.equal(stats.deletions, 0);
    assert.equal(stats.unchanged, 2);
  });

  test('Gère les ajouts de lignes purs', () => {
    const oldText = '';
    const newText = 'line 1\nline 2\nline 3';
    const diff = computeLineDiff(oldText, newText);

    assert.equal(diff.length, 3);
    assert.ok(diff.every((d) => d.type === 'added'));
    assert.equal(diff[0].newLineNumber, 1);
    assert.equal(diff[2].newLineNumber, 3);

    const stats = getDiffStats(diff);
    assert.equal(stats.additions, 3);
    assert.equal(stats.deletions, 0);
  });

  test('Gère les suppressions de lignes pures', () => {
    const oldText = 'line 1\nline 2';
    const newText = '';
    const diff = computeLineDiff(oldText, newText);

    assert.equal(diff.length, 2);
    assert.ok(diff.every((d) => d.type === 'removed'));
    assert.equal(diff[0].oldLineNumber, 1);
    assert.equal(diff[1].oldLineNumber, 2);

    const stats = getDiffStats(diff);
    assert.equal(stats.additions, 0);
    assert.equal(stats.deletions, 2);
  });

  test('Calcule un diff mixte (remplacement, conservation, ajout)', () => {
    const oldText = 'import React from "react";\nconst App = () => <div>Old</div>;\nexport default App;';
    const newText = 'import React from "react";\nconst App = () => <div>New Header</div>;\nconst Footer = () => <footer>OK</footer>;\nexport default App;';

    const diff = computeLineDiff(oldText, newText);
    const stats = getDiffStats(diff);

    assert.ok(stats.additions >= 2);
    assert.ok(stats.deletions >= 1);
    assert.ok(stats.unchanged >= 2);

    // Première ligne inchangée
    assert.equal(diff[0].type, 'unchanged');
    assert.equal(diff[0].text, 'import React from "react";');
  });
});

describe('NEXUS LAB — Assistant IA Copilot Inline (inlineCopilotService)', () => {
  const dummyHtmlFile: LabFile = {
    id: 'f-1',
    name: 'index.html',
    path: 'index.html',
    language: 'html',
    content: '<!DOCTYPE html>\n<html>\n<body>\n  <main></main>\n</body>\n</html>',
  };

  const dummyReactFile: LabFile = {
    id: 'f-2',
    name: 'App.tsx',
    path: 'src/App.tsx',
    language: 'typescript',
    content: 'export function App() {\n  const handleClick = () => {\n    console.log("clicked");\n  };\n  return <button onClick={handleClick}>Click</button>;\n}',
  };

  test(
    'Commande naturelle: « Ajoute une barre de navigation Tailwind responsive » (HTML)',
    { timeout: 15000 },
    async () => {
    const proposal = await generateInlineCodeProposal({
      file: dummyHtmlFile,
      prompt: 'Ajoute une barre de navigation Tailwind responsive',
      fullContent: dummyHtmlFile.content,
    });

    assert.ok(proposal.id.startsWith('copilot-inline'));
    assert.ok(proposal.explanation.includes('navigation') || proposal.explanation.includes('Tailwind'));
    assert.ok(proposal.suggestedSnippet.includes('<header'));
    assert.ok(proposal.suggestedSnippet.includes('md:hidden') || proposal.suggestedSnippet.includes('backdrop-blur'));
    assert.equal(proposal.isWholeFile, true);
  });

  test('Commande naturelle: « Ajoute une barre de navigation Tailwind responsive » (React/TSX)', { timeout: 15000 }, async () => {
    const proposal = await generateInlineCodeProposal({
      file: dummyReactFile,
      prompt: 'Ajoute une barre de navigation Tailwind responsive',
      fullContent: dummyReactFile.content,
    });

    assert.ok(proposal.suggestedSnippet.includes('export function Navbar') || proposal.suggestedSnippet.includes('className='));
    assert.ok(proposal.suggestedSnippet.includes('useState'));
  });

  test('Commande naturelle: « Corrige ce bug de re-render React » avec sélection', { timeout: 15000 }, async () => {
    const selectedCode = 'const handleClick = () => {\n    console.log("clicked");\n  };';
    const selectionRange = {
      startLineNumber: 2,
      startColumn: 3,
      endLineNumber: 4,
      endColumn: 5,
    };

    const proposal = await generateInlineCodeProposal({
      file: dummyReactFile,
      prompt: 'Corrige ce bug de re-render React',
      selectedCode,
      selectionRange,
      fullContent: dummyReactFile.content,
    });

    assert.equal(proposal.isWholeFile, false);
    assert.deepEqual(proposal.range, selectionRange);
    assert.ok(proposal.suggestedSnippet.includes('useCallback'));
    assert.ok(proposal.explanation.toLowerCase().includes('re-render') || proposal.explanation.toLowerCase().includes('usecallback'));
  });

  test('Commande naturelle: « Factorise cette fonction »', { timeout: 15000 }, async () => {
    const selectedCode = 'const res = computeTotal();\nupdateUi(res);';
    const proposal = await generateInlineCodeProposal({
      file: dummyReactFile,
      prompt: 'Factorise cette fonction',
      selectedCode,
      selectionRange: { startLineNumber: 2, startColumn: 1, endLineNumber: 3, endColumn: 20 },
      fullContent: dummyReactFile.content,
    });

    assert.ok(proposal.suggestedSnippet.includes('export function') || proposal.suggestedSnippet.includes('try'));
    assert.ok(proposal.explanation.includes('factorisé') || proposal.explanation.includes('modulaire'));
  });

  test('Commande naturelle: « Ajoute un try/catch pour sécuriser les erreurs »', { timeout: 15000 }, async () => {
    const selectedCode = 'fetchData();\nrenderData();';
    const proposal = await generateInlineCodeProposal({
      file: dummyReactFile,
      prompt: 'Ajoute un try/catch pour sécuriser le code',
      selectedCode,
      selectionRange: { startLineNumber: 2, startColumn: 1, endLineNumber: 3, endColumn: 20 },
      fullContent: dummyReactFile.content,
    });

    assert.ok(proposal.suggestedSnippet.includes('try {'));
    assert.ok(proposal.suggestedSnippet.includes('} catch (error) {'));
  });

  test('Injection personnalisée d’un moteur IA simulé avec extraction de bloc markdown', async () => {
    const mockAiCaller = async (_prompt: string) => {
      return `✨ Modification de test appliquée avec succès.\n\`\`\`typescript\nconst message: string = "Hello Nexus";\n\`\`\``;
    };

    const proposal = await generateInlineCodeProposal({
      file: dummyReactFile,
      prompt: 'Ajoute une variable typée',
      fullContent: dummyReactFile.content,
      aiCaller: mockAiCaller,
    });

    assert.equal(proposal.isMock, false);
    assert.equal(proposal.suggestedSnippet, 'const message: string = "Hello Nexus";');
    assert.equal(proposal.explanation, '✨ Modification de test appliquée avec succès.');
  });
});
