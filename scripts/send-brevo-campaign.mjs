#!/usr/bin/env node
/**
 * scripts/send-brevo-campaign.mjs
 *
 * Envoi direct de la campagne de notification NEXUS AI v0.4.0 via l'API Brevo v3.
 *
 * Usage :
 *   1. Envoi à des destinataires passés en argument :
 *      node scripts/send-brevo-campaign.mjs email1@example.com email2@example.com
 *
 *   2. Envoi à une liste contenue dans un fichier texte ou CSV :
 *      node scripts/send-brevo-campaign.mjs --file=scripts/recipients.txt
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BREVO_API_KEY =
  process.env.BREVO_API_KEY ||
  (process.argv.find((a) => a.startsWith('--api-key=')) || '').replace('--api-key=', '');
const SENDER = {
  name: 'NEXUS AI',
  email: 'assogbamarcos645@gmail.com',
};
const SUBJECT = 'NEXUS AI v0.4.0 est en ligne : Swarm 2.0, WebContainers & Codebase Search';

async function sendEmailToRecipient(recipientEmail, htmlContent) {
  const cleanEmail = recipientEmail.trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes('@')) return { success: false, error: 'Email invalide' };

  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': BREVO_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sender: SENDER,
        to: [{ email: cleanEmail }],
        subject: SUBJECT,
        htmlContent,
      }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return { success: false, error: data.message || `Erreur HTTP ${response.status}` };
    }

    return { success: true, messageId: data.messageId };
  } catch (err) {
    return { success: false, error: err.message || String(err) };
  }
}

async function main() {
  const args = process.argv.slice(2);
  let recipients = [];

  const fileArg = args.find((a) => a.startsWith('--file='));
  if (fileArg) {
    const filePath = path.resolve(fileArg.replace('--file=', ''));
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      recipients = content
        .split(/[\r\n,;]+/)
        .map((e) => e.trim().replace(/^["']|["']$/g, ''))
        .filter((e) => e.includes('@'));
    } else {
      console.error(`[ERREUR] Fichier introuvable : ${filePath}`);
      process.exit(1);
    }
  } else {
    recipients = args.filter((a) => a.includes('@'));
  }

  // Si aucun destinataire fourni en paramètre, vérifier s'il existe scripts/recipients.txt
  if (recipients.length === 0) {
    const defaultRecipientsFile = path.resolve(__dirname, 'recipients.txt');
    if (fs.existsSync(defaultRecipientsFile)) {
      const content = fs.readFileSync(defaultRecipientsFile, 'utf-8');
      recipients = content
        .split(/[\r\n,;]+/)
        .map((e) => e.trim().replace(/^["']|["']$/g, ''))
        .filter((e) => e.includes('@'));
    }
  }

  if (recipients.length === 0) {
    console.log('[USAGE] Aucun destinataire spécifié.');
    console.log('Exemples :');
    console.log('  node scripts/send-brevo-campaign.mjs user1@gmail.com user2@gmail.com');
    console.log('  node scripts/send-brevo-campaign.mjs --file=scripts/recipients.txt');
    return;
  }

  // Déduplication des e-mails
  recipients = Array.from(new Set(recipients.map((e) => e.toLowerCase().trim())));

  const templatePath = path.resolve(__dirname, 'brevo-campaign-template.html');
  const htmlContent = fs.readFileSync(templatePath, 'utf-8');

  console.log(`\n🚀 [NEXUS AI - CAMPAGNE BREVO] Lancement de l'envoi vers ${recipients.length} destinataire(s)...`);
  console.log(`Expéditeur : ${SENDER.name} <${SENDER.email}>`);
  console.log(`Objet : "${SUBJECT}"\n`);

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < recipients.length; i++) {
    const email = recipients[i];
    process.stdout.write(`[${i + 1}/${recipients.length}] Envoi à ${email}... `);

    const result = await sendEmailToRecipient(email, htmlContent);
    if (result.success) {
      console.log(`✅ Succès (ID: ${result.messageId})`);
      successCount++;
    } else {
      console.log(`❌ Échec (${result.error})`);
      failCount++;
    }

    // Petite temporisation de 100ms entre les envois pour éviter tout rate-limiting
    if (i < recipients.length - 1) {
      await new Promise((r) => setTimeout(r, 120));
    }
  }

  console.log('\n========================================');
  console.log(`🏁 FIN DE DIFFUSION DE LA CAMPAGNE`);
  console.log(`   Total envoyés avec succès : ${successCount}`);
  console.log(`   Total échecs              : ${failCount}`);
  console.log('========================================\n');
}

main().catch(console.error);
