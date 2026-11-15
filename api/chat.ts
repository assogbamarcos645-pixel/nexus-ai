/**
 * api/chat.ts — Vercel Edge Function pour l'inférence IA de NEXUS AI
 */

export const config = {
  runtime: 'edge',
};

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-client-info, apikey',
  'Access-Control-Max-Age': '86400',
};

function getAgentSystemPrompt(agentId?: string): string {
  const commonRule = `
HUMANITÉ, COURTOISIE EXEMPLAIRE & POSTURE D'ASSISTANT PERSONNEL :
- TU AGIS COMME UN VÉRITABLE ÊTRE HUMAIN : Tu n'es en aucun cas un robot, un automate insensible ou un terminal télégraphique. Tu incarnes un assistant personnel et collaborateur humain de très haut niveau, doué d'une profonde bienveillance, d'écoute et d'élégance relationnelle.
- INTERDICTION D'ÊTRE TROP DIRECT OU EXPÉDITIF : Ne saute jamais directement sur une réponse brute ou du code sans une introduction humaine, polie et attentionnée. Prends le temps d'accueillir l'utilisateur avec égard.
- POLITESSE ET SALUTATIONS : Salue toujours chaleureusement l'utilisateur (ex: "Bonjour !", "Ravi de vous retrouver", "C'est un réel plaisir de vous assister aujourd'hui"). Exprime ta gratitude pour sa question ou ses précisions.
- PROFONDE EMPATHIE : Si l'utilisateur mentionne un bug, une difficulté ou un doute, manifeste une véritable empathie humaine ("Je comprends parfaitement à quel point cette erreur peut être frustrante, mais rassurez-vous : nous allons la résoudre ensemble étape par étape").
- CONVERSATION VIVANTE ET SUIVI BIENVEILLANT : Conclus toujours tes réponses par une formule d'attention humaine et une proposition d'accompagnement (ex: "J'espère de tout cœur que cette solution vous est utile. Souhaitez-vous que nous approfondissions un point particulier ensemble ? Je reste à votre entière écoute.").

RÈGLE D'OR EN GÉNIE LOGICIEL & CODE :
- ZÉRO CODE TRONQUÉ : Lorsque tu rédiges du code, il est formellement interdit d'utiliser des commentaires d'omission tels que "// TODO", "// implémenter ici", "// reste du code inchangé", "// ...".
- Tout bloc de code doit être 100% COMPLET, typé, défensif, robuste et directement exécutable.
- Accompagne toujours le code d'explications pédagogiques bienveillantes, comme le ferait un collègue senior lors d'une session de pair-programming.

ANALYSE DE DOCUMENTS & DONNÉES :
- Analyse chaque document attaché (PDF, code, rapport, CSV, etc.) avec le plus grand soin. Présente tes conclusions de manière claire, structurée et chaleureuse.`;

  switch (agentId) {
    case 'coder':
      return `Tu es CodeX, Ingénieur Logiciel Full-Stack Senior & Développeur Compagnon sur NEXUS AI.
- Tu te comportes comme un pair-programmeur humain, passionné, patient, extrêmement respectueux et bienveillant.
- Tu ne balances jamais de code froidement : tu accueilles toujours la demande avec politesse, tu expliques ta démarche de conception humaine, puis tu fournis du code propre, complet et testable.
- Stack de prédilection : TypeScript, React 19, Node.js, Python, Rust, Go, SQL. ${commonRule}`;

    case 'writer':
      return `Tu es DocOps, Conseiller Humain en Documentation Technique, Architecture d'API et Synthèse Documentaire sur NEXUS AI.
- Ton approche est soignée, courtoise, élégante et très pédagogique.
- Tu prends plaisir à simplifier la complexité, à rédiger des documents impeccables et à analyser les PDF et contrats avec minutie. ${commonRule}`;

    case 'analyst':
      return `Tu es Perf & Data, Partenaire Expert en Bases de Données et Optimisation sur NEXUS AI.
- Tu es un conseiller scientifique méthodique, chaleureux et encourageant.
- Tu démystifies les problèmes de performance avec optimisme et bienveillance. ${commonRule}`;

    case 'researcher':
      return `Tu es CyberSec & QA, Auditeur Bienveillant en Cybersécurité et Qualité Logicielle sur NEXUS AI.
- Ton rôle est de rassurer, de protéger et de guider avec humanité, sans jamais adopter un ton alarmiste. ${commonRule}`;

    case 'general':
    default:
      return `Tu es NEXUS Assistant, assistant personnel universel et guide de confiance sur la plateforme NEXUS AI.
- Tu réponds à toutes les questions de la vie quotidienne, de méthodologie, d'organisation, de sciences et de technologie avec le plus grand respect, une politesse sans faille et une profonde humanité.
- Tu ne te contentes pas de donner des réponses : tu échanges, tu conseilles et tu prends sincèrement soin de l'expérience de ton interlocuteur. ${commonRule}`;
  }
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ message: 'Méthode non autorisée. Utilisez POST.' }),
      { status: 405, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
    );
  }

  try {
    const body = (await req.json().catch(() => ({}))) as any;
    const {
      message,
      agentId = 'general',
      providerId = 'demo',
      modelId,
      systemPrompt: customSystemPrompt,
      settings,
      conversationHistory,
      images,
      documents,
    } = body;

    const url = new URL(req.url);
    const isStream =
      req.headers.get('accept')?.includes('text/event-stream') ||
      body.stream === true ||
      url.searchParams.get('stream') === 'true';

    if (!message || typeof message !== 'string') {
      return new Response(
        JSON.stringify({ message: 'Requête invalide : message vide ou manquant.' }),
        { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
      );
    }

    const safeMaxTokens = Math.min(8192, Math.max(128, Number(settings?.maxTokens || 2048)));
    const safeTemp = Math.min(2.0, Math.max(0.0, Number(settings?.temperature || 0.7)));

    // Construction du message enrichi avec les documents complets si fournis
    let effectiveMessage = message;
    if (Array.isArray(documents) && documents.length > 0) {
      const docsSummary = documents
        .map(
          (doc: any, idx: number) =>
            `--- DÉBUT DOCUMENT #${idx + 1} : "${doc.name}" (${doc.category || 'fichier'}, ${doc.size || 0} octets) ---\n${doc.content}\n--- FIN DOCUMENT : "${doc.name}" ---`,
        )
        .join('\n\n');
      effectiveMessage = `${message}\n\n═══════════════════════════════════════════════════════════════\nDOCUMENTS ATTACHÉS POUR ANALYSE :\n═══════════════════════════════════════════════════════════════\n${docsSummary}\n═══════════════════════════════════════════════════════════════\n`;
    }

    // Détermination du provider effectif
    let targetProvider = providerId;
    if (targetProvider === 'demo') {
      if (process.env.MISTRAL_API_KEY) targetProvider = 'mistral';
      else if (process.env.GROQ_API_KEY) targetProvider = 'groq';
      else if (process.env.GEMINI_API_KEY) targetProvider = 'gemini';
      else if (process.env.OPENAI_API_KEY) targetProvider = 'openai';
      else if (process.env.ANTHROPIC_API_KEY) targetProvider = 'anthropic';
      else targetProvider = 'demo';
    }

    // Réponse de secours en Mode Démo si aucune clé n'est trouvée
    if (targetProvider === 'demo') {
      const demoReply = `Bonjour ! Je suis l'assistant NEXUS AI (Mode Démonstration).\n\nVotre application est bien connectée en ligne sur Vercel.\n\nPour converser avec les modèles d'IA réels (Mistral Codestral, Gemini Flash, GPT-4o, Claude ou Groq), renseignez vos clés d'API dans votre tableau de bord Vercel (ex: MISTRAL_API_KEY) dans **Project Settings > Environment Variables**.\n\nVotre message était : "${message}".`;

      if (isStream) {
        return createSseResponse(async (send) => {
          send(demoReply);
        });
      }

      return new Response(
        JSON.stringify({
          content: demoReply,
          tokens: {
            promptTokens: Math.max(1, Math.round(message.length / 4)),
            completionTokens: Math.max(1, Math.round(demoReply.length / 4)),
            totalTokens: Math.max(1, Math.round((message.length + demoReply.length) / 4)),
          },
        }),
        { status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
      );
    }

    // Vérification de la clé secrète pour le fournisseur ciblé
    let envKey = '';
    if (targetProvider === 'mistral') envKey = process.env.MISTRAL_API_KEY || '';
    if (targetProvider === 'gemini') envKey = process.env.GEMINI_API_KEY || '';
    if (targetProvider === 'openai') envKey = process.env.OPENAI_API_KEY || '';
    if (targetProvider === 'groq') envKey = process.env.GROQ_API_KEY || '';
    if (targetProvider === 'anthropic') envKey = process.env.ANTHROPIC_API_KEY || '';

    if (!envKey) {
      return new Response(
        JSON.stringify({
          message: `Modèle non disponible : aucune clé API configurée pour ${targetProvider} (${targetProvider.toUpperCase()}_API_KEY) dans vos variables d'environnement Vercel.`,
        }),
        { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
      );
    }

    const baseSystemPrompt = getAgentSystemPrompt(agentId);
    const systemPrompt =
      customSystemPrompt && String(customSystemPrompt).trim().length > 20
        ? `${customSystemPrompt}\n\n${baseSystemPrompt}`
        : baseSystemPrompt;

    // ── 1. Mistral AI ──────────────────────────────────────────────────────────
    if (targetProvider === 'mistral') {
      const mistralModel = modelId || 'codestral-latest';
      const messages = [
        { role: 'system', content: systemPrompt },
        ...(Array.isArray(conversationHistory)
          ? conversationHistory
              .filter((t: any) => t.content && (t.role === 'user' || t.role === 'assistant'))
              .map((t: any) => ({ role: t.role, content: String(t.content) }))
          : []),
        { role: 'user', content: effectiveMessage },
      ];

      if (isStream) {
        return handleOpenAICompatibleStream(
          'https://api.mistral.ai/v1/chat/completions',
          envKey,
          mistralModel,
          messages,
          safeTemp,
          safeMaxTokens,
        );
      }

      const res = await fetch('https://api.mistral.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${envKey}`,
        },
        body: JSON.stringify({
          model: mistralModel,
          messages,
          temperature: safeTemp,
          max_tokens: safeMaxTokens,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        return new Response(
          JSON.stringify({ message: errJson.message || `Erreur Mistral (${res.status})` }),
          { status: res.status, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
        );
      }

      const data = await res.json();
      const content = data.choices?.[0]?.message?.content || '';
      return new Response(
        JSON.stringify({
          content,
          tokens: {
            promptTokens: data.usage?.prompt_tokens || Math.max(1, Math.round(message.length / 4)),
            completionTokens: data.usage?.completion_tokens || Math.max(1, Math.round(content.length / 4)),
            totalTokens: data.usage?.total_tokens || 0,
          },
        }),
        { status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
      );
    }

    // ── 2. Google Gemini ───────────────────────────────────────────────────────
    if (targetProvider === 'gemini') {
      let geminiModel = modelId || 'gemini-2.5-flash';
      if (geminiModel === 'gemini-3.8-flash' || geminiModel === 'gemini-2.0-flash') {
        geminiModel = 'gemini-2.5-flash';
      }

      const contents: any[] = [];
      if (Array.isArray(conversationHistory)) {
        for (const t of conversationHistory) {
          if (t.content && (t.role === 'user' || t.role === 'assistant')) {
            contents.push({
              role: t.role === 'assistant' ? 'model' : 'user',
              parts: [{ text: String(t.content) }],
            });
          }
        }
      }

      const userParts: any[] = [];
      if (Array.isArray(images) && images.length > 0) {
        for (const img of images) {
          const match = img.match(/^data:([^;]+);base64,(.+)$/);
          if (match) {
            userParts.push({ inline_data: { mime_type: match[1], data: match[2] } });
          }
        }
      }
      userParts.push({ text: effectiveMessage });
      contents.push({ role: 'user', parts: userParts });

      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${envKey}`;
      const res = await fetch(geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents,
          generationConfig: {
            temperature: safeTemp,
            maxOutputTokens: safeMaxTokens,
          },
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        return new Response(
          JSON.stringify({ message: errJson.error?.message || `Erreur Gemini (${res.status})` }),
          { status: res.status, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
        );
      }

      const data = await res.json();
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

      if (isStream) {
        return createSseResponse(async (send) => {
          send(content);
        });
      }

      return new Response(
        JSON.stringify({
          content,
          tokens: {
            promptTokens: data.usageMetadata?.promptTokenCount || Math.max(1, Math.round(message.length / 4)),
            completionTokens: data.usageMetadata?.candidatesTokenCount || Math.max(1, Math.round(content.length / 4)),
            totalTokens: data.usageMetadata?.totalTokenCount || 0,
          },
        }),
        { status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
      );
    }

    // ── 3. OpenAI & Groq ───────────────────────────────────────────────────────
    if (targetProvider === 'openai' || targetProvider === 'groq') {
      const isGroq = targetProvider === 'groq';
      const apiUrl = isGroq
        ? 'https://api.groq.com/openai/v1/chat/completions'
        : 'https://api.openai.com/v1/chat/completions';
      const defaultModel = isGroq ? 'llama-3.3-70b-versatile' : 'gpt-4o';
      const finalModel = modelId || defaultModel;

      const messages = [
        { role: 'system', content: systemPrompt },
        ...(Array.isArray(conversationHistory)
          ? conversationHistory
              .filter((t: any) => t.content && (t.role === 'user' || t.role === 'assistant'))
              .map((t: any) => ({ role: t.role, content: String(t.content) }))
          : []),
        { role: 'user', content: effectiveMessage },
      ];

      if (isStream) {
        return handleOpenAICompatibleStream(apiUrl, envKey, finalModel, messages, safeTemp, safeMaxTokens);
      }

      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${envKey}`,
        },
        body: JSON.stringify({
          model: finalModel,
          messages,
          temperature: safeTemp,
          max_tokens: safeMaxTokens,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        return new Response(
          JSON.stringify({ message: errJson.error?.message || `Erreur ${targetProvider} (${res.status})` }),
          { status: res.status, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
        );
      }

      const data = await res.json();
      const content = data.choices?.[0]?.message?.content || '';
      return new Response(
        JSON.stringify({
          content,
          tokens: {
            promptTokens: data.usage?.prompt_tokens || Math.max(1, Math.round(message.length / 4)),
            completionTokens: data.usage?.completion_tokens || Math.max(1, Math.round(content.length / 4)),
            totalTokens: data.usage?.total_tokens || 0,
          },
        }),
        { status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
      );
    }

    // ── 4. Anthropic Claude ────────────────────────────────────────────────────
    if (targetProvider === 'anthropic') {
      let anthropicModel = modelId || 'claude-3-5-sonnet-20241022';
      if (anthropicModel === 'claude-3-5-sonnet') anthropicModel = 'claude-3-5-sonnet-20241022';
      else if (anthropicModel === 'claude-3-7-sonnet') anthropicModel = 'claude-3-7-sonnet-20250219';
      else if (anthropicModel === 'claude-3-5-haiku') anthropicModel = 'claude-3-5-haiku-20241022';

      const messages = [
        ...(Array.isArray(conversationHistory)
          ? conversationHistory
              .filter((t: any) => t.content && (t.role === 'user' || t.role === 'assistant'))
              .map((t: any) => ({ role: t.role, content: String(t.content) }))
          : []),
        { role: 'user', content: effectiveMessage },
      ];

      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': envKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: anthropicModel,
          system: systemPrompt,
          messages,
          max_tokens: safeMaxTokens,
          temperature: safeTemp,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        return new Response(
          JSON.stringify({ message: errJson.error?.message || `Erreur Anthropic (${res.status})` }),
          { status: res.status, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
        );
      }

      const data = await res.json();
      const content = data.content?.[0]?.text || '';

      if (isStream) {
        return createSseResponse(async (send) => {
          send(content);
        });
      }

      return new Response(
        JSON.stringify({
          content,
          tokens: {
            promptTokens: data.usage?.input_tokens || Math.max(1, Math.round(message.length / 4)),
            completionTokens: data.usage?.output_tokens || Math.max(1, Math.round(content.length / 4)),
            totalTokens: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0),
          },
        }),
        { status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
      );
    }

    return new Response(
      JSON.stringify({ message: `Fournisseur d'IA non supporté : ${targetProvider}` }),
      { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
    );
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return new Response(
      JSON.stringify({ message: `Erreur interne proxy Vercel : ${errorMsg}` }),
      { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
    );
  }
}

function createSseResponse(streamLogic: (send: (chunk: string) => void) => Promise<void>): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (chunk: string) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ chunk })}\n\n`));
      };
      try {
        await streamLogic(send);
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`));
      } catch (err: any) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ chunk: `[Erreur: ${err.message}]` })}\n\n`));
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      ...CORS_HEADERS,
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
    },
  });
}

async function handleOpenAICompatibleStream(
  url: string,
  key: string,
  model: string,
  messages: any[],
  temperature: number,
  max_tokens: number,
): Promise<Response> {
  const upstreamRes = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      max_tokens,
      stream: true,
    }),
  });

  if (!upstreamRes.ok) {
    const errJson = await upstreamRes.json().catch(() => ({}));
    return new Response(
      JSON.stringify({ message: errJson.error?.message || `Erreur fournisseur (${upstreamRes.status})` }),
      { status: upstreamRes.status, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
    );
  }

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  const reader = upstreamRes.body?.getReader();

  const stream = new ReadableStream({
    async start(controller) {
      if (!reader) {
        controller.close();
        return;
      }
      let buffer = '';
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith('data: ')) {
              const rawData = trimmed.slice(6);
              if (rawData === '[DONE]') {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`));
                continue;
              }
              try {
                const parsed = JSON.parse(rawData);
                const chunk = parsed.choices?.[0]?.delta?.content || '';
                if (chunk) {
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ chunk })}\n\n`));
                }
              } catch {
                // Ignore parse errors
              }
            }
          }
        }
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`));
      } catch (err: any) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ chunk: `[Erreur: ${err.message}]` })}\n\n`));
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      ...CORS_HEADERS,
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
    },
  });
}
