/**
 * tests/webcontainers-enhancement.test.ts
 *
 * Tests unitaires pour les extensions WebContainers :
 * - Montage d'arborescence FileSystemTree
 * - Support des options de streaming et détection de serveur
 */

import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  convertFilesToWebContainerTree,
  mountProjectFilesToWebContainer,
  executeTerminalCommand,
} from '../src/services/lab/runtimeService.ts';
import type { LabProject, LabFile } from '../src/types/lab.ts';

describe('NEXUS LAB — WebContainers FileSystemTree & Streaming', () => {
  test('convertFilesToWebContainerTree génère une arborescence récursive correcte', () => {
    const files: LabFile[] = [
      {
        id: 'pkg',
        name: 'package.json',
        path: 'package.json',
        language: 'json',
        content: '{"name": "test"}',
        isModified: false,
      },
      {
        id: 'app',
        name: 'App.tsx',
        path: 'src/components/App.tsx',
        language: 'typescript',
        content: 'export function App() { return <div>OK</div>; }',
        isModified: false,
      },
    ];

    const tree = convertFilesToWebContainerTree(files);

    // Racine contient package.json (fichier) et src (répertoire)
    assert.ok(tree['package.json']);
    assert.ok(tree['package.json'].file);
    assert.strictEqual(tree['package.json'].file.contents, '{"name": "test"}');

    assert.ok(tree['src']);
    assert.ok(tree['src'].directory);
    assert.ok(tree['src'].directory['components']);
    assert.ok(tree['src'].directory['components'].directory['App.tsx']);
    assert.ok(tree['src'].directory['components'].directory['App.tsx'].file);
  });

  test('mountProjectFilesToWebContainer ne crash pas en environnement de test/node', async () => {
    const project: LabProject = {
      id: 'proj-mount',
      name: 'Mount Project',
      description: 'Test',
      template: 'react-vite',
      createdAt: new Date(),
      updatedAt: new Date(),
      files: [
        {
          id: 'idx',
          name: 'index.html',
          path: 'index.html',
          language: 'html',
          content: '<h1>Hello</h1>',
          isModified: false,
        },
      ],
    };

    // Dans l'environnement Node.js (sans crossOriginIsolated), renvoie false gracieusement
    const mounted = await mountProjectFilesToWebContainer(project);
    assert.strictEqual(mounted, false);
  });

  test('executeTerminalCommand prend en charge les options de callbacks sans régression', async () => {
    const project: LabProject = {
      id: 'proj-exec',
      name: 'Exec Project',
      description: 'Test',
      template: 'react-vite',
      createdAt: new Date(),
      updatedAt: new Date(),
      files: [],
    };

    let serverReadyCalled = false;
    const res = await executeTerminalCommand('pwd', project, {
      onServerReady: () => {
        serverReadyCalled = true;
      },
    });

    assert.strictEqual(res.type, 'output');
    assert.ok(res.output.includes('/home/nexus/exec-project'));
    assert.strictEqual(serverReadyCalled, false);
  });
});
