/**
 * src/types/documents.ts
 *
 * Types pour les documents analysés et attachés aux conversations de NEXUS AI.
 */

export type DocumentCategory = 'pdf' | 'word' | 'code' | 'data' | 'markdown' | 'text' | 'archive' | 'other';

export interface AttachedDocument {
  id: string;
  name: string;
  size: number;
  category: DocumentCategory;
  extension: string;
  content: string;
  previewSnippet: string;
  pageCount?: number;
  extractedAt: string;
}

export interface DocumentParseResult {
  success: boolean;
  document?: AttachedDocument;
  error?: string;
}
