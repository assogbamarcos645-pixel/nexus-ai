/**
 * src/utils/uuid.ts
 *
 * Utilitaire de génération et validation d'identifiants UUID v4 (RFC 4122).
 * Assure la compatibilité stricte avec les types `id UUID` de PostgreSQL et Supabase.
 */

const LOOSE_UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Génère un UUID v4 standardisé.
 * Utilise l'API standard `crypto.randomUUID()` native des navigateurs modernes,
 * avec un repli cryptographique sécurisé si nécessaire.
 */
export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  // Fallback RFC 4122 v4
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    bytes[6] = (bytes[6] & 0x0f) | 0x40; // Version 4
    bytes[8] = (bytes[8] & 0x3f) | 0x80; // Variant 10xx
    const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
  }

  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Vérifie si une chaîne est un UUID valide pour PostgreSQL.
 */
export function isValidUUID(id: unknown): id is string {
  if (typeof id !== 'string') return false;
  return LOOSE_UUID_REGEX.test(id.trim());
}

/**
 * Garantit qu'un identifiant est un UUID valide.
 * Si l'identifiant fourni est déjà un UUID valide, il est retourné tel quel.
 * Sinon, un nouvel UUID v4 est généré.
 */
export function ensureUUID(id: unknown): string {
  if (isValidUUID(id)) {
    return id.trim().toLowerCase();
  }
  return generateUUID();
}
