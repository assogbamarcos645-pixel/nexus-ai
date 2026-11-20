#!/usr/bin/env node
/**
 * scripts/send-v040-notification.mjs
 *
 * Script d'envoi et de test de notification par e-mail pour NEXUS AI v0.4.0 via l'API Resend.
 *
 * Usage:
 *   node scripts/send-v040-notification.mjs
 *     -> Genere un apercu HTML localement dans scripts/preview-email.html
 *
 *   node scripts/send-v040-notification.mjs --send --api-key=re_xxxx [--to=user@example.com]
 *     -> Declenche l'envoi reel via l'API REST de Resend
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const VERSION = '0.4.0';
const SUBJECT = `NEXUS AI v${VERSION} est disponible : Swarm 2.0, WebContainers & Codebase Search`;

function getEmailHtml(userName = 'Developpeur', appUrl = 'https://nexus-ai.app') {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>NEXUS AI v${VERSION} est disponible</title>
  <style>
    body { margin: 0; padding: 0; background-color: #070712; color: #e2e8f0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; }
    .wrapper { width: 100%; background-color: #070712; padding: 32px 16px; box-sizing: border-box; }
    .container { max-width: 600px; margin: 0 auto; background: #0d0e23; border: 1px solid #1e2048; border-radius: 20px; overflow: hidden; }
    .header { padding: 36px 32px 24px; text-align: center; background: linear-gradient(180deg, rgba(124, 13, 244, 0.15) 0%, rgba(13, 14, 35, 0) 100%); border-bottom: 1px solid #1a1c40; }
    .logo-badge { display: inline-block; padding: 6px 14px; background: linear-gradient(135deg, #7c0df4, #06b6d4); color: #ffffff; font-weight: 800; font-size: 13px; border-radius: 9999px; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 14px; }
    .title { margin: 0; font-size: 26px; font-weight: 800; color: #ffffff; }
    .subtitle { margin: 8px 0 0; color: #94a3b8; font-size: 14px; }
    .content { padding: 32px; }
    .card { background: #12142e; border: 1px solid #23275c; border-radius: 14px; padding: 18px 20px; margin-bottom: 16px; }
    .card-title { font-size: 15px; font-weight: 700; color: #38bdf8; margin: 0 0 6px 0; }
    .card-desc { font-size: 13px; color: #cbd5e1; margin: 0; }
    .cta-container { text-align: center; margin: 36px 0 20px; }
    .cta-button { display: inline-block; background: linear-gradient(135deg, #7c0df4, #06b6d4); color: #ffffff !important; text-decoration: none; font-weight: 700; font-size: 15px; padding: 14px 32px; border-radius: 12px; }
    .footer { padding: 24px 32px; text-align: center; border-top: 1px solid #1a1c40; background: #090a1a; font-size: 12px; color: #64748b; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <span class="logo-badge">NEXUS AI - v${VERSION}</span>
        <h1 class="title">Une nouvelle ere commence</h1>
        <p class="subtitle">Plateforme d'intelligence collective multi-agents et IDE in-browser</p>
      </div>
      <div class="content">
        <p>Bonjour <strong>${userName}</strong>,</p>
        <p style="color: #cbd5e1; font-size: 14px;">
          Nous avons le plaisir de vous annoncer le deploiement officiel de <strong>NEXUS AI v${VERSION}</strong> :
        </p>
        <div class="card">
          <h2 class="card-title">1. Runtime WebContainers In-Browser & Streaming</h2>
          <p class="card-desc">Executez vos projets Node.js, serveurs d'API et scripts npm directement dans votre navigateur avec streaming stdout/stderr fluide et detection de serveur automatique.</p>
        </div>
        <div class="card">
          <h2 class="card-title">2. Multi-Agents Swarm 2.0 & Auto-Heal en Temps Reel</h2>
          <p class="card-desc">Orchestrez une equipe modulaire (Architecte, UI, QA, Donnees Supabase/SQL, Securite OWASP). Le mode Auto-Heal diagnostique et repare en un clic vos erreurs de build et linter.</p>
        </div>
        <div class="card">
          <h2 class="card-title">3. Codebase Search & RAG Vectoriel Hybride</h2>
          <p class="card-desc">Vos agents comprennent desormais la globalite du projet grace au decoupage semantique (BM25 + TF-IDF) injectant les bons snippets dans vos echanges.</p>
        </div>
        <div class="cta-container">
          <a href="${appUrl}" target="_blank" rel="noopener noreferrer" class="cta-button">
            Ouvrir NEXUS AI v${VERSION}
          </a>
        </div>
      </div>
      <div class="footer">
        <p>(c) ${new Date().getFullYear()} NEXUS AI - Tous droits reserves.</p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

async function main() {
  const args = process.argv.slice(2);
  const isSend = args.includes('--send');
  const apiKey = process.env.RESEND_API_KEY || (args.find((a) => a.startsWith('--api-key=')) || '').replace('--api-key=', '');

  const customToArg = args.find((a) => a.startsWith('--to='));
  const targetEmail = customToArg ? customToArg.replace('--to=', '') : 'marcosassogba645@gmail.com';

  console.log(`[NEXUS NOTIFICATION] Preparation de la notification v${VERSION}...`);

  if (!isSend) {
    const previewPath = path.resolve(__dirname, 'preview-email.html');
    const html = getEmailHtml('Super Administrateur');
    fs.writeFileSync(previewPath, html, 'utf-8');
    console.log(`[SUCCES] Fichier de previsualisation genere : ${previewPath}`);
    console.log(`[SUJET] Sujet du message : "${SUBJECT}"`);
    console.log(`[INFO] Pour declencher l'envoi reel vers ${targetEmail} :`);
    console.log(`   node scripts/send-v040-notification.mjs --send --api-key=${apiKey || 're_xxxx'}`);
    return;
  }

  if (!apiKey) {
    console.error('[ERREUR] Cle RESEND_API_KEY manquante. Passez --api-key=re_... ou definissez la variable d\'environnement.');
    process.exit(1);
  }

  console.log(`[ENVOI] Envoi du message de release a : ${targetEmail}...`);

  const html = getEmailHtml('Super Administrateur');
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'NEXUS AI <onboarding@resend.dev>',
      to: [targetEmail],
      subject: SUBJECT,
      html,
    }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    console.error(`[ERREUR] Echec d'envoi Resend (${response.status}) :`, data);
    process.exit(1);
  }

  console.log(`[SUCCES] Message envoye avec succes via Resend.`);
  console.log(`[INFO] ID du message Resend : ${data.id}`);
  console.log(`[DESTINATAIRE] Verifiez votre boite de reception : ${targetEmail}`);
}

main().catch(console.error);
