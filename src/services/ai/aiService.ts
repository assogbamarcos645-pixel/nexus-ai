/**
 * src/services/ai/aiService.ts
 *
 * Couche de service IA — interface unique pour communiquer avec les modèles d'IA.
 * Intègre la configuration du Centre de Contrôle, la télémétrie sécurisée,
 * la sanitisation des erreurs et la bascule fluide entre simulateur et API réelle.
 */

import { API_BASE_URL } from '../../lib/constants.ts';
import { getAIConfig } from './aiConfigService.ts';
import { logAIRequest, sanitizeErrorMessage } from './aiTelemetryService.ts';
import type { AITokenUsage, AIProviderId } from '../../types/ai.ts';

export interface ChatRequest {
  message: string;
  agentId: string;
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
  providerId?: AIProviderId;
  modelId?: string;
  images?: string[]; // Images en base64 Data-URI pour vision multimodale (Gemini 2.5)
  onChunk?: (chunk: string) => void;
}

export interface ChatResponse {
  content: string;
  agentId: string;
  providerId?: AIProviderId;
  modelId?: string;
  tokens?: AITokenUsage;
  isSimulated?: boolean;
}

// ─── Réponses simulées intelligentes selon l'agent ────────────────────────────

function generateContextualSimulatedResponse(
  agentId: string,
  userMessage: string,
  _modelName: string,
  images?: string[],
): string {
  const lower = userMessage.toLowerCase().trim();

  // Détection de vision multimodale ou conversion de maquette UI
  if (
    (images && images.length > 0) ||
    lower.includes('maquette') ||
    lower.includes('capture') ||
    lower.includes('screenshot') ||
    lower.includes('mockup') ||
    lower.includes('convertis cette image')
  ) {
    return `### Analyse Visuelle et Conversion UI

Analyse de la maquette effectuée. Restitution architecturale et code source prêt pour NEXUS LAB :

#### Spécifications Techniques :
- Architecture : Disposition en grille responsive, navigation avec effet de transparence et cartes de données.
- Thème : Fond sombre (#070714), bordures subtiles (rgba(255,255,255,0.1)), accents Cyan (#06b6d4) et Indigo (#6366f1).
- Composants :
  - Barre de navigation avec marque, liens et bouton d'action.
  - Grille d'indicateurs de performance en temps réel.
  - Panneau central de contenu structuré.

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
      <p class="text-sm text-slate-400">Restitution responsive générée d'après la capture d'interface.</p>
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
- Typage générique strict préservant l'intégrité des types d'entrée.
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

  return `Demande enregistrée : "${userMessage.length > 70 ? userMessage.slice(0, 67) + '...' : userMessage}".

Précisez le contexte technique si nécessaire :
1. Objectif ciblé (architecture, implémentation, refactorisation, audit de sécurité).
2. Stack technique ou contraintes d'environnement (TypeScript, React, Python, SQL, etc.).
3. Format attendu (code source complet, contrat OpenAPI, diagnostic de performance).`;
}

// ─── Exécution en mode simulation ─────────────────────────────────────────────

async function mockChat(
  request: ChatRequest,
  signal?: AbortSignal,
): Promise<ChatResponse> {
  const startTime = performance.now();
  const config = getAIConfig();
  const providerId = config.activeProviderId;
  const modelId = config.activeModelId;

  const content = generateContextualSimulatedResponse(
    request.agentId,
    request.message,
    modelId,
    request.images,
  );

  const promptTokens = Math.max(1, Math.round(request.message.length / 4));
  const completionTokens = Math.max(1, Math.round(content.length / 4));

  if (request.onChunk) {
    // Effet machine à écrire ultra-rapide : première émission sous 25ms, tokens toutes les 14ms
    await new Promise<void>((resolve, reject) => {
      const startTimer = setTimeout(() => {
        const tokens = content.match(/(\s+|\S+)/g) || [content];
        let idx = 0;
        const interval = setInterval(() => {
          if (signal?.aborted) {
            clearInterval(interval);
            reject(new DOMException('Aborted', 'AbortError'));
            return;
          }
          if (idx >= tokens.length) {
            clearInterval(interval);
            resolve();
            return;
          }
          request.onChunk?.(tokens[idx]);
          idx++;
        }, 14);

        signal?.addEventListener('abort', () => {
          clearInterval(interval);
          reject(new DOMException('Aborted', 'AbortError'));
        });
      }, 25);

      signal?.addEventListener('abort', () => {
        clearTimeout(startTimer);
        reject(new DOMException('Aborted', 'AbortError'));
      });
    });
  } else {
    // Réponse quasi-instantanée hors streaming
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(resolve, 40);
      signal?.addEventListener('abort', () => {
        clearTimeout(timeout);
        reject(new DOMException('Aborted', 'AbortError'));
      });
    });
  }

  const durationMs = Math.round(performance.now() - startTime);

  const tokens: AITokenUsage = {
    promptTokens,
    completionTokens,
    totalTokens: promptTokens + completionTokens,
  };

  logAIRequest({
    providerId,
    modelId,
    agentId: request.agentId,
    durationMs,
    success: true,
    tokens,
    isSimulated: true,
    estimatedCostUsd: 0,
  });

  return {
    content,
    agentId: request.agentId,
    providerId,
    modelId,
    tokens,
    isSimulated: true,
  };
}

// ─── Exécution avec un vrai backend LLM ───────────────────────────────────────

async function realChat(
  request: ChatRequest,
  signal?: AbortSignal,
): Promise<ChatResponse> {
  const startTime = performance.now();
  const config = getAIConfig();
  const providerId: AIProviderId = request.providerId || config.activeProviderId;
  const modelId = request.modelId || config.activeModelId;
  const isStream = Boolean(request.onChunk);

  const baseUrl = API_BASE_URL || (typeof window !== 'undefined' ? '' : 'http://127.0.0.1:5173');
  const endpoint = `${baseUrl}/api/chat${isStream ? '?stream=true' : ''}`;

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(isStream ? { Accept: 'text/event-stream' } : {}),
      },
      body: JSON.stringify({
        message: request.message,
        agentId: request.agentId,
        conversationHistory: request.conversationHistory,
        providerId,
        modelId,
        images: request.images,
        stream: isStream,
        settings: {
          maxTokens: config.settings.maxTokens,
          temperature: config.settings.temperature,
          timeoutSeconds: config.settings.timeoutSeconds,
        },
      }),
      signal,
    });

    const isSSE = response.headers.get('content-type')?.includes('text/event-stream');

    if (isSSE && response.body && request.onChunk) {
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';
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
              const data = JSON.parse(trimmed.slice(6));
              if (data.chunk) {
                fullContent += data.chunk;
                request.onChunk(data.chunk);
              }
            } catch {
              // Ignore non-json lines
            }
          }
        }
      }

      const durationMs = Math.round(performance.now() - startTime);
      const promptTokens = Math.max(1, Math.round(request.message.length / 4));
      const completionTokens = Math.max(1, Math.round(fullContent.length / 4));
      const tokens: AITokenUsage = {
        promptTokens,
        completionTokens,
        totalTokens: promptTokens + completionTokens,
      };

      logAIRequest({
        providerId,
        modelId,
        agentId: request.agentId,
        durationMs,
        success: true,
        statusCode: response.status,
        tokens,
        isSimulated: false,
      });

      return {
        content: fullContent,
        agentId: request.agentId,
        providerId,
        modelId,
        tokens,
        isSimulated: false,
      };
    }

    const durationMs = Math.round(performance.now() - startTime);

    if (!response.ok) {
      let rawError = `Erreur HTTP ${response.status}`;
      try {
        const errorJson = await response.json();
        if (errorJson.message) rawError = errorJson.message;
      } catch {
        // Ignorer
      }

      logAIRequest({
        providerId,
        modelId,
        agentId: request.agentId,
        durationMs,
        success: false,
        statusCode: response.status,
        error: rawError,
        isSimulated: false,
      });

      throw new Error(sanitizeErrorMessage(rawError));
    }

    const data = await response.json();
    const tokens: AITokenUsage | undefined = data.tokens || (data.usage
      ? {
          promptTokens: data.usage.prompt_tokens,
          completionTokens: data.usage.completion_tokens,
          totalTokens: data.usage.total_tokens,
        }
      : undefined);

    logAIRequest({
      providerId,
      modelId,
      agentId: request.agentId,
      durationMs,
      success: true,
      statusCode: response.status,
      tokens,
      isSimulated: false,
    });

    return {
      content: data.content || data.reply || '',
      agentId: request.agentId,
      providerId,
      modelId,
      tokens,
      isSimulated: false,
    };
  } catch (err: unknown) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw err;
    }

    const durationMs = Math.round(performance.now() - startTime);
    const errMessage = err instanceof Error ? err.message : String(err);

    // Si le proxy local ou distant n'est pas actif, on informe l'utilisateur
    logAIRequest({
      providerId,
      modelId,
      agentId: request.agentId,
      durationMs,
      success: false,
      error: errMessage,
      isSimulated: false,
    });

    throw new Error(
      `Échec de connexion au moteur IA (${sanitizeErrorMessage(errMessage)}). Vérifiez le Centre de Contrôle.`,
    );
  }
}

// ─── Export public ────────────────────────────────────────────────────────────

/**
 * Envoie un message à l'agent IA sélectionné.
 * Bascule automatiquement selon la configuration (Mode Démonstration ou Moteur Réel).
 */
export async function chat(
  request: ChatRequest,
  signal?: AbortSignal,
): Promise<ChatResponse> {
  const config = getAIConfig();

  // Si le mode démo est activé ou si le fournisseur est explicitement 'demo'
  if (config.settings.isDemoMode || config.activeProviderId === 'demo' || request.providerId === 'demo') {
    return mockChat(request, signal);
  }

  // Si un backend est configuré ou disponible en dev local
  return realChat(request, signal);
}
