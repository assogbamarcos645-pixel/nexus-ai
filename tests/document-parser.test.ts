import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  getDocumentCategory,
  formatFileSize,
  formatDocumentsForAIContext,
} from '../src/services/documents/documentParserService.ts';
import type { AttachedDocument } from '../src/types/documents.ts';

describe('Service d’analyse documentaire (documentParserService)', () => {
  test('Identifie correctement les catégories de fichiers', () => {
    assert.equal(getDocumentCategory('rapport.pdf'), 'pdf');
    assert.equal(getDocumentCategory('DOCUMENT.PDF'), 'pdf');
    assert.equal(getDocumentCategory('index.ts'), 'code');
    assert.equal(getDocumentCategory('App.tsx'), 'code');
    assert.equal(getDocumentCategory('script.py'), 'code');
    assert.equal(getDocumentCategory('data.json'), 'data');
    assert.equal(getDocumentCategory('metrics.csv'), 'data');
    assert.equal(getDocumentCategory('README.md'), 'markdown');
    assert.equal(getDocumentCategory('notes.txt'), 'text');
    assert.equal(getDocumentCategory('archive.zip'), 'archive');
    assert.equal(getDocumentCategory('unknown.xyz'), 'other');
  });

  test('Formate les tailles de fichiers de manière humaine et lisible', () => {
    assert.equal(formatFileSize(512), '512 o');
    assert.equal(formatFileSize(1024), '1.0 Ko');
    assert.equal(formatFileSize(150 * 1024), '150.0 Ko');
    assert.equal(formatFileSize(5 * 1024 * 1024), '5.0 Mo');
  });

  test('Formate les documents pour injection contextuelle dans le prompt IA', () => {
    const docs: AttachedDocument[] = [
      {
        id: 'doc-1',
        name: 'architecture.pdf',
        size: 1024 * 200,
        category: 'pdf',
        extension: 'pdf',
        content: 'Contenu extrait de la spécification...',
        previewSnippet: 'Contenu extrait...',
        pageCount: 12,
        extractedAt: new Date().toISOString(),
      },
    ];

    const formatted = formatDocumentsForAIContext(docs);
    assert.ok(formatted.includes('DOCUMENTS ATTACHÉS PAR L\'UTILISATEUR'));
    assert.ok(formatted.includes('architecture.pdf'));
    assert.ok(formatted.includes('Nombre de pages : 12'));
    assert.ok(formatted.includes('Contenu extrait de la spécification...'));
  });
});
