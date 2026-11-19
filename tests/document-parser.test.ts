import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import JSZip from 'jszip';
import {
  getDocumentCategory,
  formatFileSize,
  formatDocumentsForAIContext,
  extractTextFromDocx,
} from '../src/services/documents/documentParserService.ts';
import type { AttachedDocument } from '../src/types/documents.ts';

describe('Service d’analyse documentaire (documentParserService)', () => {
  test('Identifie correctement les catégories de fichiers y compris Word et données avancées', () => {
    assert.equal(getDocumentCategory('rapport.pdf'), 'pdf');
    assert.equal(getDocumentCategory('DOCUMENT.PDF'), 'pdf');
    assert.equal(getDocumentCategory('cahier-des-charges.docx'), 'word');
    assert.equal(getDocumentCategory('SPECIFICATION.DOC'), 'word');
    assert.equal(getDocumentCategory('index.ts'), 'code');
    assert.equal(getDocumentCategory('App.tsx'), 'code');
    assert.equal(getDocumentCategory('script.py'), 'code');
    assert.equal(getDocumentCategory('data.json'), 'data');
    assert.equal(getDocumentCategory('metrics.csv'), 'data');
    assert.equal(getDocumentCategory('dataset.tsv'), 'data');
    assert.equal(getDocumentCategory('comptabilite.xlsx'), 'data');
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
      {
        id: 'doc-2',
        name: 'contrat.docx',
        size: 1024 * 85,
        category: 'word',
        extension: 'docx',
        content: 'Article 1 : Clauses techniques et engagements SLA.',
        previewSnippet: 'Article 1...',
        extractedAt: new Date().toISOString(),
      },
    ];

    const formatted = formatDocumentsForAIContext(docs);
    assert.ok(formatted.includes('DOCUMENTS ATTACHÉS PAR L\'UTILISATEUR'));
    assert.ok(formatted.includes('architecture.pdf'));
    assert.ok(formatted.includes('Nombre de pages : 12'));
    assert.ok(formatted.includes('contrat.docx'));
    assert.ok(formatted.includes('WORD (.docx)'));
    assert.ok(formatted.includes('Article 1 : Clauses techniques'));
  });

  test('Extrait fidèlement le texte d’un document Word OpenXML (.docx) généré', async () => {
    // Création d’un package DOCX en mémoire avec JSZip
    const zip = new JSZip();
    const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
    <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
      <w:body>
        <w:p>
          <w:r><w:t>Titre du document : NEXUS Architecture</w:t></w:r>
        </w:p>
        <w:p>
          <w:r><w:t>Ce document spécifie les protocoles de communication temps réel.</w:t></w:r>
        </w:p>
        <w:tbl>
          <w:tr>
            <w:tc><w:p><w:r><w:t>Paramètre</w:t></w:r></w:p></w:tc>
            <w:tc><w:p><w:r><w:t>Valeur</w:t></w:r></w:p></w:tc>
          </w:tr>
          <w:tr>
            <w:tc><w:p><w:r><w:t>Timeout</w:t></w:r></w:p></w:tc>
            <w:tc><w:p><w:r><w:t>5000ms</w:t></w:r></w:p></w:tc>
          </w:tr>
        </w:tbl>
      </w:body>
    </w:document>`;

    zip.file('word/document.xml', documentXml);
    const docxBuffer = await zip.generateAsync({ type: 'uint8array' });

    // Mock d'un objet File compatible
    const mockFile = {
      name: 'nexus-spec.docx',
      size: docxBuffer.length,
      arrayBuffer: async () => docxBuffer.buffer,
    } as unknown as File;

    const extracted = await extractTextFromDocx(mockFile);
    assert.ok(extracted.includes('Titre du document : NEXUS Architecture'));
    assert.ok(extracted.includes('Ce document spécifie les protocoles'));
    assert.ok(extracted.includes('Paramètre'));
    assert.ok(extracted.includes('5000ms'));
  });
});
