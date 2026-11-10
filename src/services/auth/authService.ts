/**
 * src/services/auth/authService.ts
 *
 * Couche de service d'authentification pour NEXUS AI.
 * Utilise les API Supabase Auth officielles (sessions JWT, hachage côté serveur Argon2/bcrypt,
 * protection brute-force, vérification e-mail, réinitialisation de mot de passe et droit à l'oubli).
 */

import { getSupabase } from './supabaseClient.ts';
import type { UserProfile, MFAEnrollmentResult, MFAFactorInfo } from '@/types/auth';

export function translateAuthError(errorMsg: string): string {
  const lower = errorMsg.toLowerCase();
  if (
    lower.includes('invalid totp code') ||
    lower.includes('invalid code') ||
    lower.includes('mfa verification failed') ||
    lower.includes('totp_code_invalid')
  ) {
    return 'Code de vérification à 6 chiffres incorrect ou expiré.';
  }
  if (lower.includes('factor already exists') || lower.includes('factor_already_exists')) {
    return 'Un facteur d’authentification 2FA est déjà associé à ce compte.';
  }
  if (lower.includes('invalid login credentials') || lower.includes('invalid credentials')) {
    return 'Identifiants invalides. Vérifiez votre adresse e-mail et votre mot de passe.';
  }
  if (lower.includes('user already registered') || lower.includes('already exists')) {
    return 'Un compte existe déjà avec cette adresse e-mail.';
  }
  if (lower.includes('password should be at least')) {
    return 'Le mot de passe doit comporter au moins 6 caractères.';
  }
  if (lower.includes('email not confirmed')) {
    return 'Veuillez confirmer votre adresse e-mail via le lien reçu avant de vous connecter.';
  }
  if (lower.includes('rate limit') || lower.includes('over_email_send_rate_limit')) {
    return "Quota d'e-mails Supabase temporairement atteint (3 e-mails/heure max). Pour une inscription instantanée sans quota, désactivez « Confirm email » dans Authentication > Providers > Email sur votre console Supabase.";
  }
  if (lower.includes('network') || lower.includes('fetch') || lower.includes('failed to fetch')) {
    return 'Impossible de contacter le serveur d’authentification. Vérifiez votre connexion Internet.';
  }
  if (lower.includes('same_password')) {
    return 'Le nouveau mot de passe doit être différent de l’ancien.';
  }
  return errorMsg;
}

export async function signUpUser(
  email: string,
  password: string,
  fullName?: string,
): Promise<{ user?: UserProfile; confirmationRequired?: boolean; error?: string }> {
  const client = getSupabase();
  if (!client) {
    return { error: 'Service cloud non configuré. Renseignez VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY dans .env.' };
  }

  const cleanEmail = email.trim().toLowerCase();
  const cleanName = fullName?.trim() || cleanEmail.split('@')[0];

  const { data, error } = await client.auth.signUp({
    email: cleanEmail,
    password,
    options: {
      data: {
        full_name: cleanName,
      },
      emailRedirectTo: `${window.location.origin}/`,
    },
  });

  if (error) {
    return { error: translateAuthError(error.message) };
  }

  if (data.user) {
    // Si la session est nulle, Supabase exige la confirmation par e-mail
    const confirmationRequired = !data.session;
    const profile: UserProfile = {
      id: data.user.id,
      email: data.user.email ?? cleanEmail,
      fullName: data.user.user_metadata?.full_name ?? cleanName,
      avatarUrl: data.user.user_metadata?.avatar_url,
      createdAt: data.user.created_at ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return { user: profile, confirmationRequired };
  }

  return { error: 'Une erreur inattendue est survenue lors de l’inscription.' };
}

export async function signInUser(
  email: string,
  password: string,
): Promise<{ user?: UserProfile; requires2FA?: boolean; factorId?: string; error?: string }> {
  const client = getSupabase();
  if (!client) {
    return { error: 'Service cloud non configuré. Renseignez VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY dans .env.' };
  }

  const cleanEmail = email.trim().toLowerCase();

  const { data, error } = await client.auth.signInWithPassword({
    email: cleanEmail,
    password,
  });

  if (error) {
    return { error: translateAuthError(error.message) };
  }

  if (data.user) {
    // Vérifier si le compte requiert une double authentification (AAL2)
    try {
      const { data: aalData } = await client.auth.mfa.getAuthenticatorAssuranceLevel();
      if (aalData && aalData.currentLevel === 'aal1' && aalData.nextLevel === 'aal2') {
        const { data: factorsData } = await client.auth.mfa.listFactors();
        const verifiedFactor =
          factorsData?.totp?.[0] || factorsData?.all?.find((f) => f.factor_type === 'totp' && f.status === 'verified');
        return {
          requires2FA: true,
          factorId: verifiedFactor?.id,
        };
      }
    } catch (aalErr) {
      console.warn('[NEXUS AUTH] Vérification AAL 2FA:', aalErr);
    }

    const profile: UserProfile = {
      id: data.user.id,
      email: data.user.email ?? cleanEmail,
      fullName: data.user.user_metadata?.full_name ?? cleanEmail.split('@')[0],
      avatarUrl: data.user.user_metadata?.avatar_url,
      createdAt: data.user.created_at ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return { user: profile };
  }

  return { error: 'Impossible de récupérer la session utilisateur.' };
}

export async function signOutUser(): Promise<{ error?: string }> {
  const client = getSupabase();
  if (!client) return {};

  const { error } = await client.auth.signOut();
  if (error) {
    return { error: translateAuthError(error.message) };
  }
  return {};
}

export async function resetPasswordForEmail(
  email: string,
): Promise<{ error?: string; message?: string }> {
  const client = getSupabase();
  if (!client) {
    return { error: 'Service cloud non configuré. Renseignez VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY dans .env.' };
  }

  const cleanEmail = email.trim().toLowerCase();

  const { error } = await client.auth.resetPasswordForEmail(cleanEmail, {
    redirectTo: `${window.location.origin}/#reset-password`,
  });

  if (error) {
    return { error: translateAuthError(error.message) };
  }

  return { message: 'Un e-mail contenant un lien sécurisé de réinitialisation vous a été envoyé si l’adresse existe.' };
}

/**
 * Met à jour le mot de passe pour la session actuellement authentifiée (ex: après clic sur le lien de récupération).
 */
export async function updateUserPassword(
  newPassword: string,
): Promise<{ error?: string; success?: boolean }> {
  const client = getSupabase();
  if (!client) {
    return { error: 'Service cloud non configuré.' };
  }

  if (!newPassword || newPassword.length < 6) {
    return { error: 'Le mot de passe doit comporter au moins 6 caractères.' };
  }

  const { error } = await client.auth.updateUser({
    password: newPassword,
  });

  if (error) {
    return { error: translateAuthError(error.message) };
  }

  return { success: true };
}

/**
 * Renvoie un e-mail de confirmation d'inscription si l'utilisateur ne l'a pas reçu.
 */
export async function resendConfirmationEmail(
  email: string,
): Promise<{ error?: string; message?: string }> {
  const client = getSupabase();
  if (!client) {
    return { error: 'Service cloud non configuré.' };
  }

  const cleanEmail = email.trim().toLowerCase();
  const { error } = await client.auth.resend({
    type: 'signup',
    email: cleanEmail,
    options: {
      emailRedirectTo: `${window.location.origin}/`,
    },
  });

  if (error) {
    return { error: translateAuthError(error.message) };
  }

  return { message: 'Un nouvel e-mail de confirmation vous a été adressé.' };
}

export async function updateUserProfile(
  userId: string,
  updates: Partial<Pick<UserProfile, 'fullName' | 'avatarUrl'>>,
): Promise<{ error?: string }> {
  const client = getSupabase();
  if (!client) return { error: 'Service cloud non configuré.' };

  // 1. Mise à jour de la table publique profiles
  const { error: profileError } = await client
    .from('profiles')
    .update({
      full_name: updates.fullName,
      avatar_url: updates.avatarUrl,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (profileError) {
    console.warn('[NEXUS AUTH] Erreur mise à jour table profiles:', profileError);
  }

  // 2. Mise à jour des métadonnées du compte auth
  const { error: authError } = await client.auth.updateUser({
    data: {
      full_name: updates.fullName,
      avatar_url: updates.avatarUrl,
    },
  });

  if (authError) {
    return { error: translateAuthError(authError.message) };
  }

  return {};
}

/**
 * Supprime le compte utilisateur et toutes ses données associées (RGPD / Droit à l'oubli).
 */
export async function deleteUserAccount(userId: string): Promise<{ error?: string }> {
  const client = getSupabase();
  if (!client) return { error: 'Service cloud non configuré.' };

  try {
    // Tentative d'exécution de la fonction RPC delete_user_account (supprime auth.users + tables RLS)
    const { error: rpcError } = await client.rpc('delete_user_account');

    if (rpcError) {
      console.warn('[NEXUS AUTH] RPC delete_user_account non disponible, suppression manuelle des données:', rpcError);

      // Repli : suppression des données de chaque table protégée par RLS
      await client.from('messages').delete().eq('user_id', userId);
      await client.from('conversations').delete().eq('user_id', userId);
      await client.from('project_files').delete().eq('user_id', userId);
      await client.from('projects').delete().eq('user_id', userId);
      await client.from('memories').delete().eq('user_id', userId);
      await client.from('user_preferences').delete().eq('user_id', userId);
      await client.from('profiles').delete().eq('id', userId);
    }

    // Déconnexion de la session locale
    await client.auth.signOut();
    return {};
  } catch (err: any) {
    console.error('[NEXUS AUTH] Erreur lors de la suppression de compte:', err);
    return { error: err?.message || 'Erreur lors de la suppression du compte.' };
  }
}

/**
 * ============================================================================
 * DOUBLE AUTHENTIFICATION (2FA / TOTP)
 * ============================================================================
 */

/**
 * Enrôle un nouveau facteur TOTP (Google Authenticator, Microsoft Authenticator, 1Password, etc.).
 * Nettoie au préalable tout facteur non encore vérifié pour éviter les doublons orphelins.
 */
export async function enrollMFA(): Promise<MFAEnrollmentResult> {
  const client = getSupabase();
  if (!client) return { error: 'Service cloud non configuré.' };

  try {
    const { data: existingFactors } = await client.auth.mfa.listFactors();
    const unverified = existingFactors?.all?.filter((f) => f.factor_type === 'totp' && f.status === 'unverified') || [];
    for (const factor of unverified) {
      await client.auth.mfa.unenroll({ factorId: factor.id });
    }
  } catch (e) {
    console.warn('[NEXUS AUTH] Erreur nettoyage facteurs non vérifiés:', e);
  }

  const { data, error } = await client.auth.mfa.enroll({
    factorType: 'totp',
    friendlyName: 'NEXUS AI Authenticator',
    issuer: 'NEXUS AI',
  });

  if (error) {
    return { error: translateAuthError(error.message) };
  }

  return {
    factorId: data.id,
    qrCode: data.totp?.qr_code,
    secret: data.totp?.secret,
    uri: data.totp?.uri,
  };
}

/**
 * Valide l'enrôlement initial de la 2FA en vérifiant le premier code à 6 chiffres.
 */
export async function verifyMFAEnrollment(
  factorId: string,
  code: string,
): Promise<{ error?: string; success?: boolean }> {
  const client = getSupabase();
  if (!client) return { error: 'Service cloud non configuré.' };

  const { error } = await client.auth.mfa.challengeAndVerify({
    factorId,
    code: code.trim(),
  });

  if (error) {
    return { error: translateAuthError(error.message) };
  }

  return { success: true };
}

/**
 * Désactive / supprime un facteur 2FA.
 */
export async function unenrollMFA(factorId: string): Promise<{ error?: string; success?: boolean }> {
  const client = getSupabase();
  if (!client) return { error: 'Service cloud non configuré.' };

  const { error } = await client.auth.mfa.unenroll({
    factorId,
  });

  if (error) {
    return { error: translateAuthError(error.message) };
  }

  return { success: true };
}

/**
 * Récupère le statut 2FA du compte connecté.
 */
export async function getMFAFactors(): Promise<{
  hasMFA: boolean;
  factorId?: string;
  factors?: MFAFactorInfo[];
  error?: string;
}> {
  const client = getSupabase();
  if (!client) return { hasMFA: false, error: 'Service cloud non configuré.' };

  const { data, error } = await client.auth.mfa.listFactors();
  if (error) {
    return { hasMFA: false, error: translateAuthError(error.message) };
  }

  const verifiedTotp =
    data.totp?.[0] || data.all?.find((f) => f.factor_type === 'totp' && f.status === 'verified');
  const formattedFactors: MFAFactorInfo[] = (data.all || [])
    .filter((f) => f.factor_type === 'totp')
    .map((f) => ({
      id: f.id,
      friendlyName: f.friendly_name,
      status: f.status as 'verified' | 'unverified',
      createdAt: f.created_at,
    }));

  return {
    hasMFA: Boolean(verifiedTotp),
    factorId: verifiedTotp?.id,
    factors: formattedFactors,
  };
}

/**
 * Valide le challenge 2FA lors de la connexion pour élever le jeton de AAL1 à AAL2.
 */
export async function verify2FALogin(
  factorId: string,
  code: string,
): Promise<{ user?: UserProfile; error?: string }> {
  const client = getSupabase();
  if (!client) return { error: 'Service cloud non configuré.' };

  const { data, error } = await client.auth.mfa.challengeAndVerify({
    factorId,
    code: code.trim(),
  });

  if (error) {
    return { error: translateAuthError(error.message) };
  }

  if (data?.user) {
    const cleanEmail = data.user.email ?? '';
    const profile: UserProfile = {
      id: data.user.id,
      email: cleanEmail,
      fullName: data.user.user_metadata?.full_name ?? cleanEmail.split('@')[0] ?? 'Utilisateur',
      avatarUrl: data.user.user_metadata?.avatar_url,
      createdAt: data.user.created_at ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return { user: profile };
  }

  return { error: 'Échec de la validation du code 2FA.' };
}
