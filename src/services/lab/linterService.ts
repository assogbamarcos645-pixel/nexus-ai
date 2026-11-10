/**
 * src/services/lab/linterService.ts
 *
 * Service de linting et d'analyse statique in-browser pour NEXUS LAB.
 * Analyse les fichiers du projet en temps réel pour détecter :
 * - Erreurs de syntaxe JSX / TypeScript / JavaScript (via Sucrase & AST parser)
 * - Erreurs de syntaxe JSON (e.g. package.json mal formé)
 * - Attributs React obsolètes ou erronés (class -> className, for -> htmlFor)
 * - Imports relatifs introuvables dans l'arborescence du projet
 * - Balises JSX non fermées ou non équilibrées
 */

import { transform } from 'sucrase';
import type { LabFile, LintDiagnostic } from '@/types/lab';

export function lintProjectFiles(files: LabFile[]): LintDiagnostic[] {
  const diagnostics: LintDiagnostic[] = [];
  const filePathsSet = new Set(files.map((f) => f.path.replace(/\\/g, '/')));

  for (const file of files) {
    const ext = file.path.split('.').pop()?.toLowerCase();
    const normalizedPath = file.path.replace(/\\/g, '/');

    // 1. Analyse JSON (package.json, tsconfig.json, etc.)
    if (ext === 'json') {
      try {
        JSON.parse(file.content);
      } catch (err: any) {
        let line = 1;
        let column = 1;
        const posMatch = err.message.match(/at position (\d+)/i) || err.message.match(/line (\d+) column (\d+)/i);
        if (posMatch) {
          if (posMatch[2]) {
            line = parseInt(posMatch[1], 10);
            column = parseInt(posMatch[2], 10);
          } else {
            const charIndex = parseInt(posMatch[1], 10);
            const linesBefore = file.content.slice(0, charIndex).split('\n');
            line = linesBefore.length;
            column = (linesBefore[linesBefore.length - 1]?.length || 0) + 1;
          }
        }
        diagnostics.push({
          id: `${file.id}-json-err`,
          fileId: file.id,
          filePath: file.path,
          fileName: file.name,
          line,
          column,
          message: `Syntaxe JSON invalide : ${err.message}`,
          severity: 'error',
          rule: 'json/valid-syntax',
        });
      }
      continue;
    }

    // 2. Analyse JavaScript / TypeScript / JSX / TSX
    if (['js', 'jsx', 'ts', 'tsx'].includes(ext || '')) {
      const isTs = ext === 'ts' || ext === 'tsx';
      const isJsx = ext === 'jsx' || ext === 'tsx';

      // Test de compilation syntaxique via Sucrase
      try {
        const transforms: ('jsx' | 'typescript')[] = [];
        if (isJsx) transforms.push('jsx');
        if (isTs) transforms.push('typescript');

        if (transforms.length > 0) {
          transform(file.content, {
            transforms,
            filePath: file.path,
          });
        }
      } catch (err: any) {
        const loc = err.loc || {};
        const line = loc.line || 1;
        const column = loc.column || 1;
        diagnostics.push({
          id: `${file.id}-syntax-${line}-${column}`,
          fileId: file.id,
          filePath: file.path,
          fileName: file.name,
          line,
          column,
          message: err.message?.replace(/\(\d+:\d+\)$/, '').trim() || 'Erreur de syntaxe de code',
          severity: 'error',
          rule: 'syntax/parse-error',
        });
      }

      // Analyse ligne par ligne des bonnes pratiques React & imports
      const lines = file.content.split('\n');
      lines.forEach((lineText, idx) => {
        const lineNumber = idx + 1;

        // Détection de l'attribut "class=" dans du JSX
        if (isJsx && /\bclass="[^"]*"/i.test(lineText) && !lineText.includes('//') && !lineText.includes('class ')) {
          diagnostics.push({
            id: `${file.id}-class-prop-${lineNumber}`,
            fileId: file.id,
            filePath: file.path,
            fileName: file.name,
            line: lineNumber,
            column: lineText.indexOf('class="') + 1,
            message: 'Utilisez "className" au lieu de "class" dans les éléments JSX React.',
            severity: 'warning',
            rule: 'react/no-unknown-property',
          });
        }

        // Détection de l'attribut "for=" dans du JSX
        if (isJsx && /\bfor="[^"]*"/i.test(lineText) && !lineText.includes('//') && !lineText.includes('for (')) {
          diagnostics.push({
            id: `${file.id}-for-prop-${lineNumber}`,
            fileId: file.id,
            filePath: file.path,
            fileName: file.name,
            line: lineNumber,
            column: lineText.indexOf('for="') + 1,
            message: 'Utilisez "htmlFor" au lieu de "for" pour lier des labels dans React.',
            severity: 'warning',
            rule: 'react/no-unknown-property',
          });
        }

        // Détection d'imports relatifs cassés
        const importMatch = lineText.match(/import\s+(?:.*?\s+from\s+)?['"](\.[^'"]+)['"]/);
        if (importMatch && importMatch[1]) {
          const importRel = importMatch[1];
          const currentDir = normalizedPath.includes('/') ? normalizedPath.slice(0, normalizedPath.lastIndexOf('/')) : '';
          
          const resolveRelative = (rel: string) => {
            const parts = (currentDir ? currentDir.split('/') : []).concat(rel.split('/'));
            const resolved: string[] = [];
            for (const part of parts) {
              if (part === '.' || part === '') continue;
              if (part === '..') {
                resolved.pop();
              } else {
                resolved.push(part);
              }
            }
            return resolved.join('/');
          };

          const resolvedBase = resolveRelative(importRel);
          const candidates = [
            resolvedBase,
            `${resolvedBase}.tsx`,
            `${resolvedBase}.ts`,
            `${resolvedBase}.jsx`,
            `${resolvedBase}.js`,
            `${resolvedBase}.css`,
            `${resolvedBase}/index.tsx`,
            `${resolvedBase}/index.ts`,
            `${resolvedBase}/index.js`,
          ];

          const exists = candidates.some((cand) => filePathsSet.has(cand));
          if (!exists) {
            diagnostics.push({
              id: `${file.id}-missing-import-${lineNumber}`,
              fileId: file.id,
              filePath: file.path,
              fileName: file.name,
              line: lineNumber,
              column: lineText.indexOf(importRel) + 1,
              message: `Module relatif introuvable : "${importRel}". Aucun fichier correspondant dans le projet.`,
              severity: 'error',
              rule: 'import/no-unresolved',
            });
          }
        }
      });
    }

    // 3. Analyse HTML
    if (ext === 'html') {
      // Détection de balises HTML non fermées classiques
      const unclosedTags = ['div', 'section', 'article', 'main', 'header', 'footer', 'script', 'style'];
      for (const tag of unclosedTags) {
        const openMatches = file.content.match(new RegExp(`<${tag}(\\s[^>]*)?>`, 'gi')) || [];
        const closeMatches = file.content.match(new RegExp(`</${tag}>`, 'gi')) || [];
        if (openMatches.length > closeMatches.length) {
          diagnostics.push({
            id: `${file.id}-unclosed-${tag}`,
            fileId: file.id,
            filePath: file.path,
            fileName: file.name,
            line: 1,
            column: 1,
            message: `Balise <${tag}> possiblement non fermée (${openMatches.length} ouvrante(s), ${closeMatches.length} fermante(s)).`,
            severity: 'warning',
            rule: 'html/unclosed-tag',
          });
        }
      }
    }
  }

  return diagnostics;
}
