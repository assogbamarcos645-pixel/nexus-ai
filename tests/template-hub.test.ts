/**
 * tests/template-hub.test.ts
 *
 * Tests unitaires pour le Hub de Templates Modernes (#3).
 * Vérifie l’intégrité des 6 nouveaux modèles et leur compatibilité avec le moteur de projet.
 */

import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import { LAB_TEMPLATES } from '../src/config/labTemplates.ts';
import { MODERN_TEMPLATES } from '../src/config/modernTemplates.ts';
import { createProjectFromTemplate } from '../src/services/lab/projectService.ts';
import type { ProjectTemplateId } from '../src/types/lab.ts';

describe('NEXUS LAB — Hub de Templates Modernes (#3)', () => {
  const expectedNewTemplateIds: ProjectTemplateId[] = [
    'saas-dashboard',
    'ecommerce-store',
    'ai-studio',
    'portfolio-cosmic',
    'landing-page',
    'markdown-blog',
  ];

  test('Le catalogue complet contient tous les modèles attendus', () => {
    assert.ok(LAB_TEMPLATES.length >= 11);
    for (const expectedId of expectedNewTemplateIds) {
      const found = LAB_TEMPLATES.find((t) => t.id === expectedId);
      assert.ok(found, `Le modèle "${expectedId}" doit être présent dans LAB_TEMPLATES`);
    }
  });

  test('Chaque modèle moderne est richement structuré avec fichiers et métadonnées', () => {
    for (const tmpl of MODERN_TEMPLATES) {
      assert.ok(tmpl.id, 'Chaque template doit avoir un id');
      assert.ok(tmpl.name, 'Chaque template doit avoir un nom explicite');
      assert.ok(tmpl.description, 'Chaque template doit avoir une description');
      assert.ok(tmpl.badge, 'Chaque template doit avoir un badge');
      assert.strictEqual(tmpl.executionType, 'browser-iframe');
      assert.ok(tmpl.defaultFiles.length >= 2, 'Chaque template doit comporter au moins 2 fichiers');

      // Vérifie qu'il y a au moins un fichier HTML et un fichier d'application React
      const hasHtml = tmpl.defaultFiles.some((f) => f.path.endsWith('.html'));
      const hasApp = tmpl.defaultFiles.some((f) => f.path.endsWith('.tsx') || f.path.endsWith('.jsx'));
      assert.ok(hasHtml, `Le template ${tmpl.id} doit inclure un fichier HTML`);
      assert.ok(hasApp, `Le template ${tmpl.id} doit inclure un composant React App.tsx`);
    }
  });

  test('createProjectFromTemplate initialise correctement chaque nouveau modèle', () => {
    for (const templateId of expectedNewTemplateIds) {
      const project = createProjectFromTemplate(templateId, `Test ${templateId}`);

      assert.strictEqual(project.templateId, templateId);
      assert.strictEqual(project.name, `Test ${templateId}`);
      assert.ok(project.id);
      assert.ok(project.files.length >= 2);

      // Vérifie que chaque fichier possède un id unique et du contenu valide
      for (const file of project.files) {
        assert.ok(file.id);
        assert.ok(file.name);
        assert.ok(file.path);
        assert.ok(typeof file.content === 'string');
        assert.ok(file.content.length > 0);
      }
    }
  });
});
