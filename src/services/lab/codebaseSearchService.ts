/**
 * src/services/lab/codebaseSearchService.ts
 *
 * Moteur de Recherche Sémantique, RAG Vectoriel & Indexation de Codebase pour NEXUS LAB.
 * Permet aux agents (NEXUS DEV, Swarm, Copilot) de naviguer et d'interroger
 * l'ensemble des fichiers du projet actif avec injection contextuelle optimisée.
 */

import type { LabProject, LabFile } from '../../types/lab.ts';

export interface CodebaseChunk {
  id: string;
  fileId: string;
  filePath: string;
  fileName: string;
  language: string;
  startLine: number;
  endLine: number;
  content: string;
  type: 'component' | 'function' | 'interface' | 'export' | 'config' | 'block';
  keywords: string[];
  tokens: string[];
}

export interface CodebaseSearchResult {
  chunk: CodebaseChunk;
  score: number;
  matchedKeywords: string[];
  relevanceSnippet: string;
}

export interface SearchCodebaseOptions {
  maxResults?: number;
  minScore?: number;
  fileExtensions?: string[];
}

/**
 * Tokenise et normalise une chaîne de texte pour l'analyse lexicale et vectorielle.
 */
export function tokenizeText(text: string): string[] {
  if (!text) return [];
  // Découpage par mots, camelCase et snake_case
  const cleaned = text
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_\-.:/\\(){}[\]`"';,<>]/g, ' ')
    .toLowerCase();

  return cleaned
    .split(/\s+/)
    .map((w) => w.trim())
    .filter((w) => w.length >= 2 && !STOP_WORDS.has(w));
}

const STOP_WORDS = new Set([
  'the', 'and', 'for', 'with', 'this', 'that', 'from', 'have', 'were', 'which',
  'les', 'des', 'une', 'dans', 'pour', 'avec', 'sur', 'par', 'est', 'sont',
  'true', 'false', 'null', 'undefined', 'void', 'return', 'const', 'let', 'var',
]);

/**
 * Découpe un fichier de code en segments sémantiques (composants, hooks, fonctions, interfaces).
 */
export function chunkFile(file: LabFile): CodebaseChunk[] {
  if (!file.content || !file.content.trim()) return [];

  const lines = file.content.split('\n');
  const chunks: CodebaseChunk[] = [];

  // Fichier court (< 45 lignes) : chunk unique
  if (lines.length <= 45) {
    const tokens = tokenizeText(file.content);
    return [
      {
        id: `${file.id}-full`,
        fileId: file.id,
        filePath: file.path,
        fileName: file.name,
        language: file.language,
        startLine: 1,
        endLine: lines.length,
        content: file.content,
        type: file.path.endsWith('.json') ? 'config' : 'block',
        keywords: Array.from(new Set(tokens.slice(0, 15))),
        tokens,
      },
    ];
  }

  // Détection des délimitations de fonctions / interfaces / exports
  const boundaryRegex = /^(?:export\s+)?(?:default\s+)?(?:async\s+)?(?:function|class|interface|type|const|let)\s+([a-zA-Z0-9_$]+)/;
  let currentStart = 0;
  let currentName = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const match = line.match(boundaryRegex);

    if (match && i > currentStart + 15) {
      // Clôturer le chunk précédent
      const chunkLines = lines.slice(currentStart, i);
      const chunkContent = chunkLines.join('\n');
      const tokens = tokenizeText(chunkContent);

      chunks.push({
        id: `${file.id}-${currentStart}-${i}`,
        fileId: file.id,
        filePath: file.path,
        fileName: file.name,
        language: file.language,
        startLine: currentStart + 1,
        endLine: i,
        content: chunkContent,
        type: currentName.startsWith('use') ? 'function' : currentName.match(/^[A-Z]/) ? 'component' : 'block',
        keywords: Array.from(new Set(tokens.slice(0, 12))),
        tokens,
      });

      currentStart = i;
      currentName = match[1] || '';
    }
  }

  // Dernier chunk
  if (currentStart < lines.length) {
    const chunkLines = lines.slice(currentStart);
    const chunkContent = chunkLines.join('\n');
    const tokens = tokenizeText(chunkContent);

    chunks.push({
      id: `${file.id}-${currentStart}-${lines.length}`,
      fileId: file.id,
      filePath: file.path,
      fileName: file.name,
      language: file.language,
      startLine: currentStart + 1,
      endLine: lines.length,
      content: chunkContent,
      type: 'block',
      keywords: Array.from(new Set(tokens.slice(0, 12))),
      tokens,
    });
  }

  return chunks;
}

/**
 * Calcule la similarité cosinus TF-IDF entre les tokens d'une requête et ceux d'un chunk.
 */
function computeTfIdfScore(queryTokens: string[], chunkTokens: string[]): number {
  if (queryTokens.length === 0 || chunkTokens.length === 0) return 0;

  const chunkFreq: Record<string, number> = {};
  for (const t of chunkTokens) {
    chunkFreq[t] = (chunkFreq[t] || 0) + 1;
  }

  let matchScore = 0;
  for (const qt of queryTokens) {
    if (chunkFreq[qt]) {
      // Fréquence logarithmique pour amortir les répétitions
      matchScore += 1 + Math.log(chunkFreq[qt]);
    }
  }

  // Normalisation par la racine carrée de la taille du chunk
  return matchScore / Math.sqrt(chunkTokens.length);
}

/**
 * Recherche vectorielle et sémantique dans l'ensemble des fichiers du projet.
 */
export function searchCodebase(
  project: LabProject,
  query: string,
  options: SearchCodebaseOptions = {}
): CodebaseSearchResult[] {
  const { maxResults = 5, minScore = 0.05, fileExtensions } = options;

  if (!project || !project.files || project.files.length === 0 || !query.trim()) {
    return [];
  }

  const queryTokens = tokenizeText(query);
  if (queryTokens.length === 0) return [];

  const allChunks: CodebaseChunk[] = [];

  for (const file of project.files) {
    if (fileExtensions && fileExtensions.length > 0) {
      const matchExt = fileExtensions.some((ext) => file.path.endsWith(ext));
      if (!matchExt) continue;
    }
    const chunks = chunkFile(file);
    allChunks.push(...chunks);
  }

  const scoredResults: CodebaseSearchResult[] = [];

  for (const chunk of allChunks) {
    const tfIdf = computeTfIdfScore(queryTokens, chunk.tokens);

    // Boost si le nom du fichier ou le chemin contient un terme de la requête
    let pathBoost = 0;
    const lowerPath = chunk.filePath.toLowerCase();
    for (const qt of queryTokens) {
      if (lowerPath.includes(qt)) {
        pathBoost += 0.35;
      }
    }

    const totalScore = tfIdf + pathBoost;
    if (totalScore >= minScore) {
      // Identifier les mots-clés correspondants
      const matched = queryTokens.filter(
        (qt) => chunk.tokens.includes(qt) || lowerPath.includes(qt)
      );

      scoredResults.push({
        chunk,
        score: totalScore,
        matchedKeywords: Array.from(new Set(matched)),
        relevanceSnippet: chunk.content.slice(0, 240) + (chunk.content.length > 240 ? '...' : ''),
      });
    }
  }

  // Trier par pertinence décroissante
  scoredResults.sort((a, b) => b.score - a.score);

  return scoredResults.slice(0, maxResults);
}

/**
 * Construit un contexte textuel structuré dense prêt à être injecté
 * dans le prompt d'un agent LLM ou du Swarm.
 */
export function buildAugmentedContext(
  project: LabProject,
  query: string,
  maxTokens: number = 2000
): string {
  const results = searchCodebase(project, query, { maxResults: 4, minScore: 0.1 });

  if (results.length === 0) {
    return '';
  }

  let budgetChars = maxTokens * 4;
  const sections: string[] = [
    `### Extraits pertinents de la codebase (RAG local projet "${project.name}") :`,
  ];

  for (const res of results) {
    const chunk = res.chunk;
    const snippet = `\`\`\`${chunk.language} (${chunk.filePath}:${chunk.startLine}-${chunk.endLine})\n${chunk.content}\n\`\`\``;

    if (budgetChars - snippet.length <= 0) break;

    sections.push(snippet);
    budgetChars -= snippet.length;
  }

  return sections.join('\n\n');
}
