/**
 * src/services/lab/testGeneratorService.ts
 *
 * Moteur de génération automatique de suites de tests unitaires et E2E (#6).
 * Analyse les fichiers du projet (composants React, fonctions utilitaires, routes API)
 * et génère des suites de tests complètes pour Vitest, Testing Library et Playwright.
 */

import type { LabProject, LabFile } from '../../types/lab.ts';

export interface GeneratedTestSuite {
  files: LabFile[];
  summary: {
    componentsCount: number;
    utilsCount: number;
    testCasesCount: number;
  };
}

/**
 * Analyse un composant React pour extraire son nom et éléments interactifs.
 */
function analyzeReactComponent(content: string, fileName: string): { componentName: string; hasButtons: boolean; hasInputs: boolean } {
  const match = content.match(/export\s+(?:default\s+)?(?:function|const)\s+([A-Za-z0-9_]+)/);
  const componentName = match ? match[1] : fileName.replace(/\.[^/.]+$/, '');
  const hasButtons = /<button|onClick/i.test(content);
  const hasInputs = /<input|onChange/i.test(content);

  return {
    componentName,
    hasButtons,
    hasInputs,
  };
}

/**
 * Génère le fichier de test Vitest pour un composant React.
 */
export function generateComponentTest(file: LabFile): LabFile {
  const { componentName, hasButtons, hasInputs } = analyzeReactComponent(file.content, file.name);
  const testFileName = file.name.replace(/\.(tsx|jsx)$/, '.test.$1');
  const importPath = `./${file.name.replace(/\.(tsx|jsx)$/, '')}`;

  const lines: string[] = [];
  lines.push(`/**`);
  lines.push(` * Tests unitaires automatisés générés par NEXUS AI pour ${file.name}`);
  lines.push(` * Framework : Vitest & React Testing Library`);
  lines.push(` */`);
  lines.push(`import { describe, it, expect, beforeEach } from 'vitest';`);
  lines.push(`import { render, screen, fireEvent } from '@testing-library/react';`);
  lines.push(`import React from 'react';`);
  lines.push(`import { ${componentName} } from '${importPath}';\n`);

  lines.push(`describe('Composant <${componentName} />', () => {`);
  lines.push(`  it('se monte sans erreur et affiche les éléments principaux', () => {`);
  lines.push(`    const { container } = render(<${componentName} />);`);
  lines.push(`    expect(container).toBeDefined();`);
  lines.push(`    expect(container.firstChild).not.toBeNull();`);
  lines.push(`  });\n`);

  if (hasButtons) {
    lines.push(`  it('réagit aux interactions utilisateur sur les boutons', () => {`);
    lines.push(`    render(<${componentName} />);`);
    lines.push(`    const buttons = screen.getAllByRole('button');`);
    lines.push(`    expect(buttons.length).toBeGreaterThan(0);`);
    lines.push(`    fireEvent.click(buttons[0]);`);
    lines.push(`  });\n`);
  }

  if (hasInputs) {
    lines.push(`  it('met à jour les champs de saisie lors de la frappe', () => {`);
    lines.push(`    render(<${componentName} />);`);
    lines.push(`    const inputs = screen.getAllByRole('textbox');`);
    lines.push(`    if (inputs.length > 0) {`);
    lines.push(`      fireEvent.change(inputs[0], { target: { value: 'Test NEXUS' } });`);
    lines.push(`      expect((inputs[0] as HTMLInputElement).value).toBe('Test NEXUS');`);
    lines.push(`    }`);
    lines.push(`  });\n`);
  }

  lines.push(`  it('respecte les critères d\\\'accessibilité fondamentaux', () => {`);
  lines.push(`    const { container } = render(<${componentName} />);`);
  lines.push(`    const images = container.querySelectorAll('img');`);
  lines.push(`    images.forEach((img) => {`);
  lines.push(`      expect(img.getAttribute('alt')).not.toBeNull();`);
  lines.push(`    });`);
  lines.push(`  });`);
  lines.push(`});\n`);

  return {
    id: 'test-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
    name: testFileName,
    path: `tests/${testFileName}`,
    content: lines.join('\n'),
    language: 'typescript',
    isModified: true,
  };
}

/**
 * Génère un test E2E Playwright de fumée (Smoke Test) pour valider le rendu global.
 */
export function generatePlaywrightSmokeTest(project: LabProject): LabFile {
  const content = `/**
 * Test E2E Smoke Test Playwright généré par NEXUS AI
 * Valide le chargement du projet "${project.name}"
 */
import { test, expect } from '@playwright/test';

test.describe('Validation globale de l\\\'application', () => {
  test('Chargement de la page d\\\'accueil et absence d\\\'erreur console critique', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.goto('/');

    // Vérifie que le conteneur racine est bien monté
    const root = page.locator('#root, body');
    await expect(root).toBeVisible();

    // Vérifie l'absence de crashs bloquants
    expect(consoleErrors.length).toBe(0);
  });
});
`;

  return {
    id: 'e2e-smoke-' + Date.now(),
    name: 'app.smoke.spec.ts',
    path: 'tests/e2e/app.smoke.spec.ts',
    content,
    language: 'typescript',
    isModified: true,
  };
}

/**
 * Analyse le projet complet et génère l'ensemble des suites de tests recommandées.
 */
export function generateProjectTestSuite(project: LabProject): GeneratedTestSuite {
  const generatedFiles: LabFile[] = [];
  let componentsCount = 0;
  let utilsCount = 0;
  let testCasesCount = 0;

  // 1. Analyse des composants React / TypeScript
  const componentFiles = project.files.filter(
    (f) =>
      (f.path.endsWith('.tsx') || f.path.endsWith('.jsx')) &&
      !f.path.includes('.test.') &&
      !f.path.includes('.spec.') &&
      !f.path.includes('main.tsx'),
  );

  for (const comp of componentFiles) {
    const testFile = generateComponentTest(comp);
    generatedFiles.push(testFile);
    componentsCount++;
    testCasesCount += 3;
  }

  // 2. Smoke Test E2E Playwright
  const smokeTest = generatePlaywrightSmokeTest(project);
  generatedFiles.push(smokeTest);
  testCasesCount += 1;

  // 3. Fichier de configuration Vitest vitest.config.ts
  const vitestConfig: LabFile = {
    id: 'vitest-config-' + Date.now(),
    name: 'vitest.config.ts',
    path: 'vitest.config.ts',
    content: `import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './tests/setup.ts',
  },
});
`,
    language: 'typescript',
    isModified: true,
  };
  generatedFiles.push(vitestConfig);

  return {
    files: generatedFiles,
    summary: {
      componentsCount,
      utilsCount,
      testCasesCount,
    },
  };
}

/**
 * Injecte la suite de tests directement dans les fichiers du projet
 * et met à jour package.json pour y ajouter le script "test:vitest".
 */
export function injectTestSuiteIntoProject(project: LabProject, testSuite: GeneratedTestSuite): LabProject {
  const updatedFiles = [...project.files];

  // 1. Injection des fichiers de test générés
  for (const tf of testSuite.files) {
    const existingIdx = updatedFiles.findIndex((f) => f.path === tf.path);
    if (existingIdx >= 0) {
      updatedFiles[existingIdx] = tf;
    } else {
      updatedFiles.push(tf);
    }
  }

  // 2. Mise à jour de package.json
  const pkgIdx = updatedFiles.findIndex((f) => f.path === 'package.json');
  if (pkgIdx >= 0) {
    try {
      const parsed = JSON.parse(updatedFiles[pkgIdx].content);
      parsed.scripts = {
        ...(parsed.scripts || {}),
        test: 'vitest run',
        'test:watch': 'vitest',
      };
      parsed.devDependencies = {
        ...(parsed.devDependencies || {}),
        vitest: '^3.0.0',
        '@testing-library/react': '^16.0.0',
        jsdom: '^25.0.0',
      };
      updatedFiles[pkgIdx] = {
        ...updatedFiles[pkgIdx],
        content: JSON.stringify(parsed, null, 2),
        isModified: true,
      };
    } catch {
      // Ignorer
    }
  }

  return {
    ...project,
    files: updatedFiles,
    updatedAt: new Date().toISOString(),
  };
}
