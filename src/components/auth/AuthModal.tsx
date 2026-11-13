/**
 * src/components/auth/AuthModal.tsx
 *
 * Fenêtre modale d'authentification pour NEXUS AI.
 * Gère la connexion, l'inscription, la confirmation d'adresse e-mail,
 * la réinitialisation et la saisie d'un nouveau mot de passe après récupération.
 * Si le service cloud n'est pas configuré, affiche un avertissement clair
 * expliquant le mode local sans simuler une fausse authentification.
 */

import { useState, useEffect } from 'react';
import {
  Lock,
  Mail,
  User,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  KeyRound,
  RotateCw,
  ArrowLeft,
  Smartphone,
  ExternalLink,
} from 'lucide-react';
import { ModalCloseButton } from '@/components/ui/ModalCloseButton';
import { useAuth } from '@/hooks/useAuth';
import { Spinner } from '@/components/ui/Spinner';
import type { AuthModalMode } from '@/types/auth';

interface AuthModalProps {
  isOpen: boolean;
  initialMode?: AuthModalMode;
  onClose: () => void;
}

function getWebmailInfo(email: string): { url: string; name: string } | null {
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) return null;
  if (domain.includes('gmail.com')) return { url: 'https://mail.google.com', name: 'Gmail' };
  if (domain.includes('outlook') || domain.includes('hotmail') || domain.includes('live')) {
    return { url: 'https://outlook.live.com', name: 'Outlook' };
  }
  if (domain.includes('yahoo')) return { url: 'https://mail.yahoo.com', name: 'Yahoo Mail' };
  if (domain.includes('proton')) return { url: 'https://mail.proton.me', name: 'Proton Mail' };
  if (domain.includes('icloud')) return { url: 'https://www.icloud.com/mail', name: 'iCloud Mail' };
  return null;
}

export function AuthModal({ isOpen, initialMode = 'sign-in', onClose }: AuthModalProps) {
  const {
    isConfigured,
    isPasswordRecovery,
    clearPasswordRecovery,
    signIn,
    signUp,
    resetPassword,
    updatePassword,
    resendConfirmation,
    verify2FALogin,
    cancel2FA,
    error,
    clearError,
    isLoading,
  } = useAuth();

  const [userSelectedMode, setUserSelectedMode] = useState<AuthModalMode>(initialMode);
  const mode: AuthModalMode = isPasswordRecovery ? 'update-password' : userSelectedMode;
  const setMode = setUserSelectedMode;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Décompte automatique pour le renvoi d'e-mail de confirmation
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((c) => Math.max(0, c - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  if (!isOpen) return null;

  const handleClose = () => {
    if (isPasswordRecovery) {
      clearPasswordRecovery();
    }
    if (mode === 'verify-2fa') {
      cancel2FA();
      setTotpCode('');
    }
    clearError();
    setLocalError(null);
    setSuccessNotice(null);
    onClose();
  };

  const handleCancel2FA = () => {
    cancel2FA();
    setTotpCode('');
    clearError();
    setLocalError(null);
    setMode('sign-in');
  };

  const handleResendConfirmation = async () => {
    if (!email.trim() || isResending || resendCooldown > 0) return;
    setIsResending(true);
    setLocalError(null);
    const res = await resendConfirmation(email.trim());
    setIsResending(false);
    if (res.error) {
      setLocalError(res.error);
    } else if (res.message) {
      setSuccessNotice(res.message);
      setResendCooldown(60);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setLocalError(null);
    setSuccessNotice(null);

    if (!isConfigured) return;

    if (mode === 'verify-2fa') {
      const cleanCode = totpCode.trim().replace(/\s/g, '');
      if (cleanCode.length < 6) {
        setLocalError('Veuillez entrer le code à 6 chiffres de votre application.');
        return;
      }
      const res = await verify2FALogin(cleanCode);
      if (!res.error) {
        setTotpCode('');
        handleClose();
      }
      return;
    }

    if (mode === 'sign-in') {
      const res = await signIn(email.trim(), password);
      if (res.requires2FA) {
        setMode('verify-2fa');
        return;
      }
      if (!res.error) {
        handleClose();
      }
    } else if (mode === 'sign-up') {
      if (password.length < 6) {
        setLocalError('Le mot de passe doit comporter au moins 6 caractères.');
        return;
      }
      const res = await signUp(email.trim(), password, fullName.trim());
      if (res.error) {
        setLocalError(res.error);
      } else {
        // Affiche l'écran de confirmation e-mail avec minuterie anti-spam
        setMode('email-confirmation-pending');
        setResendCooldown(60);
      }
    } else if (mode === 'forgot-password') {
      const res = await resetPassword(email.trim());
      if (res.message) {
        setSuccessNotice(res.message);
      }
    } else if (mode === 'update-password') {
      if (password.length < 6) {
        setLocalError('Le mot de passe doit comporter au moins 6 caractères.');
        return;
      }
      if (password !== confirmPassword) {
        setLocalError('Les deux mots de passe ne correspondent pas.');
        return;
      }
      const res = await updatePassword(password);
      if (!res.error) {
        setSuccessNotice('Votre mot de passe a été mis à jour avec succès ! Vous pouvez maintenant utiliser votre compte.');
        setTimeout(() => {
          handleClose();
        }, 1800);
      }
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 cursor-pointer"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
      onClick={handleClose}
    >
      <div
        className="relative w-full max-w-md max-h-[92dvh] sm:max-h-[90dvh] flex flex-col rounded-t-3xl sm:rounded-2xl bg-surface-950 border-t sm:border border-nexus-500/30 shadow-[0_0_50px_rgba(124,13,244,0.35)] overflow-hidden pb-safe cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Poignée tactile mobile style iOS (tap pour fermer) */}
        <button
          type="button"
          onClick={handleClose}
          className="sm:hidden w-full flex justify-center pt-2.5 pb-1 bg-transparent cursor-pointer shrink-0"
          aria-label="Fermer"
        >
          <div className="w-12 h-1 bg-white/20 rounded-full" />
        </button>

        {/* En-tête */}
        <div className="px-6 py-5 border-b border-white/8 bg-surface-900/90 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="p-2 rounded-xl bg-gradient-to-br from-nexus-500 to-cyan-500 text-white shadow-[0_0_15px_rgba(124,13,244,0.5)] shrink-0">
              {mode === 'verify-2fa' ? <ShieldCheck size={16} /> : <Sparkles size={16} />}
            </div>
            <div className="min-w-0">
              <h3 id="auth-modal-title" className="text-sm font-semibold text-white truncate">
                {mode === 'sign-in' && 'Connexion à NEXUS AI'}
                {mode === 'sign-up' && 'Créer un compte NEXUS AI'}
                {mode === 'forgot-password' && 'Réinitialiser le mot de passe'}
                {mode === 'update-password' && 'Nouveau mot de passe'}
                {mode === 'verify-2fa' && 'Double Authentification (2FA)'}
                {mode === 'email-confirmation-pending' && 'Vérification de votre adresse e-mail'}
              </h3>
              <p className="text-xs text-white/50 mt-0.5 truncate">
                {mode === 'email-confirmation-pending'
                  ? 'Lien de confirmation envoyé dans votre boîte de réception'
                  : mode === 'verify-2fa'
                  ? 'Protection renforcée par code à usage unique'
                  : 'Authentification sécurisée & Synchronisation cloud'}
              </p>
            </div>
          </div>

          <ModalCloseButton
            onClick={handleClose}
            label="Fermer"
            title="Fermer (Échap)"
          />
        </div>

        {/* Corps */}
        <div className="p-6 space-y-5 overflow-y-auto scrollbar-thin flex-1">
          {/* Avertissement Mode Local si le cloud n'est pas configuré */}
          {!isConfigured && (
            <div className="p-4 rounded-xl bg-nexus-950/80 border border-nexus-500/30 text-xs text-nexus-200 leading-relaxed space-y-2">
              <div className="flex items-center gap-2 font-semibold text-white">
                <AlertCircle size={15} className="text-cyan-400 shrink-0" />
                <span>Mode local actif — Service Cloud non configuré</span>
              </div>
              <p className="text-white/70">
                L'application fonctionne actuellement à 100% en local dans votre navigateur. Aucune donnée n'est envoyée vers un serveur externe.
              </p>
              <div className="p-2.5 rounded-lg bg-black/40 border border-white/6 font-mono text-[10px] text-white/60 space-y-1">
                <p className="text-cyan-300 font-semibold">Pour activer l'authentification réelle :</p>
                <p>1. Créez un projet sur <span className="text-white">supabase.com</span></p>
                <p>2. Renseignez <span className="text-white">VITE_SUPABASE_URL</span> dans .env</p>
                <p>3. Renseignez <span className="text-white">VITE_SUPABASE_ANON_KEY</span> dans .env</p>
                <p>4. Exécutez le script SQL <span className="text-white">supabase/migrations/...</span></p>
              </div>
            </div>
          )}

          {/* Onglets de bascule (uniquement si non en mode récupération, 2FA ou attente de confirmation) */}
          {mode !== 'update-password' && mode !== 'verify-2fa' && mode !== 'email-confirmation-pending' && (
            <div className="flex bg-surface-900 p-1 rounded-xl border border-white/8 text-xs">
              <button
                type="button"
                onClick={() => {
                  setMode('sign-in');
                  clearError();
                  setLocalError(null);
                  setSuccessNotice(null);
                }}
                className={`flex-1 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                  mode === 'sign-in' ? 'bg-nexus-600 text-white shadow-sm' : 'text-white/60 hover:text-white'
                }`}
              >
                Connexion
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('sign-up');
                  clearError();
                  setLocalError(null);
                  setSuccessNotice(null);
                }}
                className={`flex-1 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                  mode === 'sign-up' ? 'bg-nexus-600 text-white shadow-sm' : 'text-white/60 hover:text-white'
                }`}
              >
                Inscription
              </button>
            </div>
          )}

          {/* Messages de retour */}
          {(error || localError) && (
            <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs flex items-start gap-2">
              <AlertCircle size={14} className="shrink-0 mt-0.5" />
              <span>{error || localError}</span>
            </div>
          )}

          {successNotice && mode !== 'email-confirmation-pending' && (
            <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-start gap-2">
              <CheckCircle2 size={14} className="shrink-0 mt-0.5" />
              <div className="space-y-2 flex-1">
                <span>{successNotice}</span>
              </div>
            </div>
          )}

          {/* Écran dédié : En attente de confirmation e-mail */}
          {mode === 'email-confirmation-pending' && (
            <div className="py-2 text-center space-y-4 animate-in fade-in zoom-in-95 duration-200">
              <div className="relative inline-flex items-center justify-center">
                <div className="absolute inset-0 rounded-2xl bg-cyan-500/20 blur-xl animate-pulse" />
                <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-tr from-nexus-600/30 via-cyan-500/20 to-purple-500/30 border border-cyan-400/40 flex items-center justify-center text-cyan-300 shadow-[0_0_25px_rgba(6,182,212,0.35)]">
                  <Mail size={28} className="animate-pulse" />
                </div>
              </div>

              <div className="space-y-1.5">
                <h4 className="text-sm font-bold text-white tracking-wide">
                  Consultez votre boîte de réception
                </h4>
                <p className="text-xs text-white/70 max-w-sm mx-auto leading-relaxed">
                  Un e-mail de confirmation contenant votre lien d'activation sécurisé a été envoyé à :
                </p>
                <div className="inline-block px-3 py-1 rounded-lg bg-black/50 border border-cyan-500/30 font-mono text-xs font-semibold text-cyan-300 break-all">
                  {email || 'votre adresse e-mail'}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-nexus-950/70 border border-nexus-500/20 text-left space-y-2 text-xs text-white/80">
                <div className="flex items-center gap-1.5 text-cyan-400 font-semibold text-xs">
                  <Sparkles size={13} />
                  <span>Étapes pour activer votre compte :</span>
                </div>
                <ol className="list-decimal list-inside space-y-1 text-white/70 text-[11px] pl-1">
                  <li>Ouvrez l'e-mail provenant de <strong className="text-white">NEXUS AI (Supabase)</strong>.</li>
                  <li>Cliquez sur le lien <strong className="text-cyan-300">Confirmer mon e-mail</strong>.</li>
                  <li>Vous serez automatiquement connecté et redirigé vers l'application.</li>
                </ol>
                <p className="text-[10px] text-white/40 italic pt-1 border-t border-white/5">
                  Astuce : Pensez à vérifier votre dossier de spams / courriers indésirables si l'e-mail tarde.
                </p>
              </div>

              {getWebmailInfo(email) && (
                <a
                  href={getWebmailInfo(email)!.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-tactile inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-cyan-600 to-nexus-600 hover:from-cyan-500 hover:to-nexus-500 shadow-[0_0_20px_rgba(6,182,212,0.35)] transition-all cursor-pointer"
                >
                  <ExternalLink size={14} />
                  <span>Ouvrir ma boîte {getWebmailInfo(email)!.name}</span>
                </a>
              )}

              <div className="flex flex-col items-center gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={handleResendConfirmation}
                  disabled={isResending || resendCooldown > 0}
                  className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RotateCw size={12} className={isResending ? 'animate-spin' : ''} />
                  <span>
                    {resendCooldown > 0
                      ? `Renvoyer l'e-mail dans ${resendCooldown}s`
                      : isResending
                      ? 'Envoi en cours...'
                      : "Vous n'avez rien reçu ? Renvoyer l'e-mail"}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMode('sign-in');
                    clearError();
                    setLocalError(null);
                    setSuccessNotice(null);
                  }}
                  className="text-xs text-white/50 hover:text-white flex items-center gap-1.5 cursor-pointer pt-1"
                >
                  <ArrowLeft size={12} />
                  <span>Retour à la page de connexion</span>
                </button>
              </div>
            </div>
          )}

          {/* Formulaire */}
          {mode !== 'email-confirmation-pending' && (
            <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* Vue spécifique Double Authentification (2FA / TOTP) */}
            {mode === 'verify-2fa' && (
              <div className="space-y-4">
                <div className="p-3.5 rounded-xl bg-nexus-950/60 border border-nexus-500/20 flex items-start gap-3 text-xs text-white/80">
                  <div className="p-2 rounded-lg bg-nexus-600/20 text-cyan-400 shrink-0 mt-0.5">
                    <Smartphone size={18} />
                  </div>
                  <div className="space-y-1">
                    <p className="font-semibold text-white">Vérification de sécurité 2FA</p>
                    <p className="text-[11px] text-white/60 leading-relaxed">
                      Entrez le code temporaire à 6 chiffres généré par votre application d'authentification (Google Authenticator, Microsoft Authenticator, etc.).
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-white/70 uppercase tracking-wider mb-1.5 text-center">
                    Code à 6 chiffres
                  </label>
                  <input
                    type="text"
                    required
                    inputMode="numeric"
                    pattern="[0-9]*"
                    autoComplete="one-time-code"
                    autoFocus
                    maxLength={6}
                    value={totpCode}
                    onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    className="w-full text-center text-2xl font-mono tracking-[0.4em] py-3 rounded-xl bg-black/60 border border-nexus-500/40 text-cyan-300 placeholder:text-white/20 focus:outline-none focus:border-nexus-400 focus:ring-2 focus:ring-nexus-500/20 transition-all"
                  />
                </div>

                <div className="pt-1">
                  <button
                    type="button"
                    onClick={handleCancel2FA}
                    className="text-xs text-white/60 hover:text-white flex items-center gap-1 cursor-pointer mx-auto"
                  >
                    <ArrowLeft size={13} />
                    <span>Annuler et retourner à la connexion</span>
                  </button>
                </div>
              </div>
            )}

            {mode === 'sign-up' && (
              <div>
                <label className="block text-xs font-semibold text-white/70 uppercase tracking-wider mb-1">
                  Nom d'affichage
                </label>
                <div className="relative">
                  <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Ex: Alex Carter"
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs placeholder:text-white/30 focus:outline-none focus:border-nexus-500 transition-colors"
                  />
                </div>
              </div>
            )}

            {mode !== 'update-password' && mode !== 'verify-2fa' && (
              <div>
                <label className="block text-xs font-semibold text-white/70 uppercase tracking-wider mb-1">
                  Adresse e-mail
                </label>
                <div className="relative">
                  <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nom@exemple.com"
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs placeholder:text-white/30 focus:outline-none focus:border-nexus-500 transition-colors"
                  />
                </div>
              </div>
            )}

            {mode !== 'forgot-password' && mode !== 'verify-2fa' && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-white/70 uppercase tracking-wider">
                    {mode === 'update-password' ? 'Nouveau mot de passe' : 'Mot de passe'}
                  </label>
                  {mode === 'sign-in' && (
                    <button
                      type="button"
                      onClick={() => {
                        setMode('forgot-password');
                        clearError();
                        setLocalError(null);
                        setSuccessNotice(null);
                      }}
                      className="text-[11px] text-cyan-400 hover:underline cursor-pointer"
                    >
                      Mot de passe oublié ?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Au moins 6 caractères"
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs placeholder:text-white/30 focus:outline-none focus:border-nexus-500 transition-colors"
                  />
                </div>
              </div>
            )}

            {mode === 'update-password' && (
              <div>
                <label className="block text-xs font-semibold text-white/70 uppercase tracking-wider mb-1">
                  Confirmer le mot de passe
                </label>
                <div className="relative">
                  <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Répétez le mot de passe"
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs placeholder:text-white/30 focus:outline-none focus:border-nexus-500 transition-colors"
                  />
                </div>
              </div>
            )}

            {mode === 'forgot-password' && (
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setMode('sign-in');
                    clearError();
                    setLocalError(null);
                    setSuccessNotice(null);
                  }}
                  className="text-xs text-white/60 hover:text-white flex items-center gap-1 cursor-pointer"
                >
                  <ArrowLeft size={13} />
                  <span>Retour à la connexion</span>
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || !isConfigured}
              className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-white flex items-center justify-center gap-2 transition-all cursor-pointer ${
                isConfigured
                  ? 'bg-gradient-to-r from-nexus-600 to-cyan-600 hover:from-nexus-500 hover:to-cyan-500 shadow-[0_0_20px_rgba(124,13,244,0.4)]'
                  : 'bg-white/10 text-white/40 cursor-not-allowed border border-white/6'
              }`}
            >
              {isLoading ? (
                <Spinner size="sm" />
              ) : isConfigured ? (
                <>
                  <KeyRound size={14} />
                  <span>
                    {mode === 'sign-in' && 'Se connecter'}
                    {mode === 'sign-up' && 'Créer mon compte'}
                    {mode === 'forgot-password' && 'Envoyer le lien de réinitialisation'}
                    {mode === 'update-password' && 'Enregistrer le nouveau mot de passe'}
                    {mode === 'verify-2fa' && 'Valider le code et se connecter'}
                  </span>
                </>
              ) : (
                <span>Configuration .env requise pour l’authentification</span>
              )}
            </button>
          </form>
          )}

          {/* Pied de modale */}
          <div className="pt-2 border-t border-white/6 text-center text-[10px] text-white/40 flex items-center justify-center gap-1.5">
            <ShieldCheck size={13} className="text-emerald-400" />
            <span>Mots de passe hachés et sécurisés via Supabase Auth (Argon2 / bcrypt)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
