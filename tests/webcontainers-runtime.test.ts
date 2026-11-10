/**
 * tests/webcontainers-runtime.test.ts
 *
 * Tests unitaires et d'intégration pour le Terminal WebContainers,
 * le Runtime Full-Stack in-browser et le Linter statique de NEXUS LAB.
 */

import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  executeTerminalCommand,
  bundleProjectForPreview,
  isWebContainerSupported,
} from '../src/services/lab/runtimeService.ts';
import { lintProjectFiles } from '../src/services/lab/linterService.ts';
import { createProjectFromTemplate } from '../src/services/lab/projectService.ts';
import type { LabFile } from '../src/types/lab.ts';

describe('NEXUS LAB — Terminal Interactif & Shell Virtuel', () => {
  test('Exécution de la commande "help" affiche la documentation des commandes', async () => {
    const project = createProjectFromTemplate('react-vite', 'Test App');
    const res = await executeTerminalCommand('help', project);

    assert.strictEqual(res.type, 'info');
    assert.ok(res.output.includes('npm install'));
    assert.ok(res.output.includes('npm run dev'));
    assert.ok(res.output.includes('npm run build'));
    assert.ok(res.output.includes('node <fichier>'));
  });

  test('Commande "pwd" renvoie le répertoire virtuel du projet', async () => {
    const project = createProjectFromTemplate('react-vite', 'Mon Projet Vite');
    const res = await executeTerminalCommand('pwd', project);

    assert.strictEqual(res.type, 'output');
    assert.ok(res.output.includes('/home/nexus/mon-projet-vite'));
  });

  test('Commande "ls" liste tous les fichiers du projet avec leurs tailles', async () => {
    const project = createProjectFromTemplate('react-vite', 'Test App');
    const res = await executeTerminalCommand('ls', project);

    assert.strictEqual(res.type, 'output');
    assert.ok(res.output.includes('package.json'));
    assert.ok(res.output.includes('src/App.tsx'));
    assert.ok(res.output.includes('index.html'));
  });

  test('Commande "cat" affiche le contenu du fichier demandé', async () => {
    const project = createProjectFromTemplate('react-vite', 'Test App');
    const res = await executeTerminalCommand('cat package.json', project);

    assert.strictEqual(res.type, 'output');
    assert.ok(res.output.includes('"name": "nexus-react-app"'));
  });

  test('Commande "cat" renvoie une erreur si le fichier est introuvable', async () => {
    const project = createProjectFromTemplate('react-vite', 'Test App');
    const res = await executeTerminalCommand('cat inexistant.txt', project);

    assert.strictEqual(res.type, 'error');
    assert.ok(res.output.includes('Aucun fichier de ce nom'));
  });

  test('Commande "npm install <pkg>" met à jour package.json et ajoute la dépendance', async () => {
    const project = createProjectFromTemplate('react-vite', 'Test App');
    const res = await executeTerminalCommand('npm install canvas-confetti', project);

    assert.strictEqual(res.type, 'success');
    assert.ok(res.output.includes('canvas-confetti@latest'));
    assert.ok(res.output.includes('added 1 package'));
    assert.ok(res.updatedFiles !== undefined);

    const updatedPkg = res.updatedFiles?.find((f) => f.path === 'package.json');
    assert.ok(updatedPkg !== undefined);
    assert.ok(updatedPkg.content.includes('"canvas-confetti": "^latest"'));
  });

  test('Commande "npm run dev" démarre le serveur de développement Vite', async () => {
    const project = createProjectFromTemplate('react-vite', 'Test App');
    const res = await executeTerminalCommand('npm run dev', project);

    assert.strictEqual(res.type, 'success');
    assert.ok(res.output.includes('VITE'));
    assert.ok(res.output.includes('http://localhost:5173/'));
    assert.ok(res.output.includes('[HMR]'));
  });

  test('Commande "npm run build" transpile et calcule les chunks de production', async () => {
    const project = createProjectFromTemplate('react-vite', 'Test App');
    const res = await executeTerminalCommand('npm run build', project);

    assert.strictEqual(res.type, 'success');
    assert.ok(res.output.includes('building for production'));
    assert.ok(res.output.includes('dist/assets/index.js'));
  });

  test('Commande "npm test" valide la suite de tests et de syntaxe', async () => {
    const project = createProjectFromTemplate('react-vite', 'Test App');
    const res = await executeTerminalCommand('npm test', project);

    assert.strictEqual(res.type, 'success');
    assert.ok(res.output.includes('vitest run'));
    assert.ok(res.output.includes('sans régression'));
  });

  test('Commande inconnue renvoie un message d’aide explicite', async () => {
    const project = createProjectFromTemplate('react-vite', 'Test App');
    const res = await executeTerminalCommand('commande_inconnue', project);

    assert.strictEqual(res.type, 'error');
    assert.ok(res.output.includes('commande introuvable'));
  });
});

describe('NEXUS LAB — Compilateur React, JSX/TSX & Tailwind CSS in-browser', () => {
  test('Compilation d’un projet React Vite avec injection de Tailwind CSS et import map', async () => {
    const project = createProjectFromTemplate('react-vite', 'App React');
    const html = await bundleProjectForPreview(project);

    assert.ok(typeof html === 'string');
    // Vérification de la présence de l'import map ESM
    assert.ok(html.includes('<script type="importmap">'));
    assert.ok(html.includes('"react": "https://esm.sh/react@19?dev"'));
    assert.ok(html.includes('"react-dom/client"'));
    // Vérification de l'injection du script Tailwind JIT
    assert.ok(html.includes('cdn.tailwindcss.com'));
    // Vérification de la présence de l'intercepteur de logs
    assert.ok(html.includes('nexus-preview-log'));
    // Vérification du script module de point d'entrée
    assert.ok(html.includes('<script type="module">'));
  });

  test('isWebContainerSupported renvoie un booléen sans crash en environnement Node/Navigateur', () => {
    assert.strictEqual(typeof isWebContainerSupported(), 'boolean');
  });

  test('Support des projets API Node.js avec simulateur interactif', async () => {
    const project = createProjectFromTemplate('node-api', 'API Express');
    const html = await bundleProjectForPreview(project);

    assert.ok(html.includes('Serveur Express • Actif'));
    assert.ok(html.includes('Endpoints Détectés'));
    assert.ok(html.includes('Tester la requête'));
  });

  test('Support des projets HTML/CSS/JS classiques avec Tailwind et intercepteur', async () => {
    const project = createProjectFromTemplate('html-css-js', 'Site Web');
    const html = await bundleProjectForPreview(project);

    assert.ok(html.includes('<style'));
    assert.ok(html.includes('cdn.tailwindcss.com'));
    assert.ok(html.includes('nexus-preview-log'));
  });
});

describe('NEXUS LAB — Linter & Analyse Statique in-browser', () => {
  test('Détecte les erreurs de syntaxe JSON dans package.json', () => {
    const faultyFiles: LabFile[] = [
      {
        id: 'pkg-1',
        name: 'package.json',
        path: 'package.json',
        language: 'json',
        content: '{\n  "name": "mon-app",,\n}', // Double virgule invalide
      },
    ];

    const diags = lintProjectFiles(faultyFiles);
    assert.ok(diags.length > 0);
    assert.strictEqual(diags[0].severity, 'error');
    assert.strictEqual(diags[0].rule, 'json/valid-syntax');
  });

  test('Détecte les erreurs de syntaxe JSX/TSX', () => {
    const faultyFiles: LabFile[] = [
      {
        id: 'app-1',
        name: 'App.tsx',
        path: 'src/App.tsx',
        language: 'typescript',
        content: 'export default function App() {\n  return <div><span>Non fermé</div>;\n}',
      },
    ];

    const diags = lintProjectFiles(faultyFiles);
    assert.ok(diags.length > 0);
    const syntaxErr = diags.find((d) => d.severity === 'error');
    assert.ok(syntaxErr !== undefined);
  });

  test('Avertit lors de l’utilisation de "class=" au lieu de "className=" dans du JSX', () => {
    const files: LabFile[] = [
      {
        id: 'card-1',
        name: 'Card.tsx',
        path: 'src/components/Card.tsx',
        language: 'typescript',
        content: 'export function Card() {\n  return <div class="bg-red-500">Alerte</div>;\n}',
      },
    ];

    const diags = lintProjectFiles(files);
    const classWarn = diags.find((d) => d.rule === 'react/no-unknown-property');
    assert.ok(classWarn !== undefined);
    assert.ok(classWarn.message.includes('className'));
  });

  test('Avertit lors de l’utilisation de "for=" au lieu de "htmlFor=" dans du JSX', () => {
    const files: LabFile[] = [
      {
        id: 'label-1',
        name: 'Input.tsx',
        path: 'src/components/Input.tsx',
        language: 'typescript',
        content: 'export function Input() {\n  return <label for="email">Email</label>;\n}',
      },
    ];

    const diags = lintProjectFiles(files);
    const forWarn = diags.find((d) => d.message.includes('htmlFor'));
    assert.ok(forWarn !== undefined);
  });

  test('Détecte les imports relatifs vers des fichiers introuvables', () => {
    const files: LabFile[] = [
      {
        id: 'main-1',
        name: 'main.tsx',
        path: 'src/main.tsx',
        language: 'typescript',
        content: 'import { Inexistant } from "./FichierInexistant";\nexport const x = 1;',
      },
    ];

    const diags = lintProjectFiles(files);
    const missingImport = diags.find((d) => d.rule === 'import/no-unresolved');
    assert.ok(missingImport !== undefined);
    assert.ok(missingImport.message.includes('Module relatif introuvable'));
  });

  test('Renvoie une liste vide lorsque tous les fichiers sont parfaitement valides', () => {
    const project = createProjectFromTemplate('react-vite', 'App Parfaite');
    const diags = lintProjectFiles(project.files);

    const errors = diags.filter((d) => d.severity === 'error');
    assert.strictEqual(errors.length, 0, 'Un modèle officiel ne doit présenter aucune erreur de syntaxe');
  });
});
