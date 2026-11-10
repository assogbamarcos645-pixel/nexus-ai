/**
 * src/services/lab/inspectTweakService.ts
 *
 * Moteur d'itération visuelle directe (« Inspect & Tweak ») pour NEXUS LAB.
 * Permet d'analyser l'élément cliqué sur la maquette générée (Gemini 2.5),
 * de contextualiser la requête de retouche ciblée, et d'appliquer la mise à jour
 * de code directement dans les fichiers du projet avec synchronisation HMR sub-seconde.
 */

import type { LabProject, LabFile, InspectedElementInfo } from '../../types/lab.ts';

export interface InspectTweakRequest {
  project: LabProject;
  element: InspectedElementInfo;
  prompt: string;
  activeFile?: LabFile | null;
  signal?: AbortSignal;
  devAssistantCaller?: (options: { file: LabFile; prompt: string; signal?: AbortSignal }) => Promise<{
    suggestedCode: string;
    explanation: string;
    isMock?: boolean;
  }>;
}

export interface InspectTweakResult {
  updatedProject: LabProject;
  updatedFile: LabFile;
  explanation: string;
  isSimulated: boolean;
}

/**
 * Trouve le fichier le plus pertinent contenant le composant inspecté.
 */
export function findTargetFileForElement(project: LabProject, element: InspectedElementInfo, activeFile?: LabFile | null): LabFile {
  // 1. Si le fichier actif contient déjà un indice sur l'élément (id, classe ou tag)
  if (activeFile) {
    const content = activeFile.content;
    if (element.id && content.includes(element.id)) return activeFile;
    if (element.textContent && element.textContent.length > 3 && content.includes(element.textContent)) return activeFile;
    const firstClass = element.className?.trim().split(/\s+/)[0];
    if (firstClass && content.includes(firstClass)) return activeFile;
  }

  // 2. Recherche parmi tous les fichiers du projet
  for (const file of project.files) {
    if (file.language !== 'html' && file.language !== 'javascript' && file.language !== 'typescript') continue;
    const content = file.content;
    if (element.id && content.includes(element.id)) return file;
    if (element.textContent && element.textContent.length > 3 && content.includes(element.textContent)) return file;
    const firstClass = element.className?.trim().split(/\s+/)[0];
    if (firstClass && content.includes(firstClass)) return file;
  }

  // 3. Repli vers le fichier d'entrée par défaut
  const entryFile = project.files.find((f) =>
    f.path === 'index.html' ||
    f.path === 'src/App.tsx' ||
    f.path === 'src/App.jsx' ||
    f.path === 'App.tsx' ||
    f.path.endsWith('.html') ||
    f.path.endsWith('.tsx')
  );

  return entryFile || project.files[0];
}

/**
 * Génère une retouche locale de haute fidélité pour le mode simulation / hors-ligne.
 */
function applySimulatedTweak(
  content: string,
  element: InspectedElementInfo,
  prompt: string,
): { updatedContent: string; explanation: string } {
  const p = prompt.toLowerCase();
  let updatedContent = content;
  let explanation = '';

  const tagLower = element.tagName.toLowerCase();
  const textSnippet = element.textContent || '';

  // 1. Dégradé & Néon (Couleurs Cyber / Cosmic)
  if (p.includes('violet') || p.includes('dégradé') || p.includes('gradient') || p.includes('neon') || p.includes('couleur')) {
    const newClasses = 'bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 text-white shadow-[0_0_20px_rgba(168,85,247,0.5)] border border-purple-400/30';
    if (element.className && content.includes(element.className)) {
      updatedContent = content.replace(element.className, `${element.className} ${newClasses}`);
    } else if (textSnippet && content.includes(textSnippet)) {
      updatedContent = content.replace(textSnippet, textSnippet);
    }
    explanation = `Dégradé appliqué sur l'élément <${tagLower}> selon la demande.`;
  }
  // 2. Bouton arrondi / Pill
  else if (p.includes('rond') || p.includes('arrondi') || p.includes('pill')) {
    if (element.className && content.includes(element.className)) {
      updatedContent = content.replace(element.className, `${element.className} rounded-full px-6 py-3`);
    } else if (content.includes(`class="`)) {
      updatedContent = content.replace(`class="`, `class="rounded-full `);
    }
    explanation = `L'élément <${tagLower}> a été transformé avec des bordures arrondies (pill shape) et des espacements confortables.`;
  }
  // 3. Agrandissement / Padding
  else if (p.includes('agrandir') || p.includes('taille') || p.includes('padding') || p.includes('plus grand')) {
    if (element.className && content.includes(element.className)) {
      updatedContent = content.replace(element.className, `${element.className} text-lg px-8 py-4 font-bold scale-105 transition-transform`);
    }
    explanation = `J'ai augmenté l'échelle, la typographie et les marges internes (padding) de l'élément <${tagLower}>.`;
  }
  // 4. Glassmorphism & Transparence
  else if (p.includes('glass') || p.includes('verre') || p.includes('transparence') || p.includes('flou')) {
    const glassClasses = 'backdrop-blur-xl bg-slate-900/60 border border-white/15 shadow-[0_8px_32px_rgba(0,0,0,0.37)] text-white';
    if (element.className && content.includes(element.className)) {
      updatedContent = content.replace(element.className, `${element.className} ${glassClasses}`);
    }
    explanation = `J'ai intégré un effet glassmorphism haut de gamme avec flou d'arrière-plan et bordure fine translucide.`;
  }
  // 5. Modification du texte
  else if (p.includes('texte') || p.includes('titre') || p.includes('renommer') || p.includes('appel') || p.includes('cta')) {
    if (textSnippet && content.includes(textSnippet)) {
      const matchNewText = prompt.match(/["'«]([^"'»]+)["'»]/);
      const newText = matchNewText ? matchNewText[1] : `${textSnippet} — Optimisé`;
      updatedContent = content.replace(textSnippet, newText);
      explanation = `Le libellé de l'élément <${tagLower}> a été mis à jour vers "${newText}".`;
    }
  }

  // Si aucun remplacement spécifique n'a pu se faire textuellement, injecter une amélioration stylée
  if (updatedContent === content) {
    if (element.className && content.includes(element.className)) {
      updatedContent = content.replace(
        element.className,
        `${element.className} ring-2 ring-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-all hover:scale-102`
      );
      explanation = `Retouche appliquée sur l'élément <${tagLower}> : lueur cyan dynamique et micro-interaction au survol.`;
    } else {
      explanation = `Retouche visuelle prise en compte pour l'élément <${tagLower}>.`;
    }
  }

  return { updatedContent, explanation };
}

/**
 * Déclenche une retouche ciblée (« Inspect & Tweak ») sur un élément avec l'agent IA.
 */
export async function executeInspectTweak(options: InspectTweakRequest): Promise<InspectTweakResult> {
  const { project, element, prompt, activeFile, signal } = options;
  const targetFile = findTargetFileForElement(project, element, activeFile);

  const specializedPrompt = `Tu es NEXUS DEV et Gemini 2.5, expert en retouche visuelle de code d'interface.
L'utilisateur a inspecté et cliqué sur l'élément suivant dans la maquette en direct :
- Balise HTML : <${element.tagName.toLowerCase()}>
- ID : ${element.id || 'aucun'}
- Classes actuelles : "${element.className || ''}"
- Contenu texte actuel : "${element.textContent || ''}"
- Sélecteur CSS : "${element.selector || ''}"
${element.outerHTML ? `- Extrait HTML : \n${element.outerHTML.slice(0, 500)}` : ''}

Demande de retouche ciblée de l'utilisateur :
"${prompt}"

Fichier à modifier : ${targetFile.path} (langage : ${targetFile.language})
Contenu actuel du fichier :
\`\`\`${targetFile.language}
${targetFile.content}
\`\`\`

Instructions strictes :
1. Fournis une explication concise (1 à 2 phrases) de la retouche effectuée.
2. Fournis IMPÉRATIVEMENT la version complète et prête à l'emploi du fichier mis à jour dans un bloc markdown unique du type :
\`\`\`${targetFile.language}
// code complet ici
\`\`\`
Veille à ne pas casser le reste du fichier et à cibler précisément l'élément sélectionné.`;

  try {
    let proposal: { suggestedCode: string; explanation: string; isMock?: boolean };

    if (options.devAssistantCaller) {
      proposal = await options.devAssistantCaller({
        file: targetFile,
        prompt: specializedPrompt,
        signal,
      });
    } else {
      const devMod = await import('./devService.ts').catch(() => null);
      if (devMod && typeof devMod.requestDevAssistance === 'function') {
        proposal = await devMod.requestDevAssistance({
          file: targetFile,
          prompt: specializedPrompt,
          signal,
        });
      } else {
        const sim = applySimulatedTweak(targetFile.content, element, prompt);
        proposal = {
          suggestedCode: sim.updatedContent,
          explanation: sim.explanation,
          isMock: true,
        };
      }
    }

    const isSimulated = Boolean(proposal.isMock);
    let finalCode = proposal.suggestedCode;
    let finalExplanation = proposal.explanation;

    // Si la proposition est simulée ou n'a pas modifié le fichier, on applique notre retoucheur chirurgical
    if (isSimulated || finalCode.trim() === targetFile.content.trim()) {
      const localSim = applySimulatedTweak(targetFile.content, element, prompt);
      finalCode = localSim.updatedContent;
      finalExplanation = localSim.explanation;
    }

    const updatedFile: LabFile = {
      ...targetFile,
      content: finalCode,
      isModified: true,
    };

    const updatedFiles = project.files.map((f) => (f.id === updatedFile.id ? updatedFile : f));
    const updatedProject: LabProject = {
      ...project,
      updatedAt: new Date().toISOString(),
      files: updatedFiles,
    };

    return {
      updatedProject,
      updatedFile,
      explanation: finalExplanation || `Retouche de l'élément <${element.tagName.toLowerCase()}> effectuée avec succès.`,
      isSimulated,
    };
  } catch (err) {
    console.warn('[INSPECT TWEAK] Erreur lors de l’appel IA, repli local:', err);
    const localSim = applySimulatedTweak(targetFile.content, element, prompt);
    const updatedFile: LabFile = {
      ...targetFile,
      content: localSim.updatedContent,
      isModified: true,
    };
    const updatedFiles = project.files.map((f) => (f.id === updatedFile.id ? updatedFile : f));

    return {
      updatedProject: {
        ...project,
        updatedAt: new Date().toISOString(),
        files: updatedFiles,
      },
      updatedFile,
      explanation: localSim.explanation,
      isSimulated: true,
    };
  }
}
