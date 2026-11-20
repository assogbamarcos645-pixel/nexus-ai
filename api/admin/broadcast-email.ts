/**
 * api/admin/broadcast-email.ts — Vercel Serverless Function
 *
 * Envoi sécurisé côté serveur des campagnes d'e-mails administrateur (Brevo / Resend).
 * Contourne les bloqueurs de publicité (AdBlock) et les limitations CORS des navigateurs.
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
};

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ success: false, error: 'Méthode non autorisée. Utilisez POST.' }),
      { status: 405, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const body = await req.json().catch(() => ({}));
    const {
      apiKey: customApiKey,
      provider = 'brevo',
      subject,
      recipients = [],
      senderEmail = 'assogbamarcos645@gmail.com',
      senderName = 'NEXUS AI',
      htmlContent,
    } = body;

    const cleanRecipients = (Array.isArray(recipients) ? recipients : [])
      .map((r: string) => String(r).trim().toLowerCase())
      .filter((r: string) => r.includes('@'));

    if (cleanRecipients.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'Aucun destinataire valide spécifié.' }),
        { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      );
    }

    if (!subject || !htmlContent) {
      return new Response(
        JSON.stringify({ success: false, error: 'Sujet ou contenu HTML manquant.' }),
        { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      );
    }

    // 1. Traitement Brevo
    if (provider === 'brevo') {
      const brevoKey =
        customApiKey ||
        process.env.BREVO_API_KEY ||
        process.env.VITE_BREVO_API_KEY ||
        '';

      if (!brevoKey) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Clé API Brevo manquante. Renseignez la clé dans le formulaire ou dans les variables d’environnement.',
          }),
          { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
        );
      }

      let totalSent = 0;
      let totalFailed = 0;
      const errors: string[] = [];

      for (let i = 0; i < cleanRecipients.length; i++) {
        const recipient = cleanRecipients[i];
        try {
          const res = await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: {
              'api-key': brevoKey,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              sender: { name: senderName, email: senderEmail },
              to: [{ email: recipient }],
              subject,
              htmlContent,
            }),
          });

          const data = await res.json().catch(() => ({}));
          if (!res.ok) {
            totalFailed++;
            errors.push(`${recipient}: ${data.message || res.statusText}`);
          } else {
            totalSent++;
          }
        } catch (err: any) {
          totalFailed++;
          errors.push(`${recipient}: ${err.message || String(err)}`);
        }

        if (i < cleanRecipients.length - 1) {
          await new Promise((r) => setTimeout(r, 100));
        }
      }

      return new Response(
        JSON.stringify({
          success: totalSent > 0,
          totalSent,
          totalFailed,
          errors,
        }),
        { status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Traitement Resend
    if (provider === 'resend') {
      const resendKey = customApiKey || process.env.RESEND_API_KEY || process.env.VITE_RESEND_API_KEY || '';
      if (!resendKey) {
        return new Response(
          JSON.stringify({ success: false, error: 'Clé API Resend manquante.' }),
          { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
        );
      }

      const res = await fetch('https://api.resend.com/emails/batch', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(
          cleanRecipients.map((to: string) => ({
            from: `${senderName} <${senderEmail}>`,
            to,
            subject,
            html: htmlContent,
          }))
        ),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        return new Response(
          JSON.stringify({ success: false, error: data.message || 'Erreur Resend' }),
          { status: res.status, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          totalSent: cleanRecipients.length,
          totalFailed: 0,
          errors: [],
        }),
        { status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: false, error: 'Fournisseur non supporté.' }),
      { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ success: false, error: err.message || 'Erreur interne du serveur' }),
      { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    );
  }
}
