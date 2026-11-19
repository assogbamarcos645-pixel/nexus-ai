/**
 * src/services/admin/adminSecurityService.ts
 *
 * Moteur de securite et de controle d'acces pour l'Espace Super-Admin de NEXUS AI :
 * 1. Verification d'eligibilite par adresse e-mail Super-Administrateur
 * 2. Hachage et controle du code PIN / mot de passe maitre (SHA-256)
 * 3. Authentification biometrique (Empreinte digitale / WebAuthn / Touch ID / Windows Hello)
 * 4. Gestion de la session ephemere (auto-verrouillage securise)
 * 5. Mode maintenance et gestion des utilisateurs
 */

import type {
  AdminSecurityConfig,
  AdminAuditEntry,
  AdminAuditAction,
  ManagedUser,
} from '../../types/admin.ts';
import { generateUUID } from '../../utils/uuid.ts';

const ADMIN_STORAGE_KEY = 'nexus_admin_security_v1';
const ADMIN_SESSION_KEY = 'nexus_admin_session_unlocked_v1';
const ADMIN_AUDIT_KEY = 'nexus_admin_audit_logs_v1';
const ADMIN_USERS_KEY = 'nexus_admin_managed_users_v1';
const MAX_AUDIT_LOGS = 60;

export async function hashSecret(secret: string): Promise<string> {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const msgBuffer = new TextEncoder().encode(secret);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }
  let hash = 0;
  for (let i = 0; i < secret.length; i++) {
    const char = secret.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return `fallback_${Math.abs(hash).toString(16)}`;
}

export function getDefaultAdminConfig(): AdminSecurityConfig {
  return {
    primaryAdminEmail: 'marcosassogba645@gmail.com',
    allowedAdminEmails: ['marcosassogba645@gmail.com', 'admin@nexus-ai.local'],
    masterPinHash: '',
    isPinConfigured: false,
    biometricEnabled: false,
    maintenanceMode: false,
    maintenanceNotice: 'NEXUS AI est actuellement en maintenance privee. Merci de reessayer plus tard.',
    autoLockMinutes: 15,
  };
}

export function getAdminConfig(): AdminSecurityConfig {
  if (typeof window === 'undefined') return getDefaultAdminConfig();
  try {
    const raw = localStorage.getItem(ADMIN_STORAGE_KEY);
    if (!raw) return getDefaultAdminConfig();
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return getDefaultAdminConfig();
    return { ...getDefaultAdminConfig(), ...parsed };
  } catch (err) {
    console.warn('[AdminSecurityService] Erreur lecture configuration:', err);
    return getDefaultAdminConfig();
  }
}

export function saveAdminConfig(config: AdminSecurityConfig): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(config));
    window.dispatchEvent(new CustomEvent('nexus:admin-config-updated', { detail: config }));
  } catch (err) {
    console.error('[AdminSecurityService] Erreur sauvegarde configuration:', err);
  }
}

export function logAdminAudit(action: AdminAuditAction, success: boolean, details: string): AdminAuditEntry {
  const entry: AdminAuditEntry = {
    id: generateUUID(),
    timestamp: new Date().toISOString(),
    action,
    success,
    details,
    ipOrDevice: typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 80) : 'local',
  };

  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(ADMIN_AUDIT_KEY);
      const list: AdminAuditEntry[] = raw ? JSON.parse(raw) : [];
      const updated = [entry, ...list].slice(0, MAX_AUDIT_LOGS);
      localStorage.setItem(ADMIN_AUDIT_KEY, JSON.stringify(updated));
    } catch {
      // Ignorer
    }
  }

  return entry;
}

export function getAdminAuditLogs(): AdminAuditEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(ADMIN_AUDIT_KEY);
    if (!raw) return [];
    return JSON.parse(raw) || [];
  } catch {
    return [];
  }
}

export function clearAdminAuditLogs(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(ADMIN_AUDIT_KEY);
  } catch {
    // Ignorer
  }
}

// ─── Verification de l'Email Administrateur ───────────────────────────────────

export function isEmailAuthorizedAdmin(email: string): boolean {
  if (!email || !email.trim()) return false;
  const config = getAdminConfig();
  const normalized = email.trim().toLowerCase();
  return (
    normalized === config.primaryAdminEmail.toLowerCase() ||
    config.allowedAdminEmails.map((e) => e.toLowerCase()).includes(normalized)
  );
}

// ─── Verification et Configuration du Code PIN ────────────────────────────────

export async function setMasterAdminPin(newPin: string): Promise<boolean> {
  const cleanPin = newPin.trim();
  if (cleanPin.length < 4) return false;
  const hash = await hashSecret(cleanPin);
  const config = getAdminConfig();
  saveAdminConfig({
    ...config,
    masterPinHash: hash,
    isPinConfigured: true,
  });
  logAdminAudit('settings_update', true, 'Configuration ou mise a jour du code PIN maitre');
  return true;
}

export async function verifyMasterAdminPin(enteredPin: string): Promise<boolean> {
  const config = getAdminConfig();
  if (!config.isPinConfigured || !config.masterPinHash) {
    // Si aucun PIN n'est encore configuré, on valide temporairement le PIN d'initialisation par défaut "0000" ou configuration
    return enteredPin.trim() === '0000';
  }
  const hash = await hashSecret(enteredPin.trim());
  return hash === config.masterPinHash;
}

// ─── Biometrie (WebAuthn / Empreinte Digitale / Windows Hello / Touch ID) ─────

export function isBiometricsSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return Boolean(
    typeof window.PublicKeyCredential !== 'undefined' &&
    typeof window.navigator?.credentials?.create === 'function' &&
    typeof window.navigator?.credentials?.get === 'function'
  );
}

export async function registerBiometricCredential(email: string): Promise<{ success: boolean; error?: string }> {
  if (!isBiometricsSupported()) {
    return {
      success: false,
      error: 'Le materiel ou le navigateur actuel ne supporte pas l authentification biometrique WebAuthn.',
    };
  }

  try {
    const challenge = new Uint8Array(32);
    if (typeof window.crypto !== 'undefined' && window.crypto.getRandomValues) {
      window.crypto.getRandomValues(challenge);
    }

    const userId = new Uint8Array(16);
    if (typeof window.crypto !== 'undefined' && window.crypto.getRandomValues) {
      window.crypto.getRandomValues(userId);
    }

    const credential = (await navigator.credentials.create({
      publicKey: {
        challenge,
        rp: {
          name: 'NEXUS AI Super-Admin Vault',
        },
        user: {
          id: userId,
          name: email.trim().toLowerCase(),
          displayName: 'Super Administrateur',
        },
        pubKeyCredParams: [
          { type: 'public-key', alg: -7 }, // ES256
          { type: 'public-key', alg: -257 }, // RS256
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'required',
        },
        timeout: 60000,
      },
    })) as PublicKeyCredential | null;

    if (!credential) {
      return { success: false, error: 'Enregistrement de l empreinte annule par l utilisateur.' };
    }

    const config = getAdminConfig();
    saveAdminConfig({
      ...config,
      biometricCredentialId: credential.id,
      biometricEnabled: true,
      biometricRegisteredAt: new Date().toISOString(),
    });

    logAdminAudit('settings_update', true, 'Capteur d empreinte digitale / biometrie enregistre avec succes');
    return { success: true };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    // Gestion du fallback si l'utilisateur annule ou si le capteur est occupe
    return {
      success: false,
      error: `Echec de l enregistrement biometrique : ${errorMsg}`,
    };
  }
}

export async function verifyBiometricCredential(): Promise<{ success: boolean; error?: string }> {
  if (!isBiometricsSupported()) {
    return {
      success: false,
      error: 'Authentification biometrique non supportee sur cet appareil.',
    };
  }

  const config = getAdminConfig();
  if (!config.biometricEnabled || !config.biometricCredentialId) {
    return {
      success: false,
      error: 'Aucune empreinte digitale n a encore ete enregistree sur cet appareil.',
    };
  }

  try {
    const challenge = new Uint8Array(32);
    if (typeof window.crypto !== 'undefined' && window.crypto.getRandomValues) {
      window.crypto.getRandomValues(challenge);
    }

    const credential = await navigator.credentials.get({
      publicKey: {
        challenge,
        allowCredentials: [
          {
            id: Uint8Array.from(atob(config.biometricCredentialId.replace(/_/g, '/').replace(/-/g, '+')), (c) =>
              c.charCodeAt(0),
            ),
            type: 'public-key',
          },
        ],
        userVerification: 'required',
        timeout: 60000,
      },
    });

    if (!credential) {
      return { success: false, error: 'Reconnaissance de l empreinte annulee.' };
    }

    return { success: true };
  } catch {
    // En cas d'erreur de décodage d'ID ou de contrainte WebAuthn stricte, tentative avec authentification plateforme directe
    try {
      const fallbackChallenge = new Uint8Array(32);
      if (typeof window.crypto !== 'undefined' && window.crypto.getRandomValues) {
        window.crypto.getRandomValues(fallbackChallenge);
      }
      const cred = await navigator.credentials.get({
        publicKey: {
          challenge: fallbackChallenge,
          userVerification: 'required',
          timeout: 60000,
        },
      });
      if (cred) return { success: true };
      return { success: false, error: 'Reconnaissance biometrique echouee.' };
    } catch (fallbackErr) {
      return {
        success: false,
        error: fallbackErr instanceof Error ? fallbackErr.message : 'Erreur capteur biometrique.',
      };
    }
  }
}

// ─── Session Ephemere & Verrouillage de l'Espace Admin ────────────────────────

export function isVaultUnlocked(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const tsStr = sessionStorage.getItem(ADMIN_SESSION_KEY);
    if (!tsStr) return false;
    const ts = parseInt(tsStr, 10);
    if (isNaN(ts)) return false;

    const config = getAdminConfig();
    const maxAgeMs = config.autoLockMinutes * 60 * 1000;
    const isExpired = Date.now() - ts > maxAgeMs;

    if (isExpired) {
      sessionStorage.removeItem(ADMIN_SESSION_KEY);
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export function unlockVaultSession(): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(ADMIN_SESSION_KEY, Date.now().toString());
    window.dispatchEvent(new CustomEvent('nexus:admin-vault-unlocked'));
  } catch {
    // Ignorer
  }
}

export function lockVaultSession(): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
    window.dispatchEvent(new CustomEvent('nexus:admin-vault-locked'));
    logAdminAudit('settings_update', true, 'Verrouillage manuel du coffre-fort admin');
  } catch {
    // Ignorer
  }
}

export async function unlockWithFullVerification(
  email: string,
  pin: string,
  requireBiometric = false,
): Promise<{ success: boolean; error?: string }> {
  // Niveau 1 : Verification d'eligibilite par e-mail
  if (!isEmailAuthorizedAdmin(email)) {
    logAdminAudit('failed_attempt', false, `Refus d acces : e-mail non autorise (${email})`);
    return {
      success: false,
      error: 'Cette adresse e-mail ne possede pas les droits Super-Administrateur.',
    };
  }

  // Niveau 2 : Verification du Code PIN
  const isPinValid = await verifyMasterAdminPin(pin);
  if (!isPinValid) {
    logAdminAudit('failed_attempt', false, `Echec code PIN pour l e-mail ${email}`);
    return {
      success: false,
      error: 'Code PIN maitre incorrect.',
    };
  }

  // Niveau 3 : Verification biometrique si requise et activee
  const config = getAdminConfig();
  if (requireBiometric || config.biometricEnabled) {
    const bioRes = await verifyBiometricCredential();
    if (!bioRes.success) {
      logAdminAudit('failed_attempt', false, `Echec empreinte digitale pour ${email} : ${bioRes.error}`);
      return {
        success: false,
        error: bioRes.error || 'Authentification par empreinte digitale refusee.',
      };
    }
    logAdminAudit('unlock_biometric', true, `Deverrouillage triple facteur (Email + PIN + Empreinte) pour ${email}`);
  } else {
    logAdminAudit('unlock_pin', true, `Deverrouillage double facteur (Email + PIN) pour ${email}`);
  }

  unlockVaultSession();
  return { success: true };
}

// ─── Mode Maintenance & Utilisateurs ──────────────────────────────────────────

export function isMaintenanceModeActive(): boolean {
  return getAdminConfig().maintenanceMode;
}

export function toggleMaintenanceMode(enabled: boolean, notice?: string): void {
  const config = getAdminConfig();
  saveAdminConfig({
    ...config,
    maintenanceMode: enabled,
    maintenanceNotice: notice || config.maintenanceNotice,
  });
  logAdminAudit(
    'maintenance_toggle',
    true,
    enabled ? 'Activation du mode maintenance globale' : 'Desactivation du mode maintenance',
  );
}

export function triggerEmergencyKillswitch(): void {
  // Révocation immédiate de toutes les sessions
  lockVaultSession();
  if (typeof window !== 'undefined') {
    try {
      sessionStorage.clear();
      // Mettre en maintenance pour couper l'accès aux autres utilisateurs
      toggleMaintenanceMode(true, 'Application temporairement suspendue suite au declenchement du Killswitch.');
    } catch {
      // Ignorer
    }
  }
  logAdminAudit('killswitch_triggered', true, 'Declenchement d urgence du Killswitch administrateur');
}

export function getManagedUsers(): ManagedUser[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(ADMIN_USERS_KEY);
    if (!raw) {
      const defaultUsers: ManagedUser[] = [
        {
          id: 'user-admin-root',
          email: getAdminConfig().primaryAdminEmail,
          fullName: 'Super Administrateur (Vous)',
          role: 'super_admin',
          status: 'active',
          lastSeen: new Date().toISOString(),
          createdAt: '2026-01-01T00:00:00.000Z',
        },
        {
          id: 'user-demo-guest',
          email: 'invite@nexus-ai.local',
          fullName: 'Session Invite / Visiteur',
          role: 'user',
          status: 'active',
          lastSeen: new Date().toISOString(),
          createdAt: '2026-02-15T12:00:00.000Z',
        },
      ];
      localStorage.setItem(ADMIN_USERS_KEY, JSON.stringify(defaultUsers));
      return defaultUsers;
    }
    return JSON.parse(raw) || [];
  } catch {
    return [];
  }
}

export function updateManagedUserRole(userId: string, newRole: ManagedUser['role']): void {
  const users = getManagedUsers();
  const updated = users.map((u) => (u.id === userId ? { ...u, role: newRole } : u));
  if (typeof window !== 'undefined') {
    localStorage.setItem(ADMIN_USERS_KEY, JSON.stringify(updated));
  }
  logAdminAudit('user_update', true, `Modification de role pour l utilisateur ${userId} -> ${newRole}`);
}

export function toggleManagedUserStatus(userId: string): void {
  const users = getManagedUsers();
  const updated = users.map((u) => {
    if (u.id !== userId) return u;
    const newStatus = u.status === 'active' ? 'suspended' : 'active';
    return { ...u, status: newStatus as ManagedUser['status'] };
  });
  if (typeof window !== 'undefined') {
    localStorage.setItem(ADMIN_USERS_KEY, JSON.stringify(updated));
  }
  logAdminAudit('user_update', true, `Basculement de statut pour l utilisateur ${userId}`);
}
