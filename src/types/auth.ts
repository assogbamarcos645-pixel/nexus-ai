/**
 * src/types/auth.ts
 *
 * Types pour l'authentification et les profils utilisateur dans NEXUS AI.
 */

export interface UserProfile {
  id: string; // Correspond à auth.users(id)
  email: string;
  fullName: string;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserMemory {
  id: string;
  userId: string;
  key: string;
  content: string;
  category: 'preference' | 'context' | 'fact' | 'project';
  agentId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserPreferences {
  userId: string;
  theme: 'dark' | 'light' | 'cosmic';
  defaultAgentId: string;
  autoSaveLab: boolean;
  cloudSyncEnabled: boolean;
  updatedAt: string;
}

export type AuthModalMode =
  | 'sign-in'
  | 'sign-up'
  | 'forgot-password'
  | 'update-password'
  | 'profile'
  | 'verify-2fa'
  | 'email-confirmation-pending';

export interface MFAEnrollmentResult {
  factorId?: string;
  qrCode?: string;
  secret?: string;
  uri?: string;
  error?: string;
}

export interface MFAFactorInfo {
  id: string;
  friendlyName?: string;
  status: 'verified' | 'unverified';
  createdAt: string;
}

export interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isConfigured: boolean;
  isPasswordRecovery: boolean;
  error: string | null;
  pending2FAFactorId: string | null;
  clearError: () => void;
  clearPasswordRecovery: () => void;
  signIn: (email: string, password: string) => Promise<{ error?: string; requires2FA?: boolean; factorId?: string }>;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error?: string; confirmationRequired?: boolean }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error?: string; message?: string }>;
  updatePassword: (newPassword: string) => Promise<{ error?: string; success?: boolean }>;
  resendConfirmation: (email: string) => Promise<{ error?: string; message?: string }>;
  updateProfile: (updates: Partial<Pick<UserProfile, 'fullName' | 'avatarUrl'>>) => Promise<{ error?: string }>;
  deleteAccount: () => Promise<{ error?: string }>;

  // Double authentification (2FA / TOTP)
  enroll2FA: () => Promise<MFAEnrollmentResult>;
  verify2FAEnrollment: (factorId: string, code: string) => Promise<{ error?: string; success?: boolean }>;
  unenroll2FA: (factorId: string) => Promise<{ error?: string; success?: boolean }>;
  get2FAStatus: () => Promise<{ hasMFA: boolean; factorId?: string; error?: string }>;
  verify2FALogin: (code: string, factorId?: string) => Promise<{ error?: string; success?: boolean }>;
  cancel2FA: () => void;
}
