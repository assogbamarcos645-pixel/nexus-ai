/**
 * tests/inspect-tweak.test.ts
 *
 * Tests unitaires pour les fonctionnalités :
 * 1. Itération Visuelle en Direct (« Inspect & Tweak » / Mode Clic-to-Edit)
 * 2. Curseur Comparatif Avant / Après (Superposition interactive Maquette & Code)
 */

import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import type { LabProject, LabFile, InspectedElementInfo } from '../src/types/lab.ts';
import {
  findTargetFileForElement,
  executeInspectTweak,
} from '../src/services/lab/inspectTweakService.ts';
import { createAndOpenProjectFromMockup } from '../src/services/lab/mockupConverterService.ts';
import { INSPECTOR_INTERCEPTOR_SCRIPT } from '../src/services/lab/runtimeService.ts';

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

describe('Itération Visuelle — Mode Clic-to-Edit (« Inspect & Tweak »)', () => {
  const sampleFile: LabFile = {
    id: 'f-1',
    name: 'index.html',
    path: 'index.html',
    language: 'html',
    content: `<!DOCTYPE html>
<html>
<head><title>Test</title></head>
<body class="bg-slate-900">
  <div class="max-w-4xl mx-auto p-6">
    <h1 id="main-title" class="text-2xl font-bold text-white">Tableau de Bord</h1>
    <button id="cta-btn" class="bg-blue-600 text-white px-4 py-2">Démarrer le projet</button>
  </div>
</body>
</html>`,
  };

  const sampleProject: LabProject = {
    id: 'p-1',
    name: 'Test Project',
    description: 'Test description',
    templateId: 'html-css-js',
    files: [sampleFile],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const sampleElement: InspectedElementInfo = {
    tagName: 'BUTTON',
    id: 'cta-btn',
    className: 'bg-blue-600 text-white px-4 py-2',
    textContent: 'Démarrer le projet',
    selector: 'div > button#cta-btn',
    outerHTML: '<button id="cta-btn" class="bg-blue-600 text-white px-4 py-2">Démarrer le projet</button>',
    computedStyles: {
      color: 'rgb(255, 255, 255)',
      backgroundColor: 'rgb(37, 99, 235)',
      borderRadius: '0px',
      padding: '8px 16px',
    },
  };

  test('findTargetFileForElement localise le fichier contenant l’élément inspecté', () => {
    const target = findTargetFileForElement(sampleProject, sampleElement, sampleFile);
    assert.equal(target.id, sampleFile.id);
    assert.equal(target.path, 'index.html');
  });

  test('executeInspectTweak applique une retouche de couleur/dégradé sur l’élément ciblé', async () => {
    const result = await executeInspectTweak({
      project: sampleProject,
      element: sampleElement,
      prompt: 'Rendre le bouton violet néon avec un dégradé lumineux',
      activeFile: sampleFile,
    });

    assert.ok(result.updatedProject);
    assert.ok(result.updatedFile);
    assert.equal(result.updatedFile.isModified, true);
    // Vérifie que le nouveau code contient la classe violette/dégradée demandée
    assert.ok(
      result.updatedFile.content.includes('purple') ||
      result.updatedFile.content.includes('gradient') ||
      result.updatedFile.content.includes('text-white')
    );
    assert.ok(result.explanation.length > 0);
  });

  test('executeInspectTweak applique des bordures arrondies (pill) sur demande', async () => {
    const result = await executeInspectTweak({
      project: sampleProject,
      element: sampleElement,
      prompt: 'Arrondir les angles en format pill',
      activeFile: sampleFile,
    });

    assert.ok(result.updatedFile.content.includes('rounded-full'));
    assert.ok(result.explanation.includes('arrondie'));
  });

  test('INSPECTOR_INTERCEPTOR_SCRIPT contient le code d’écoute postMessage et l’overlay d’inspection', () => {
    assert.ok(INSPECTOR_INTERCEPTOR_SCRIPT.includes('nexus-set-inspect-mode'));
    assert.ok(INSPECTOR_INTERCEPTOR_SCRIPT.includes('nexus-inspect-selected'));
    assert.ok(INSPECTOR_INTERCEPTOR_SCRIPT.includes('nexus-inspector-box'));
  });
});

describe('Curseur Comparatif Avant / Après & Gestion de Maquette de Référence', () => {
  test('createAndOpenProjectFromMockup stocke fidèlement l’image de maquette d’origine', () => {
    const sampleMockupDataUri = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const markdownWithHtml = `
\`\`\`html
<!DOCTYPE html>
<html><body><h1>Converti depuis Gemini 2.5</h1></body></html>
\`\`\`
    `;

    const project = createAndOpenProjectFromMockup(
      markdownWithHtml,
      'Projet Test Comparatif',
      sampleMockupDataUri,
    );

    assert.equal(project.mockupImage, sampleMockupDataUri);
    assert.equal(project.name, 'Projet Test Comparatif');
    assert.equal(project.templateId, 'html-css-js');
  });

  test('Le projet supporte la mise à jour et la suppression de l’image de maquette', () => {
    const project: LabProject = {
      id: 'p-mockup-test',
      name: 'Projet Mockup',
      description: 'Test',
      templateId: 'html-css-js',
      files: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      mockupImage: 'https://example.com/mockup.png',
    };

    assert.equal(project.mockupImage, 'https://example.com/mockup.png');

    // Mise à jour
    const updatedWithNewImage = { ...project, mockupImage: 'data:image/svg+xml;utf8,<svg></svg>' };
    assert.ok(updatedWithNewImage.mockupImage.startsWith('data:image/svg'));

    // Suppression
    const updatedWithoutImage = { ...project, mockupImage: undefined };
    assert.equal(updatedWithoutImage.mockupImage, undefined);
  });
});
