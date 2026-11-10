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
  const hasHtml = /```html[\s\S]*?```/i.test(content) || /<!DOCTYPE html>/i.test(content) || /<header|<main|<div/i.test(content);
  return hasHtml;
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
  const bundle = extractCodeBundleFromMarkdown(messageContent);
  const projectId = generateUUID();
  const timestamp = new Date().toISOString();

  const files: LabFile[] = [
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
  ];

  const newProject: LabProject = {
    id: projectId,
    name: projectName?.trim() || `Maquette UI #${Math.floor(100 + Math.random() * 900)}`,
    description: 'Projet généré automatiquement via Vision Multimodale & Gemini 2.5',
    templateId: 'html-css-js',
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
