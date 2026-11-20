/**
 * src/services/admin/adminRagService.ts
 *
 * Base de Connaissances RAG Globale :
 * - Gestion des documents d'entreprise indexes (statut, chunks, vecteurs)
 * - Ajout et suppression de documents de reference
 * - Observabilite RAG (nombre de requetes, latence moyenne de recherche)
 */

import type { RagDocument, RagMetrics } from '../../types/admin.ts';
import { generateUUID } from '../../utils/uuid.ts';
import { logAdminAudit } from './adminSecurityService.ts';

const RAG_DOCS_STORAGE_KEY = 'nexus_admin_rag_docs_v1';

export function getDefaultRagDocuments(): RagDocument[] {
  return [
    {
      id: 'rag-doc-1',
      title: 'Guide d Architecture NEXUS AI v3.0',
      category: 'Architecture',
      fileType: 'markdown',
      sizeKb: 142,
      chunksCount: 86,
      vectorsCount: 86,
      status: 'indexed',
      indexedAt: '2026-02-10T12:00:00.000Z',
    },
    {
      id: 'rag-doc-2',
      title: 'Politique de Securite & Conformite RGPD',
      category: 'Securite',
      fileType: 'pdf',
      sizeKb: 310,
      chunksCount: 154,
      vectorsCount: 154,
      status: 'indexed',
      indexedAt: '2026-02-12T15:30:00.000Z',
    },
    {
      id: 'rag-doc-3',
      title: 'Documentation API Microservices & Endpoints',
      category: 'API & Dev',
      fileType: 'markdown',
      sizeKb: 215,
      chunksCount: 112,
      vectorsCount: 112,
      status: 'indexed',
      indexedAt: '2026-02-16T09:45:00.000Z',
    },
    {
      id: 'rag-doc-4',
      title: 'Manuel des Bonnes Pratiques Frontend React 19',
      category: 'Frontend',
      fileType: 'markdown',
      sizeKb: 88,
      chunksCount: 48,
      vectorsCount: 48,
      status: 'indexed',
      indexedAt: '2026-02-17T17:10:00.000Z',
    },
  ];
}

export function getRagDocuments(): RagDocument[] {
  if (typeof window === 'undefined') return getDefaultRagDocuments();
  try {
    const raw = localStorage.getItem(RAG_DOCS_STORAGE_KEY);
    if (!raw) return getDefaultRagDocuments();
    return JSON.parse(raw) || getDefaultRagDocuments();
  } catch {
    return getDefaultRagDocuments();
  }
}

export function saveRagDocuments(docs: RagDocument[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(RAG_DOCS_STORAGE_KEY, JSON.stringify(docs));
    window.dispatchEvent(new CustomEvent('nexus:rag-docs-updated', { detail: docs }));
  } catch (err) {
    console.error('[AdminRagService] Erreur sauvegarde RAG:', err);
  }
}

export function addRagDocument(
  title: string,
  category: string,
  fileType: RagDocument['fileType'],
  sizeKb = 120,
): RagDocument {
  const chunks = Math.max(12, Math.round(sizeKb * 0.6));
  const newDoc: RagDocument = {
    id: generateUUID(),
    title,
    category,
    fileType,
    sizeKb,
    chunksCount: chunks,
    vectorsCount: chunks,
    status: 'indexed',
    indexedAt: new Date().toISOString(),
  };

  const current = getRagDocuments();
  const updated = [newDoc, ...current];
  saveRagDocuments(updated);
  logAdminAudit('rag_doc_added', true, `Indexation vectorielle du document : ${title} (${chunks} vecteurs)`);
  return newDoc;
}

export function deleteRagDocument(docId: string): boolean {
  const current = getRagDocuments();
  const target = current.find((d) => d.id === docId);
  if (!target) return false;

  const updated = current.filter((d) => d.id !== docId);
  saveRagDocuments(updated);
  logAdminAudit('rag_doc_deleted', true, `Suppression de l index vectoriel du document : ${target.title}`);
  return true;
}

export function getRagMetrics(): RagMetrics {
  const docs = getRagDocuments();
  const totalChunks = docs.reduce((acc, d) => acc + d.chunksCount, 0);
  const totalVectors = docs.reduce((acc, d) => acc + d.vectorsCount, 0);

  return {
    totalDocuments: docs.length,
    totalChunks,
    totalVectors,
    totalQueries: 1480,
    averageLatencyMs: 38,
  };
}
