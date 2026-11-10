/**
 * src/services/lab/devService.ts
 *
 * Moteur d'assistance pour NEXUS DEV.
 * Réutilise la couche de service IA (aiService.ts) avec l'agent CodeX / NEXUS DEV.
 * Génère des propositions de code structurées avec explication et diff avant/après.
 */

import { chat } from '../ai/aiService.ts';
import type { LabFile, DevProposal } from '../../types/lab.ts';

export interface DevRequestOptions {
  file: LabFile;
  prompt: string;
  intent?: 'explain' | 'optimize' | 'fix' | 'refactor' | 'custom';
  signal?: AbortSignal;
  onChunk?: (chunk: string) => void;
}

/**
 * Génère des améliorations contextualisées en mode simulation
 * lorsque aucun backend LLM n'est raccordé.
 */
function generateSimulatedProposal(file: LabFile, prompt: string): { explanation: string; suggestedCode: string } {
  const content = file.content;
  const lang = file.language;

  let explanation = '';
  let suggestedCode = content;

  if (lang === 'html') {
    explanation = `J'ai analysé votre fichier **${file.name}**. J'ai amélioré l'accessibilité (attributs ARIA, balises sémantiques), optimisé les méta-données pour le responsive et ajouté une gestion gracieuse du thème Cosmic Intelligence.`;
    if (!content.includes('role=')) {
      suggestedCode = content.replace(
        '<main class="grid">',
        '<!-- NEXUS DEV: Amélioration accessibilité et sémantique -->\n    <main class="grid" role="main" aria-label="Tableau de bord principal">',
      );
    } else {
      suggestedCode = `<!-- Optimisé par NEXUS DEV -->\n` + content;
    }
  } else if (lang === 'javascript' || lang === 'typescript') {
    explanation = `J'ai inspecté la logique de **${file.name}**. J'ai ajouté des blocs de gestion d'erreurs (try/catch), sécurisé les accès DOM et renforcé la performance avec un nettoyage des écouteurs.`;
    if (content.includes('addEventListener')) {
      suggestedCode =
        `// [NEXUS DEV] Optimisation de la robustesse et gestion d'erreurs\n` +
        content.replace(
          /addEventListener\('click',\s*\(\)\s*=>\s*\{/,
          `addEventListener('click', () => {\n  try {`,
        ) +
        `\n// Fin du bloc sécurisé par NEXUS DEV`;
    } else {
      suggestedCode = `// [NEXUS DEV] Code typé et optimisé\n` + content;
    }
  } else if (lang === 'css') {
    explanation = `J'ai analysé vos styles dans **${file.name}**. J'ai optimisé les variables CSS pour le contraste et la fluidité des micro-interactions.`;
    suggestedCode = content + `\n\n/* [NEXUS DEV] Micro-interactions et lueur Cosmic */\n.btn:focus-visible {\n  outline: 2px solid var(--cyan);\n  outline-offset: 3px;\n}\n`;
  } else if (lang === 'python') {
    explanation = `J'ai examiné votre code Python dans **${file.name}**. J'ai ajouté du logging contextualisé et une gestion préventive des exceptions pour fiabiliser le service.`;
    suggestedCode =
      `# [NEXUS DEV] Fiabilisation et typage amélioré\nimport logging\nlogging.basicConfig(level=logging.INFO)\n\n` +
      content;
  } else if (lang === 'php') {
    explanation = `J'ai audité votre fichier PHP **${file.name}**. J'ai renforcé les en-têtes HTTP de sécurité (X-Content-Type-Options) et la gestion des exceptions.`;
    suggestedCode = content.replace(
      "header('Content-Type: application/json; charset=utf-8');",
      "header('Content-Type: application/json; charset=utf-8');\nheader('X-Content-Type-Options: nosniff');\nheader('X-Frame-Options: SAMEORIGIN');",
    );
  } else {
    explanation = `Analyse effectuée pour **${file.name}** selon votre demande : "${prompt}".`;
    suggestedCode = content;
  }

  return { explanation, suggestedCode };
}

/**
 * Envoie le fichier et la requête utilisateur à l'agent NEXUS DEV.
 * Raccordé directement à la couche IA réelle (Groq, OpenAI, Gemini) via chat().
 */
export async function requestDevAssistance(options: DevRequestOptions): Promise<DevProposal> {
  const { file, prompt, signal } = options;

  try {
    const fullPrompt = `Tu es NEXUS DEV, assistant expert en programmation et ingénierie logicielle.
Fichier actif : ${file.path} (langage : ${file.language})
Demande de l'utilisateur : ${prompt}

Contenu actuel du fichier :
\`\`\`${file.language}
${file.content}
\`\`\`

Instructions de réponse :
1. Si la demande implique d'ajouter, modifier, corriger ou optimiser le code du fichier, fournis d'abord une explication concise de tes modifications. Ensuite, fournis IMPÉRATIVEMENT la version complète et prête à l'emploi du code dans un bloc markdown unique du type :
\`\`\`${file.language}
// code complet modifié ici
\`\`\`
2. Si la demande est une simple question d'analyse ou d'explication sans modification requise sur le code du fichier, fournis ton explication détaillée sans répéter le bloc de code complet.`;

    const response = await chat(
      {
        message: fullPrompt,
        agentId: 'coder',
        onChunk: options.onChunk,
      },
      signal,
    );

    // Extraction robuste du bloc de code (supporte les retours Windows \r\n et sans langage strict)
    const codeBlockMatch = response.content.match(/```[\w-]*\r?\n([\s\S]*?)```/);
    const suggestedCode = codeBlockMatch ? codeBlockMatch[1].trim() : file.content;
    const explanation = response.content.replace(/```[\w-]*\r?\n[\s\S]*?```/g, '').trim();

    return {
      id: `proposal-${Date.now()}`,
      filePath: file.path,
      explanation: explanation || response.content || 'Analyse effectuée avec succès.',
      originalCode: file.content,
      suggestedCode,
      timestamp: new Date(),
      isMock: Boolean(response.isSimulated),
    };
  } catch (err) {
    console.warn('[NEXUS DEV] Appel moteur IA échoué, repli sur la démonstration locale:', err);
    const sim = generateSimulatedProposal(file, prompt);
    if (options.onChunk) {
      options.onChunk(sim.explanation);
    }
    return {
      id: `proposal-mock-${Date.now()}`,
      filePath: file.path,
      explanation: sim.explanation,
      originalCode: file.content,
      suggestedCode: sim.suggestedCode,
      timestamp: new Date(),
      isMock: true,
    };
  }
}
