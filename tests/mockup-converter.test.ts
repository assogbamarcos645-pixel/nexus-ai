/**
 * tests/mockup-converter.test.ts
 *
 * Tests unitaires pour la fonctionnalité Vision Multimodale & Conversion de Maquettes en Code :
 * - Détection de projets extractibles (hasExtractableProject)
 * - Extraction et isolation des blocs de code HTML, CSS, JavaScript (extractCodeBundleFromMarkdown)
 * - Génération de projets complets pour NEXUS LAB (createAndOpenProjectFromMockup)
 * - Persistance et structure des fichiers du projet
 */

import test, { describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  hasExtractableProject,
  extractCodeBundleFromMarkdown,
  createAndOpenProjectFromMockup,
} from '../src/services/lab/mockupConverterService.ts';

// Mock simple de localStorage pour l'environnement Node
const memoryStorage: Record<string, string> = {};
globalThis.localStorage = {
  getItem: (key: string) => memoryStorage[key] || null,
  setItem: (key: string, value: string) => {
    memoryStorage[key] = value;
  },
  removeItem: (key: string) => {
    delete memoryStorage[key];
  },
  clear: () => {
    for (const key of Object.keys(memoryStorage)) {
      delete memoryStorage[key];
    }
  },
  length: 0,
  key: () => null,
} as unknown as Storage;

describe('Vision Multimodale — Détection de code extractible (hasExtractableProject)', () => {
  test('Renvoie false pour du texte simple sans balise ni bloc HTML', () => {
    assert.equal(hasExtractableProject(''), false);
    assert.equal(hasExtractableProject('Bonjour, comment puis-je vous aider ?'), false);
    assert.equal(hasExtractableProject('Voici une analyse textuelle de votre logo sans code.'), false);
  });

  test('Renvoie true lorsqu’un bloc ```html est présent dans le markdown', () => {
    const markdown = `
Voici le code correspondant à votre capture :
\`\`\`html
<!DOCTYPE html>
<html>
  <body class="bg-slate-900 text-white">
    <h1>Ma Dashboard</h1>
  </body>
</html>
\`\`\`
Vous pouvez le tester directement.`;
    assert.equal(hasExtractableProject(markdown), true);
  });

  test('Renvoie true lorsqu’un doctype ou des balises sémantiques sont présentes', () => {
    assert.equal(hasExtractableProject('<!DOCTYPE html><html><body>Salut</body></html>'), true);
    assert.equal(hasExtractableProject('<main class="container"><div class="card">Card</div></main>'), true);
  });
});

describe('Vision Multimodale — Extraction de code (extractCodeBundleFromMarkdown)', () => {
  test('Extrait proprement les 3 blocs HTML, CSS et JavaScript', () => {
    const markdown = `
# Analyse de la maquette
Voici les composants reconstruits :

\`\`\`html
<header class="navbar">
  <div class="logo">NEXUS</div>
  <button id="cta-btn">Action</button>
</header>
\`\`\`

Styles associés :
\`\`\`css
.navbar {
  display: flex;
  justify-content: space-between;
  padding: 1rem;
}
\`\`\`

Script d'interaction :
\`\`\`js
document.getElementById('cta-btn').addEventListener('click', () => alert('Hello'));
\`\`\`
`;

    const bundle = extractCodeBundleFromMarkdown(markdown);

    assert.ok(bundle.html.includes('<header class="navbar">'));
    assert.ok(bundle.css.includes('.navbar {'));
    assert.ok(bundle.js.includes("document.getElementById('cta-btn')"));
  });

  test('Applique des fallbacks robustes si CSS ou JS sont omis dans la réponse', () => {
    const markdown = `
\`\`\`html
<div class="hero">Simple Hero</div>
\`\`\`
`;

    const bundle = extractCodeBundleFromMarkdown(markdown);

    assert.equal(bundle.html, '<div class="hero">Simple Hero</div>');
    assert.ok(bundle.css.length > 0);
    assert.ok(bundle.css.includes('margin: 0'));
    assert.ok(bundle.js.length > 0);
    assert.ok(bundle.js.includes('[NEXUS LAB]'));
  });

  test('Fournit un squelette HTML moderne avec Tailwind si aucun bloc HTML valide n’est trouvé', () => {
    const bundle = extractCodeBundleFromMarkdown('Du texte explicatif sans bloc de code');

    assert.ok(bundle.html.includes('<!DOCTYPE html>'));
    assert.ok(bundle.html.includes('@tailwindcss/browser'));
    assert.ok(bundle.html.includes('style.css'));
    assert.ok(bundle.html.includes('app.js'));
  });
});

describe('Vision Multimodale — Création de projet NEXUS LAB (createAndOpenProjectFromMockup)', () => {
  beforeEach(() => {
    globalThis.localStorage.clear();
  });

  test('Génère un projet complet avec index.html, style.css et app.js', () => {
    const markdown = `
\`\`\`html
<main class="min-h-screen bg-slate-950 flex items-center justify-center">
  <h1 class="text-3xl font-bold text-cyan-400">Interface IA</h1>
</main>
\`\`\`
\`\`\`css
body { font-family: sans-serif; }
\`\`\`
\`\`\`js
console.log('App ready');
\`\`\`
`;

    const project = createAndOpenProjectFromMockup(markdown, 'Dashboard SaaS Analytique');

    assert.equal(project.name, 'Dashboard SaaS Analytique');
    assert.equal(project.templateId, 'html-css-js');
    assert.equal(project.files.length, 3);

    const htmlFile = project.files.find((f) => f.name === 'index.html');
    const cssFile = project.files.find((f) => f.name === 'style.css');
    const jsFile = project.files.find((f) => f.name === 'app.js');

    assert.ok(htmlFile);
    assert.ok(cssFile);
    assert.ok(jsFile);

    assert.ok(htmlFile?.content.includes('<main class="min-h-screen'));
    assert.ok(cssFile?.content.includes('font-family: sans-serif;'));
    assert.ok(jsFile?.content.includes('App ready'));
    assert.equal(htmlFile?.language, 'html');
    assert.equal(cssFile?.language, 'css');
    assert.equal(jsFile?.language, 'javascript');
  });

  test('Persiste le projet créé dans le stockage local et le rend immédiatement récupérable', () => {
    const markdown = `\`\`\`html\n<div>Test Storage</div>\n\`\`\``;
    const project = createAndOpenProjectFromMockup(markdown);

    const rawStored = globalThis.localStorage.getItem('nexus_lab_projects_v1');
    assert.ok(rawStored);
    const parsed = JSON.parse(rawStored);
    assert.ok(Array.isArray(parsed));
    assert.equal(parsed[0].id, project.id);
    assert.equal(parsed[0].files[0].name, 'index.html');
  });
});
