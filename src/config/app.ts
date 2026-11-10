/**
 * src/config/app.ts
 *
 * Central app configuration constants.
 * Never put secret keys here — frontend code is public.
 */

export const APP_NAME = 'NEXUS AI';
export const APP_VERSION = '0.3.0';
export const APP_DESCRIPTION = 'Plateforme d\'intelligence artificielle multi-agents';

/** Base URL for the future API backend (configure via env variable). */
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

/** Feature flags — active and prepared capabilities. */
export const FEATURES = {
  auth: true,            // Authentification e-mail / mot de passe & session
  sync: true,            // Synchronisation cloud Supabase
  projects: true,        // Espace NEXUS LAB & modèles
  documents: true,       // Éditeur de code & prévisualisation
  memory: true,          // Souvenirs & mémoire contextuelle IA
  multiAgent: true,      // Agents spécialisés
} as const;

export const MAX_MESSAGE_LENGTH = 8_000;
export const MAX_CONVERSATION_HISTORY = 100;
