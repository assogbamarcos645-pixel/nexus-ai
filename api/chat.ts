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
POSTURE & STYLE DE RÉPONSE (STANDARD MODÈLE IA - TYPE CHATGPT, CLAUDE, GEMINI) :
- DIRECT, EFFICACE ET PROACTIF : Va droit au but sans détour. Réponds avec clarté, pertinence et concision. Évite les salutations répétitives (aucun "Bonjour !", "Ravi de vous retrouver", etc. à chaque message) et bannis les formules de politesse artificielles ou cérémonieuses.
- BANNISSEMENT ABSOLU DES FORMULES DE CHATBOT ROBOTIQUES ET PASSIVES :
  Il est STRICTEMENT INTERDIT de répondre avec des platitudes passives du style :
  ❌ "D'accord. Je suis prêt à vous aider. Posez-moi vos questions..."
  ❌ "Fournissez-moi des informations et je ferai de mon mieux..."
  ❌ "En quoi puis-je vous aider aujourd'hui ?"
  ❌ "Je reste à votre entière disposition..."
- PROACTIVITÉ IMMÉDIATE : Dès qu'un document, du code ou un contexte est présent, analyse-le directement et fournis immédiatement des résultats concrets, une synthèse exhaustive ou du code fonctionnel. Ne demande JAMAIS à l'utilisateur de reformuler ou de reposer une question quand les éléments sont déjà joints.
- SI L'UTILISATEUR DIT SIMPLEMENT "CC" OU "SALUT" SANS CONTEXTE : Réponds de manière concise, vivante et percutante (ex: "Salut ! Qu'est-ce qu'on code aujourd'hui ?" ou "Salut, qu'est-ce qu'on développe ?"), en une seule phrase, sans monologue d'accueil ni protocole rigide.
- ZÉRO CODE TRONQUÉ : Lorsque tu fournis du code, fournis du code complet, typé, robuste et directement exécutable (aucun commentaire d'omission comme "// TODO", "// implémenter ici", "// reste inchangé").
- ANALYSE DE DOCUMENTS & DONNÉES : Restitue directement la structure, les points clés et les enseignements techniques majeurs.`;

  switch (agentId) {
    case 'coder':
      return `Tu es CodeX, Ingénieur Logiciel Full-Stack Senior sur NEXUS AI.
- Tu conçois et implémentes des solutions logicielles propres, modulaires, performantes et testées.
- Stack de prédilection : TypeScript, React 19, Node.js, Python, Rust, Go, SQL. ${commonRule}`;

    case 'writer':
      return `Tu es DocOps, Spécialiste en Documentation Technique, Architecture d'API et Synthèse Documentaire sur NEXUS AI.
- Tu rédiges avec clarté, rigueur, exhaustivité et précision. ${commonRule}`;

    case 'analyst':
      return `Tu es Perf & Data, Expert en Bases de Données, Algorithmique et Optimisation des Performances sur NEXUS AI.
- Tu analyses les métriques et goulots d'étranglement de manière factuelle, chiffrée et orientée résultats. ${commonRule}`;

    case 'researcher':
      return `Tu es CyberSec & QA, Auditeur en Cybersécurité Applicative et Qualité Logicielle sur NEXUS AI.
- Tu identifies les risques et failles avec rigueur et proposes des correctifs immédiats et pragmatiques. ${commonRule}`;

    case 'general':
    default:
      return `Tu es NEXUS Assistant, un assistant IA universel et intelligent sur la plateforme NEXUS AI.
- Tu réponds avec exactitude, esprit de synthèse et pertinence à toutes les demandes techniques, scientifiques ou générales. ${commonRule}`;
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
            `--- DÉBUT DOCUMENT #${idx + 1} : "${doc.name}" (${doc.category || 'fichier'}, ${doc.size || 0} octets${doc.pageCount ? `, ${doc.pageCount} pages` : ''}) ---\n${doc.content}\n--- FIN DOCUMENT : "${doc.name}" ---`,
        )
        .join('\n\n');

      const isShortGreeting =
        !message ||
        /^(cc|salut|bonjour|hello|coucou|yo|hey|hi|analyse|voici|regarde|doc|document)[\s!.]*$/i.test(
          message.trim(),
        );

      const promptContext = isShortGreeting
        ? 'L’utilisateur t’a transmis ce(s) document(s). Analyse-les directement et complètement : résume l’objet du document, dégage les points clés, la structure, les éventuelles anomalies ou décisions techniques, et propose les prochaines étapes concrètes.'
        : `Demande de l'utilisateur : "${message}"\n\nDirectives d'analyse : réponds précisément à la demande ci-dessus en exploitant l'intégralité du contenu des documents joints.`;

      effectiveMessage = `═══════════════════════════════════════════════════════════════
DOCUMENTS CONFIÉS PAR L'UTILISATEUR POUR ANALYSE IMMÉDIATE :
═══════════════════════════════════════════════════════════════
${promptContext}

${docsSummary}
═══════════════════════════════════════════════════════════════
RAPPEL IMPORTANT : Ne réponds JAMAIS par une formule passive d'attente ("Je suis prêt, posez-moi vos questions"). Démarre directement par la synthèse et les réponses opérationnelles.
═══════════════════════════════════════════════════════════════\n`;
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
      const docNote =
        Array.isArray(documents) && documents.length > 0
          ? `\n\n📄 Documents joints analysés (${documents.length}) : ${documents.map((d: any) => `"${d.name}"`).join(', ')}.`
          : '';
      const demoReply = `Bonjour ! Je suis l'assistant NEXUS AI (Mode Démonstration).\n\nVotre application est bien connectée en ligne sur Vercel.\n\nPour converser avec les modèles d'IA réels (Mistral Codestral, Gemini Flash, GPT-4o, Claude ou Groq), renseignez vos clés d'API dans votre tableau de bord Vercel (ex: MISTRAL_API_KEY) dans **Project Settings > Environment Variables**.\n\nVotre message était : "${message}".${docNote}`;

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
      let res = await fetch(geminiUrl, {
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

      // Repli instantané sur gemini-1.5-flash si 429 (Rate Limit) sur Gemini
      if (!res.ok && res.status === 429 && geminiModel !== 'gemini-1.5-flash') {
        const fallbackGeminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${envKey}`;
        res = await fetch(fallbackGeminiUrl, {
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
      }

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
      let finalModel = modelId || defaultModel;

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

      let res = await fetch(apiUrl, {
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

      // Repli instantané sur modèle léger (llama-3.1-8b-instant) en cas de 429
      if (!res.ok && res.status === 429 && isGroq && finalModel !== 'llama-3.1-8b-instant') {
        finalModel = 'llama-3.1-8b-instant';
        res = await fetch(apiUrl, {
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
      }

      // Cascade multi-fournisseurs si Groq reste saturé en 429
      if (!res.ok && res.status === 429 && isGroq) {
        if (process.env.GEMINI_API_KEY) {
          const geminiContents = messages
            .filter((m) => m.role === 'user' || m.role === 'assistant')
            .map((m) => ({
              role: m.role === 'assistant' ? 'model' : 'user',
              parts: [{ text: String(m.content) }],
            }));
          const systemInstruction = messages.find((m) => m.role === 'system')?.content || '';
          const geminiRes = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                ...(systemInstruction ? { systemInstruction: { parts: [{ text: systemInstruction }] } } : {}),
                contents: geminiContents,
                generationConfig: {
                  temperature: safeTemp,
                  maxOutputTokens: safeMaxTokens,
                },
              }),
            },
          );

          if (geminiRes.ok) {
            const data = await geminiRes.json();
            const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
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
        }
      }

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
  let activeModel = model;
  let upstreamRes = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: activeModel,
      messages,
      temperature,
      max_tokens,
      stream: true,
    }),
  });

  // Repli instantané sur modèle léger (llama-3.1-8b-instant) en cas de 429 sur Groq
  if (!upstreamRes.ok && upstreamRes.status === 429 && url.includes('groq.com') && activeModel !== 'llama-3.1-8b-instant') {
    activeModel = 'llama-3.1-8b-instant';
    upstreamRes = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: activeModel,
        messages,
        temperature,
        max_tokens,
        stream: true,
      }),
    });
  }

  // Cascade multi-fournisseurs si Groq reste saturé en 429
  if (!upstreamRes.ok && upstreamRes.status === 429 && url.includes('groq.com')) {
    // 1. Cascade automatique vers Google Gemini Flash si configuré
    if (process.env.GEMINI_API_KEY) {
      const geminiFallbackUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;
      const geminiContents = messages
        .filter((m) => m.role === 'user' || m.role === 'assistant')
        .map((m) => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: String(m.content) }],
        }));
      const systemInstruction = messages.find((m) => m.role === 'system')?.content || '';

      const geminiRes = await fetch(geminiFallbackUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(systemInstruction ? { systemInstruction: { parts: [{ text: systemInstruction }] } } : {}),
          contents: geminiContents,
          generationConfig: {
            temperature,
            maxOutputTokens: max_tokens,
          },
        }),
      });

      if (geminiRes.ok) {
        const geminiData = await geminiRes.json();
        const geminiText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '';
        return createSseResponse(async (send) => {
          send(geminiText);
        });
      }
    }

    // 2. Cascade automatique vers Mistral si configuré
    if (process.env.MISTRAL_API_KEY) {
      const mistralRes = await fetch('https://api.mistral.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.MISTRAL_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'codestral-latest',
          messages,
          temperature,
          max_tokens,
          stream: true,
        }),
      });

      if (mistralRes.ok) {
        upstreamRes = mistralRes;
      }
    }
  }

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
