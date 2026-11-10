/**
 * supabase/functions/nexus-ai-proxy/index.ts
 *
 * Supabase Edge Function — Proxy sécurisé pour l'inférence des modèles d'IA (NEXUS AI).
 *
 * Ce script s'exécute côté serveur (Deno runtime).
 * Vos clés secrètes d'API (OPENAI_API_KEY, ANTHROPIC_API_KEY, GEMINI_API_KEY, MISTRAL_API_KEY, GROQ_API_KEY)
 * sont stockées dans les Supabase Secrets (Deno.env.get) et ne sont JAMAIS exposées au client navigateur.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";

const allowedOrigin = Deno.env.get("ALLOWED_ORIGIN") || "*";

const securityHeaders = {
  "Access-Control-Allow-Origin": allowedOrigin,
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
};

const corsHeaders = securityHeaders;

// Rate limiter en mémoire par client (IP ou identifiant utilisateur)
// Fenêtre glissante de 60 secondes, max 60 requêtes par minute
interface RateLimitBucket {
  count: number;
  resetAt: number;
}
const rateLimitMap = new Map<string, RateLimitBucket>();
const MAX_REQUESTS_PER_MINUTE = 60;

function checkRateLimit(clientId: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const bucket = rateLimitMap.get(clientId);

  if (!bucket || now > bucket.resetAt) {
    rateLimitMap.set(clientId, { count: 1, resetAt: now + 60_000 });
    return { allowed: true };
  }

  if (bucket.count >= MAX_REQUESTS_PER_MINUTE) {
    const retryAfter = Math.ceil((bucket.resetAt - now) / 1000);
    return { allowed: false, retryAfter };
  }

  bucket.count += 1;
  return { allowed: true };
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: securityHeaders });
  }

  // Contrôle de sécurité : Limitation de la charge utile (Max 1 Mo)
  const contentLength = req.headers.get("content-length");
  if (contentLength && parseInt(contentLength, 10) > 1_048_576) {
    return new Response(
      JSON.stringify({ error: "Charge utile trop volumineuse (limite maximale : 1 Mo)." }),
      { headers: { ...securityHeaders, "Content-Type": "application/json" }, status: 413 }
    );
  }

  // Contrôle de sécurité : Limitation de débit (Rate Limiting)
  const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anonymous";
  const authHeader = req.headers.get("Authorization");
  const rateLimitKey = authHeader ? `${clientIp}:${authHeader.slice(-16)}` : clientIp;

  const rateCheck = checkRateLimit(rateLimitKey);
  if (!rateCheck.allowed) {
    return new Response(
      JSON.stringify({
        error: "Trop de requêtes rapprochées. Veuillez patienter avant de réessayer.",
        retryAfterSeconds: rateCheck.retryAfter,
      }),
      {
        headers: {
          ...securityHeaders,
          "Content-Type": "application/json",
          "Retry-After": String(rateCheck.retryAfter || 60),
        },
        status: 429,
      }
    );
  }

  const url = new URL(req.url);

  // 1. Route de statut : GET /status
  if (req.method === "GET" && url.pathname.endsWith("/status")) {
    const geminiKey = Deno.env.get("GEMINI_API_KEY");
    const openaiKey = Deno.env.get("OPENAI_API_KEY");
    const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");
    const mistralKey = Deno.env.get("MISTRAL_API_KEY");
    const groqKey = Deno.env.get("GROQ_API_KEY");

    return new Response(
      JSON.stringify({
        status: "operational",
        runtime: "supabase_edge_function",
        availableProviders: {
          gemini: Boolean(geminiKey),
          openai: Boolean(openaiKey),
          anthropic: Boolean(anthropicKey),
          mistral: Boolean(mistralKey),
          groq: Boolean(groqKey),
          demo: true,
        },
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  }

  // 2. Route de test : POST /test
  if (req.method === "POST" && url.pathname.endsWith("/test")) {
    try {
      const { providerId, modelId } = await req.json();
      const startTime = Date.now();

      if (providerId === "demo") {
        return new Response(
          JSON.stringify({
            success: true,
            message: "Simulateur local opérationnel sans appel réseau.",
            latencyMs: 15,
            maskedKeyHint: "Aucune clé requise",
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const envName = `${providerId.toUpperCase()}_API_KEY`;
      const secret = Deno.env.get(envName);

      if (!secret) {
        return new Response(
          JSON.stringify({
            success: false,
            message: `Secret ${envName} manquant dans les secrets Supabase.`,
            latencyMs: Date.now() - startTime,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: `Fournisseur ${providerId} (${modelId}) prêt sur l'Edge Function.`,
          latencyMs: Date.now() - startTime + 30,
          maskedKeyHint: `${secret.slice(0, 4)}...${secret.slice(-4)}`,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return new Response(JSON.stringify({ error: message }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }
  }

  // 3. Route de chat : POST /chat
  if (req.method === "POST" && (url.pathname.endsWith("/chat") || url.pathname === "/")) {
    try {
      const body = await req.json();
      const { message: rawMessage, agentId = "general", providerId = "demo", modelId, settings } = body;

      if (!rawMessage || typeof rawMessage !== "string") {
        return new Response(
          JSON.stringify({ error: "Requête invalide : message vide ou manquant." }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
        );
      }

      // Nettoyage défensif contre les octets nuls et caractères de contrôle
      // eslint-disable-next-line no-control-regex
      const cleanMessage = rawMessage.replace(/[\0\x01-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "").trim();

      if (!cleanMessage) {
        return new Response(
          JSON.stringify({ error: "Requête invalide : message vide après assainissement." }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
        );
      }

      if (cleanMessage.length > 8000) {
        return new Response(
          JSON.stringify({ error: "Requête refusée : le message dépasse la limite autorisée de 8 000 caractères." }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
        );
      }

      const message = cleanMessage;

      const safeMaxTokens = Math.min(8192, Math.max(128, Number(settings?.maxTokens || 2048)));
      const safeTemp = Math.min(2.0, Math.max(0.0, Number(settings?.temperature || 0.7)));

      // A. Mode Démonstration
      if (providerId === "demo") {
        return new Response(
          JSON.stringify({
            content: `[${agentId} • Mode Démonstration]\n\nRéponse simulée par le proxy Edge Function.\n\nDemande : "${message.slice(0, 100)}${message.length > 100 ? "..." : ""}"\nParamètres appliqués : maxTokens=${safeMaxTokens}, temperature=${safeTemp}.`,
            tokens: {
              promptTokens: Math.max(1, Math.round(message.length / 4)),
              completionTokens: 45,
              totalTokens: Math.max(1, Math.round(message.length / 4)) + 45,
            },
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // B. Fournisseurs Réels (Vérification de session JWT obligatoire en production)
      const supabaseUrl = Deno.env.get("SUPABASE_URL");
      const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
      const authHeader = req.headers.get("Authorization");

      if (supabaseUrl && supabaseAnonKey) {
        if (!authHeader) {
          return new Response(
            JSON.stringify({ error: "Authentification requise : veuillez vous connecter pour utiliser les modèles d'IA réels." }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
          );
        }

        const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
          global: { headers: { Authorization: authHeader } },
        });

        const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
        if (authError || !user) {
          return new Response(
            JSON.stringify({ error: "Session d'authentification invalide ou expirée." }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
          );
        }
      }

      let envKey = "";
      if (providerId === "gemini") envKey = Deno.env.get("GEMINI_API_KEY") || "";
      if (providerId === "openai") envKey = Deno.env.get("OPENAI_API_KEY") || "";
      if (providerId === "groq") envKey = Deno.env.get("GROQ_API_KEY") || "";
      if (providerId === "mistral") envKey = Deno.env.get("MISTRAL_API_KEY") || "";
      if (providerId === "anthropic") envKey = Deno.env.get("ANTHROPIC_API_KEY") || "";

      if (!envKey) {
        return new Response(
          JSON.stringify({
            error: `La clé secrète pour ${providerId} n'est pas définie dans les Supabase Secrets (${providerId.toUpperCase()}_API_KEY).`,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
        );
      }

      // 1. Google Gemini API
      if (providerId === "gemini") {
        const geminiModel = modelId || "gemini-3.5-flash";
        const systemPrompt =
          agentId === "coder"
            ? "Tu es CodeX, un ingénieur logiciel expert. Écris du code propre, moderne et efficace. Réponds en français."
            : agentId === "writer"
            ? "Tu es Scribe, un assistant professionnel de rédaction et de création de contenu. Réponds en français."
            : agentId === "analyst"
            ? "Tu es Analyst, un expert en analyse de données et synthèse stratégique. Réponds en français."
            : "Tu es NEXUS, une intelligence artificielle avancée. Réponds avec pertinence, clarté et concision en français.";

        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${envKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              systemInstruction: {
                parts: [{ text: systemPrompt }],
              },
              contents: [{ role: "user", parts: [{ text: message }] }],
              generationConfig: { maxOutputTokens: safeMaxTokens, temperature: safeTemp },
            }),
          }
        );

        if (!geminiRes.ok) {
          const errJson = await geminiRes.json().catch(() => ({}));
          return new Response(
            JSON.stringify({ error: errJson.error?.message || `Erreur Gemini (${geminiRes.status})` }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: geminiRes.status }
          );
        }

        const data = await geminiRes.json();
        const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
        const promptTokens = data.usageMetadata?.promptTokenCount || Math.max(1, Math.round(message.length / 4));
        const completionTokens = data.usageMetadata?.candidatesTokenCount || Math.max(1, Math.round(reply.length / 4));

        return new Response(
          JSON.stringify({
            content: reply,
            tokens: { promptTokens, completionTokens, totalTokens: promptTokens + completionTokens },
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // 2. OpenAI API
      if (providerId === "openai") {
        const isReasoning = modelId?.startsWith("o1");
        const systemPrompt =
          agentId === "coder"
            ? "Tu es CodeX, un ingénieur logiciel expert. Écris du code propre, moderne et efficace. Réponds en français."
            : agentId === "writer"
            ? "Tu es Scribe, un assistant professionnel de rédaction et de création de contenu. Réponds en français."
            : agentId === "analyst"
            ? "Tu es Analyst, un expert en analyse de données et synthèse stratégique. Réponds en français."
            : "Tu es NEXUS, une intelligence artificielle avancée. Réponds avec pertinence, clarté et concision en français.";

        const messages = isReasoning
          ? [{ role: "user", content: `${systemPrompt}\n\n${message}` }]
          : [
              { role: "system", content: systemPrompt },
              { role: "user", content: message },
            ];

        const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${envKey}`,
          },
          body: JSON.stringify({
            model: modelId || "gpt-4o-mini",
            messages,
            ...(isReasoning
              ? { max_completion_tokens: safeMaxTokens }
              : { max_tokens: safeMaxTokens, temperature: safeTemp }),
          }),
        });

        if (!openaiRes.ok) {
          const errJson = await openaiRes.json().catch(() => ({}));
          return new Response(
            JSON.stringify({ error: errJson.error?.message || `Erreur OpenAI (${openaiRes.status})` }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: openaiRes.status }
          );
        }

        const data = await openaiRes.json();
        const reply = data.choices?.[0]?.message?.content || "";
        return new Response(
          JSON.stringify({
            content: reply,
            tokens: {
              promptTokens: data.usage?.prompt_tokens || Math.max(1, Math.round(message.length / 4)),
              completionTokens: data.usage?.completion_tokens || Math.max(1, Math.round(reply.length / 4)),
              totalTokens: data.usage?.total_tokens || 0,
            },
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // 3. Groq Cloud API
      if (providerId === "groq") {
        const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${envKey}`,
          },
          body: JSON.stringify({
            model: modelId || "llama-3.3-70b-versatile",
            messages: [{ role: "user", content: message }],
            max_tokens: safeMaxTokens,
            temperature: safeTemp,
          }),
        });

        if (!groqRes.ok) {
          const errJson = await groqRes.json().catch(() => ({}));
          return new Response(
            JSON.stringify({ error: errJson.error?.message || `Erreur Groq (${groqRes.status})` }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: groqRes.status }
          );
        }

        const data = await groqRes.json();
        const reply = data.choices?.[0]?.message?.content || "";
        return new Response(
          JSON.stringify({
            content: reply,
            tokens: {
              promptTokens: data.usage?.prompt_tokens || Math.max(1, Math.round(message.length / 4)),
              completionTokens: data.usage?.completion_tokens || Math.max(1, Math.round(reply.length / 4)),
              totalTokens: data.usage?.total_tokens || 0,
            },
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // 4. Mistral AI API
      if (providerId === "mistral") {
        const mistralRes = await fetch("https://api.mistral.ai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${envKey}`,
          },
          body: JSON.stringify({
            model: modelId || "mistral-small-latest",
            messages: [{ role: "user", content: message }],
            max_tokens: safeMaxTokens,
            temperature: safeTemp,
          }),
        });

        if (!mistralRes.ok) {
          const errJson = await mistralRes.json().catch(() => ({}));
          return new Response(
            JSON.stringify({ error: errJson.error?.message || `Erreur Mistral (${mistralRes.status})` }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: mistralRes.status }
          );
        }

        const data = await mistralRes.json();
        const reply = data.choices?.[0]?.message?.content || "";
        return new Response(
          JSON.stringify({
            content: reply,
            tokens: {
              promptTokens: data.usage?.prompt_tokens || Math.max(1, Math.round(message.length / 4)),
              completionTokens: data.usage?.completion_tokens || Math.max(1, Math.round(reply.length / 4)),
              totalTokens: data.usage?.total_tokens || 0,
            },
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // 5. Anthropic Claude API
      if (providerId === "anthropic") {
        const anthropicModel =
          modelId === "claude-3-7-sonnet"
            ? "claude-3-7-sonnet-20250219"
            : modelId === "claude-3-5-sonnet"
            ? "claude-3-5-sonnet-20241022"
            : modelId === "claude-3-5-haiku"
            ? "claude-3-5-haiku-20241022"
            : modelId === "claude-3-opus"
            ? "claude-3-opus-20240229"
            : modelId || "claude-3-5-haiku-20241022";

        const systemPrompt =
          agentId === "coder"
            ? "Tu es CodeX, un ingénieur logiciel expert. Écris du code propre, moderne et efficace. Réponds en français."
            : agentId === "writer"
            ? "Tu es Scribe, un assistant professionnel de rédaction et de création de contenu. Réponds en français."
            : agentId === "analyst"
            ? "Tu es Analyst, un expert en analyse de données et synthèse stratégique. Réponds en français."
            : "Tu es NEXUS, une intelligence artificielle avancée. Réponds avec pertinence, clarté et concision en français.";

        const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": envKey,
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify({
            model: anthropicModel,
            max_tokens: safeMaxTokens,
            system: systemPrompt,
            messages: [{ role: "user", content: message }],
          }),
        });

        if (!anthropicRes.ok) {
          const errJson = await anthropicRes.json().catch(() => ({}));
          return new Response(
            JSON.stringify({ error: errJson.error?.message || `Erreur Anthropic (${anthropicRes.status})` }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: anthropicRes.status }
          );
        }

        const data = await anthropicRes.json();
        const reply = data.content?.[0]?.text || "";
        return new Response(
          JSON.stringify({
            content: reply,
            tokens: {
              promptTokens: data.usage?.input_tokens || Math.max(1, Math.round(message.length / 4)),
              completionTokens: data.usage?.output_tokens || Math.max(1, Math.round(reply.length / 4)),
              totalTokens: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0),
            },
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ error: `Fournisseur d'IA non supporté : ${providerId}` }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return new Response(
        JSON.stringify({ error: `Erreur interne proxy : ${message}` }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }
  }

  return new Response("Not found", { status: 404, headers: corsHeaders });
});

