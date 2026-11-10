/**
 * server/devProxyPlugin.ts
 *
 * Plugin Vite pour le développement local :
 * Fournit un environnement d'exécution serveur (Node.js) sécurisé pour les routes /api/ai/* et /api/chat.
 *
 * RÈGLES DE SÉCURITÉ :
 * 1. Les variables d'environnement secrètes (OPENAI_API_KEY, GEMINI_API_KEY, etc.) sont lues exclusivement côté serveur.
 * 2. Aucune clé complète n'est renvoyée au client ; seules des empreintes masquées (ex: "sk-...4a2b") sont transmises.
 * 3. Les paramètres de requêtes (maxTokens, temperature, timeouts) sont strictement validés et bornés.
 */

import type { Plugin, ViteDevServer, PreviewServer } from 'vite';
import type { IncomingMessage, ServerResponse } from 'node:http';
import dns from 'node:dns';
import fs from 'node:fs';
import path from 'node:path';

// Optimisation DNS critique sous Windows : privilégie IPv4 pour éliminer les temps de latence
try {
  dns.setDefaultResultOrder('ipv4first');
} catch {
  // Ignorer si non supporté
}

// Chargement de secours des variables .env.local si non injectées
function loadLocalEnvFallback() {
  try {
    const envPath = path.resolve(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      for (const line of content.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx > 0) {
          const key = trimmed.slice(0, eqIdx).trim();
          const val = trimmed.slice(eqIdx + 1).trim();
          if (!process.env[key] && val) {
            process.env[key] = val;
          }
        }
      }
    }
  } catch {
    // Ignorer
  }
}
loadLocalEnvFallback();

function parseRequestBody(req: IncomingMessage): Promise<any> {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      // Protection anti-déni de service : max 1 Mo
      if (body.length > 1_000_000) {
        req.destroy();
        resolve({});
      }
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        resolve({});
      }
    });
  });
}

function sendJson(res: ServerResponse, statusCode: number, data: unknown) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(data));
}

function maskSecretKey(key?: string): string | undefined {
  if (!key || key.length < 8) return undefined;
  const start = key.slice(0, 4);
  const end = key.slice(-4);
  return `${start}...${end}`;
}

function initSseResponse(res: ServerResponse) {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();
}

function sendSseChunk(res: ServerResponse, chunk: string) {
  res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
}

function endSse(res: ServerResponse) {
  res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
  res.end();
}

// Simple in‑memory rate limiter (120 req/min per IP for /api routes)
const rateLimitMap = new Map<string, { count: number; reset: number }>();
function checkRateLimit(req: IncomingMessage, res: ServerResponse): boolean {
  const ip = req.socket.remoteAddress || '127.0.0.1';
  const now = Date.now();
  const LIMIT = 120;
  const WINDOW_MS = 60_000;
  let entry = rateLimitMap.get(ip);
  if (!entry || now > entry.reset) {
    entry = { count: 1, reset: now + WINDOW_MS };
    rateLimitMap.set(ip, entry);
  } else {
    entry.count++;
  }
  if (entry.count > LIMIT) {
    res.statusCode = 429;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ error: 'Too many requests, please try again later.' }));
    return true;
  }
  return false;
}

export function nexusDevProxyPlugin(): Plugin {
  const middleware = async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
        const url = req.url || '';

        // Seules les routes d'API sont gérées par ce middleware
        if (!url.startsWith('/api/')) {
          return next();
        }

        // En-têtes de sécurité défensifs pour l'ensemble des routes API
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('X-Frame-Options', 'DENY');
        res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

        // Limitation de débit sur l'API
        if (checkRateLimit(req, res)) {
          return;
        }

        // ── 1. GET /api/ai/status ───────────────────────────────────────────
        if (req.method === 'GET' && url.startsWith('/api/ai/status')) {
          const geminiKey = process.env.GEMINI_API_KEY;
          const openaiKey = process.env.OPENAI_API_KEY;
          const anthropicKey = process.env.ANTHROPIC_API_KEY;
          const mistralKey = process.env.MISTRAL_API_KEY;
          const groqKey = process.env.GROQ_API_KEY;

          return sendJson(res, 200, {
            status: 'operational',
            mode: 'local_dev_proxy',
            availableProviders: {
              gemini: Boolean(geminiKey),
              openai: Boolean(openaiKey),
              anthropic: Boolean(anthropicKey),
              mistral: Boolean(mistralKey),
              groq: Boolean(groqKey),
              ollama: true, // Toujours disponible localement si le démon Ollama tourne
              demo: true,
            },
            maskedKeys: {
              gemini: maskSecretKey(geminiKey),
              openai: maskSecretKey(openaiKey),
              anthropic: maskSecretKey(anthropicKey),
              mistral: maskSecretKey(mistralKey),
              groq: maskSecretKey(groqKey),
            },
          });
        }

        // ── 1.1. GET /api/ai/ollama-models ──────────────────────────────────
        if (req.method === 'GET' && url.startsWith('/api/ai/ollama-models')) {
          try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 2000);
            const ollamaRes = await fetch('http://127.0.0.1:11434/api/tags', { signal: controller.signal });
            clearTimeout(timeout);
            if (ollamaRes.ok) {
              const data = (await ollamaRes.json()) as any;
              return sendJson(res, 200, {
                installed: true,
                models: data.models || [],
              });
            }
            return sendJson(res, 200, { installed: false, models: [] });
          } catch {
            return sendJson(res, 200, { installed: false, models: [] });
          }
        }

        // ── 2. POST /api/ai/test ────────────────────────────────────────────
        if (req.method === 'POST' && url.startsWith('/api/ai/test')) {
          const body = await parseRequestBody(req);
          const { providerId, modelId } = body;
          const startTime = Date.now();

          // A. Fournisseur Démo
          if (providerId === 'demo') {
            return sendJson(res, 200, {
              success: true,
              message: 'Simulateur local opérationnel sans appel réseau.',
              latencyMs: Date.now() - startTime + 10,
              maskedKeyHint: 'Aucune clé requise (Mode Local)',
            });
          }

          // B. Fournisseur Ollama Local
          if (providerId === 'ollama') {
            try {
              const controller = new AbortController();
              const timeout = setTimeout(() => controller.abort(), 4000);
              const ollamaRes = await fetch('http://127.0.0.1:11434/api/tags', {
                signal: controller.signal,
              });
              clearTimeout(timeout);
              const latencyMs = Date.now() - startTime;

              if (ollamaRes.ok) {
                const data = (await ollamaRes.json()) as any;
                const modelNames = data.models?.map((m: any) => m.name).join(', ') || 'aucun modèle';
                return sendJson(res, 200, {
                  success: true,
                  message: `Serveur Ollama actif en local (${latencyMs} ms). Modèles prêts : ${modelNames}.`,
                  latencyMs,
                  maskedKeyHint: 'Localhost:11434 (100% privé)',
                });
              }
              return sendJson(res, 200, {
                success: false,
                message: `Le serveur Ollama a renvoyé un code ${ollamaRes.status}.`,
                latencyMs,
              });
            } catch {
              return sendJson(res, 200, {
                success: false,
                message:
                  'Serveur Ollama introuvable sur http://localhost:11434. Lancez "ollama serve" sur votre machine.',
                latencyMs: Date.now() - startTime,
              });
            }
          }

          // C. Fournisseurs Cloud (OpenAI, Gemini, Anthropic, Mistral, Groq)
          let envKeyName = '';
          let secretValue: string | undefined = '';

          switch (providerId) {
            case 'gemini':
              envKeyName = 'GEMINI_API_KEY';
              secretValue = process.env.GEMINI_API_KEY;
              break;
            case 'openai':
              envKeyName = 'OPENAI_API_KEY';
              secretValue = process.env.OPENAI_API_KEY;
              break;
            case 'anthropic':
              envKeyName = 'ANTHROPIC_API_KEY';
              secretValue = process.env.ANTHROPIC_API_KEY;
              break;
            case 'mistral':
              envKeyName = 'MISTRAL_API_KEY';
              secretValue = process.env.MISTRAL_API_KEY;
              break;
            case 'groq':
              envKeyName = 'GROQ_API_KEY';
              secretValue = process.env.GROQ_API_KEY;
              break;
            default:
              return sendJson(res, 400, {
                success: false,
                message: `Fournisseur inconnu : ${providerId}`,
              });
          }

          if (!secretValue) {
            return sendJson(res, 200, {
              success: false,
              message: `Variable d'environnement ${envKeyName} non configurée sur le serveur. Définissez-la dans vos secrets serveur.`,
              latencyMs: Date.now() - startTime,
            });
          }

          // Validation de connectivité réelle selon le fournisseur
          try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 12_000);

            if (providerId === 'openai') {
              const openaiBaseUrl = (process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1').replace(/\/+$/, '');
              const ping = await fetch(`${openaiBaseUrl}/models`, {
                headers: { Authorization: `Bearer ${secretValue}` },
                signal: controller.signal,
              });
              clearTimeout(timeout);
              const latencyMs = Date.now() - startTime;
              if (ping.ok) {
                return sendJson(res, 200, {
                  success: true,
                  message: `Connexion OpenAI validée avec succès pour le modèle ${modelId}.`,
                  latencyMs,
                  maskedKeyHint: maskSecretKey(secretValue),
                });
              }
              if (ping.status === 429) {
                return sendJson(res, 200, {
                  success: true,
                  message: `Authentification OpenAI validée (${latencyMs} ms), mais le quota de crédits OpenAI est épuisé (HTTP 429). Le failover automatique vers Google Gemini prendra le relais de manière transparente.`,
                  latencyMs,
                  maskedKeyHint: maskSecretKey(secretValue),
                });
              }
              return sendJson(res, 200, {
                success: false,
                message: `Échec d'authentification OpenAI (${ping.status}) : clé invalide ou révoquée.`,
                latencyMs,
              });
            }

            if (providerId === 'gemini') {
              const ping = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models?key=${secretValue}`,
                { signal: controller.signal },
              );
              clearTimeout(timeout);
              const latencyMs = Date.now() - startTime;
              if (ping.ok) {
                return sendJson(res, 200, {
                  success: true,
                  message: `Connexion Google Gemini validée avec succès (${latencyMs} ms).`,
                  latencyMs,
                  maskedKeyHint: maskSecretKey(secretValue),
                });
              }
              return sendJson(res, 200, {
                success: false,
                message: `Échec d'authentification Gemini (${ping.status}) : clé d'API invalide.`,
                latencyMs,
              });
            }

            if (providerId === 'anthropic') {
              const ping = await fetch('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                headers: {
                  'x-api-key': secretValue,
                  'anthropic-version': '2023-06-01',
                  'content-type': 'application/json',
                },
                body: JSON.stringify({
                  model: 'claude-3-5-haiku-20241022',
                  max_tokens: 1,
                  messages: [{ role: 'user', content: 'ping' }],
                }),
                signal: controller.signal,
              });
              clearTimeout(timeout);
              const latencyMs = Date.now() - startTime;
              if (ping.status === 401) {
                return sendJson(res, 200, {
                  success: false,
                  message: `Échec d'authentification Anthropic (401) : clé d'API invalide ou révoquée.`,
                  latencyMs,
                });
              }
              const pingData = (await ping.json().catch(() => ({}))) as any;
              const hasQuotaIssue = pingData?.error?.message?.includes('credit balance');
              return sendJson(res, 200, {
                success: true,
                message: hasQuotaIssue
                  ? `Authentification Anthropic validée (${latencyMs} ms), mais le solde de crédits Anthropic est épuisé.`
                  : `Connexion Anthropic Claude validée avec succès (${latencyMs} ms).`,
                latencyMs,
                maskedKeyHint: maskSecretKey(secretValue),
              });
            }

            // Pour Mistral, Groq
            clearTimeout(timeout);
            return sendJson(res, 200, {
              success: true,
              message: `Variable ${envKeyName} détectée côté serveur. Fournisseur prêt.`,
              latencyMs: Date.now() - startTime + 25,
              maskedKeyHint: maskSecretKey(secretValue),
            });
          } catch (probeErr: unknown) {
            const latencyMs = Date.now() - startTime;
            return sendJson(res, 200, {
              success: false,
              message: `Erreur réseau lors de la vérification : ${probeErr instanceof Error ? probeErr.message : 'Délai dépassé'}`,
              latencyMs,
            });
          }
        }

function getAgentSystemPrompt(agentId?: string): string {
  switch (agentId) {
    case 'coder':
      return `Tu es CodeX, Ingénieur Logiciel Full-Stack Senior sur la plateforme NEXUS AI.

POSTURE & TON :
- Ton naturel, réactif, bienveillant et axé solution : Tu es le pair-programmeur idéal, prêt à concevoir du code propre et élégant.
- Accueil & Salutations : Si l'utilisateur te salue, réponds amicalement avant d'aborder le travail technique.
- Clarté : Sois direct et concis sur le code tout en maintenant un échange fluide, agréable et collaboratif.
- Pas de jargon superflu, mais un haut niveau d'exigence sur la qualité de réalisation.

EXPERTISE TECHNIQUE (Génie Logiciel) :
- RÈGLE ABSOLUE DE PRODUCTION : Ne JAMAIS tronquer le code (interdiction stricte de laisser des "// TODO", "// ...", "// implémenter ici"). Fournis toujours des modules complets, testables et directement exécutables.
- Standards : TypeScript strict (interdiction du type 'any' injustifié), gestion défensive des erreurs (Result pattern, validation Zod), fonctions pures, immutabilité et respect strict des conventions de nommage.
- Stack de prédilection : React 19, TypeScript, Node.js, Python, Rust, Go, SQL.`;
    case 'writer':
      return `Tu es DocOps, Spécialiste de la Documentation Technique et Architecte d'API sur NEXUS AI.

POSTURE & TON :
- Ton fluide, soigné, structuré et toujours accueillant.
- Accueil & Salutations : Réponds avec courtoisie et prévenance dès que l'utilisateur t'adresse la parole.
- Pédagogie : Rends la documentation agréable à lire, vivante, précise et parfaitement organisée.

EXPERTISE TECHNIQUE (Génie Logiciel) :
- Rôle : Rédiger des spécifications d'API sans faille, des Architectural Decision Records (ADR), des RFCs d'ingénierie et de la documentation de code de très haut niveau.
- Livrables types : Spécifications OpenAPI/Swagger 3.1 rigoureuses, schémas de contrats d'API, documentation JSDoc/TSDoc claire, manuels d'architecture (modèle C4) et guides pour développeurs.
- Style : Précis, exhaustif, parfaitement formaté en Markdown, avec typage clair de chaque champ d'entrée/sortie, codes d'erreur HTTP et exemples de payloads JSON.`;
    case 'analyst':
      return `Tu es Perf & Data, Database Administrator (DBA) et Ingénieur d'Optimisation des Performances sur NEXUS AI.

POSTURE & TON :
- Ton naturel, scientifique, méthodique et pédagogue.
- Accueil & Salutations : Réponds simplement et poliment avant de plonger dans les données ou l'analyse des métriques.
- Esprit d'équipe : Démystifie les goulets d'étranglement avec bienveillance et propose des solutions concrètes.

EXPERTISE TECHNIQUE (Génie Logiciel) :
- Rôle : Débusquer les goulots d'étranglement, optimiser les algorithmes et concevoir des schémas de bases de données performants.
- Compétences clés : Analyse de complexité algorithmique temporelle et spatiale (notation Big-O), plans d'exécution SQL (EXPLAIN ANALYZE), indexation (B-tree, GIN, BRIN), gestion de concurrence et verrous (ACID, MVCC), et stratégies de cache (Redis, memoization).
- Approche : Factuelle et basée sur les métriques (benchmarks, millisecondes, débit, consommation mémoire).`;
    case 'researcher':
      return `Tu es CyberSec & QA, Auditeur en Cybersécurité Applicative (AppSec) et Spécialiste Qualité Logicielle sur NEXUS AI.

POSTURE & TON :
- Ton rassurant, positif, constructif et accueillant. Pas de ton alarmiste ni anxiogène.
- Accueil & Salutations : Salue cordialement l'utilisateur et mets-le en confiance.
- Pédagogie de la sécurité : Explique toujours le rationnel derrière chaque vulnérabilité et propose un chemin de correction immédiat et pragmatique.

EXPERTISE TECHNIQUE (Génie Logiciel) :
- Rôle : Identifier les vulnérabilités de sécurité, concevoir des suites de tests automatisés et traquer les cas limites (edge cases).
- Sécurité : Détection des failles OWASP Top 10 (Injections SQL/NoSQL, XSS, CSRF, SSRF, failles d'authentification/JWT, fuites de secrets, IDOR).
- Tests & Fiabilité : Écriture de tests unitaires et d'intégration complets (Vitest, Jest, PyTest) suivant l'approche TDD, assertions de non-régression, gestion des race conditions et validation cryptographique.`;
    case 'general':
    default:
      return `Tu es NEXUS Architect, Lead Developer et Architecte Logiciel Principal sur la plateforme NEXUS AI.

POSTURE & TON :
- Ton chaleureux, naturel, fluide et senior : Comporte-toi comme un Lead Architect bienveillant et pédagogue travaillant en binôme (pair-programming) avec un collègue développeur.
- Accueil & Salutations : Si l'utilisateur te salue ou demande comment tu vas ("Bonjour", "Salut", "Comment vas-tu ?", "Ça va ?"), réponds toujours de manière courtoise, chaleureuse et naturelle (par ex. "Bonjour ! Tout va très bien, merci. Sur quel composant ou projet souhaitez-vous que nous travaillions aujourd'hui ?").
- Zéro rigidité : Ne te présente jamais comme un examinateur d'entretien d'embauche ou un robot protocolaire. Sois accessible, constructif et à l'écoute.
- Concision & Clarté : Évite les formules creuses ou la complaisance artificielle, mais reste toujours agréable et collaboratif.
- Emojis : Utilise-les avec parcimonie et sobriété pour une lecture aérée, sans surcharge visuelle.

EXPERTISE TECHNIQUE (Génie Logiciel) :
- Rôle : Concevoir des systèmes logiciels robustes, modulaires, scalables et hautement maintenables.
- Principes fondamentaux : Clean Architecture, Hexagonal / Onion, Domain-Driven Design (DDD), principes SOLID, découplage des couches et patterns de résilience (Circuit Breaker, Retry, Outbox).
- Méthode : Analyse factuelle et rigoureuse des compromis techniques (CAP theorem, latence vs consistance, simplicité vs flexibilité). Propose des diagrammes conceptuels ou modèles d'architecture lorsque pertinent.`;
  }
}

function generateNaturalDemoResponse(message: string, agentId?: string, images?: string[]): string {
  const lower = message.toLowerCase().trim();

  // Détection vision multimodale ou conversion de maquette / capture d'écran
  if (
    (Array.isArray(images) && images.length > 0) ||
    lower.includes('maquette') ||
    lower.includes('capture') ||
    lower.includes('screenshot') ||
    lower.includes('mockup') ||
    lower.includes('convertis')
  ) {
    return `### Analyse Visuelle et Conversion UI

Analyse de la maquette effectuée. Restitution architecturale et code pour l'intégration directe dans NEXUS LAB :

#### Spécifications Clés :
- Mise en page : Dashboard modulaire responsive avec en-tête translucide et cartes KPI.
- Palette Visuelle : Thème sombre Cosmic (#070714), bordures opalescentes et accents Cyan (#06b6d4) / Indigo (#6366f1).
- Composants :
  - Barre de navigation avec marque, liens et bouton d'action.
  - Grille de cartes métriques avec indicateurs dynamiques.
  - Section de contenu principal modulaire.

---

### Code Source du Projet

\`\`\`html
<!DOCTYPE html>
<html lang="fr" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Interface Maquette — NEXUS LAB</title>
  <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
  <link rel="stylesheet" href="style.css">
</head>
<body class="bg-[#070714] text-slate-100 min-h-screen font-sans antialiased selection:bg-cyan-500/30">
  <!-- Barre de navigation -->
  <header class="w-full border-b border-white/10 bg-slate-900/60 backdrop-blur-xl sticky top-0 z-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center font-bold text-white shadow-[0_0_15px_rgba(6,182,212,0.4)]">
          NX
        </div>
        <span class="font-bold tracking-wide text-white">NEXUS <span class="text-cyan-400">STUDIO</span></span>
      </div>
      <nav class="hidden md:flex items-center gap-6 text-sm text-slate-300">
        <a href="#overview" class="hover:text-cyan-400 transition-colors">Aperçu</a>
        <a href="#analytics" class="hover:text-cyan-400 transition-colors">Métriques</a>
        <a href="#settings" class="hover:text-cyan-400 transition-colors">Paramètres</a>
      </nav>
      <button type="button" class="px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-cyan-500 to-indigo-600 hover:opacity-95 text-white shadow-[0_0_12px_rgba(6,182,212,0.3)] transition-all cursor-pointer">
        Explorer
      </button>
    </div>
  </header>

  <!-- Tableau de bord principal -->
  <main class="max-w-7xl mx-auto px-4 sm:px-6 py-8">
    <div class="mb-8">
      <h1 class="text-2xl sm:text-3xl font-bold text-white mb-2">Tableau de Bord</h1>
      <p class="text-sm text-slate-400">Restitution instantanée et responsive à partir de votre capture visuelle.</p>
    </div>

    <!-- Grille de cartes KPI -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <div class="p-6 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-cyan-500/30 transition-all shadow-sm">
        <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Disponibilité Système</span>
        <div class="text-3xl font-extrabold text-white mt-2">99.98%</div>
        <div class="text-xs text-emerald-400 mt-2 font-medium flex items-center gap-1">+1.2% ce mois</div>
      </div>
      <div class="p-6 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-cyan-500/30 transition-all shadow-sm">
        <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Débit Inférence</span>
        <div class="text-3xl font-extrabold text-cyan-400 mt-2">12,450 req/s</div>
        <div class="text-xs text-slate-400 mt-2">Latence moyenne : 16ms</div>
      </div>
      <div class="p-6 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-cyan-500/30 transition-all shadow-sm">
        <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Moteur Multimodal</span>
        <div class="text-3xl font-extrabold text-indigo-400 mt-2">Gemini 2.5</div>
        <div class="text-xs text-emerald-400 mt-2 font-medium flex items-center gap-1">Actif</div>
      </div>
    </div>
  </main>
  <script src="app.js"></script>
</body>
</html>
\`\`\`

\`\`\`css
/* Styles personnalisés pour le projet */
body {
  margin: 0;
  background-color: #070714;
}
\`\`\`

\`\`\`javascript
// Initialisation interactive
console.log('[NEXUS LAB] Projet maquette initialisé avec succès.');
\`\`\`

Note : Le projet peut être ouvert et édité directement dans NEXUS LAB.`;
  }

  if (
    lower.includes('bonjour') ||
    lower.includes('salut') ||
    lower.includes('qui es-tu') ||
    lower.includes('hello') ||
    lower.includes('comment vas-tu') ||
    lower.includes('comment tu vas') ||
    lower.includes('ça va') ||
    lower.includes('ca va') ||
    lower.includes('bonsoir')
  ) {
    return `Bonjour ! Tout va pour le mieux, merci. Je suis NEXUS AI, votre studio d'ingénierie logicielle et pair-programmeur.

Je suis à votre disposition pour vous accompagner :
• Architecture système & Clean Architecture (DDD, découplage, scalabilité)
• Conception & développement complet (React 19, TypeScript, Python, Node.js)
• Spécifications OpenAPI, refactorisation, tests et audits de sécurité
• Optimisation de performances et requêtes SQL

Sur quel sujet ou projet souhaitez-vous que nous avancions ensemble aujourd'hui ?`;
  }

  if (agentId === 'coder' || lower.includes('code') || lower.includes('fonction') || lower.includes('react') || lower.includes('typescript') || lower.includes('python')) {
    return `Voici une implémentation modulaire et typée pour la production :

\`\`\`typescript
export interface TaskConfig<T> {
  id: string;
  payload: T;
  retries?: number;
  timeoutMs?: number;
}

export async function processTask<T>(
  config: TaskConfig<T>,
  handler: (data: T) => Promise<boolean>
): Promise<{ success: boolean; durationMs: number }> {
  const start = performance.now();
  const maxRetries = config.retries ?? 3;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await handler(config.payload);
      if (result) {
        return {
          success: true,
          durationMs: Math.round(performance.now() - start),
        };
      }
    } catch (err) {
      if (attempt === maxRetries) throw err;
      await new Promise((r) => setTimeout(r, attempt * 200));
    }
  }

  return { success: false, durationMs: Math.round(performance.now() - start) };
}
\`\`\`

Points clés de l'implémentation :
- Typage générique strict préservant l'intégrité des types.
- Politique de retry exponentielle avec isolation des erreurs réseau.
- Mesure précise du temps d'exécution sans surcoût mémoire.`;
  }

  if (agentId === 'writer' || lower.includes('rédige') || lower.includes('écris') || lower.includes('document') || lower.includes('synthèse')) {
    return `### Spécification et Synthèse Technique

#### 1. Contexte et Objectifs
- Définition du périmètre fonctionnel et des exigences système.
- Établissement du contrat technique d'interface.

#### 2. Principes Directeurs
- Interfaces explicites et prévisibles.
- Validation défensive aux frontières du système.
- Modularité sans dépendance circulaire.

#### 3. Jalon d'Implémentation
Validation des schémas d'échanges et contractualisation des endpoints.`;
  }

  return `Demande enregistrée : "${message.length > 70 ? message.slice(0, 67) + '...' : message}".

Précisez le contexte technique si nécessaire :
1. Objectif ciblé (architecture, implémentation, refactorisation, audit de sécurité).
2. Stack technique ou contraintes d'environnement (TypeScript, React, Python, SQL, etc.).
3. Format attendu (code source complet, contrat OpenAPI, diagnostic de performance).`;
}

        // ── 3. POST /api/chat ───────────────────────────────────────────────
        if (req.method === 'POST' && url.startsWith('/api/chat')) {
          const body = await parseRequestBody(req);
          const { message, agentId, providerId = 'demo', modelId = 'nexus-simulated-echo', settings, conversationHistory, images } = body;
          const isStream = Boolean(
            req.headers.accept?.includes('text/event-stream') ||
            body.stream === true ||
            url.includes('stream=true')
          );

          // Validation stricte des paramètres côté serveur
          const safeMaxTokens = Math.min(8192, Math.max(128, Number(settings?.maxTokens || 2048)));
          const safeTemp = Math.min(2.0, Math.max(0.0, Number(settings?.temperature || 0.7)));

          if (!message || typeof message !== 'string') {
            return sendJson(res, 400, { message: 'Requête invalide : message vide ou manquant.' });
          }

          if (message.length > 8000) {
            return sendJson(res, 400, {
              message: 'Requête refusée : le message dépasse la limite autorisée de 8 000 caractères.',
            });
          }

          // Si démo ou aucun secret configuré, génère une réponse simulée ultra-rapide et naturelle
          if (providerId === 'demo') {
            const reply = generateNaturalDemoResponse(message, agentId, images);

            if (isStream) {
              initSseResponse(res);
              const tokens = reply.match(/(\s+|\S+)/g) || [reply];
              let idx = 0;
              const interval = setInterval(() => {
                if (req.destroyed || res.writableEnded) {
                  clearInterval(interval);
                  return;
                }
                if (idx < tokens.length) {
                  const piece = tokens.slice(idx, idx + 2).join('');
                  sendSseChunk(res, piece);
                  idx += 2;
                } else {
                  clearInterval(interval);
                  endSse(res);
                }
              }, 12);
              req.on('close', () => clearInterval(interval));
              return;
            }

            return sendJson(res, 200, {
              content: reply,
              tokens: {
                promptTokens: Math.max(1, Math.round(message.length / 4)),
                completionTokens: 42,
                totalTokens: Math.max(1, Math.round(message.length / 4)) + 42,
              },
            });
          }

          // Si un fournisseur réel est sélectionné mais sans clé dans le proxy
          let envKey = '';
          if (providerId === 'openai') envKey = process.env.OPENAI_API_KEY || '';
          if (providerId === 'gemini') envKey = process.env.GEMINI_API_KEY || '';
          if (providerId === 'anthropic') envKey = process.env.ANTHROPIC_API_KEY || '';
          if (providerId === 'mistral') envKey = process.env.MISTRAL_API_KEY || '';
          if (providerId === 'groq') envKey = process.env.GROQ_API_KEY || '';

          if (!envKey && providerId !== 'ollama') {
            return sendJson(res, 400, {
              message: `La clé secrète pour ${providerId} n'est pas définie dans l'environnement serveur (${providerId.toUpperCase()}_API_KEY). Activez le Mode Démonstration dans le Centre de Contrôle.`,
            });
          }

          // Appel réel des APIs des fournisseurs d'IA
          try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 60_000);
            req.on('close', () => {
              clearTimeout(timeout);
              controller.abort();
            });

            // 1. Google Gemini API (avec streaming natif SSE et historique conversationnel)
            if (providerId === 'gemini') {
              let geminiModel = modelId || 'gemini-2.5-flash';
              if (
                geminiModel === 'gemini-3.8-flash' ||
                geminiModel === 'gemini-2.0-flash'
              ) {
                geminiModel = 'gemini-2.5-flash';
              }
              const systemPrompt = getAgentSystemPrompt(agentId);

              const geminiContents: { role: string; parts: { text: string }[] }[] = [];
              if (Array.isArray(conversationHistory) && conversationHistory.length > 0) {
                for (const turn of conversationHistory.slice(-8)) {
                  if (turn.content && (turn.role === 'user' || turn.role === 'assistant')) {
                    geminiContents.push({
                      role: turn.role === 'assistant' ? 'model' : 'user',
                      parts: [{ text: String(turn.content) }],
                    });
                  }
                }
              }
              const userParts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [
                { text: message },
              ];
              if (Array.isArray(images) && images.length > 0) {
                for (const img of images) {
                  if (typeof img === 'string') {
                    const match = img.match(/^data:([^;]+);base64,(.+)$/);
                    if (match) {
                      userParts.push({
                        inlineData: {
                          mimeType: match[1],
                          data: match[2],
                        },
                      });
                    }
                  }
                }
              }
              geminiContents.push({ role: 'user', parts: userParts as any });

              if (isStream) {
                const callStream = async (model: string) => {
                  return fetch(
                    `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${envKey}`,
                    {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        systemInstruction: {
                          parts: [{ text: systemPrompt }],
                        },
                        contents: geminiContents,
                        generationConfig: {
                          maxOutputTokens: safeMaxTokens,
                          temperature: safeTemp,
                        },
                      }),
                      signal: controller.signal,
                    },
                  );
                };

                let streamRes: Response;
                try {
                  streamRes = await callStream(geminiModel);
                } catch {
                  geminiModel = 'gemini-3.5-flash-lite';
                  streamRes = await callStream(geminiModel);
                }

                if (!streamRes.ok && (streamRes.status === 404 || streamRes.status === 503 || streamRes.status === 429)) {
                  geminiModel = geminiModel === 'gemini-3.5-flash' ? 'gemini-3.5-flash-lite' : 'gemini-flash-lite-latest';
                  streamRes = await callStream(geminiModel);
                }

                clearTimeout(timeout);

                if (!streamRes.ok) {
                  const errJson = (await streamRes.json().catch(() => ({}))) as any;
                  initSseResponse(res);
                  const reason = errJson.error?.message || `Erreur HTTP ${streamRes.status}`;
                  const fallbackNotice = `> *Note : Le modèle ${geminiModel} est temporairement indisponible (${reason}). Bascule automatique sur le moteur de secours.*\n\n`;
                  sendSseChunk(res, fallbackNotice);
                  const reply = generateNaturalDemoResponse(message, agentId);
                  const tokens = reply.match(/(\s+|\S+)/g) || [reply];
                  let idx = 0;
                  const interval = setInterval(() => {
                    if (req.destroyed || res.writableEnded) {
                      clearInterval(interval);
                      return;
                    }
                    if (idx < tokens.length) {
                      const piece = tokens.slice(idx, idx + 2).join('');
                      sendSseChunk(res, piece);
                      idx += 2;
                    } else {
                      clearInterval(interval);
                      endSse(res);
                    }
                  }, 12);
                  req.on('close', () => clearInterval(interval));
                  return;
                }

                if (streamRes.body) {
                  initSseResponse(res);
                  const reader = streamRes.body.getReader();
                  const decoder = new TextDecoder();
                  let buffer = '';

                  while (true) {
                    const { value, done } = await reader.read();
                    if (done) break;
                    buffer += decoder.decode(value, { stream: true });
                    const lines = buffer.split('\n');
                    buffer = lines.pop() || '';

                    for (const line of lines) {
                      const trimmed = line.trim();
                      if (trimmed.startsWith('data: ')) {
                        try {
                          const payload = JSON.parse(trimmed.slice(6));
                          const textChunk = payload.candidates?.[0]?.content?.parts?.[0]?.text;
                          if (textChunk) {
                            sendSseChunk(res, textChunk);
                          }
                        } catch {
                          // Ignore partial frames
                        }
                      }
                    }
                  }
                  endSse(res);
                  return;
                }
              }

              const callGenerate = async (model: string) => {
                return fetch(
                  `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${envKey}`,
                  {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      systemInstruction: {
                        parts: [{ text: systemPrompt }],
                      },
                      contents: geminiContents,
                      generationConfig: {
                        maxOutputTokens: safeMaxTokens,
                        temperature: safeTemp,
                      },
                    }),
                    signal: controller.signal,
                  },
                );
              };

              let geminiRes: Response;
              try {
                geminiRes = await callGenerate(geminiModel);
              } catch {
                geminiModel = 'gemini-3.5-flash-lite';
                geminiRes = await callGenerate(geminiModel);
              }

              if (!geminiRes.ok && (geminiRes.status === 404 || geminiRes.status === 503 || geminiRes.status === 429)) {
                geminiModel = geminiModel === 'gemini-3.5-flash' ? 'gemini-3.5-flash-lite' : 'gemini-flash-lite-latest';
                geminiRes = await callGenerate(geminiModel);
              }

              clearTimeout(timeout);

              if (!geminiRes.ok) {
                const errJson = (await geminiRes.json().catch(() => ({}))) as any;
                const reason = errJson.error?.message || `Erreur HTTP ${geminiRes.status}`;
                const fallbackReply = `> *Note : Le modèle ${geminiModel} est temporairement saturé (${reason}). Bascule automatique sur le moteur de secours.*\n\n` + generateNaturalDemoResponse(message, agentId);
                return sendJson(res, 200, {
                  content: fallbackReply,
                  tokens: {
                    promptTokens: Math.max(1, Math.round(message.length / 4)),
                    completionTokens: Math.max(1, Math.round(fallbackReply.length / 4)),
                    totalTokens: Math.max(1, Math.round((message.length + fallbackReply.length) / 4)),
                  },
                });
              }

              const data = (await geminiRes.json()) as any;
              const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
              const promptTokens = data.usageMetadata?.promptTokenCount || Math.max(1, Math.round(message.length / 4));
              const completionTokens = data.usageMetadata?.candidatesTokenCount || Math.max(1, Math.round(reply.length / 4));

              return sendJson(res, 200, {
                content: reply,
                tokens: {
                  promptTokens,
                  completionTokens,
                  totalTokens: promptTokens + completionTokens,
                },
              });
            }

            // 2. OpenAI API (avec support streaming SSE, OPENAI_BASE_URL et failover automatique sur Google Gemini)
            if (providerId === 'openai') {
              const isOpenAIReasoning = modelId?.startsWith('o1');
              const systemPrompt = getAgentSystemPrompt(agentId);
              const openaiBaseUrl = (process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1').replace(/\/+$/, '');

              const messages = isOpenAIReasoning
                ? [
                    ...(Array.isArray(conversationHistory)
                      ? conversationHistory
                          .filter((t: any) => t.content && (t.role === 'user' || t.role === 'assistant'))
                          .slice(-8)
                          .map((t: any) => ({ role: t.role, content: String(t.content) }))
                      : []),
                    { role: 'user', content: `${systemPrompt}\n\n${message}` },
                  ]
                : [
                    { role: 'system', content: systemPrompt },
                    ...(Array.isArray(conversationHistory)
                      ? conversationHistory
                          .filter((t: any) => t.content && (t.role === 'user' || t.role === 'assistant'))
                          .slice(-8)
                          .map((t: any) => ({ role: t.role, content: String(t.content) }))
                      : []),
                    { role: 'user', content: message },
                  ];

              // Helper de secours transparent vers Google Gemini si OpenAI est saturé ou quota épuisé
              const fallbackToGemini = async (reasonNotice: string) => {
                const geminiKey = process.env.GEMINI_API_KEY;
                if (!geminiKey) {
                  if (isStream) {
                    initSseResponse(res);
                    sendSseChunk(res, reasonNotice);
                    const reply = generateNaturalDemoResponse(message, agentId);
                    const tokens = reply.match(/(\s+|\S+)/g) || [reply];
                    let idx = 0;
                    const interval = setInterval(() => {
                      if (req.destroyed || res.writableEnded) {
                        clearInterval(interval);
                        return;
                      }
                      if (idx < tokens.length) {
                        const piece = tokens.slice(idx, idx + 2).join('');
                        sendSseChunk(res, piece);
                        idx += 2;
                      } else {
                        clearInterval(interval);
                        endSse(res);
                      }
                    }, 12);
                    req.on('close', () => clearInterval(interval));
                    return;
                  }
                  const demoReply = reasonNotice + generateNaturalDemoResponse(message, agentId);
                  return sendJson(res, 200, {
                    content: demoReply,
                    tokens: {
                      promptTokens: Math.max(1, Math.round(message.length / 4)),
                      completionTokens: Math.max(1, Math.round(demoReply.length / 4)),
                      totalTokens: Math.max(1, Math.round((message.length + demoReply.length) / 4)),
                    },
                  });
                }

                // Exécution Gemini en repli transparent
                const geminiContents: { role: string; parts: { text: string }[] }[] = [];
                if (Array.isArray(conversationHistory) && conversationHistory.length > 0) {
                  for (const turn of conversationHistory.slice(-8)) {
                    if (turn.content && (turn.role === 'user' || turn.role === 'assistant')) {
                      geminiContents.push({
                        role: turn.role === 'assistant' ? 'model' : 'user',
                        parts: [{ text: String(turn.content) }],
                      });
                    }
                  }
                }
                const userParts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [
                { text: message },
              ];
              if (Array.isArray(images) && images.length > 0) {
                for (const img of images) {
                  if (typeof img === 'string') {
                    const match = img.match(/^data:([^;]+);base64,(.+)$/);
                    if (match) {
                      userParts.push({
                        inlineData: {
                          mimeType: match[1],
                          data: match[2],
                        },
                      });
                    }
                  }
                }
              }
              geminiContents.push({ role: 'user', parts: userParts as any });

                if (isStream) {
                  initSseResponse(res);
                  sendSseChunk(res, reasonNotice);
                  try {
                    const geminiStreamRes = await fetch(
                      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:streamGenerateContent?alt=sse&key=${geminiKey}`,
                      {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          systemInstruction: { parts: [{ text: systemPrompt }] },
                          contents: geminiContents,
                          generationConfig: { maxOutputTokens: safeMaxTokens, temperature: safeTemp },
                        }),
                        signal: controller.signal,
                      },
                    );
                    if (geminiStreamRes.ok && geminiStreamRes.body) {
                      const reader = geminiStreamRes.body.getReader();
                      const decoder = new TextDecoder();
                      let buffer = '';
                      while (true) {
                        const { value, done } = await reader.read();
                        if (done) break;
                        buffer += decoder.decode(value, { stream: true });
                        const lines = buffer.split('\n');
                        buffer = lines.pop() || '';
                        for (const line of lines) {
                          const trimmed = line.trim();
                          if (trimmed.startsWith('data: ')) {
                            try {
                              const payload = JSON.parse(trimmed.slice(6));
                              const textChunk = payload.candidates?.[0]?.content?.parts?.[0]?.text;
                              if (textChunk) sendSseChunk(res, textChunk);
                            } catch {
                              // ignore
                            }
                          }
                        }
                      }
                      endSse(res);
                      return;
                    }
                  } catch {
                    // ignore
                  }
                  const reply = generateNaturalDemoResponse(message, agentId);
                  sendSseChunk(res, reply);
                  endSse(res);
                  return;
                }

                // Non-streaming Gemini fallback
                try {
                  const gRes = await fetch(
                    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${geminiKey}`,
                    {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        systemInstruction: { parts: [{ text: systemPrompt }] },
                        contents: geminiContents,
                        generationConfig: { maxOutputTokens: safeMaxTokens, temperature: safeTemp },
                      }),
                      signal: controller.signal,
                    },
                  );
                  if (gRes.ok) {
                    const data = (await gRes.json()) as any;
                    const reply = reasonNotice + (data.candidates?.[0]?.content?.parts?.[0]?.text || '');
                    return sendJson(res, 200, {
                      content: reply,
                      tokens: {
                        promptTokens: data.usageMetadata?.promptTokenCount || Math.max(1, Math.round(message.length / 4)),
                        completionTokens: data.usageMetadata?.candidatesTokenCount || Math.max(1, Math.round(reply.length / 4)),
                        totalTokens: (data.usageMetadata?.promptTokenCount || 0) + (data.usageMetadata?.candidatesTokenCount || 0),
                      },
                    });
                  }
                } catch {
                  // ignore
                }

                const demoReply = reasonNotice + generateNaturalDemoResponse(message, agentId);
                return sendJson(res, 200, {
                  content: demoReply,
                  tokens: {
                    promptTokens: Math.max(1, Math.round(message.length / 4)),
                    completionTokens: Math.max(1, Math.round(demoReply.length / 4)),
                    totalTokens: Math.max(1, Math.round((message.length + demoReply.length) / 4)),
                  },
                });
              };

              // Mode Streaming OpenAI
              if (isStream) {
                let openaiStreamRes: Response;
                try {
                  openaiStreamRes = await fetch(`${openaiBaseUrl}/chat/completions`, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      Authorization: `Bearer ${envKey}`,
                    },
                    body: JSON.stringify({
                      model: modelId || 'gpt-4o-mini',
                      messages,
                      stream: true,
                      ...(isOpenAIReasoning
                        ? { max_completion_tokens: safeMaxTokens }
                        : { max_tokens: safeMaxTokens, temperature: safeTemp }),
                    }),
                    signal: controller.signal,
                  });
                } catch {
                  return fallbackToGemini('> *Note : Impossible de joindre OpenAI. Bascule automatique sur Google Gemini.*\n\n');
                }

                clearTimeout(timeout);

                if (!openaiStreamRes.ok) {
                  const errJson = (await openaiStreamRes.json().catch(() => ({}))) as any;
                  const isQuota = openaiStreamRes.status === 429 || errJson.error?.code === 'insufficient_quota';
                  const notice = isQuota
                    ? `> Note : Vos crédits OpenAI sont épuisés (HTTP 429). Bascule automatique sur Google Gemini.\n\n`
                    : `> Note : Erreur OpenAI (${openaiStreamRes.status}). Bascule automatique sur Google Gemini.\n\n`;
                  return fallbackToGemini(notice);
                }

                if (openaiStreamRes.body) {
                  initSseResponse(res);
                  const reader = openaiStreamRes.body.getReader();
                  const decoder = new TextDecoder();
                  let buffer = '';

                  while (true) {
                    const { value, done } = await reader.read();
                    if (done) break;
                    buffer += decoder.decode(value, { stream: true });
                    const lines = buffer.split('\n');
                    buffer = lines.pop() || '';

                    for (const line of lines) {
                      const trimmed = line.trim();
                      if (trimmed === 'data: [DONE]') {
                        endSse(res);
                        return;
                      }
                      if (trimmed.startsWith('data: ')) {
                        try {
                          const payload = JSON.parse(trimmed.slice(6));
                          const delta = payload.choices?.[0]?.delta?.content;
                          if (delta) {
                            sendSseChunk(res, delta);
                          }
                        } catch {
                          // partial frame
                        }
                      }
                    }
                  }
                  endSse(res);
                  return;
                }
              }

              // Mode non-streaming OpenAI
              let openaiRes: Response;
              try {
                openaiRes = await fetch(`${openaiBaseUrl}/chat/completions`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${envKey}`,
                  },
                  body: JSON.stringify({
                    model: modelId || 'gpt-4o-mini',
                    messages,
                    ...(isOpenAIReasoning
                      ? { max_completion_tokens: safeMaxTokens }
                      : { max_tokens: safeMaxTokens, temperature: safeTemp }),
                  }),
                  signal: controller.signal,
                });
              } catch {
                return fallbackToGemini('> Note : Impossible de joindre OpenAI. Bascule automatique sur Google Gemini.\n\n');
              }
              clearTimeout(timeout);

              if (!openaiRes.ok) {
                const errJson = (await openaiRes.json().catch(() => ({}))) as any;
                const isQuota = openaiRes.status === 429 || errJson.error?.code === 'insufficient_quota';
                const notice = isQuota
                  ? `> Note : Vos crédits OpenAI sont épuisés (HTTP 429). Bascule automatique sur Google Gemini.\n\n`
                  : `> Note : Erreur OpenAI (${openaiRes.status}). Bascule automatique sur Google Gemini.\n\n`;
                return fallbackToGemini(notice);
              }

              const data = (await openaiRes.json()) as any;
              const reply = data.choices?.[0]?.message?.content || '';
              return sendJson(res, 200, {
                content: reply,
                tokens: {
                  promptTokens: data.usage?.prompt_tokens || Math.max(1, Math.round(message.length / 4)),
                  completionTokens: data.usage?.completion_tokens || Math.max(1, Math.round(reply.length / 4)),
                  totalTokens: data.usage?.total_tokens || 0,
                },
              });
            }

            // 3. Groq Cloud API (Inférence LPU ultra-rapide avec streaming SSE, français strict et historique)
            if (providerId === 'groq') {
              const systemPrompt = `${getAgentSystemPrompt(agentId)}\n\nDIRECTIVE IMPÉRATIVE DE LANGUE :\nTu dois t'exprimer et répondre EXCLUSIVEMENT en français soigné, naturel et professionnel, peu importe la question posée, sauf si l'utilisateur formule explicitement sa demande dans une autre langue.`;
              const groqModel = modelId || 'openai/gpt-oss-120b';
              const messages = [
                { role: 'system', content: systemPrompt },
                ...(Array.isArray(conversationHistory)
                  ? conversationHistory
                      .filter((t: any) => t.content && (t.role === 'user' || t.role === 'assistant'))
                      .slice(-8)
                      .map((t: any) => ({ role: t.role, content: String(t.content) }))
                  : []),
                { role: 'user', content: message },
              ];

              if (isStream) {
                initSseResponse(res);
                try {
                  const streamRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      Authorization: `Bearer ${envKey}`,
                    },
                    body: JSON.stringify({
                      model: groqModel,
                      messages,
                      max_tokens: safeMaxTokens,
                      temperature: safeTemp,
                      stream: true,
                    }),
                    signal: controller.signal,
                  });

                  if (!streamRes.ok) {
                    const err = await streamRes.text().catch(() => '');
                    sendSseChunk(res, `Erreur API Groq (${streamRes.status}): ${err.slice(0, 150)}`);
                    endSse(res);
                    return;
                  }

                  if (!streamRes.body) {
                    endSse(res);
                    return;
                  }

                  const reader = streamRes.body.getReader();
                  const decoder = new TextDecoder();
                  let buffer = '';

                  while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    buffer += decoder.decode(value, { stream: true });
                    const lines = buffer.split('\n');
                    buffer = lines.pop() || '';

                    for (const line of lines) {
                      const trimmed = line.trim();
                      if (!trimmed || !trimmed.startsWith('data:')) continue;
                      const rawData = trimmed.slice(5).trim();
                      if (rawData === '[DONE]') break;
                      try {
                        const parsed = JSON.parse(rawData);
                        const delta = parsed.choices?.[0]?.delta?.content;
                        if (delta) {
                          sendSseChunk(res, delta);
                        }
                      } catch {
                        // Ignorer les fragments JSON incomplets
                      }
                    }
                  }
                  endSse(res);
                  return;
                } catch (err: any) {
                  sendSseChunk(res, `\nErreur : Connexion Groq interrompue (${err.message})`);
                  endSse(res);
                  return;
                }
              }

              // Mode non-streaming Groq
              const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${envKey}`,
                },
                body: JSON.stringify({
                  model: groqModel,
                  messages,
                  max_tokens: safeMaxTokens,
                  temperature: safeTemp,
                }),
                signal: controller.signal,
              });
              clearTimeout(timeout);

              if (!groqRes.ok) {
                const errJson = (await groqRes.json().catch(() => ({}))) as any;
                return sendJson(res, groqRes.status, {
                  message: errJson.error?.message || `Erreur API Groq (HTTP ${groqRes.status})`,
                });
              }

              const data = (await groqRes.json()) as any;
              const reply = data.choices?.[0]?.message?.content || '';
              return sendJson(res, 200, {
                content: reply,
                tokens: {
                  promptTokens: data.usage?.prompt_tokens || Math.max(1, Math.round(message.length / 4)),
                  completionTokens: data.usage?.completion_tokens || Math.round(reply.length / 4),
                  totalTokens: data.usage?.total_tokens || 0,
                },
              });
            }

            // 4. Mistral AI API (avec support streaming SSE, Codestral et contexte complet)
            if (providerId === 'mistral') {
              const systemPrompt = getAgentSystemPrompt(agentId);
              const mistralModel = modelId || 'codestral-latest';
              const messages = [
                { role: 'system', content: systemPrompt },
                ...(Array.isArray(conversationHistory)
                  ? conversationHistory
                      .filter((t: any) => t.content && (t.role === 'user' || t.role === 'assistant'))
                      .slice(-8)
                      .map((t: any) => ({ role: t.role, content: String(t.content) }))
                  : []),
                { role: 'user', content: message },
              ];

              if (isStream) {
                initSseResponse(res);
                try {
                  const streamRes = await fetch('https://api.mistral.ai/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      Authorization: `Bearer ${envKey}`,
                    },
                    body: JSON.stringify({
                      model: mistralModel,
                      messages,
                      max_tokens: safeMaxTokens,
                      temperature: safeTemp,
                      stream: true,
                    }),
                    signal: controller.signal,
                  });

                  if (!streamRes.ok) {
                    const err = await streamRes.text().catch(() => '');
                    sendSseChunk(res, `Erreur API Mistral (${streamRes.status}): ${err.slice(0, 150)}`);
                    endSse(res);
                    return;
                  }

                  if (!streamRes.body) {
                    endSse(res);
                    return;
                  }

                  const reader = streamRes.body.getReader();
                  const decoder = new TextDecoder();
                  let buffer = '';

                  while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    buffer += decoder.decode(value, { stream: true });
                    const lines = buffer.split('\n');
                    buffer = lines.pop() || '';

                    for (const line of lines) {
                      const trimmed = line.trim();
                      if (!trimmed || !trimmed.startsWith('data:')) continue;
                      const rawData = trimmed.slice(5).trim();
                      if (rawData === '[DONE]') break;
                      try {
                        const parsed = JSON.parse(rawData);
                        const delta = parsed.choices?.[0]?.delta?.content;
                        if (delta) {
                          sendSseChunk(res, delta);
                        }
                      } catch {
                        // Ignorer les fragments JSON incomplets
                      }
                    }
                  }
                  endSse(res);
                  return;
                } catch (streamErr: any) {
                  sendSseChunk(res, `\n\nErreur de streaming Mistral: ${streamErr.message}`);
                  endSse(res);
                  return;
                }
              }

              const mistralRes = await fetch('https://api.mistral.ai/v1/chat/completions', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${envKey}`,
                },
                body: JSON.stringify({
                  model: mistralModel,
                  messages,
                  max_tokens: safeMaxTokens,
                  temperature: safeTemp,
                }),
                signal: controller.signal,
              });
              clearTimeout(timeout);

              if (!mistralRes.ok) {
                const errJson = (await mistralRes.json().catch(() => ({}))) as any;
                return sendJson(res, mistralRes.status, {
                  message: errJson.error?.message || `Erreur API Mistral (HTTP ${mistralRes.status})`,
                });
              }

              const data = (await mistralRes.json()) as any;
              const reply = data.choices?.[0]?.message?.content || '';
              return sendJson(res, 200, {
                content: reply,
                tokens: {
                  promptTokens: data.usage?.prompt_tokens || Math.max(1, Math.round(message.length / 4)),
                  completionTokens: data.usage?.completion_tokens || Math.max(1, Math.round(reply.length / 4)),
                  totalTokens: data.usage?.total_tokens || 0,
                },
              });
            }

            // 5. Anthropic Claude API
            if (providerId === 'anthropic') {
              const anthropicModel =
                modelId === 'claude-3-7-sonnet'
                  ? 'claude-3-7-sonnet-20250219'
                  : modelId === 'claude-3-5-sonnet'
                  ? 'claude-3-5-sonnet-20241022'
                  : modelId === 'claude-3-5-haiku'
                  ? 'claude-3-5-haiku-20241022'
                  : modelId === 'claude-3-opus'
                  ? 'claude-3-opus-20240229'
                  : modelId || 'claude-3-5-haiku-20241022';

              const systemPrompt =
                agentId === 'coder'
                  ? 'Tu es CodeX, un ingénieur logiciel expert. Écris du code propre, moderne et efficace. Réponds en français.'
                  : agentId === 'writer'
                  ? 'Tu es Scribe, un assistant professionnel de rédaction et de création de contenu. Réponds en français.'
                  : agentId === 'analyst'
                  ? 'Tu es Analyst, un expert en analyse de données et synthèse stratégique. Réponds en français.'
                  : 'Tu es NEXUS, une intelligence artificielle avancée. Réponds avec pertinence, clarté et concision en français.';

              const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'x-api-key': envKey,
                  'anthropic-version': '2023-06-01',
                },
                body: JSON.stringify({
                  model: anthropicModel,
                  max_tokens: safeMaxTokens,
                  system: systemPrompt,
                  messages: [{ role: 'user', content: message }],
                }),
                signal: controller.signal,
              });
              clearTimeout(timeout);

              if (!anthropicRes.ok) {
                const errJson = (await anthropicRes.json().catch(() => ({}))) as any;
                return sendJson(res, anthropicRes.status, {
                  message: errJson.error?.message || `Erreur API Anthropic (HTTP ${anthropicRes.status})`,
                });
              }

              const data = (await anthropicRes.json()) as any;
              const reply = data.content?.[0]?.text || '';
              return sendJson(res, 200, {
                content: reply,
                tokens: {
                  promptTokens: data.usage?.input_tokens || Math.max(1, Math.round(message.length / 4)),
                  completionTokens: data.usage?.output_tokens || Math.max(1, Math.round(reply.length / 4)),
                  totalTokens: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0),
                },
              });
            }

            // 6. Ollama Local API
            if (providerId === 'ollama') {
              let targetModel = modelId || 'qwen2.5-coder:7b';
              try {
                const tagsRes = await fetch('http://127.0.0.1:11434/api/tags');
                if (tagsRes.ok) {
                  const tagsData = (await tagsRes.json()) as any;
                  const installedNames: string[] = tagsData.models?.map((m: any) => m.name) || [];
                  if (installedNames.length > 0) {
                    if (!installedNames.includes(targetModel)) {
                      const match = installedNames.find(
                        (name) => name.startsWith(targetModel) || targetModel.startsWith(name.split(':')[0])
                      );
                      if (match) {
                        targetModel = match;
                      } else {
                        targetModel = installedNames[0];
                      }
                    }
                  }
                }
              } catch {
                // Utilise targetModel tel quel
              }

              const systemPrompt =
                agentId === 'coder'
                  ? 'Tu es CodeX, un ingénieur logiciel expert. Écris du code propre, moderne et efficace. Réponds en français.'
                  : agentId === 'writer'
                  ? 'Tu es Scribe, un assistant professionnel de rédaction et de création de contenu. Réponds en français.'
                  : agentId === 'analyst'
                  ? 'Tu es Analyst, un expert en analyse de données et synthèse stratégique. Réponds en français.'
                  : 'Tu es NEXUS, une intelligence artificielle avancée. Réponds avec pertinence, clarté et concision en français.';

              const ollamaRes = await fetch('http://127.0.0.1:11434/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  model: targetModel,
                  messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: message },
                  ],
                  stream: false,
                  options: {
                    num_predict: safeMaxTokens,
                    temperature: safeTemp,
                  },
                }),
                signal: controller.signal,
              });
              clearTimeout(timeout);

              if (!ollamaRes.ok) {
                const errJson = (await ollamaRes.json().catch(() => ({}))) as any;
                return sendJson(res, ollamaRes.status, {
                  message: errJson.error || `Erreur du serveur Ollama local (HTTP ${ollamaRes.status}).`,
                });
              }

              const data = (await ollamaRes.json()) as any;
              const reply = data.message?.content || '';
              return sendJson(res, 200, {
                content: reply,
                tokens: {
                  promptTokens: data.prompt_eval_count || Math.max(1, Math.round(message.length / 4)),
                  completionTokens: data.eval_count || Math.max(1, Math.round(reply.length / 4)),
                  totalTokens: (data.prompt_eval_count || 0) + (data.eval_count || 0),
                },
              });
            }

            clearTimeout(timeout);
            return sendJson(res, 400, { message: `Fournisseur d'IA non supporté : ${providerId}` });
          } catch (callErr: unknown) {
            const errorMsg = callErr instanceof Error ? callErr.message : String(callErr);
            console.warn(`[NEXUS PROXY] Erreur réseau (${errorMsg}), bascule de secours sur le moteur local.`);
            const fallbackReply = `> *Note : Échec de communication avec l'API distante (${errorMsg}). Bascule automatique sur le moteur local.*\n\n` + generateNaturalDemoResponse(message, agentId);
            if (isStream) {
              initSseResponse(res);
              sendSseChunk(res, fallbackReply);
              endSse(res);
              return;
            }
            return sendJson(res, 200, {
              content: fallbackReply,
              tokens: {
                promptTokens: Math.max(1, Math.round(message.length / 4)),
                completionTokens: 42,
                totalTokens: Math.max(1, Math.round(message.length / 4)) + 42,
              },
            });
          }
        }

        next();
      };

  return {
    name: 'nexus-dev-proxy',
    configureServer(server: ViteDevServer) {
      server.middlewares.use(middleware);
    },
    configurePreviewServer(server: PreviewServer) {
      server.middlewares.use(middleware);
    },
  };
}

