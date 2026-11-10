/**
 * src/utils/diffUtils.ts
 *
 * Utilitaire de calcul de diff ligne par ligne (LCS - Longest Common Subsequence).
 * Génère des structures de diff précises pour la visualisation avant/après
 * avec mise en valeur des ajouts, suppressions et lignes inchangées.
 */

export interface DiffLine {
  type: 'added' | 'removed' | 'unchanged';
  text: string;
  oldLineNumber?: number;
  newLineNumber?: number;
}

export interface DiffStats {
  additions: number;
  deletions: number;
  unchanged: number;
  totalChanges: number;
}

/**
 * Calcule le diff ligne par ligne entre deux blocs de texte via l'algorithme LCS.
 */
export function computeLineDiff(oldText: string, newText: string): DiffLine[] {
  // Gestion des textes strictement identiques
  if (oldText === newText) {
    if (!oldText) return [];
    return oldText.split('\n').map((line, index) => ({
      type: 'unchanged',
      text: line,
      oldLineNumber: index + 1,
      newLineNumber: index + 1,
    }));
  }

  // Normalisation des fins de lignes CRLF -> LF
  const normalizedOld = oldText.replace(/\r\n/g, '\n');
  const normalizedNew = newText.replace(/\r\n/g, '\n');

  const oldLines = normalizedOld.length > 0 ? normalizedOld.split('\n') : [];
  const newLines = normalizedNew.length > 0 ? normalizedNew.split('\n') : [];

  const m = oldLines.length;
  const n = newLines.length;

  // Si l'ancien texte est vide, toutes les lignes sont des ajouts
  if (m === 0) {
    return newLines.map((line, index) => ({
      type: 'added',
      text: line,
      newLineNumber: index + 1,
    }));
  }

  // Si le nouveau texte est vide, toutes les lignes sont des suppressions
  if (n === 0) {
    return oldLines.map((line, index) => ({
      type: 'removed',
      text: line,
      oldLineNumber: index + 1,
    }));
  }

  // Table de programmation dynamique pour le LCS
  // dp[i][j] représente la longueur du LCS pour oldLines[0..i-1] et newLines[0..j-1]
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (oldLines[i - 1] === newLines[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Remontée arrière pour reconstituer les deltas
  const result: DiffLine[] = [];
  let i = m;
  let j = n;

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldLines[i - 1] === newLines[j - 1]) {
      result.unshift({
        type: 'unchanged',
        text: oldLines[i - 1],
        oldLineNumber: i,
        newLineNumber: j,
      });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      result.unshift({
        type: 'added',
        text: newLines[j - 1],
        newLineNumber: j,
      });
      j--;
    } else if (i > 0 && (j === 0 || dp[i][j - 1] < dp[i - 1][j])) {
      result.unshift({
        type: 'removed',
        text: oldLines[i - 1],
        oldLineNumber: i,
      });
      i--;
    }
  }

  return result;
}

/**
 * Calcule les métriques globales d'un diff (+N, -M).
 */
export function getDiffStats(diffLines: DiffLine[]): DiffStats {
  let additions = 0;
  let deletions = 0;
  let unchanged = 0;

  for (const line of diffLines) {
    if (line.type === 'added') additions++;
    else if (line.type === 'removed') deletions++;
    else if (line.type === 'unchanged') unchanged++;
  }

  return {
    additions,
    deletions,
    unchanged,
    totalChanges: additions + deletions,
  };
}
