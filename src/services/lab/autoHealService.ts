/**
 * src/services/lab/autoHealService.ts
 *
 * Moteur de diagnostic et d'auto-réparation (Auto-Heal) pour NEXUS LAB.
 * Intercepte les erreurs d'exécution (runtime, React, syntaxe, promesses non gérées)
 * survenant dans le panneau d'aperçu et génère automatiquement un correctif ciblé via l'IA CodeX.
 */

import type { LabProject, LabFile, DevProposal } from '../../types/lab.ts';
import { requestDevAssistance } from './devService.ts';

export interface AutoHealErrorDetails {
  message: string;
  stack?: string;
  filename?: string;
  lineno?: number;
}

export interface AutoHealResult {
  targetFile: LabFile;
  proposal: DevProposal;
  diagnostics: string;
}

/**
 * Identifie le fichier source le plus probable associé à l'erreur.
 */
export function identifyFailingFile(project: LabProject, error: AutoHealErrorDetails): LabFile {
  const files = project.files;
  if (!files || files.length === 0) {
    throw new Error('Le projet ne contient aucun fichier.');
  }

  // 1. Recherche par nom de fichier dans la stack trace ou le nom fourni
  if (error.filename) {
    const cleanFilename = error.filename.split('/').pop()?.split('\\').pop()?.split('?')[0];
    if (cleanFilename) {
      const match = files.find(
        (f) => f.name.toLowerCase() === cleanFilename.toLowerCase() || f.path.toLowerCase().endsWith(cleanFilename.toLowerCase()),
      );
      if (match) return match;
    }
  }

  if (error.stack) {
    let bestMatch: LabFile | null = null;
    let earliestIndex = Infinity;

    for (const f of files) {
      if (f.name) {
        const idx = error.stack.indexOf(f.name);
        if (idx !== -1 && idx < earliestIndex) {
          earliestIndex = idx;
          bestMatch = f;
        }
      }
    }
    if (bestMatch) {
      return bestMatch;
    }
  }

  // 2. Recherche du composant principal selon le template
  const priorityPaths = [
    'src/App.tsx',
    'src/App.jsx',
    'App.tsx',
    'App.jsx',
    'src/index.tsx',
    'src/main.tsx',
    'index.html',
    'script.js',
    'main.js',
    'app.py',
    'index.php',
  ];

  for (const p of priorityPaths) {
    const found = files.find((f) => f.path.toLowerCase() === p.toLowerCase() || f.name.toLowerCase() === p.toLowerCase());
    if (found) return found;
  }

  // Fallback : premier fichier de code trouvé
  const codeFile = files.find((f) => ['typescript', 'javascript', 'html', 'python', 'php'].includes(f.language));
  return codeFile || files[0];
}

/**
 * Lance le diagnostic chirurgical et génère le correctif Auto-Heal prêt à l'emploi.
 */
export async function diagnoseAndHealError(
  project: LabProject,
  error: AutoHealErrorDetails,
  onChunk?: (chunk: string) => void,
  signal?: AbortSignal,
): Promise<AutoHealResult> {
  const targetFile = identifyFailingFile(project, error);

  const errorSummary = error.message || 'Erreur d’exécution indéterminée';
  const stackSnippet = error.stack ? `\nStack trace :\n${error.stack.slice(0, 1000)}` : '';
  const lineInfo = error.lineno ? ` (ligne détectée : ${error.lineno})` : '';

  const healPrompt = `URGENT - RÉPARATION DU CODE RUNTIME (AUTO-HEAL) :
Une erreur d'exécution s'est produite dans le panneau d'aperçu de l'application :
Message d'erreur : "${errorSummary}"${lineInfo}${stackSnippet}

Fichier source incriminé : "${targetFile.path}"

MISSION DE RÉPARATION :
1. Analyse la cause racine de cette erreur (syntaxe, import manquant, variable non définie, hook React invalide, etc.).
2. Explique brièvement l'origine du problème en 2 phrases claires.
3. Fournis le code COMPLET, corrigé et prêt à l'emploi pour le fichier "${targetFile.path}".`;

  const proposal = await requestDevAssistance({
    file: targetFile,
    prompt: healPrompt,
    intent: 'fix',
    onChunk,
    signal,
  });

  return {
    targetFile,
    proposal: {
      ...proposal,
      explanation: `**Auto-Heal Appliqué :** Correction de l'erreur \`${errorSummary.slice(0, 80)}\`.\n\n${proposal.explanation}`,
    },
    diagnostics: errorSummary,
  };
}
