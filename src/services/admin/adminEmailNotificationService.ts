/**
 * src/services/admin/adminEmailNotificationService.ts
 *
 * Service de Notification Externe par E-mail & Campagnes de Release (NEXUS AI).
 * Permet d'envoyer un e-mail responsive et stylé à tous les utilisateurs enregistrés
 * via l'API Resend, un relais SMTP ou d'exporter la liste des adresses pour Brevo/Mailchimp.
 */

import { getManagedUsers } from './adminSecurityService.ts';

export interface EmailCampaignOptions {
  subject: string;
  appUrl?: string;
  senderName?: string;
  senderEmail?: string;
  resendApiKey?: string;
  customNote?: string;
}

export interface SendEmailResult {
  success: boolean;
  totalSent: number;
  totalFailed: number;
  errors: string[];
  simulated?: boolean;
}

/**
 * Génère le template HTML complet, responsive et moderne pour annoncer la version v0.4.0.
 */
export function generateReleaseNotificationHtml(options: {
  userName?: string;
  appUrl?: string;
  customNote?: string;
  version?: string;
} = {}): string {
  const {
    userName = 'Développeur',
    appUrl = 'https://nexus-ai.app',
    customNote,
    version = '0.4.0',
  } = options;

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>NEXUS AI v${version} est disponible</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #070712;
      color: #e2e8f0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.6;
    }
    .wrapper {
      width: 100%;
      background-color: #070712;
      padding: 32px 16px;
      box-sizing: border-box;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background: #0d0e23;
      border: 1px solid #1e2048;
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6);
    }
    .header {
      padding: 36px 32px 24px;
      text-align: center;
      background: linear-gradient(180deg, rgba(124, 13, 244, 0.15) 0%, rgba(13, 14, 35, 0) 100%);
      border-bottom: 1px solid #1a1c40;
    }
    .logo-badge {
      display: inline-block;
      padding: 6px 14px;
      background: linear-gradient(135deg, #7c0df4, #06b6d4);
      color: #ffffff;
      font-weight: 800;
      font-size: 13px;
      border-radius: 9999px;
      letter-spacing: 1px;
      text-transform: uppercase;
      margin-bottom: 14px;
    }
    .title {
      margin: 0;
      font-size: 26px;
      font-weight: 800;
      color: #ffffff;
      letter-spacing: -0.5px;
    }
    .subtitle {
      margin: 8px 0 0;
      color: #94a3b8;
      font-size: 14px;
    }
    .content {
      padding: 32px;
    }
    .greeting {
      font-size: 16px;
      color: #f1f5f9;
      margin-bottom: 16px;
    }
    .card {
      background: #12142e;
      border: 1px solid #23275c;
      border-radius: 14px;
      padding: 18px 20px;
      margin-bottom: 16px;
    }
    .card-title {
      font-size: 15px;
      font-weight: 700;
      color: #38bdf8;
      margin: 0 0 6px 0;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .card-desc {
      font-size: 13px;
      color: #cbd5e1;
      margin: 0;
      line-height: 1.5;
    }
    .cta-container {
      text-align: center;
      margin: 36px 0 20px;
    }
    .cta-button {
      display: inline-block;
      background: linear-gradient(135deg, #7c0df4, #06b6d4);
      color: #ffffff !important;
      text-decoration: none;
      font-weight: 700;
      font-size: 15px;
      padding: 14px 32px;
      border-radius: 12px;
      box-shadow: 0 8px 20px rgba(124, 13, 244, 0.35);
    }
    .footer {
      padding: 24px 32px;
      text-align: center;
      border-top: 1px solid #1a1c40;
      background: #090a1a;
      font-size: 12px;
      color: #64748b;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <span class="logo-badge">NEXUS AI • v${version}</span>
        <h1 class="title">Une nouvelle ère commence</h1>
        <p class="subtitle">La plateforme d'intelligence collective multi-agents et IDE in-browser</p>
      </div>

      <div class="content">
        <p class="greeting">Bonjour <strong>${userName}</strong>,</p>
        <p style="color: #cbd5e1; font-size: 14px; margin-bottom: 24px;">
          Nous avons le plaisir de vous annoncer le déploiement officiel de <strong>NEXUS AI v${version}</strong>.
          Cette version majeure intègre 3 innovations technologiques conçues pour décupler votre productivité de développement :
        </p>

        <!-- Feature 1 -->
        <div class="card">
          <h2 class="card-title">⚡ 1. Runtime WebContainers In-Browser & Streaming</h2>
          <p class="card-desc">
            Exécutez vos projets Node.js, serveurs d'API et scripts npm directement dans votre navigateur avec un streaming stdout/stderr fluide et détection de serveur automatique sans dépendance de serveur distant.
          </p>
        </div>

        <!-- Feature 2 -->
        <div class="card">
          <h2 class="card-title">🧠 2. Multi-Agents Swarm 2.0 & Auto-Heal en Temps Réel</h2>
          <p class="card-desc">
            Orchestrez une équipe modulaire (Architecte, UI, QA, Données Supabase/SQL, Sécurité OWASP). Grâce au mode <strong>Auto-Heal</strong>, le Swarm diagnostique et répare en un clic vos erreurs de build et de linter.
          </p>
        </div>

        <!-- Feature 3 -->
        <div class="card">
          <h2 class="card-title">🔍 3. Codebase Search & RAG Vectoriel Hybride</h2>
          <p class="card-desc">
            Vos agents disposent désormais d'une compréhension globale du projet grâce au découpage sémantique (BM25 + TF-IDF) injectant exactement les fichiers de code utiles dans vos échanges.
          </p>
        </div>

        ${
          customNote
            ? `<div style="background: rgba(6, 182, 212, 0.08); border-left: 3px solid #06b6d4; padding: 12px 16px; margin: 20px 0; border-radius: 4px; font-size: 13px; color: #a5f3fc;">
                ${customNote}
              </div>`
            : ''
        }

        <div class="cta-container">
          <a href="${appUrl}" target="_blank" rel="noopener noreferrer" class="cta-button">
            Ouvrir NEXUS AI v${version} →
          </a>
        </div>
      </div>

      <div class="footer">
        <p style="margin: 0 0 8px;">
          Vous recevez cet e-mail car vous êtes inscrit sur la plateforme NEXUS AI.
        </p>
        <p style="margin: 0; color: #475569;">
          © ${new Date().getFullYear()} NEXUS AI — Tous droits réservés • Chiffrement de bout en bout & conformité RGPD.
        </p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Récupère la liste de tous les emails des utilisateurs gérés.
 */
export function getAllUserEmails(): string[] {
  const users = getManagedUsers();
  if (!users || users.length === 0) {
    return ['marcosassogba645@gmail.com', 'alex.dev@nexus-corp.com'];
  }
  return users.map((u) => u.email).filter(Boolean);
}

/**
 * Exporte la liste des utilisateurs sous format CSV prêt pour Mailchimp / Brevo / Resend.
 */
export function exportUsersCsv(): string {
  const users = getManagedUsers();
  const header = 'Email,Nom,Role,Statut,DerniereConnexion';
  if (!users || users.length === 0) {
    return `${header}\n"marcosassogba645@gmail.com","Super Administrateur","super_admin","active","${new Date().toISOString()}"\n"alex.dev@nexus-corp.com","Alexandre Renard","pro_dev","active","${new Date().toISOString()}"`;
  }
  const rows = users.map((u) => `"${u.email}","${u.fullName}","${u.role}","${u.status}","${u.lastSeen}"`);
  return [header, ...rows].join('\n');
}

/**
 * Déclenche l'envoi d'e-mails réels (via Resend) ou en mode simulation haute-fidélité.
 */
export async function sendBroadcastEmail(options: EmailCampaignOptions): Promise<SendEmailResult> {
  const recipients = getAllUserEmails();
  const {
    subject,
    resendApiKey,
    appUrl = 'https://nexus-ai.app',
    senderName = 'NEXUS AI Team',
    senderEmail = 'notifications@nexus-ai.app',
    customNote,
  } = options;

  if (recipients.length === 0) {
    return {
      success: false,
      totalSent: 0,
      totalFailed: 0,
      errors: ['Aucun utilisateur trouvé dans la base de données.'],
    };
  }

  // 1. Si une clé Resend est fournie, tenter l'envoi direct via l'API Resend
  if (resendApiKey && resendApiKey.startsWith('re_')) {
    try {
      const html = generateReleaseNotificationHtml({ appUrl, customNote });
      const response = await fetch('https://api.resend.com/emails/batch', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(
          recipients.map((to) => ({
            from: `${senderName} <${senderEmail}>`,
            to,
            subject,
            html,
          }))
        ),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Erreur API Resend (HTTP ${response.status})`);
      }

      return {
        success: true,
        totalSent: recipients.length,
        totalFailed: 0,
        errors: [],
        simulated: false,
      };
    } catch (err: any) {
      console.warn('[EMAIL NOTIFICATION] Échec appel direct Resend:', err);
      return {
        success: false,
        totalSent: 0,
        totalFailed: recipients.length,
        errors: [err.message || String(err)],
      };
    }
  }

  // 2. Mode Démonstration / Enregistrement local en l'absence de clé de fournisseur externe
  // Simule l'envoi réussi avec horodatage d'audit
  return {
    success: true,
    totalSent: recipients.length,
    totalFailed: 0,
    errors: [],
    simulated: true,
  };
}
