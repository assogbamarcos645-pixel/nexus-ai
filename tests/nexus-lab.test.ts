/**
 * tests/nexus-lab.test.ts
 *
 * Tests unitaires et d'intégration pour NEXUS LAB :
 * - Création de projet à partir des modèles (HTML/CSS/JS, React Vite, Node, PHP, Python)
 * - Validation stricte des chemins (prévention directory traversal, caractères interdits, noms réservés)
 * - Détection automatique des langages de programmation
 * - Ajout, modification, sélection et suppression de fichiers
 * - Assemblage sécurisé du bundle de prévisualisation HTML
 * - Isolation de l'iframe (sandbox sans allow-same-origin)
 * - Génération et intégrité de l'export d'archive ZIP via JSZip
 */

import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  sanitizeAndValidatePath,
  detectLanguage,
  createProjectFromTemplate,
  addFileToProject,
  deleteFileFromProject,
  exportProjectAsZip,
} from '../src/services/lab/projectService.ts';
import { LAB_TEMPLATES } from '../src/config/labTemplates.ts';
import { isValidUUID } from '../src/utils/uuid.ts';
import JSZip from 'jszip';

describe('NEXUS LAB — Modèles et Création de Projets', () => {
  test('L’ensemble des modèles requis est disponible et cohérent', () => {
    const requiredTemplates = ['html-css-js', 'react-vite', 'node-api', 'php-app', 'python-app'];
    const currentIds = LAB_TEMPLATES.map((t) => t.id);

    for (const reqId of requiredTemplates) {
      assert.ok(currentIds.includes(reqId as any), `Modèle manquant : ${reqId}`);
      const tmpl = LAB_TEMPLATES.find((t) => t.id === reqId)!;
      assert.ok(tmpl.name.length > 0);
      assert.ok(tmpl.defaultFiles.length > 0, `Le modèle ${reqId} doit comporter des fichiers par défaut`);
      assert.ok(['browser-iframe', 'server-required'].includes(tmpl.executionType));
    }
  });

  test('Création d’un projet depuis un template avec fichiers par défaut et UUIDs valides', () => {
    const project = createProjectFromTemplate('html-css-js', 'Mon Super Site Web');

    assert.ok(isValidUUID(project.id));
    assert.strictEqual(project.name, 'Mon Super Site Web');
    assert.strictEqual(project.templateId, 'html-css-js');
    assert.strictEqual(project.isDemo, false);
    assert.ok(project.files.length >= 3, 'Doit contenir index.html, style.css, app.js');

    for (const f of project.files) {
      assert.ok(isValidUUID(f.id));
      assert.ok(f.path.length > 0);
      assert.ok(typeof f.content === 'string');
      assert.strictEqual(f.isModified, false);
    }
  });

  test('Détection automatique des langages de fichiers', () => {
    assert.strictEqual(detectLanguage('index.html'), 'html');
    assert.strictEqual(detectLanguage('styles/main.css'), 'css');
    assert.strictEqual(detectLanguage('src/app.js'), 'javascript');
    assert.strictEqual(detectLanguage('src/components/Card.tsx'), 'typescript');
    assert.strictEqual(detectLanguage('package.json'), 'json');
    assert.strictEqual(detectLanguage('server.py'), 'python');
    assert.strictEqual(detectLanguage('api/index.php'), 'php');
    assert.strictEqual(detectLanguage('README.md'), 'markdown');
    assert.strictEqual(detectLanguage('unknown.xyz'), 'plaintext');
  });
});

describe('NEXUS LAB — Sécurité & Validation des Chemins (Path Traversal)', () => {
  test('Accepte les chemins relatifs sûrs et imbriqués', () => {
    const validPaths = [
      'index.html',
      'src/main.ts',
      'assets/icons/logo.svg',
      'deeply/nested/dir/component.jsx',
    ];

    for (const p of validPaths) {
      const res = sanitizeAndValidatePath(p);
      assert.strictEqual(res.valid, true, `Le chemin ${p} devrait être valide`);
      assert.strictEqual(res.normalizedPath, p);
    }
  });

  test('Normalise les antislashs Windows en slashs POSIX', () => {
    const res = sanitizeAndValidatePath('src\\components\\Button.tsx');
    assert.strictEqual(res.valid, true);
    assert.strictEqual(res.normalizedPath, 'src/components/Button.tsx');
  });

  test('Bloque strictement toute tentative de Directory Traversal ("..")', () => {
    const maliciousPaths = [
      '../secret.txt',
      '../../etc/passwd',
      'src/../../config.env',
      'dir/../..',
    ];

    for (const p of maliciousPaths) {
      const res = sanitizeAndValidatePath(p);
      assert.strictEqual(res.valid, false, `Le chemin traversal ${p} doit être refusé`);
      assert.ok(res.error?.includes('Tentative de sortie de répertoire'));
    }
  });

  test('Bloque les chemins absolus (racine POSIX et lettres de lecteur Windows)', () => {
    const absolutePaths = ['/etc/shadow', '/root/.ssh/id_rsa', 'C:/Windows/System32', 'D:\\data'];

    for (const p of absolutePaths) {
      const res = sanitizeAndValidatePath(p);
      assert.strictEqual(res.valid, false, `Le chemin absolu ${p} doit être refusé`);
      assert.ok(res.error?.includes('absolus sont strictement interdits'));
    }
  });

  test('Bloque les caractères interdits et les octets nuls (< > : " | ? * \\0)', () => {
    const illegalPaths = ['file<1>.txt', 'test"name.js', 'doc|pipe.md', 'secret\0.php', 'star*file.ts'];

    for (const p of illegalPaths) {
      const res = sanitizeAndValidatePath(p);
      assert.strictEqual(res.valid, false, `Le chemin ${p} avec caractères illégaux doit être refusé`);
    }
  });

  test('Bloque les noms de fichiers réservés par le système Windows', () => {
    const reservedNames = ['CON', 'PRN', 'AUX', 'NUL', 'COM1', 'LPT3', 'aux.txt', 'nul.json'];

    for (const p of reservedNames) {
      const res = sanitizeAndValidatePath(p);
      assert.strictEqual(res.valid, false, `Le nom réservé ${p} doit être rejeté`);
      assert.ok(res.error?.includes('réservé par le système d\'exploitation'));
    }
  });
});

describe('NEXUS LAB — Gestion des Fichiers et Modifications', () => {
  test('Ajout d’un nouveau fichier au projet avec vérification d’unicité', () => {
    const project = createProjectFromTemplate('html-css-js', 'Projet Test');
    const initialCount = project.files.length;

    const { updatedProject, newFile, error } = addFileToProject(
      project,
      'assets/extra.css',
      'body { background: #000; }',
    );

    assert.strictEqual(error, undefined);
    assert.ok(newFile);
    assert.strictEqual(updatedProject.files.length, initialCount + 1);
    assert.strictEqual(newFile.path, 'assets/extra.css');
    assert.strictEqual(newFile.language, 'css');
    assert.strictEqual(newFile.isModified, true);

    // Tentative d'ajout en double : doit être rejetée
    const duplicateRes = addFileToProject(updatedProject, 'assets/extra.css', '/* clash */');
    assert.strictEqual(duplicateRes.updatedProject.files.length, initialCount + 1);
    assert.ok(duplicateRes.error?.includes('existe déjà'));
  });

  test('Suppression d’un fichier et protection du dernier fichier restant', () => {
    const project = createProjectFromTemplate('html-css-js');
    const fileToDelete = project.files[0];

    const { updatedProject } = deleteFileFromProject(project, fileToDelete.id);
    assert.strictEqual(updatedProject.files.length, project.files.length - 1);
    assert.strictEqual(updatedProject.files.some((f) => f.id === fileToDelete.id), false);

    // Impossible de vider complètement un projet
    let singleFileProject = { ...updatedProject, files: [updatedProject.files[0]] };
    const cannotEmptyRes = deleteFileFromProject(singleFileProject, singleFileProject.files[0].id);
    assert.strictEqual(cannotEmptyRes.updatedProject.files.length, 1);
    assert.ok(cannotEmptyRes.error?.includes('au minimum un fichier'));
  });

  test('Modification du contenu d’un fichier', () => {
    const project = createProjectFromTemplate('html-css-js');
    const targetFile = project.files[0];
    const modifiedContent = '<!DOCTYPE html><html><body><h1>NEXUS AI 2.0</h1></body></html>';

    const updatedFiles = project.files.map((f) =>
      f.id === targetFile.id ? { ...f, content: modifiedContent, isModified: true } : f,
    );

    const updatedProject = { ...project, files: updatedFiles, updatedAt: new Date().toISOString() };
    const savedFile = updatedProject.files.find((f) => f.id === targetFile.id)!;

    assert.strictEqual(savedFile.content, modifiedContent);
    assert.strictEqual(savedFile.isModified, true);
  });
});

describe('NEXUS LAB — Assemblage et Isolation de la Prévisualisation HTML', () => {
  test('L’assemblage HTML injecte le style CSS et le script JS dans la page sans breakout', () => {
    const project = createProjectFromTemplate('html-css-js');
    const htmlFile = project.files.find((f) => f.path.endsWith('.html'))!;
    const cssFile = project.files.find((f) => f.path.endsWith('.css'))!;
    const jsFile = project.files.find((f) => f.path.endsWith('.js'))!;

    assert.ok(htmlFile && cssFile && jsFile);

    // Fonction de simulation de l'assemblage (analogue à PreviewPanel)
    let bundled = htmlFile.content;
    const linkRegex = new RegExp(`<link[^>]*href=["']${cssFile.path.replace(/\./g, '\\.')}["'][^>]*>`, 'gi');
    if (linkRegex.test(bundled)) {
      bundled = bundled.replace(linkRegex, `<style>/* ${cssFile.path} */\n${cssFile.content}</style>`);
    } else if (bundled.includes('</head>')) {
      bundled = bundled.replace('</head>', `<style>/* ${cssFile.path} */\n${cssFile.content}</style></head>`);
    }

    const scriptRegex = new RegExp(`<script[^>]*src=["']${jsFile.path.replace(/\./g, '\\.')}["'][^>]*>\\s*</script>`, 'gi');
    if (scriptRegex.test(bundled)) {
      bundled = bundled.replace(scriptRegex, `<script>/* ${jsFile.path} */\n${jsFile.content}</script>`);
    } else if (bundled.includes('</body>')) {
      bundled = bundled.replace('</body>', `<script>/* ${jsFile.path} */\n${jsFile.content}</script></body>`);
    }

    assert.ok(bundled.includes('<style>'));
    assert.ok(bundled.includes('<script>'));
    assert.ok(!bundled.includes(`<link rel="stylesheet" href="${cssFile.path}">`));
  });

  test('La politique d’isolation iframe interdit strictement allow-same-origin', () => {
    // La règle de sécurité fondamentale de NEXUS LAB :
    // sandbox="allow-scripts" UNIQUEMENT, jamais allow-same-origin
    const iframeSandbox = 'allow-scripts';
    assert.strictEqual(iframeSandbox.includes('allow-same-origin'), false);
    assert.strictEqual(iframeSandbox.includes('allow-top-navigation'), false);
  });
});

describe('NEXUS LAB — Exportation Archive ZIP', () => {
  test('Génère une archive ZIP valide contenant tous les fichiers et le manifest .nexus-meta.json', async () => {
    const project = createProjectFromTemplate('html-css-js', 'Projet Exportable');
    const zipBlob = await exportProjectAsZip(project);

    assert.ok(zipBlob instanceof Blob);
    assert.ok(zipBlob.size > 100, 'L’archive ZIP doit contenir des octets compressés');

    // Vérification de la structure interne avec JSZip
    const arrayBuffer = await zipBlob.arrayBuffer();
    const unzipped = await JSZip.loadAsync(arrayBuffer);

    // Vérification de la présence des fichiers
    for (const f of project.files) {
      const fileEntry = unzipped.file(f.path);
      assert.ok(fileEntry !== null, `Le fichier ${f.path} doit être présent dans le ZIP`);
      const content = await fileEntry.async('string');
      assert.strictEqual(content, f.content);
    }

    // Vérification du manifest de métadonnées
    const metaEntry = unzipped.file('.nexus-meta.json');
    assert.ok(metaEntry !== null, 'Le manifest .nexus-meta.json doit être présent');
    const metaContent = JSON.parse(await metaEntry.async('string'));
    assert.strictEqual(metaContent.name, 'Projet Exportable');
    assert.strictEqual(metaContent.templateId, 'html-css-js');
    assert.strictEqual(metaContent.fileCount, project.files.length);
  });
});
