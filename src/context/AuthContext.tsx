/**
 * src/context/AuthContext.tsx
 *
 * Fournisseur d'état d'authentification pour NEXUS AI.
 * Gère la persistance de session JWT, le rafraîchissement automatique des jetons,
 * la détection des flux de récupération de mot de passe et l'écoute des événements Supabase Auth.
 */

import { useState, useEffect, useCallback, type ReactNode } from 'react';
import { AuthContext } from './authContextDef';
import { getSupabase } from '@/services/auth/supabaseClient';
import {
  signUpUser,
  signInUser,
  signOutUser,
  resetPasswordForEmail,
  updateUserPassword,
  resendConfirmationEmail,
  updateUserProfile,
  deleteUserAccount,
  enrollMFA,
  verifyMFAEnrollment,
  unenrollMFA,
  getMFAFactors,
  verify2FALogin,
} from '@/services/auth/authService';
import { IS_CLOUD_CONFIGURED } from '@/lib/constants';
import type { UserProfile, MFAEnrollmentResult } from '@/types/auth';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(() => IS_CLOUD_CONFIGURED);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.location.hash.includes('type=recovery') || window.location.hash.includes('reset-password');
  });
  const [error, setError] = useState<string | null>(null);
  const [pending2FAFactorId, setPending2FAFactorId] = useState<string | null>(null);

  // Initialisation et abonnement aux changements de session si configuré
  useEffect(() => {
    const client = getSupabase();
    if (!client || !IS_CLOUD_CONFIGURED) {
      return;
    }

    // Récupération de la session initiale en validant le niveau d'assurance (AAL)
    client.auth.getSession().then(async ({ data: { session }, error: sessionError }) => {
      if (sessionError) {
        console.warn('[NEXUS AUTH] Erreur de récupération session:', sessionError);
      }
      if (session?.user) {
        try {
          const { data: aalData } = await client.auth.mfa.getAuthenticatorAssuranceLevel();
          if (aalData && aalData.currentLevel === 'aal1' && aalData.nextLevel === 'aal2') {
            // L'utilisateur doit d'abord compléter son challenge 2FA
            const { data: factorsData } = await client.auth.mfa.listFactors();
            const verifiedFactor = factorsData?.totp?.find((f) => f.status === 'verified');
            setPending2FAFactorId(verifiedFactor?.id || null);
            setUser(null);
            setIsLoading(false);
            return;
          }
        } catch (aalErr) {
          console.warn('[NEXUS AUTH] Vérification AAL initiale:', aalErr);
        }

        setUser({
          id: session.user.id,
          email: session.user.email ?? '',
          fullName: session.user.user_metadata?.full_name ?? session.user.email?.split('@')[0] ?? 'Utilisateur',
          avatarUrl: session.user.user_metadata?.avatar_url,
          createdAt: session.user.created_at ?? new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
      setIsLoading(false);
    });

    // Écouteur temps réel des changements d'état d'authentification
    const {
      data: { subscription },
    } = client.auth.onAuthStateChange(async (event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsPasswordRecovery(true);
      }

      if (session?.user) {
        try {
          const { data: aalData } = await client.auth.mfa.getAuthenticatorAssuranceLevel();
          if (aalData && aalData.currentLevel === 'aal1' && aalData.nextLevel === 'aal2') {
            const { data: factorsData } = await client.auth.mfa.listFactors();
            const verifiedFactor = factorsData?.totp?.find((f) => f.status === 'verified');
            setPending2FAFactorId(verifiedFactor?.id || null);
            setUser(null);
            setIsLoading(false);
            return;
          }
        } catch (aalErr) {
          console.warn('[NEXUS AUTH] Vérification AAL listener:', aalErr);
        }

        setUser({
          id: session.user.id,
          email: session.user.email ?? '',
          fullName: session.user.user_metadata?.full_name ?? session.user.email?.split('@')[0] ?? 'Utilisateur',
          avatarUrl: session.user.user_metadata?.avatar_url,
          createdAt: session.user.created_at ?? new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const clearError = useCallback(() => setError(null), []);
  const clearPasswordRecovery = useCallback(() => {
    setIsPasswordRecovery(false);
    // Nettoyer le hash d'URL si présent
    if (window.location.hash.includes('recovery') || window.location.hash.includes('reset-password')) {
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, []);

  const signIn = useCallback(async (email: string, pass: string) => {
    setError(null);
    setIsLoading(true);
    try {
      const res = await signInUser(email, pass);
      if (res.error) {
        setError(res.error);
        return { error: res.error };
      }
      if (res.requires2FA) {
        setPending2FAFactorId(res.factorId || null);
        return { requires2FA: true, factorId: res.factorId };
      }
      if (res.user) {
        setUser(res.user);
        setPending2FAFactorId(null);
      }
      return {};
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signUp = useCallback(async (email: string, pass: string, name?: string) => {
    setError(null);
    setIsLoading(true);
    try {
      const res = await signUpUser(email, pass, name);
      if (res.error) {
        setError(res.error);
        return { error: res.error };
      }
      if (res.user && !res.confirmationRequired) {
        setUser(res.user);
      }
      return { confirmationRequired: res.confirmationRequired };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    setError(null);
    setIsLoading(true);
    setPending2FAFactorId(null);
    try {
      await signOutUser();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    setError(null);
    return resetPasswordForEmail(email);
  }, []);

  const updatePassword = useCallback(async (newPassword: string) => {
    setError(null);
    setIsLoading(true);
    try {
      const res = await updateUserPassword(newPassword);
      if (res.error) {
        setError(res.error);
        return { error: res.error };
      }
      setIsPasswordRecovery(false);
      if (window.location.hash.includes('recovery') || window.location.hash.includes('reset-password')) {
        window.history.replaceState(null, '', window.location.pathname);
      }
      return { success: true };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const resendConfirmation = useCallback(async (email: string) => {
    setError(null);
    return resendConfirmationEmail(email);
  }, []);

  const updateProfile = useCallback(
    async (updates: Partial<Pick<UserProfile, 'fullName' | 'avatarUrl'>>) => {
      if (!user) return { error: 'Non connecté' };
      setError(null);
      const res = await updateUserProfile(user.id, updates);
      if (!res.error) {
        setUser((prev) => (prev ? { ...prev, ...updates, updatedAt: new Date().toISOString() } : null));
      }
      return res;
    },
    [user],
  );

  const deleteAccount = useCallback(async () => {
    if (!user) return { error: 'Non connecté' };
    setError(null);
    const res = await deleteUserAccount(user.id);
    if (!res.error) {
      setUser(null);
    }
    return res;
  }, [user]);

  // ============================================================================
  // DOUBLE AUTHENTIFICATION (2FA / TOTP)
  // ============================================================================

  const enroll2FA = useCallback(async (): Promise<MFAEnrollmentResult> => {
    setError(null);
    return enrollMFA();
  }, []);

  const verify2FAEnrollment = useCallback(
    async (factorId: string, code: string) => {
      setError(null);
      return verifyMFAEnrollment(factorId, code);
    },
    [],
  );

  const unenroll2FA = useCallback(async (factorId: string) => {
    setError(null);
    return unenrollMFA(factorId);
  }, []);

  const get2FAStatus = useCallback(async () => {
    return getMFAFactors();
  }, []);

  const verify2FALoginHandler = useCallback(
    async (code: string, factorId?: string) => {
      const targetFactorId = factorId || pending2FAFactorId;
      if (!targetFactorId) {
        const err = 'Identifiant de facteur 2FA manquant.';
        setError(err);
        return { error: err };
      }

      setError(null);
      setIsLoading(true);
      try {
        const res = await verify2FALogin(targetFactorId, code);
        if (res.error) {
          setError(res.error);
          return { error: res.error };
        }
        if (res.user) {
          setUser(res.user);
          setPending2FAFactorId(null);
        }
        return { success: true };
      } finally {
        setIsLoading(false);
      }
    },
    [pending2FAFactorId],
  );

  const cancel2FA = useCallback(async () => {
    setPending2FAFactorId(null);
    setError(null);
    // Déconnexion de la session partielle AAL1 pour repartir sur un état propre
    try {
      await signOutUser();
    } catch {
      // Ignorer
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user),
        isLoading,
        isConfigured: IS_CLOUD_CONFIGURED,
        isPasswordRecovery,
        error,
        pending2FAFactorId,
        clearError,
        clearPasswordRecovery,
        signIn,
        signUp,
        signOut,
        resetPassword,
        updatePassword,
        resendConfirmation,
        updateProfile,
        deleteAccount,
        enroll2FA,
        verify2FAEnrollment,
        unenroll2FA,
        get2FAStatus,
        verify2FALogin: verify2FALoginHandler,
        cancel2FA,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
