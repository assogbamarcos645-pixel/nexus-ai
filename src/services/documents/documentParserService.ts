/**
 * src/services/documents/documentParserService.ts
 *
 * Moteur d'extraction et d'analyse de documents pour NEXUS AI.
 * Prend en charge l'extraction complète et structurée de texte pour :
 *  - Fichiers PDF (.pdf) via pdfjs-dist avec préservation des sauts de ligne
 *  - Documents Word (.docx) via JSZip et parsing XML des paragraphes/tableaux
 *  - Fichiers de données (JSON, CSV, TSV, XML, YAML) avec détection de schéma
 *  - Fichiers de code (TS, JS, PY, HTML, CSS, SQL, C, Rust, Go, etc.)
 *  - Fichiers markdown & texte brut (.md, .txt)
 *  - Archives de code (.zip) via JSZip
 */

import * as pdfjsLib from 'pdfjs-dist';
import JSZip from 'jszip';
import type { AttachedDocument, DocumentCategory, DocumentParseResult } from '../../types/documents.ts';
import { generateUUID } from '../../utils/uuid.ts';

// Configuration du worker PDF.js (compatible Vite et ESM avec fallback défensif)
try {
  if (typeof window !== 'undefined' && pdfjsLib.GlobalWorkerOptions) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || '4.10.38'}/pdf.worker.min.mjs`;
  }
} catch {
  // Ignorer si déjà configuré
}

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 Mo max
const MAX_EXTRACTED_CHARS = 200_000; // ~50 000 mots pour les LLMs

/**
 * Détecte la catégorie d'un document selon son nom ou extension.
 */
export function getDocumentCategory(filename: string): DocumentCategory {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  if (ext === 'pdf') return 'pdf';
  if (['docx', 'doc'].includes(ext)) return 'word';
  if (['zip', 'tar', 'gz'].includes(ext)) return 'archive';
  if (['md', 'markdown'].includes(ext)) return 'markdown';
  if (['json', 'csv', 'tsv', 'xml', 'yaml', 'yml', 'xlsx', 'xls'].includes(ext)) return 'data';
  if (['txt', 'log', 'rtf'].includes(ext)) return 'text';
  if (
    [
      'js', 'jsx', 'ts', 'tsx', 'py', 'java', 'c', 'cpp', 'h', 'hpp',
      'cs', 'go', 'rs', 'php', 'rb', 'sql', 'sh', 'bat', 'html', 'css',
      'scss', 'less', 'vue', 'svelte', 'dockerfile', 'env', 'prisma',
    ].includes(ext)
  ) {
    return 'code';
  }
  return 'other';
}

/**
 * Formate une taille en octets de manière lisible (ex: 245 Ko, 1.4 Mo).
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

/**
 * Extrait le texte d'un document Word (.docx) à partir de sa structure OpenXML zippée.
 */
export async function extractTextFromDocx(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(arrayBuffer);
  const docEntry = zip.file('word/document.xml');

  if (!docEntry) {
    throw new Error('Structure OpenXML introuvable dans le document Word.');
  }

  const xmlContent = await docEntry.async('string');

  // Traitement intelligent des balises Word OpenXML :
  // - <w:p> : paragraphe -> saut de ligne
  // - <w:tr> : ligne de tableau -> saut de ligne
  // - <w:tc> : cellule de tableau -> tabulation / séparateur
  // - <w:tab/> : tabulation
  // - <w:br/> : saut de ligne forcé
  const cleanedText = xmlContent
    .replace(/<w:tab\s*\/?>/gi, '\t')
    .replace(/<w:br\s*\/?>/gi, '\n')
    .replace(/<\/w:tc>/gi, ' | ')
    .replace(/<\/w:tr>/gi, '\n')
    .replace(/<\/w:p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '') // Nettoyage de toutes les autres balises XML
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  if (!cleanedText) {
    throw new Error('Le document Word ne contient aucun texte exploitable.');
  }

  return cleanedText;
}

/**
 * Extrait le texte d'un fichier PDF page par page en préservant la mise en page.
 */
async function extractTextFromPdf(file: File): Promise<{ text: string; pages: number }> {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(arrayBuffer),
    useSystemFonts: true,
  });

  const pdf = await loadingTask.promise;
  const numPages = pdf.numPages;
  const textPieces: string[] = [];

  for (let i = 1; i <= numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();

    // Groupement des éléments textuels par ligne approximative pour conserver les retours à la ligne
    const lineMap: Record<number, string[]> = {};
    const yOrder: number[] = [];

    for (const item of content.items as any[]) {
      const str = item.str || '';
      if (!str.trim()) continue;

      // item.transform[5] est la coordonnée Y verticale
      const rawY = Array.isArray(item.transform) ? item.transform[5] : 0;
      // Arrondi pour regrouper les textes d'une même ligne
      const roundedY = Math.round(rawY / 3) * 3;

      if (!lineMap[roundedY]) {
        lineMap[roundedY] = [];
        yOrder.push(roundedY);
      }
      lineMap[roundedY].push(str);
    }

    // Le repère PDF a l'origine en bas : on trie Y de façon décroissante (du haut vers le bas de page)
    yOrder.sort((a, b) => b - a);
    const pageLines = yOrder.map((y) => lineMap[y].join(' ').trim()).filter(Boolean);
    const pageText = pageLines.join('\n');

    if (pageText) {
      textPieces.push(`--- Page ${i} / ${numPages} ---\n${pageText}`);
    }
  }

  return {
    text: textPieces.join('\n\n'),
    pages: numPages,
  };
}

/**
 * Analyse et structure les fichiers de données (CSV, TSV, JSON) pour une lecture LLM optimale.
 */
async function extractStructuredDataText(file: File, ext: string): Promise<string> {
  const rawText = await file.text();
  const trimmed = rawText.trim();

  if (ext === 'json') {
    try {
      const parsed = JSON.parse(trimmed);
      const isArray = Array.isArray(parsed);
      const count = isArray ? parsed.length : Object.keys(parsed).length;
      const meta = isArray
        ? `[Tableau JSON : ${count} éléments]`
        : `[Objet JSON : ${count} clés principales]`;
      return `${meta}\n${JSON.stringify(parsed, null, 2)}`;
    } catch {
      return trimmed;
    }
  }

  if (ext === 'csv' || ext === 'tsv') {
    const lines = trimmed.split(/\r?\n/).filter(Boolean);
    if (lines.length > 0) {
      const separator = ext === 'tsv' ? '\t' : (lines[0].includes(';') ? ';' : ',');
      const headers = lines[0].split(separator).map((h) => h.trim().replace(/^["']|["']$/g, ''));
      const rowCount = lines.length - 1;
      const meta = `[Jeu de données ${ext.toUpperCase()} : ${rowCount} lignes de données, ${headers.length} colonnes : ${headers.join(', ')}]`;
      return `${meta}\n\n${trimmed}`;
    }
  }

  return trimmed;
}

/**
 * Extrait le texte des fichiers sources contenus dans une archive ZIP.
 */
async function extractTextFromZip(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(arrayBuffer);
  const fileEntries: string[] = [];

  let totalChars = 0;
  for (const [relativePath, zipEntry] of Object.entries(zip.files)) {
    if (zipEntry.dir) continue;
    if (relativePath.includes('node_modules/') || relativePath.startsWith('.') || relativePath.includes('dist/')) {
      continue;
    }

    const category = getDocumentCategory(relativePath);
    if (['code', 'markdown', 'data', 'text', 'word'].includes(category)) {
      try {
        let text = '';
        if (category === 'word') {
          // Document Word contenu dans un zip
          const docData = await zipEntry.async('uint8array');
          const innerZip = await JSZip.loadAsync(docData);
          const innerDoc = innerZip.file('word/document.xml');
          if (innerDoc) {
            const xml = await innerDoc.async('string');
            text = xml.replace(/<\/w:p>/gi, '\n\n').replace(/<[^>]+>/g, '').trim();
          }
        } else {
          text = await zipEntry.async('string');
        }

        if (text && text.trim().length > 0) {
          const snippet = text.slice(0, 15_000);
          fileEntries.push(`### Fichier : ${relativePath}\n\`\`\`\n${snippet}\n\`\`\``);
          totalChars += snippet.length;
          if (totalChars > MAX_EXTRACTED_CHARS) break;
        }
      } catch {
        // Ignorer les fichiers non lisibles
      }
    }
  }

  return fileEntries.join('\n\n') || `Archive ZIP : ${file.name} (aucun fichier texte ou code lisible identifié).`;
}

/**
 * Parse et extrait l'intégralité du contenu textuel d'un document téléversé.
 */
export async function parseDocumentFile(file: File): Promise<DocumentParseResult> {
  if (!file) {
    return { success: false, error: 'Aucun fichier sélectionné.' };
  }

  if (file.size > MAX_FILE_SIZE) {
    return {
      success: false,
      error: `Le fichier dépasse la limite maximale autorisée de ${formatFileSize(MAX_FILE_SIZE)}.`,
    };
  }

  const category = getDocumentCategory(file.name);
  const ext = file.name.split('.').pop()?.toLowerCase() || '';

  try {
    let extractedText = '';
    let pageCount: number | undefined;

    if (category === 'pdf') {
      const pdfRes = await extractTextFromPdf(file);
      extractedText = pdfRes.text;
      pageCount = pdfRes.pages;
    } else if (category === 'word') {
      extractedText = await extractTextFromDocx(file);
    } else if (category === 'archive') {
      extractedText = await extractTextFromZip(file);
    } else if (category === 'data') {
      extractedText = await extractStructuredDataText(file, ext);
    } else {
      // Lecture UTF-8 directe pour code, markdown et texte brut
      extractedText = await file.text();
    }

    // Nettoyage des octets nuls et caractères de contrôle invalides
    extractedText = extractedText.replace(/\0/g, '');

    // Troncature de sécurité très large pour ne pas saturer le contexte
    if (extractedText.length > MAX_EXTRACTED_CHARS) {
      extractedText =
        extractedText.slice(0, MAX_EXTRACTED_CHARS) +
        '\n\n[... Contenu tronqué au-delà de 200 000 caractères pour respecter le contexte ...]';
    }

    if (!extractedText.trim()) {
      return {
        success: false,
        error: `Le document "${file.name}" ne contient aucun texte exploitable ou est protégé.`,
      };
    }

    const previewSnippet =
      extractedText.slice(0, 240).replace(/\s+/g, ' ').trim() +
      (extractedText.length > 240 ? '...' : '');

    const document: AttachedDocument = {
      id: generateUUID(),
      name: file.name,
      size: file.size,
      category,
      extension: ext,
      content: extractedText,
      previewSnippet,
      pageCount,
      extractedAt: new Date().toISOString(),
    };

    return { success: true, document };
  } catch (err: any) {
    return {
      success: false,
      error: `Erreur lors de l'analyse de "${file.name}" : ${err?.message || 'Format illisible'}.`,
    };
  }
}

/**
 * Formate une liste de documents attachés pour injection dans le contexte du modèle IA.
 */
export function formatDocumentsForAIContext(docs: AttachedDocument[]): string {
  if (!docs || docs.length === 0) return '';

  const header = `\n\n═══════════════════════════════════════════════════════════════
DOCUMENTS ATTACHÉS PAR L'UTILISATEUR POUR ANALYSE ET EXÉCUTION :
═══════════════════════════════════════════════════════════════\n`;

  const body = docs
    .map((doc, idx) => {
      const meta = [
        `Document #${idx + 1} : "${doc.name}"`,
        `Type : ${doc.category.toUpperCase()} (.${doc.extension})`,
        `Taille : ${formatFileSize(doc.size)}`,
        doc.pageCount ? `Nombre de pages : ${doc.pageCount}` : null,
      ]
        .filter(Boolean)
        .join(' | ');

      return `--- DÉBUT FICHIER [${meta}] ---
${doc.content}
--- FIN FICHIER [${doc.name}] ---`;
    })
    .join('\n\n');

  return `${header}${body}\n═══════════════════════════════════════════════════════════════\n`;
}
