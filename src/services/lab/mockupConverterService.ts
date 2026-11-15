/**
 * src/services/lab/mockupConverterService.ts
 *
 * Service de conversion automatique de maquettes et captures d'écran en projets NEXUS LAB.
 * Analyse les blocs de code générés par le moteur multimodal (Gemini 2.5),
 * extrait et assemble les fichiers (HTML/CSS/JS), initialise le projet dans le stockage local
 * et déclenche la navigation immédiate vers le LAB.
 */

import type { LabProject, LabFile } from '../../types/lab.ts';
import { loadProjectsFromStorage, saveProjectsToStorage } from './projectService.ts';
import { generateUUID } from '../../utils/uuid.ts';

export interface ExtractedCodeBundle {
  html: string;
  css: string;
  js: string;
}

/**
 * Détecte si un message de réponse contient du code exploitable pour générer un projet LAB.
 */
export function hasExtractableProject(content: string): boolean {
  if (!content || typeof content !== 'string') return false;
  // Détection de tout bloc de code (HTML, TS, TSX, JS, CSS, Python, etc.)
  const hasCodeBlock = /```(?:html|typescript|ts|tsx|javascript|js|jsx|css|py|python|json|sql)[\s\S]*?```/i.test(content);
  const hasRawHtml = /<!DOCTYPE html>/i.test(content) || /<header|<main|<div|<section/i.test(content);
  return hasCodeBlock || hasRawHtml;
}

/**
 * Extrait les blocs de code HTML, CSS et JavaScript d'un message markdown.
 */
export function extractCodeBundleFromMarkdown(markdown: string): ExtractedCodeBundle {
  let html = '';
  let css = '';
  let js = '';

  // 1. Extraction HTML
  const htmlMatch = markdown.match(/```html\r?\n([\s\S]*?)```/i);
  if (htmlMatch) {
    html = htmlMatch[1].trim();
  } else {
    // Tentative de détection directe de balises HTML si pas de bloc markdown strict
    const tagMatch = markdown.match(/(<!DOCTYPE[\s\S]*?<\/html>)/i);
    if (tagMatch) {
      html = tagMatch[1].trim();
    }
  }

  // 2. Extraction CSS
  const cssMatch = markdown.match(/```css\r?\n([\s\S]*?)```/i);
  if (cssMatch) {
    css = cssMatch[1].trim();
  } else {
    css = `/* Styles générés par NEXUS Multimodal Vision */\nbody {\n  margin: 0;\n  background-color: #070714;\n}\n`;
  }

  // 3. Extraction JavaScript
  const jsMatch = markdown.match(/```(?:javascript|js)\r?\n([\s\S]*?)```/i);
  if (jsMatch) {
    js = jsMatch[1].trim();
  } else {
    js = `// Interactions dynamiques de la maquette convertie\nconsole.log('[NEXUS LAB] Interface initialisée avec succès.');\n`;
  }

  // Si aucun HTML n'a été détecté mais que du markdown existe, construire un squelette valide
  if (!html) {
    html = `<!DOCTYPE html>
<html lang="fr" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Maquette Convertie</title>
  <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
  <link rel="stylesheet" href="style.css">
</head>
<body class="bg-slate-950 text-white min-h-screen p-8">
  <div class="max-w-4xl mx-auto">
    <h1 class="text-2xl font-bold mb-4">Projet issu de la Maquette</h1>
    <p class="text-slate-400">Interface générée par Vision Multimodale.</p>
  </div>
  <script src="app.js"></script>
</body>
</html>`;
  }

  return { html, css, js };
}

/**
 * Crée un projet NEXUS LAB à partir des codes extraits, l'enregistre en local
 * et diffuse l'événement de navigation.
 */
export function createAndOpenProjectFromMockup(
  messageContent: string,
  projectName?: string,
  mockupImage?: string,
): LabProject {
  const projectId = generateUUID();
  const timestamp = new Date().toISOString();

  // Détection des différents blocs de code
  const pythonMatch = messageContent.match(/```(?:python|py)\r?\n([\s\S]*?)```/i);
  const tsxMatch = messageContent.match(/```(?:tsx|jsx)\r?\n([\s\S]*?)```/i);
  const tsMatch = messageContent.match(/```(?:typescript|ts)\r?\n([\s\S]*?)```/i);

  let templateId: any = 'html-css-js';
  const files: LabFile[] = [];

  if (pythonMatch) {
    templateId = 'python-app';
    files.push({
      id: `file-${generateUUID()}`,
      name: 'main.py',
      path: 'main.py',
      content: pythonMatch[1].trim(),
      language: 'python',
      isModified: false,
    });
  } else if (tsxMatch || tsMatch) {
    const rawCode = (tsxMatch ? tsxMatch[1] : tsMatch ? tsMatch[1] : '').trim();
    const isReact = /import React|useState|useEffect|return\s*\(|</.test(rawCode);

    if (isReact) {
      templateId = 'html-css-js';
      // Enveloppe HTML avec support React et Babel/Tailwind pour exécution instantanée dans la preview
      const htmlWrapper = `<!DOCTYPE html>
<html lang="fr" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Projet React NEXUS LAB</title>
  <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
  <script src="https://unpkg.com/react@18/umd/react.development.js" crossorigin></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js" crossorigin></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <link rel="stylesheet" href="style.css">
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen">
  <div id="root"></div>
  <script type="text/babel">
    ${rawCode.replace(/export\s+default\s+function\s+([A-Za-z0-9_]+)/, 'function $1')}
    
    // Montage automatique du composant React
    const rootElement = document.getElementById('root');
    if (rootElement) {
      const root = ReactDOM.createRoot(rootElement);
      // Trouve le premier composant défini
      const targetComponent = typeof App !== 'undefined' ? App : (typeof Component !== 'undefined' ? Component : null);
      if (targetComponent) {
        root.render(React.createElement(targetComponent));
      }
    }
  </script>
</body>
</html>`;

      files.push(
        {
          id: `file-${generateUUID()}`,
          name: 'index.html',
          path: 'index.html',
          content: htmlWrapper,
          language: 'html',
          isModified: false,
        },
        {
          id: `file-${generateUUID()}`,
          name: 'Component.tsx',
          path: 'Component.tsx',
          content: rawCode,
          language: 'typescript',
          isModified: false,
        },
        {
          id: `file-${generateUUID()}`,
          name: 'style.css',
          path: 'style.css',
          content: '/* Styles globaux NEXUS LAB */\nbody { margin: 0; font-family: system-ui, sans-serif; }\n',
          language: 'css',
          isModified: false,
        },
      );
    } else {
      const bundle = extractCodeBundleFromMarkdown(messageContent);
      files.push(
        {
          id: `file-${generateUUID()}`,
          name: 'index.html',
          path: 'index.html',
          content: bundle.html,
          language: 'html',
          isModified: false,
        },
        {
          id: `file-${generateUUID()}`,
          name: 'index.ts',
          path: 'index.ts',
          content: rawCode,
          language: 'typescript',
          isModified: false,
        },
        {
          id: `file-${generateUUID()}`,
          name: 'style.css',
          path: 'style.css',
          content: bundle.css,
          language: 'css',
          isModified: false,
        },
      );
    }
  } else {
    const bundle = extractCodeBundleFromMarkdown(messageContent);
    files.push(
      {
        id: `file-${generateUUID()}`,
        name: 'index.html',
        path: 'index.html',
        content: bundle.html,
        language: 'html',
        isModified: false,
      },
      {
        id: `file-${generateUUID()}`,
        name: 'style.css',
        path: 'style.css',
        content: bundle.css,
        language: 'css',
        isModified: false,
      },
      {
        id: `file-${generateUUID()}`,
        name: 'app.js',
        path: 'app.js',
        content: bundle.js,
        language: 'javascript',
        isModified: false,
      },
    );
  }

  const newProject: LabProject = {
    id: projectId,
    name: projectName?.trim() || `Projet NEXUS LAB #${Math.floor(100 + Math.random() * 900)}`,
    description: 'Projet généré par NEXUS AI avec code prêt pour compilation & prévisualisation',
    templateId,
    files,
    createdAt: timestamp,
    updatedAt: timestamp,
    isDemo: false,
    mockupImage: mockupImage || undefined,
  };

  // Enregistrement dans le stockage local des projets
  const existing = loadProjectsFromStorage();
  const updated = [newProject, ...existing];
  saveProjectsToStorage(updated);

  // Émission de l'événement global pour basculer vers NEXUS LAB
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('nexus-open-project', {
        detail: { projectId: newProject.id },
      }),
    );
  }

  return newProject;
}
