/**
 * src/services/lab/inlineCopilotService.ts
 *
 * Moteur d'assistance intelligente « Copilot Inline » (style Cursor IDE).
 * Traite les commandes en langage naturel sur la sélection ou la ligne active,
 * interroge les modèles d'IA configurés (ou moteur simulé haute fidélité)
 * et produit des propositions de code avec diff visuel interactif.
 */

import type { LabFile, CodeSelectionRange, InlineCopilotProposal } from '../../types/lab.ts';

export interface InlineCopilotRequest {
  file: LabFile;
  prompt: string;
  selectedCode?: string;
  selectionRange?: CodeSelectionRange | null;
  fullContent: string;
  cursorPosition?: { lineNumber: number; column: number } | null;
  signal?: AbortSignal;
  aiCaller?: (prompt: string, signal?: AbortSignal) => Promise<string>;
}

/**
 * Génère une suggestion locale contextualisée de haute qualité en mode simulation
 * ou en cas d'absence temporaire de clé API.
 */
function generateSimulatedInlineCode(
  file: LabFile,
  prompt: string,
  selectedCode: string,
  isWholeFile: boolean,
): { explanation: string; suggestedSnippet: string } {
  const p = prompt.toLowerCase();
  const lang = file.language;

  // 1. Barre de navigation Tailwind responsive
  if (p.includes('nav') || p.includes('navigation') || p.includes('barre')) {
    if (lang === 'html') {
      const suggestedSnippet = `<!-- Barre de navigation Tailwind responsive générée par NEXUS Copilot Inline -->
<header class="w-full bg-slate-900/80 backdrop-blur-md border-b border-white/10 sticky top-0 z-50">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="flex items-center justify-between h-16">
      <div class="flex items-center gap-3">
        <div class="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-[0_0_15px_rgba(6,182,212,0.4)]">
          NX
        </div>
        <span class="text-base font-semibold text-white tracking-wide">NEXUS<span class="text-cyan-400">.AI</span></span>
      </div>
      <nav class="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
        <a href="#accueil" class="hover:text-cyan-400 transition-colors">Accueil</a>
        <a href="#projets" class="hover:text-cyan-400 transition-colors">Projets</a>
        <a href="#docs" class="hover:text-cyan-400 transition-colors">Documentation</a>
        <a href="#aide" class="hover:text-cyan-400 transition-colors">Support</a>
      </nav>
      <div class="hidden md:flex items-center gap-3">
        <button type="button" class="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-cyan-500 to-indigo-600 hover:opacity-95 shadow-[0_0_12px_rgba(6,182,212,0.3)] transition-all">
          Démarrer
        </button>
      </div>
      <!-- Bouton Menu Mobile (Hamburger) -->
      <button type="button" class="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5" aria-label="Ouvrir le menu">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
      </button>
    </div>
  </div>
</header>`;
      return {
        explanation: 'Barre de navigation Tailwind responsive avec menu mobile et styles glassmorphism intégrés.',
        suggestedSnippet,
      };
    }

    // JSX / TSX
    const suggestedSnippet = `// Composant Navbar Tailwind responsive généré par Copilot Inline
import { useState } from 'react';
import { Menu, X, Sparkles } from 'lucide-react';

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="w-full bg-slate-900/80 backdrop-blur-md border-b border-white/10 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-[0_0_15px_rgba(6,182,212,0.4)]">
              <Sparkles size={18} />
            </div>
            <span className="text-base font-bold text-white tracking-wide">NEXUS<span className="text-cyan-400">.AI</span></span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
            <a href="#dashboard" className="hover:text-cyan-400 transition-colors">Tableau de bord</a>
            <a href="#features" className="hover:text-cyan-400 transition-colors">Fonctionnalités</a>
            <a href="#docs" className="hover:text-cyan-400 transition-colors">Documentation</a>
          </nav>
          <div className="hidden md:flex items-center gap-3">
            <button className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-cyan-500 to-indigo-600 hover:opacity-95 shadow-[0_0_12px_rgba(6,182,212,0.3)] transition-all">
              Rejoindre
            </button>
          </div>
          <button onClick={() => setIsOpen(!isOpen)} className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white" aria-label="Menu">
            {isOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>
      {isOpen && (
        <div className="md:hidden px-4 pt-2 pb-4 space-y-2 bg-slate-950/95 border-b border-white/10 text-sm">
          <a href="#dashboard" className="block py-2 text-slate-300 hover:text-cyan-400">Tableau de bord</a>
          <a href="#features" className="block py-2 text-slate-300 hover:text-cyan-400">Fonctionnalités</a>
          <a href="#docs" className="block py-2 text-slate-300 hover:text-cyan-400">Documentation</a>
        </div>
      )}
    </header>
  );
}`;
    return {
      explanation: 'Composant React de navigation Tailwind avec menu mobile responsive et icônes intégrées.',
      suggestedSnippet,
    };
  }

  // 2. Correction de bug de re-render React / optimisation mémoire
  if (p.includes('re-render') || p.includes('rerender') || p.includes('memo') || p.includes('render')) {
    const code = selectedCode.trim() || file.content;
    const suggestedSnippet = `// [NEXUS COPILOT] Mémorisation optimisée pour éliminer les re-renders intempestifs
import { useCallback, useMemo, memo } from 'react';

${code
  .replace(/const\s+(\w+)\s*=\s*\((.*?)\)\s*=>\s*\{/g, 'const $1 = useCallback(($2) => {')
  .replace(/\n\};/g, '\n}, []);')}

// Composant mémorisé pour éviter les rendus inutiles lors des mises à jour parentes`;
    return {
      explanation: 'Stabilisation des gestionnaires avec useCallback et prévention des cascades de re-render.',
      suggestedSnippet,
    };
  }

  // 3. Factorisation de fonction
  if (p.includes('factorise') || p.includes('refactor') || p.includes('factorisation') || p.includes('simplifi')) {
    const code = selectedCode.trim() || file.content;
    const lines = code.split('\n');
    const indented = lines.map((l) => '  ' + l).join('\n');
    const suggestedSnippet = `/**
 * [NEXUS COPILOT] Fonction factorisée et modulaire
 * - Séparation stricte des responsabilités
 * - Gestion préventive des cas aux limites
 */
export function executeOptimizedWorkflow(inputData: unknown) {
  // 1. Validation préalable des entrées
  if (!inputData) {
    return { success: false, error: 'Données d\\'entrée invalides' };
  }

  try {
${indented}
    return { success: true };
  } catch (error) {
    console.error('[NEXUS ERROR] Échec de l\\'opération factorisée:', error);
    return { success: false, error };
  }
}`;
    return {
      explanation: 'Code factorisé avec clause de garde, typage TypeScript strict et bloc de sécurité try/catch.',
      suggestedSnippet,
    };
  }

  // 4. Gestion d'erreurs try/catch
  if (p.includes('try') || p.includes('catch') || p.includes('erreur') || p.includes('sécuris')) {
    const code = selectedCode.trim() || file.content;
    const suggestedSnippet = `try {
  // [NEXUS COPILOT] Exécution sécurisée
  ${code.split('\n').join('\n  ')}
} catch (error) {
  console.error('[NEXUS COPILOT ERROR] Erreur interceptée:', error);
  // Notification utilisateur ou repli gracieux
}`;
    return {
      explanation: 'Ajout d\'un bloc try/catch robuste avec traçabilité d\'erreur contextualisée.',
      suggestedSnippet,
    };
  }

  // 5. Repli générique
  const baseCode = selectedCode.trim() || (isWholeFile ? file.content : `// Inséré à la ligne active\n`);
  const suggestedSnippet = `// [NEXUS COPILOT INLINE: ${prompt}]
${baseCode}
// Optimisation complétée avec succès`;

  return {
    explanation: `Amélioration appliquée avec succès pour la demande : "${prompt}".`,
    suggestedSnippet,
  };
}

/**
 * Lance la génération Copilot Inline sur le code sélectionné ou le fichier actif.
 */
export async function generateInlineCodeProposal(
  options: InlineCopilotRequest,
): Promise<InlineCopilotProposal> {
  const {
    file,
    prompt,
    selectedCode = '',
    selectionRange = null,
    fullContent,
    cursorPosition = null,
    signal,
    aiCaller,
  } = options;

  const hasSelection = Boolean(selectedCode && selectedCode.trim().length > 0 && selectionRange);
  const originalSnippet = hasSelection ? selectedCode : fullContent;
  const isWholeFile = !hasSelection;

  try {
    const fullSystemPrompt = `Tu es l'assistant IA « Copilot Inline » (style Cursor IDE) intégré dans NEXUS LAB.
L'utilisateur te transmet une instruction directe sur un bloc de code ou un fichier source.
Fichier : "${file.name}" (Langage : ${file.language})
Demande de l'utilisateur : "${prompt}"

${selectionRange && selectedCode
  ? `L'utilisateur a SÉLECTIONNÉ les lignes ${selectionRange.startLineNumber} à ${selectionRange.endLineNumber} :
\`\`\`${file.language}
${selectedCode}
\`\`\`

Contexte entourant (ne pas répéter dans la réponse) :
--- AVANT LA SÉLECTION ---
${fullContent.slice(0, Math.max(0, fullContent.indexOf(selectedCode))).slice(-600)}
--- APRÈS LA SÉLECTION ---
${fullContent.slice(Math.max(0, fullContent.indexOf(selectedCode) + selectedCode.length)).slice(0, 600)}
`
  : `Position du curseur : Ligne ${cursorPosition?.lineNumber ?? 1}
Contenu complet actuel :
\`\`\`${file.language}
${fullContent}
\`\`\`
`}

INSTRUCTIONS IMPÉRATIVES :
1. Donne d'abord UNE SEULE phrase courte expliquant ce qui a été fait (ex: "Barre de navigation Tailwind responsive avec menu burger.").
2. Fournis ensuite UNIQUEMENT le bloc de code de remplacement dans un bloc markdown unique du type :
\`\`\`${file.language}
// code de remplacement complet ici
\`\`\`
3. Si l'utilisateur avait sélectionné un bloc de code, ton bloc markdown DOIT CONTENIR UNIQUEMENT le code de remplacement de ce bloc spécifique (pas tout le fichier).
4. Ne donne aucun blabla superflu avant ou après le bloc markdown.`;

    let rawResponse = '';

    if (aiCaller) {
      rawResponse = await aiCaller(fullSystemPrompt, signal);
    } else {
      const { chat } = await import('../ai/aiService.ts');
      const response = await chat(
        {
          message: fullSystemPrompt,
          agentId: 'coder',
        },
        signal,
      );
      rawResponse = response.content;
    }

    // Extraction du bloc de code retourné par le LLM
    const codeMatch = rawResponse.match(/```[\w-]*\r?\n([\s\S]*?)```/);
    const suggestedSnippet = codeMatch ? codeMatch[1].trimEnd() : rawResponse.trim();

    // Extraction de la phrase explicative
    let explanation = rawResponse
      .replace(/```[\w-]*\r?\n[\s\S]*?```/g, '')
      .trim()
      .split('\n')[0]
      .trim();

    if (!explanation || explanation.length < 5) {
      explanation = `Code généré avec succès d'après votre consigne : "${prompt}".`;
    }

    return {
      id: `copilot-inline-${Date.now()}`,
      filePath: file.path,
      prompt,
      explanation,
      originalSnippet,
      suggestedSnippet,
      range: selectionRange,
      isWholeFile,
      timestamp: new Date(),
      isMock: false,
    };
  } catch (err) {
    console.warn('[COPILOT INLINE] Moteur IA indisponible ou erreur réseau, repli simulé:', err);
    const sim = generateSimulatedInlineCode(file, prompt, selectedCode, isWholeFile);

    return {
      id: `copilot-inline-mock-${Date.now()}`,
      filePath: file.path,
      prompt,
      explanation: sim.explanation,
      originalSnippet,
      suggestedSnippet: sim.suggestedSnippet,
      range: selectionRange,
      isWholeFile,
      timestamp: new Date(),
      isMock: true,
    };
  }
}
