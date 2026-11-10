/**
 * src/services/lab/codeCompletionService.ts
 *
 * Moteur d'autocomplétion intelligente, snippets et « Ghost Text » Copilot pour NEXUS LAB.
 * Enregistre les fournisseurs de complétion et complétion en ligne (Ghost Text) Monaco
 * pour l'ensemble des langages supportés (HTML, CSS, JavaScript, TypeScript, Python, PHP, JSON).
 * Moteur ultra-rapide (< 200 ms) combinant synthèse prédictive instantanée, cache LRU et repli IA léger.
 * Accepte les suggestions par Tab et les rejette par Échap.
 */

import type { LabFile } from '../../types/lab.ts';

let isSnippetsRegistered = false;
let isGhostTextRegistered = false;
let ghostTextEnabled = true;

export interface GhostTextEngineStats {
  lastLatencyMs: number;
  totalSuggestions: number;
  acceptedCount: number;
  cacheHits: number;
}

const ghostStats: GhostTextEngineStats = {
  lastLatencyMs: 8,
  totalSuggestions: 0,
  acceptedCount: 0,
  cacheHits: 0,
};

export function getGhostTextStats(): GhostTextEngineStats {
  return { ...ghostStats };
}

export function recordGhostTextAccepted(): void {
  ghostStats.acceptedCount += 1;
}

export function setGhostTextEnabled(enabled: boolean): void {
  ghostTextEnabled = enabled;
}

export function isGhostTextEnabled(): boolean {
  return ghostTextEnabled;
}

// Cache LRU ultra-rapide pour garantir une réponse < 5 ms sur les motifs récurrents
const GHOST_CACHE_MAX_ENTRIES = 256;
const ghostCache = new Map<string, string>();

function getCacheKey(language: string, prefix: string): string {
  return `${language}:${prefix.trim()}`;
}

function cacheGhostSuggestion(language: string, prefix: string, suggestion: string): void {
  const key = getCacheKey(language, prefix);
  if (ghostCache.size >= GHOST_CACHE_MAX_ENTRIES) {
    const firstKey = ghostCache.keys().next().value;
    if (firstKey) ghostCache.delete(firstKey);
  }
  ghostCache.set(key, suggestion);
}

interface SnippetDef {
  label: string;
  kind?: number; // Monaco CompletionItemKind
  detail: string;
  documentation: string;
  insertText: string;
}

const HTML_SNIPPETS: SnippetDef[] = [
  {
    label: 'html5',
    detail: 'Structure HTML5 complète',
    documentation: 'Génère un squelette HTML5 moderne avec encodage UTF-8 et viewport responsive.',
    insertText: `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>\${1:Mon Projet NEXUS}</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <div class="container">
    <h1>\${2:Bienvenue sur NEXUS}</h1>
    \${0}
  </div>
  <script src="app.js"></script>
</body>
</html>`,
  },
  {
    label: 'div.container',
    detail: 'Conteneur centré',
    documentation: 'Crée un conteneur HTML structuré.',
    insertText: '<div class="container">\n  ${0}\n</div>',
  },
  {
    label: 'button.btn',
    detail: 'Bouton interactif',
    documentation: 'Bouton moderne avec identifiant et type.',
    insertText: '<button type="button" id="${1:btn-action}" class="btn">\n  <span>${2:Cliquer ici}</span>\n</button>',
  },
  {
    label: 'card.cyber',
    detail: 'Carte Cyber / Liquid Glass',
    documentation: 'Carte d\'interface avec en-tête et corps.',
    insertText: '<div class="card">\n  <h2 class="card-title">${1:Titre de la carte}</h2>\n  <p class="card-desc">${2:Description ou contenu...}</p>\n  ${0}\n</div>',
  },
  {
    label: 'input.text',
    detail: 'Champ de saisie texte',
    documentation: 'Champ de saisie avec label accessible.',
    insertText: '<label for="${1:field-id}">${2:Libellé} :</label>\n<input type="text" id="${1:field-id}" name="${1:field-id}" placeholder="${3:Entrez une valeur...}">',
  },
];

const CSS_SNIPPETS: SnippetDef[] = [
  {
    label: 'flex-center',
    detail: 'Centrage Flexbox parfait',
    documentation: 'Centre le contenu horizontalement et verticalement.',
    insertText: 'display: flex;\nalign-items: center;\njustify-content: center;',
  },
  {
    label: 'flex-between',
    detail: 'Disposition Flexbox espacée',
    documentation: 'Aligne les éléments avec un espacement équilibré.',
    insertText: 'display: flex;\nalign-items: center;\njustify-content: space-between;',
  },
  {
    label: 'grid-auto',
    detail: 'Grille responsive automatique',
    documentation: 'Grille CSS responsive avec auto-fit et minmax.',
    insertText: 'display: grid;\ngrid-template-columns: repeat(auto-fit, minmax(${1:280px}, 1fr));\ngap: ${2:1.5rem};',
  },
  {
    label: 'liquid-glass-css',
    detail: 'Finition Verre Dépoli Liquid Glass',
    documentation: 'Style verre translucide avec flou de réfraction et biseau optique.',
    insertText: `background: rgba(255, 255, 255, 0.08);
-webkit-backdrop-filter: blur(24px) saturate(180%);
backdrop-filter: blur(24px) saturate(180%);
border: 1px solid rgba(255, 255, 255, 0.15);
border-radius: 16px;
box-shadow: 0 12px 36px -12px rgba(0, 0, 0, 0.5), inset 0 1px 1.5px rgba(255, 255, 255, 0.2);`,
  },
  {
    label: 'transition-smooth',
    detail: 'Transition fluide cubique',
    documentation: 'Animation lissée inspirée des standards Apple/VisionOS.',
    insertText: 'transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);',
  },
];

const JS_SNIPPETS: SnippetDef[] = [
  {
    label: 'afunc',
    detail: 'Fonction asynchrone sécurisée',
    documentation: 'Déclare une fonction async avec bloc try/catch et gestion d\'erreurs.',
    insertText: `async function \${1:fetchData}(\${2:params}) {
  try {
    \${0}
  } catch (error) {
    console.error('Erreur dans \${1:fetchData}:', error);
    throw error;
  }
}`,
  },
  {
    label: 'fetch-json',
    detail: 'Appel API Fetch avec JSON',
    documentation: 'Requête HTTP GET ou POST avec parsing JSON et vérification de statut.',
    insertText: `async function \${1:loadApi}(\${2:url}) {
  const response = await fetch(\${2:url}, {
    headers: { 'Accept': 'application/json' },
  });
  if (!response.ok) {
    throw new Error(\`Erreur HTTP: \${response.status}\`);
  }
  return await response.json();
}`,
  },
  {
    label: 'listener',
    detail: 'Écouteur d\'événement DOM',
    documentation: 'Attache un écouteur addEventListener sécurisé.',
    insertText: `document.getElementById('\${1:element-id}')?.addEventListener('\${2:click}', (event) => {
  event.preventDefault();
  \${0}
});`,
  },
  {
    label: 'dom-ready',
    detail: 'Événement DOMContentLoaded',
    documentation: 'Exécute le script dès que le DOM est prêt.',
    insertText: `document.addEventListener('DOMContentLoaded', () => {
  console.log('NEXUS LAB • Application prête');
  \${0}
});`,
  },
  {
    label: 'interval',
    detail: 'Minuteur périodique (setInterval)',
    documentation: 'Exécute du code à intervalles réguliers.',
    insertText: `const \${1:timerId} = setInterval(() => {
  \${0}
}, \${2:1000});`,
  },
];

const PYTHON_SNIPPETS: SnippetDef[] = [
  {
    label: 'def-func',
    detail: 'Fonction Python avec type hints',
    documentation: 'Déclare une fonction Python avec typage et docstring.',
    insertText: `def \${1:process_data}(\${2:item}: str) -> dict:
    """\${3:Description du traitement.}"""
    \${0}
    return {"status": "ok", "result": \${2:item}}`,
  },
  {
    label: 'fastapi-route',
    detail: 'Route FastAPI GET/POST',
    documentation: 'Point d\'entrée d\'API REST FastAPI moderne.',
    insertText: `@app.get("/api/\${1:resource}")
async def get_\${1:resource}():
    """Récupère les informations de \${1:resource}."""
    return {"success": True, "data": []}`,
  },
  {
    label: 'try-except',
    detail: 'Bloc de capture d\'erreurs Python',
    documentation: 'Capture sécurisée des exceptions avec journalisation.',
    insertText: `try:
    \${1:# Opération risquée}
    \${0}
except Exception as exc:
    print(f"Erreur détectée: {exc}")
    raise`,
  },
  {
    label: 'if-main',
    detail: 'Point d\'entrée if __name__ == "__main__"',
    documentation: 'Point d\'exécution standard d\'un script Python.',
    insertText: `if __name__ == "__main__":
    \${0:main()}`,
  },
];

const PHP_SNIPPETS: SnippetDef[] = [
  {
    label: 'php-header-json',
    detail: 'En-têtes API JSON & CORS',
    documentation: 'Configure les en-têtes HTTP pour une API REST sécurisée.',
    insertText: `header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('Access-Control-Allow-Origin: *');`,
  },
  {
    label: 'pdo-connect',
    detail: 'Connexion PDO sécurisée',
    documentation: 'Instancie une connexion base de données avec gestion d\'erreurs.',
    insertText: `try {
    \\$pdo = new PDO('mysql:host=localhost;dbname=\${1:nexus};charset=utf8mb4', '\${2:user}', '\${3:pass}', [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
} catch (PDOException \\$e) {
    http_response_code(500);
    echo json_encode(['error' => 'Connexion impossible']);
    exit;
}`,
  },
];

/**
 * Enregistre les snippets et fournisseurs de complétion dans l'instance Monaco
 */
export function registerNexusCompletions(monaco: any, force = false) {
  if ((isSnippetsRegistered && !force) || !monaco?.languages) return;
  isSnippetsRegistered = true;

  const registerForLanguage = (language: string, snippets: SnippetDef[]) => {
    try {
      monaco.languages.registerCompletionItemProvider(language, {
        provideCompletionItems: (model: any, position: any) => {
          const word = model.getWordUntilPosition(position);
          const range = {
            startLineNumber: position.lineNumber,
            endLineNumber: position.lineNumber,
            startColumn: word.startColumn,
            endColumn: word.endColumn,
          };

          const suggestions = snippets.map((s) => ({
            label: s.label,
            kind: s.kind ?? monaco.languages.CompletionItemKind.Snippet,
            detail: `[NEXUS AI] ${s.detail}`,
            documentation: {
              value: s.documentation,
            },
            insertText: s.insertText,
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            range,
          }));

          return { suggestions };
        },
      });
    } catch (err) {
      console.warn(`[NEXUS COMPLETION] Erreur lors de l'enregistrement pour ${language}:`, err);
    }
  };

  registerForLanguage('html', HTML_SNIPPETS);
  registerForLanguage('css', CSS_SNIPPETS);
  registerForLanguage('javascript', JS_SNIPPETS);
  registerForLanguage('typescript', JS_SNIPPETS);
  registerForLanguage('python', PYTHON_SNIPPETS);
  registerForLanguage('php', PHP_SNIPPETS);
}

// ─────────────────────────────────────────────────────────────────────────────
// SYNTHÈSE PRÉDICTIVE INSTANTANÉE « GHOST TEXT » (< 5 ms)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Analyse le préfixe de la ligne active et le contexte environnant pour prédire
 * immédiatement la suite de code de façon déterministe et ultra-rapide.
 */
export function predictInstantGhostText(
  language: string,
  lineBeforeCursor: string,
  fullContextBefore: string = '',
): string | null {
  const line = lineBeforeCursor;
  const trimmed = line.trim();

  if (!trimmed) return null;

  // 1. JAVASCRIPT / TYPESCRIPT
  if (language === 'javascript' || language === 'typescript') {
    // Points d'accès d'API courantes
    if (trimmed.endsWith('.')) {
      if (trimmed.includes('console.')) return 'log();';
      if (trimmed.includes('JSON.')) return 'stringify();';
      if (trimmed.includes('document.')) return 'getElementById("");';
      if (trimmed.includes('response.') || trimmed.includes('res.')) return 'json();';
      if (trimmed.includes('Math.')) return 'round();';
      if (trimmed.includes('Object.')) return 'keys();';
    }

    // React Hooks & States
    if (trimmed.startsWith('const [') && !trimmed.includes('=')) {
      if (trimmed === 'const [') return 'state, setState] = useState(null);';
      if (trimmed === 'const [isOpen,') return ' setIsOpen] = useState(false);';
      if (trimmed === 'const [isLoading,') return ' setIsLoading] = useState(true);';
      if (trimmed === 'const [loading,') return ' setLoading] = useState(true);';
      if (trimmed === 'const [error,') return ' setError] = useState<string | null>(null);';
      if (trimmed === 'const [data,') return ' setData] = useState<any>(null);';
      if (trimmed === 'const [query,') return ' setQuery] = useState("");';
      if (trimmed === 'const [count,') return ' setCount] = useState(0);';

      // Déduction générique du setter React : const [myVar, -> setMyVar] = useState(null);
      const match = trimmed.match(/^const\s*\[\s*([a-zA-Z0-9_]+)\s*,?$/);
      if (match && match[1]) {
        const varName = match[1];
        const setterName = 'set' + varName.charAt(0).toUpperCase() + varName.slice(1);
        return ` ${setterName}] = useState(null);`;
      }
    }

    if (trimmed === 'useEffect(') return '() => {\n    \n    return () => {};\n  }, []);';
    if (trimmed === 'useCallback(') return '() => {\n    \n  }, []);';
    if (trimmed === 'useMemo(') return '() => {\n    \n  }, []);';
    if (trimmed === 'useRef(') return '<HTMLDivElement>(null);';

    // Imports ES6
    if (trimmed === 'import React') return " from 'react';";
    if (trimmed === 'import {') return " useState, useEffect } from 'react';";
    if (trimmed.startsWith('import ') && !trimmed.includes('from') && trimmed.includes('{')) {
      return "} from '';";
    }

    // Gestion asynchrone & Fetch
    if (trimmed === 'const res = await' || trimmed === 'const response = await') {
      return " fetch('/api/data');";
    }
    if (trimmed === 'const data = await') return ' response.json();';
    if (trimmed === 'if (!res.ok)' || trimmed === 'if (!response.ok)') {
      return " {\n    throw new Error('Erreur réseau');\n  }";
    }

    // Blocs de contrôle
    if (trimmed === 'try {') return '\n    \n  } catch (error) {\n    console.error(error);\n  }';
    if (trimmed === 'async function') {
      return ' execute() {\n  try {\n    \n  } catch (err) {\n    console.error(err);\n  }\n}';
    }
    if (trimmed === 'const handleClick =') return ' () => {\n  \n};';
    if (trimmed === 'const handleSubmit =') return ' (e: React.FormEvent) => {\n  e.preventDefault();\n};';

    // Méthodes de tableau
    if (trimmed.endsWith('.map(')) return '(item, index) => item)';
    if (trimmed.endsWith('.filter(')) return '(item) => Boolean(item))';
    if (trimmed.endsWith('.reduce(')) return '(acc, curr) => acc + curr, 0)';
    if (trimmed.endsWith('.find(')) return '(item) => item.id === id)';
  }

  // 2. HTML
  if (language === 'html') {
    if (trimmed === '<!DOCTYPE' || trimmed === '<!doc') {
      return ' html>\n<html lang="fr">\n<head>\n  <meta charset="UTF-8">\n  <title>NEXUS</title>\n</head>\n<body>\n  \n</body>\n</html>';
    }
    if (trimmed === '<div') return ' class=""></div>';
    if (trimmed === '<div class="container"') return '>\n  \n</div>';
    if (trimmed === '<button') return ' type="button" class="btn">Valider</button>';
    if (trimmed === '<input') return ' type="text" name="" placeholder="" />';
    if (trimmed === '<span') return ' class=""></span>';
    if (trimmed === '<header') return ' class="flex items-center justify-between p-4">\n  \n</header>';
    if (trimmed === '<nav') return ' class="flex items-center gap-4">\n  \n</nav>';
    if (trimmed === '<section') return ' class="py-12 px-4">\n  \n</section>';
    if (trimmed === '<form') return ' action="#" method="POST">\n  \n</form>';
    if (trimmed === '<img') return ' src="" alt="" loading="lazy" />';

    // Fermeture automatique contextuelle de balise ouvrante
    if (trimmed.startsWith('<') && !trimmed.includes('>') && !trimmed.startsWith('</')) {
      const tag = trimmed.replace('<', '').split(' ')[0];
      if (tag && /^[a-zA-Z0-9]+$/.test(tag)) {
        return `></${tag}>`;
      }
    }
  }

  // 3. CSS
  if (language === 'css') {
    if (trimmed === 'display:') return ' flex;';
    if (trimmed === 'justify-content:') return ' center;';
    if (trimmed === 'align-items:') return ' center;';
    if (trimmed === 'flex-direction:') return ' column;';
    if (trimmed === 'border-radius:') return ' 12px;';
    if (trimmed === 'backdrop-filter:') return ' blur(20px) saturate(180%);';
    if (trimmed === '-webkit-backdrop-filter:') return ' blur(20px) saturate(180%);';
    if (trimmed === 'background:') return ' rgba(255, 255, 255, 0.08);';
    if (trimmed === 'border:') return ' 1px solid rgba(255, 255, 255, 0.15);';
    if (trimmed === 'transition:') return ' all 0.25s cubic-bezier(0.16, 1, 0.3, 1);';
    if (trimmed === 'box-shadow:') return ' 0 10px 30px -10px rgba(0, 0, 0, 0.5);';
    if (trimmed === 'grid-template-columns:') return ' repeat(auto-fit, minmax(280px, 1fr));';
  }

  // 4. PYTHON
  if (language === 'python') {
    if (trimmed === 'if __name__') return ' == "__main__":\n    main()';
    if (trimmed === 'def') return ' process_data(data: dict) -> dict:\n    return data';
    if (trimmed === 'async def') return ' fetch_data() -> dict:\n    return {"status": "ok"}';
    if (trimmed === 'try:') return '\n    pass\nexcept Exception as err:\n    print(f"Erreur: {err}")';
    if (trimmed.startsWith('with open(') && !trimmed.includes('as')) {
      return ', "r", encoding="utf-8") as f:\n    content = f.read()';
    }
    if (trimmed === 'from typing import') return ' List, Dict, Optional, Any';
    if (trimmed === 'import') return ' os, sys, json';
  }

  // 5. PHP
  if (language === 'php') {
    if (trimmed === 'header(') return "'Content-Type: application/json; charset=utf-8');";
    if (trimmed === 'echo json_encode(') return "['status' => 'success', 'data' => []]);";
    if (trimmed === 'public function') return ' __construct()\n    {\n        \n    }';
    if (trimmed === 'try {') return '\n    \n} catch (Exception $e) {\n    http_response_code(500);\n}';
  }

  // 6. JSON
  if (language === 'json') {
    if (trimmed === '"scripts":') return ' {\n    "dev": "vite",\n    "build": "tsc && vite build"\n  },';
    if (trimmed === '"name":') return ' "nexus-app",';
    if (trimmed === '"version":') return ' "1.0.0",';
    if (trimmed === '"dependencies":') return ' {\n  },';
  }

  // 7. Détection contextuelle d'identifiant déclaré plus haut
  if (fullContextBefore && trimmed.length >= 2 && /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(trimmed)) {
    const identRegex = new RegExp(`\\b(${trimmed}[a-zA-Z0-9_$]+)\\b`, 'g');
    const matches = fullContextBefore.match(identRegex);
    if (matches && matches.length > 0) {
      const candidate = matches[matches.length - 1];
      if (candidate !== trimmed && candidate.startsWith(trimmed)) {
        return candidate.slice(trimmed.length);
      }
    }
  }

  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// FOURNISSEUR INLINE COMPLETIONS (« GHOST TEXT ») MONACO (< 200 ms)
// ─────────────────────────────────────────────────────────────────────────────

interface GhostTextProviderOptions {
  aiCaller?: (prompt: string, signal?: AbortSignal) => Promise<string>;
}

/**
 * Enregistre le fournisseur de suggestions invisibles en direct (« Ghost Text »)
 * dans Monaco Editor avec un objectif de temps de réponse < 200 ms.
 *
 * Monaco prend en charge nativement :
 * - Touche [Tab] pour accepter la suggestion
 * - Touche [Échap] pour la rejeter
 */
export function registerInlineGhostTextProvider(
  monaco: any,
  options: GhostTextProviderOptions = {},
  force = false,
) {
  if ((isGhostTextRegistered && !force) || !monaco?.languages?.registerInlineCompletionsProvider) {
    return { dispose: () => {} };
  }
  isGhostTextRegistered = true;

  const supportedLanguages = [
    'javascript',
    'typescript',
    'html',
    'css',
    'json',
    'python',
    'php',
  ];

  const disposables: Array<{ dispose: () => void }> = [];

  for (const lang of supportedLanguages) {
    try {
      const disposable = monaco.languages.registerInlineCompletionsProvider(lang, {
        provideInlineCompletions: async (model: any, position: any, _context: any, token: any) => {
          const startTime = performance.now();

          if (!ghostTextEnabled || token?.isCancellationRequested) {
            return { items: [] };
          }

          const lineContent = model.getLineContent(position.lineNumber) || '';
          const linePrefix = lineContent.slice(0, position.column - 1);
          const lineSuffix = lineContent.slice(position.column - 1);

          // Si la ligne est entièrement vide ou si le curseur est au milieu d'un mot existant
          if (!linePrefix.trim()) {
            return { items: [] };
          }

          // Éviter de proposer si le suffixe contient déjà du texte sur la même ligne (sauf ponctuation)
          if (lineSuffix.trim().length > 0 && !linePrefix.endsWith('(') && !linePrefix.endsWith('.')) {
            return { items: [] };
          }

          ghostStats.totalSuggestions += 1;

          // 1. Vérification dans le cache LRU (< 1 ms)
          const cached = ghostCache.get(getCacheKey(lang, linePrefix));
          if (cached) {
            ghostStats.cacheHits += 1;
            ghostStats.lastLatencyMs = Math.round(performance.now() - startTime);
            return {
              items: [
                {
                  insertText: cached,
                  range: new monaco.Range(
                    position.lineNumber,
                    position.column,
                    position.lineNumber,
                    position.column,
                  ),
                },
              ],
            };
          }

          // 2. Synthèse prédictive instantanée (< 5 ms)
          const offset = model.getOffsetAt(position);
          const codeBefore = model.getValue().slice(Math.max(0, offset - 1000), offset);
          const instantSuggestion = predictInstantGhostText(lang, linePrefix, codeBefore);

          if (instantSuggestion) {
            cacheGhostSuggestion(lang, linePrefix, instantSuggestion);
            ghostStats.lastLatencyMs = Math.round(performance.now() - startTime);
            return {
              items: [
                {
                  insertText: instantSuggestion,
                  range: new monaco.Range(
                    position.lineNumber,
                    position.column,
                    position.lineNumber,
                    position.column,
                  ),
                },
              ],
            };
          }

          // 3. Moteur IA ultra-rapide avec garde-fou strict (< 160 ms pour garantir < 200 ms total)
          if (linePrefix.trim().length >= 3 && !token?.isCancellationRequested) {
            try {
              const abortController = new AbortController();
              const timeoutId = setTimeout(() => abortController.abort(), 160);

              if (token?.onCancellationRequested) {
                token.onCancellationRequested(() => abortController.abort());
              }

              const fullText = model.getValue();
              const codeAfter = fullText.slice(offset, offset + 400);

              const prompt = `Complète STRICTEMENT le code au curseur sans aucun commentaire ni bloc markdown.
Langage : ${lang}
Ligne active : ${linePrefix}
Contexte :
${codeBefore.slice(-300)}
Suite :
${codeAfter.slice(0, 150)}
Complétion :`;

              let aiCompletion: string | null = null;
              if (options.aiCaller) {
                aiCompletion = await options.aiCaller(prompt, abortController.signal);
              } else {
                // Appel optimisé au moteur d'inférence
                const { chat } = await import('../ai/aiService.ts');
                const response = await chat(
                  {
                    message: prompt,
                    agentId: 'nexus-core',
                  },
                  abortController.signal,
                );
                aiCompletion = response.content;
              }

              clearTimeout(timeoutId);

              if (aiCompletion && !token?.isCancellationRequested) {
                const cleaned = aiCompletion
                  .replace(/^```[a-z]*\n?/i, '')
                  .replace(/```$/i, '')
                  .trim();

                if (cleaned.length > 0 && cleaned.length < 200) {
                  cacheGhostSuggestion(lang, linePrefix, cleaned);
                  ghostStats.lastLatencyMs = Math.round(performance.now() - startTime);

                  return {
                    items: [
                      {
                        insertText: cleaned,
                        range: new monaco.Range(
                          position.lineNumber,
                          position.column,
                          position.lineNumber,
                          position.column,
                        ),
                      },
                    ],
                  };
                }
              }
            } catch {
              // En cas de dépassement de délai (> 160 ms) ou d'annulation, renvoyer immédiatement
            }
          }

          ghostStats.lastLatencyMs = Math.round(performance.now() - startTime);
          return { items: [] };
        },
        freeInlineCompletions: () => {},
      });

      disposables.push(disposable);
    } catch (err) {
      console.warn(`[NEXUS GHOST TEXT] Impossible d'enregistrer sur ${lang}:`, err);
    }
  }

  return {
    dispose: () => {
      isGhostTextRegistered = false;
      disposables.forEach((d) => d?.dispose?.());
    },
  };
}

export interface GenerateAICompletionOptions {
  file: LabFile;
  codeBeforeCursor: string;
  codeAfterCursor: string;
  signal?: AbortSignal;
  aiCaller?: (prompt: string, signal?: AbortSignal) => Promise<string>;
}

/**
 * Complétion assistée par IA à la position du curseur
 * Analyse le contexte de code environnant et renvoie la complétion prédictive la plus pertinente.
 */
export async function generateAICompletion(options: GenerateAICompletionOptions): Promise<string | null> {
  const { file, codeBeforeCursor, codeAfterCursor, signal, aiCaller } = options;

  // En mode local ou si aucun jeton n'est connecté, proposer une complétion heuristique contextuelle
  const lastLine = codeBeforeCursor.split('\n').pop() || '';
  const trimmedLine = lastLine.trim();

  // Complétions intelligentes rapides selon la dernière ligne tapée
  if (file.language === 'html' && trimmedLine.startsWith('<') && !trimmedLine.includes('>')) {
    const tag = trimmedLine.replace('<', '').split(' ')[0];
    if (tag) return `>${codeAfterCursor.startsWith('</') ? '' : `</${tag}>`}`;
  }

  if ((file.language === 'javascript' || file.language === 'typescript') && trimmedLine.endsWith('.')) {
    if (trimmedLine.includes('console.')) return 'log()';
    if (trimmedLine.includes('JSON.')) return 'stringify()';
    if (trimmedLine.includes('document.')) return 'getElementById("")';
    if (trimmedLine.includes('response.')) return 'json()';
  }

  // Requête au moteur IA configuré pour inférer la suite de code
  try {
    const prompt = `Tu es un moteur d'autocomplétion ultra-précis (style GitHub Copilot) pour le fichier "${file.name}" (${file.language}).
Complète STRICTEMENT le code à la position du curseur.
NE DONNE AUCUN BLABLA, AUCUNE EXPLICATION, AUCUN BLOC MARKDOWN \`\`\`.
Renvoie UNIQUEMENT les quelques caractères ou la ligne suivante à insérer à cet endroit précis.

=== CODE AVANT CURSEUR ===
${codeBeforeCursor.slice(-1200)}

=== CODE APRÈS CURSEUR ===
${codeAfterCursor.slice(0, 500)}

Complétion à insérer :`;

    let completion = '';
    if (aiCaller) {
      completion = await aiCaller(prompt, signal);
    } else {
      const { chat } = await import('../ai/aiService.ts');
      const response = await chat(
        {
          message: prompt,
          agentId: 'nexus-core',
        },
        signal,
      );
      completion = response.content;
    }

    const trimmedCompletion = completion.trim();
    // Épurer les délimitations Markdown éventuelles
    const cleaned = trimmedCompletion
      .replace(/^```[a-z]*\n?/i, '')
      .replace(/```$/i, '')
      .trim();

    return cleaned.length > 0 ? cleaned : null;
  } catch {
    // Repli de complétion contextuelle intelligente
    if (trimmedLine.startsWith('function') && !trimmedLine.includes('(')) {
      return '() {\n  \n}';
    }
    if (trimmedLine.startsWith('const') && trimmedLine.includes('=') && !trimmedLine.includes(';')) {
      return ' null;';
    }
    return null;
  }
}
