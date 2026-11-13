/**
 * api/ai/status.ts — Vercel Edge Function pour l'état des services IA
 */

export const config = {
  runtime: 'edge',
};

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-client-info, apikey',
};

function maskKey(key?: string): string | undefined {
  if (!key || key.length < 8) return undefined;
  return `${key.slice(0, 4)}...${key.slice(-4)}`;
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  const geminiKey = process.env.GEMINI_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const mistralKey = process.env.MISTRAL_API_KEY;
  const groqKey = process.env.GROQ_API_KEY;

  return new Response(
    JSON.stringify({
      status: 'operational',
      mode: 'vercel_edge',
      availableProviders: {
        gemini: Boolean(geminiKey),
        openai: Boolean(openaiKey),
        anthropic: Boolean(anthropicKey),
        mistral: Boolean(mistralKey),
        groq: Boolean(groqKey),
        demo: true,
      },
      maskedKeys: {
        gemini: maskKey(geminiKey),
        openai: maskKey(openaiKey),
        anthropic: maskKey(anthropicKey),
        mistral: maskKey(mistralKey),
        groq: maskKey(groqKey),
      },
    }),
    { status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
  );
}
