/**
 * src/lib/constants.ts
 *
 * Constantes partagées à l'échelle de l'application.
 * Ne jamais placer de clés secrètes ici — le code frontend est public.
 */

export const APP_NAME = 'NEXUS AI';
export const APP_VERSION = '0.3.0';

/** URL du backend API (définie dans .env — jamais de clé secrète ici). */
export const API_BASE_URL =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL) ||
  (typeof process !== 'undefined' && process.env?.VITE_API_BASE_URL) ||
  '';

/** Configuration Supabase (URL et clé publique anon). */
export const SUPABASE_URL =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) ||
  (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_URL) ||
  '';

export const SUPABASE_ANON_KEY =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) ||
  (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_ANON_KEY) ||
  '';

/**
 * Détermine si le service cloud Supabase est réellement configuré avec des valeurs valides.
 * Évite les fausses illusions si les variables d'environnement sont absentes ou des placeholders.
 */
export const IS_CLOUD_CONFIGURED = Boolean(
  SUPABASE_URL &&
    SUPABASE_ANON_KEY &&
    !SUPABASE_URL.includes('votre-projet') &&
    !SUPABASE_ANON_KEY.includes('votre_cle'),
);

export const MAX_MESSAGE_LENGTH = 8_000;
export const MAX_CONVERSATION_HISTORY = 100;

/** Feature flags — fonctionnalités actives et préparées. */
export const FEATURES = {
  auth: true,        // Authentification par e-mail / mot de passe
  sync: true,        // Synchronisation cloud des données
  projects: true,    // Espace NEXUS LAB
  documents: true,   // Édition de code et documents
  memory: true,      // Souvenirs et mémoire contextuelle
  multiAgent: true,  // Agents spécialisés
} as const;

