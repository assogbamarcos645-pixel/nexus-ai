/**
 * src/services/auth/supabaseClient.ts
 *
 * Client Supabase sécurisé pour NEXUS AI.
 * Utilise l'URL et la clé publique anonyme (anon key).
 * Aucune clé secrète (service_role) n'est jamais exposée côté client.
 * Si les variables ne sont pas configurées, le client reste null pour permettre
 * un fonctionnement 100% local en mode démonstration sans plantage.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY, IS_CLOUD_CONFIGURED } from '../../lib/constants.ts';

let supabaseClient: SupabaseClient | null = null;

if (IS_CLOUD_CONFIGURED) {
  try {
    supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: 'nexus_auth_session',
      },
    });
  } catch (err) {
    console.warn('[NEXUS AI] Impossible d’initialiser le client Supabase:', err);
    supabaseClient = null;
  }
}

/**
 * Retourne l'instance Supabase si le service est configuré, sinon null.
 */
export function getSupabase(): SupabaseClient | null {
  return supabaseClient;
}

export const supabase = supabaseClient;
