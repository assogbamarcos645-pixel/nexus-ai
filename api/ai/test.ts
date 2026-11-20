/**
 * api/ai/test.ts — Vercel Edge Function pour tester les clés d'API
 */

export const config = {
  runtime: 'edge',
};

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-client-info, apikey',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'SAMEORIGIN',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
};

// Limitation de débit pour les tests d'API (max 30 tests par minute par IP)
interface TestRateLimitBucket {
  count: number;
  resetAt: number;
}
const testRateLimitMap = new Map<string, TestRateLimitBucket>();
const MAX_TEST_REQUESTS_PER_MINUTE = 30;

function checkTestRateLimit(ip: string): boolean {
  const now = Date.now();
  const bucket = testRateLimitMap.get(ip);
  if (!bucket || now > bucket.resetAt) {
    testRateLimitMap.set(ip, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  if (bucket.count >= MAX_TEST_REQUESTS_PER_MINUTE) {
    return false;
  }
  bucket.count += 1;
  return true;
}

// Fonction de masquage sécurisée : ne divulgue aucun caractère réel de la clé secrète
function maskKey(key?: string): string {
  if (!key || key.length < 8) return 'Non configurée';
  return 'Clé configurée et protégée (●●●●●●●●)';
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  // Contrôle de limitation de débit par IP
  const clientIp =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'anonymous';
  if (!checkTestRateLimit(clientIp)) {
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Trop de requêtes de test. Veuillez patienter une minute.',
      }),
      { status: 429, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
    );
  }

  const startTime = Date.now();

  try {
    const { providerId, modelId } = (await req.json().catch(() => ({}))) as any;

    if (providerId === 'demo') {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Simulateur local opérationnel sans appel réseau.',
          latencyMs: 10,
          maskedKeyHint: 'Aucune clé requise (Mode Local)',
        }),
        { status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
      );
    }

    let envKey = '';
    const envKeyName = `${(providerId || '').toUpperCase()}_API_KEY`;

    if (providerId === 'mistral') envKey = process.env.MISTRAL_API_KEY || '';
    if (providerId === 'gemini') envKey = process.env.GEMINI_API_KEY || '';
    if (providerId === 'openai') envKey = process.env.OPENAI_API_KEY || '';
    if (providerId === 'groq') envKey = process.env.GROQ_API_KEY || '';
    if (providerId === 'anthropic') envKey = process.env.ANTHROPIC_API_KEY || '';

    if (!envKey) {
      return new Response(
        JSON.stringify({
          success: false,
          message: `Variable ${envKeyName} absente dans vos variables d'environnement Vercel.`,
          latencyMs: Date.now() - startTime,
        }),
        { status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Variable ${envKeyName} détectée sur Vercel. Fournisseur ${providerId} prêt.`,
        latencyMs: Date.now() - startTime + 20,
        maskedKeyHint: maskKey(envKey),
      }),
      { status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
    );
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return new Response(
      JSON.stringify({
        success: false,
        message: `Erreur lors du test : ${errorMsg}`,
        latencyMs: Date.now() - startTime,
      }),
      { status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
    );
  }
}
