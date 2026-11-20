/**
 * api/audio/transcribe.ts
 *
 * Endpoint universel de transcription audio haute performance (Whisper & Gemini AI).
 * Moteur universel pour la dictée vocale NEXUS AI sur tous les navigateurs (Brave, Chrome, Safari, Firefox, iOS, Android).
 *
 * Chaîne de bascule intelligente (Multi-Provider Fallback) :
 *  1. Groq Whisper (whisper-large-v3-turbo) : Ultra-rapide (~100-200ms)
 *  2. OpenAI Whisper (whisper-1) : Haute fidélité
 *  3. Google Gemini 2.5 / 1.5 Flash : Compréhension multimodale audio directe
 */

export const config = {
  runtime: 'edge',
};

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-client-info, apikey',
  'Access-Control-Max-Age': '86400',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'SAMEORIGIN',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
};

// Rate limiter en mémoire par IP pour l'audio (max 30 requêtes par minute)
interface AudioRateLimitBucket {
  count: number;
  resetAt: number;
}
const audioRateLimitMap = new Map<string, AudioRateLimitBucket>();
const MAX_AUDIO_REQUESTS_PER_MINUTE = 30;

function checkAudioRateLimit(ip: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const bucket = audioRateLimitMap.get(ip);
  if (!bucket || now > bucket.resetAt) {
    audioRateLimitMap.set(ip, { count: 1, resetAt: now + 60_000 });
    return { allowed: true };
  }
  if (bucket.count >= MAX_AUDIO_REQUESTS_PER_MINUTE) {
    const retryAfter = Math.ceil((bucket.resetAt - now) / 1000);
    return { allowed: false, retryAfter };
  }
  bucket.count += 1;
  return { allowed: true };
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Méthode non autorisée. Utilisez POST.' }),
      { status: 405, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
    );
  }

  // Contrôle de sécurité : Limitation de débit audio par IP (max 30 req/min)
  const clientIp =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'anonymous';
  const rateLimitCheck = checkAudioRateLimit(clientIp);
  if (!rateLimitCheck.allowed) {
    return new Response(
      JSON.stringify({
        error: `Trop de requêtes audio depuis cette adresse IP. Veuillez patienter ${rateLimitCheck.retryAfter} seconde(s).`,
      }),
      {
        status: 429,
        headers: {
          ...CORS_HEADERS,
          'Content-Type': 'application/json',
          'Retry-After': String(rateLimitCheck.retryAfter || 60),
        },
      },
    );
  }

  // Contrôle de sécurité : Limitation de taille globale de la requête audio (Max 25 Mo)
  const contentLength = req.headers.get('content-length');
  if (contentLength && parseInt(contentLength, 10) > 25 * 1024 * 1024) {
    return new Response(
      JSON.stringify({ error: 'Fichier audio trop volumineux (limite maximale : 25 Mo).' }),
      { status: 413, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
    );
  }

  try {
    const formData = await req.formData().catch(() => null);
    if (!formData) {
      return new Response(
        JSON.stringify({ error: 'Données de formulaire invalides.' }),
        { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
      );
    }

    const audioFile = formData.get('file');
    const language = (formData.get('language') as string) || 'fr';

    if (!audioFile || !(audioFile instanceof Blob)) {
      return new Response(
        JSON.stringify({ error: 'Fichier audio manquant ou invalide.' }),
        { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
      );
    }

    if (audioFile.size > 25 * 1024 * 1024) {
      return new Response(
        JSON.stringify({ error: 'Le fichier audio dépasse la limite maximale autorisée de 25 Mo.' }),
        { status: 413, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
      );
    }

    const groqKey = process.env.GROQ_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY;

    // 1. Priorité à Groq Whisper (ultra-rapide, ~100-200ms)
    if (groqKey) {
      try {
        const groqBody = new FormData();
        groqBody.append('file', audioFile, 'audio.webm');
        groqBody.append('model', 'whisper-large-v3-turbo');
        groqBody.append('language', language === 'en' ? 'en' : 'fr');
        groqBody.append('response_format', 'json');

        const groqRes = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${groqKey}`,
          },
          body: groqBody,
        });

        if (groqRes.ok) {
          const data = (await groqRes.json()) as { text?: string };
          const text = (data.text || '').trim();
          if (text) {
            return new Response(
              JSON.stringify({ text }),
              { status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
            );
          }
        } else {
          console.warn('[NEXUS Transcribe] Groq error status:', groqRes.status);
        }
      } catch (groqErr) {
        console.warn('[NEXUS Transcribe] Groq failed, fallback to OpenAI / Gemini:', groqErr);
      }
    }

    // 2. Bascule sur OpenAI Whisper-1
    if (openaiKey) {
      try {
        const openAiBody = new FormData();
        openAiBody.append('file', audioFile, 'audio.webm');
        openAiBody.append('model', 'whisper-1');
        openAiBody.append('language', language === 'en' ? 'en' : 'fr');

        const openaiRes = await fetch('https://api.openai.com/v1/audio/transcriptions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${openaiKey}`,
          },
          body: openAiBody,
        });

        if (openaiRes.ok) {
          const data = (await openaiRes.json()) as { text?: string };
          const text = (data.text || '').trim();
          if (text) {
            return new Response(
              JSON.stringify({ text }),
              { status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
            );
          }
        } else {
          console.warn('[NEXUS Transcribe] OpenAI error status:', openaiRes.status);
        }
      } catch (openAiErr) {
        console.warn('[NEXUS Transcribe] OpenAI Whisper failed, fallback to Gemini:', openAiErr);
      }
    }

    // 3. Bascule sur Google Gemini (Multimodal Audio)
    if (geminiKey) {
      try {
        const arrayBuffer = await audioFile.arrayBuffer();
        const base64Audio = arrayBufferToBase64(arrayBuffer);
        const mimeType = (audioFile.type || 'audio/webm').split(';')[0];

        const promptText =
          language === 'fr'
            ? "Transcris fidèlement et exactement cet enregistrement audio en texte en français. Ne réponds rien d'autre que la transcription exacte, sans guillemets ni commentaires."
            : 'Transcribe this audio recording accurately. Return only the exact transcription text with no additional commentary.';

        // Tentative avec Gemini 2.5 Flash
        let geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [
                {
                  role: 'user',
                  parts: [
                    { inline_data: { mime_type: mimeType, data: base64Audio } },
                    { text: promptText },
                  ],
                },
              ],
            }),
          },
        );

        // Fallback Gemini 1.5 Flash si 2.5 n'est pas encore disponible
        if (!geminiRes.ok) {
          geminiRes = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [
                  {
                    role: 'user',
                    parts: [
                      { inline_data: { mime_type: mimeType, data: base64Audio } },
                      { text: promptText },
                    ],
                  },
                ],
              }),
            },
          );
        }

        if (geminiRes.ok) {
          const geminiData = (await geminiRes.json()) as any;
          const text = (
            geminiData.candidates?.[0]?.content?.parts?.[0]?.text || ''
          ).trim();
          if (text) {
            return new Response(
              JSON.stringify({ text }),
              { status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
            );
          }
        }
      } catch (geminiErr) {
        console.warn('[NEXUS Transcribe] Gemini audio transcription failed:', geminiErr);
      }
    }

    return new Response(
      JSON.stringify({
        error:
          'Aucune clé de transcription disponible (GROQ_API_KEY, OPENAI_API_KEY ou GEMINI_API_KEY).',
      }),
      { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err?.message || 'Erreur interne de transcription.' }),
      { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
    );
  }
}
