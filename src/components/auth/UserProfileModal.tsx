/**
 * src/components/auth/UserProfileModal.tsx
 *
 * Fenêtre modale du profil utilisateur pour NEXUS AI.
 * Affiche les informations de session, les statistiques de synchronisation cloud,
 * permet la modification du profil, la déconnexion et la suppression de compte.
 */

import { useState, useEffect } from 'react';
import {
  User,
  LogOut,
  Trash2,
  RefreshCw,
  CloudCheck,
  Check,
  Database,
  Calendar,
  Save,
  ShieldCheck,
  ShieldAlert,
  Smartphone,
  Copy,
  AlertCircle,
  KeyRound,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useSync } from '@/hooks/useSync';
import { Spinner } from '@/components/ui/Spinner';
import { ModalCloseButton } from '@/components/ui/ModalCloseButton';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UserProfileModal({ isOpen, onClose }: UserProfileModalProps) {
  const {
    user,
    signOut,
    updateProfile,
    deleteAccount,
    isLoading,
    enroll2FA,
    verify2FAEnrollment,
    unenroll2FA,
    get2FAStatus,
  } = useAuth();
  const { stats, status, lastSyncedAt, syncNow, importLocalDataToCloud, hasLocalDataPendingImport } = useSync();

  const [fullName, setFullName] = useState(user?.fullName || '');
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');
  const [importing, setImporting] = useState(false);

  // État de la double authentification (2FA / TOTP)
  const [mfaStatus, setMfaStatus] = useState<{ hasMFA: boolean; factorId?: string } | null>(null);
  const [enrollData, setEnrollData] = useState<{ factorId: string; qrCode?: string; secret?: string; uri?: string } | null>(null);
  const [mfaCode, setMfaCode] = useState('');
  const [mfaError, setMfaError] = useState<string | null>(null);
  const [mfaSuccess, setMfaSuccess] = useState<string | null>(null);
  const [isSubmittingMFA, setIsSubmittingMFA] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);

  useEffect(() => {
    if (!isOpen || !user) return;
    let isCancelled = false;
    get2FAStatus()
      .then((res) => {
        if (!isCancelled) {
          setMfaStatus({ hasMFA: res.hasMFA, factorId: res.factorId });
        }
      })
      .catch((err) => {
        console.warn('[NEXUS AUTH] Erreur récupération statut 2FA:', err);
      });

    return () => {
      isCancelled = true;
    };
  }, [isOpen, user, get2FAStatus]);

  if (!isOpen || !user) return null;

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || isUpdating) return;
    setIsUpdating(true);
    setUpdateSuccess(false);

    const res = await updateProfile({ fullName: fullName.trim() });
    setIsUpdating(false);
    if (!res.error) {
      setUpdateSuccess(true);
      setTimeout(() => setUpdateSuccess(false), 2000);
    }
  };

  const handleDelete = async () => {
    if (deleteConfirmationText !== 'SUPPRIMER') return;
    const res = await deleteAccount();
    if (!res.error) {
      onClose();
    }
  };

  const handleImportLocal = async () => {
    setImporting(true);
    await importLocalDataToCloud();
    setImporting(false);
  };

  const handleStartEnroll = async () => {
    setMfaError(null);
    setMfaSuccess(null);
    setMfaCode('');
    setIsSubmittingMFA(true);
    try {
      const res = await enroll2FA();
      if (res.error) {
        setMfaError(res.error);
      } else if (res.factorId) {
        setEnrollData({
          factorId: res.factorId,
          qrCode: res.qrCode,
          secret: res.secret,
          uri: res.uri,
        });
      }
    } finally {
      setIsSubmittingMFA(false);
    }
  };

  const handleVerifyEnroll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enrollData?.factorId) return;
    const cleanCode = mfaCode.trim().replace(/\s/g, '');
    if (cleanCode.length < 6) {
      setMfaError('Veuillez entrer le code à 6 chiffres.');
      return;
    }
    setMfaError(null);
    setIsSubmittingMFA(true);
    try {
      const res = await verify2FAEnrollment(enrollData.factorId, cleanCode);
      if (res.error) {
        setMfaError(res.error);
      } else {
        setMfaStatus({ hasMFA: true, factorId: enrollData.factorId });
        setEnrollData(null);
        setMfaCode('');
        setMfaSuccess('Double authentification activée avec succès !');
        setTimeout(() => setMfaSuccess(null), 4000);
      }
    } finally {
      setIsSubmittingMFA(false);
    }
  };

  const handleUnenroll = async () => {
    if (!mfaStatus?.factorId) return;
    setMfaError(null);
    setIsSubmittingMFA(true);
    try {
      const res = await unenroll2FA(mfaStatus.factorId);
      if (res.error) {
        setMfaError(res.error);
      } else {
        setMfaStatus({ hasMFA: false });
        setEnrollData(null);
        setMfaSuccess('Double authentification désactivée.');
        setTimeout(() => setMfaSuccess(null), 4000);
      }
    } finally {
      setIsSubmittingMFA(false);
    }
  };

  const handleCopySecret = () => {
    if (!enrollData?.secret) return;
    navigator.clipboard.writeText(enrollData.secret);
    setCopiedSecret(true);
    setTimeout(() => setCopiedSecret(false), 2000);
  };

  const formatQrSrc = (qr?: string) => {
    if (!qr) return '';
    if (qr.startsWith('data:')) return qr;
    if (qr.startsWith('<svg')) return `data:image/svg+xml;utf-8,${encodeURIComponent(qr)}`;
    return qr;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="profile-modal-title"
    >
      <div className="relative w-full max-w-lg max-h-[92dvh] sm:max-h-[90dvh] flex flex-col rounded-t-3xl sm:rounded-2xl bg-surface-950 border-t sm:border border-nexus-500/30 shadow-[0_0_50px_rgba(124,13,244,0.35)] overflow-hidden pb-safe">
        {/* Poignée tactile mobile style iOS */}
        <div className="sm:hidden w-10 h-1 bg-white/20 rounded-full mx-auto mt-2 mb-1 shrink-0" aria-hidden="true" />

        {/* En-tête */}
        <div className="px-6 py-4 border-b border-white/8 bg-surface-900 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-nexus-600 to-cyan-500 flex items-center justify-center text-white font-bold text-sm shadow-[0_0_15px_rgba(124,13,244,0.4)] shrink-0">
              {user.fullName ? user.fullName[0].toUpperCase() : 'U'}
            </div>
            <div className="min-w-0">
              <h3 id="profile-modal-title" className="text-sm font-semibold text-white truncate">
                Profil & Paramètres Cloud
              </h3>
              <p className="text-xs text-white/50 truncate">{user.email}</p>
            </div>
          </div>

          <ModalCloseButton
            onClick={onClose}
            label="Fermer"
            title="Fermer (Échap)"
          />
        </div>

        {/* Corps */}
        <div className="p-6 space-y-6 max-h-[75dvh] overflow-y-auto scrollbar-thin">
          {/* Formulaire de modification du nom */}
          <form onSubmit={handleUpdate} className="space-y-3">
            <label className="block text-xs font-semibold text-white/70 uppercase tracking-wider">
              Nom d'affichage
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:outline-none focus:border-nexus-500 transition-colors"
                />
              </div>
              <button
                type="submit"
                disabled={isUpdating || fullName.trim() === user.fullName}
                className="px-3.5 py-2 rounded-xl text-xs font-medium text-white bg-nexus-600 hover:bg-nexus-500 disabled:opacity-30 disabled:hover:bg-nexus-600 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                {isUpdating ? <Spinner size="sm" /> : updateSuccess ? <Check size={14} className="text-emerald-400" /> : <Save size={14} />}
                <span>{updateSuccess ? 'Enregistré' : 'Modifier'}</span>
              </button>
            </div>
          </form>

          {/* État et Statistiques de synchronisation cloud */}
          <div className="p-4 rounded-xl bg-surface-900 border border-white/8 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-white flex items-center gap-2">
                <CloudCheck size={16} className="text-cyan-400" />
                <span>Statut Cloud Supabase</span>
              </span>
              <button
                type="button"
                onClick={() => syncNow()}
                disabled={status === 'syncing'}
                className="text-[11px] text-cyan-300 hover:text-cyan-200 flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw size={11} className={status === 'syncing' ? 'animate-spin' : ''} />
                <span>Actualiser</span>
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t border-white/6">
              <div className="p-2 rounded-lg bg-black/30 border border-white/4">
                <span className="block text-sm font-bold text-white font-mono">{stats.conversationsCount}</span>
                <span className="text-[10px] text-white/50">Conversations</span>
              </div>
              <div className="p-2 rounded-lg bg-black/30 border border-white/4">
                <span className="block text-sm font-bold text-white font-mono">{stats.projectsCount}</span>
                <span className="text-[10px] text-white/50">Projets LAB</span>
              </div>
              <div className="p-2 rounded-lg bg-black/30 border border-white/4">
                <span className="block text-sm font-bold text-white font-mono">{stats.memoriesCount}</span>
                <span className="text-[10px] text-white/50">Souvenirs IA</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-white/40 pt-1 font-mono">
              <span className="flex items-center gap-1">
                <Calendar size={11} /> Dernier sync :
              </span>
              <span>{lastSyncedAt ? lastSyncedAt.toLocaleTimeString('fr-FR') : 'Jamais'}</span>
            </div>
          </div>

          {/* Proposition d'importation des données locales */}
          {hasLocalDataPendingImport && (
            <div className="p-4 rounded-xl bg-nexus-950/70 border border-cyan-500/30 space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-cyan-300">
                <Database size={15} />
                <span>Données locales prêtes pour le Cloud</span>
              </div>
              <p className="text-xs text-white/70 leading-relaxed">
                Des conversations ou projets ont été créés localement sur cet appareil. Souhaitez-vous les sauvegarder sur votre compte cloud ?
              </p>
              <button
                type="button"
                onClick={handleImportLocal}
                disabled={importing}
                className="w-full py-2 px-3 rounded-lg text-xs font-semibold text-white bg-gradient-to-r from-nexus-600 to-cyan-600 hover:from-nexus-500 hover:to-cyan-500 shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {importing ? <Spinner size="sm" /> : <RefreshCw size={13} />}
                <span>Importer mes données locales vers le cloud</span>
              </button>
            </div>
          )}

          {/* Section Sécurité & Double Authentification (2FA / TOTP) */}
          <div className="p-4 rounded-xl bg-surface-900 border border-white/8 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck size={16} className="text-nexus-400" />
                <span className="text-xs font-semibold text-white">Double Authentification (2FA)</span>
              </div>
              {mfaStatus === null ? (
                <Spinner size="sm" />
              ) : mfaStatus?.hasMFA ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Active (TOTP)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-white/5 text-white/50 border border-white/8">
                  Désactivée
                </span>
              )}
            </div>

            {/* Messages de retour 2FA */}
            {mfaError && (
              <div className="p-2.5 rounded-lg bg-red-500/15 border border-red-500/30 text-red-300 text-xs flex items-start gap-2">
                <AlertCircle size={14} className="shrink-0 mt-0.5" />
                <span>{mfaError}</span>
              </div>
            )}

            {mfaSuccess && (
              <div className="p-2.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-start gap-2">
                <Check size={14} className="shrink-0 mt-0.5" />
                <span>{mfaSuccess}</span>
              </div>
            )}

            {/* État 1 : 2FA déjà active */}
            {mfaStatus?.hasMFA && !enrollData && (
              <div className="space-y-3">
                <p className="text-xs text-white/70 leading-relaxed">
                  Votre compte est protégé par une application TOTP (Google Authenticator, Microsoft Authenticator, 1Password, etc.). Un code à 6 chiffres vous sera demandé à chaque nouvelle connexion.
                </p>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-emerald-400/80 font-medium flex items-center gap-1.5">
                    <ShieldCheck size={13} />
                    Niveau de sécurité maximal
                  </span>
                  <button
                    type="button"
                    onClick={handleUnenroll}
                    disabled={isSubmittingMFA}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    {isSubmittingMFA ? <Spinner size="sm" /> : <ShieldAlert size={13} />}
                    <span>Désactiver la 2FA</span>
                  </button>
                </div>
              </div>
            )}

            {/* État 2 : 2FA désactivée et pas encore d'enrôlement en cours */}
            {!mfaStatus?.hasMFA && !enrollData && (
              <div className="space-y-3">
                <p className="text-xs text-white/60 leading-relaxed">
                  Sécurisez vos accès en associant une application d'authentification mobile. Même si votre mot de passe venait à être compromis, votre compte reste totalement protégé.
                </p>
                <button
                  type="button"
                  onClick={handleStartEnroll}
                  disabled={isSubmittingMFA || mfaStatus === null}
                  className="w-full py-2 px-3 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-nexus-600 to-cyan-600 hover:from-nexus-500 hover:to-cyan-500 shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isSubmittingMFA ? <Spinner size="sm" /> : <Smartphone size={14} />}
                  <span>Activer la double authentification (TOTP)</span>
                </button>
              </div>
            )}

            {/* État 3 : Enrôlement en cours (Affichage QR code + Clé + Saisie du premier code) */}
            {enrollData && (
              <div className="space-y-4 pt-2 border-t border-white/6">
                <div className="p-3 rounded-lg bg-black/40 border border-white/6 space-y-3">
                  <p className="text-xs font-semibold text-white flex items-center gap-1.5">
                    <KeyRound size={14} className="text-cyan-400" />
                    <span>Étape 1 : Scannez le QR Code</span>
                  </p>
                  <p className="text-[11px] text-white/60">
                    Ouvrez Google Authenticator ou votre application préférée et scannez l'image ci-dessous :
                  </p>

                  {enrollData.qrCode && (
                    <div className="flex justify-center p-3 bg-white rounded-xl shadow-inner max-w-[210px] mx-auto">
                      <img
                        src={formatQrSrc(enrollData.qrCode)}
                        alt="QR Code Double Authentification"
                        className="w-44 h-44 object-contain"
                      />
                    </div>
                  )}

                  {/* Clé manuelle si la caméra n'est pas disponible */}
                  {enrollData.secret && (
                    <div className="pt-1 space-y-1">
                      <span className="text-[10px] text-white/50 block">Ou saisissez manuellement cette clé :</span>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 px-2.5 py-1.5 rounded-lg bg-surface-950 border border-white/10 text-cyan-300 font-mono text-[11px] select-all break-all">
                          {enrollData.secret}
                        </code>
                        <button
                          type="button"
                          onClick={handleCopySecret}
                          className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/10 text-xs transition-colors flex items-center gap-1 cursor-pointer"
                          title="Copier la clé secrète"
                        >
                          {copiedSecret ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                          <span className="text-[11px]">{copiedSecret ? 'Copié' : 'Copier'}</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Étape 2 : Confirmation du premier code généré */}
                <form onSubmit={handleVerifyEnroll} className="space-y-3">
                  <p className="text-xs font-semibold text-white flex items-center gap-1.5">
                    <Smartphone size={14} className="text-nexus-400" />
                    <span>Étape 2 : Confirmez avec le code généré</span>
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      value={mfaCode}
                      onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="Code 6 chiffres"
                      className="flex-1 px-3 py-2 rounded-xl bg-black/40 border border-nexus-500/40 text-cyan-300 text-center font-mono tracking-widest text-sm focus:outline-none focus:border-nexus-400"
                    />
                    <button
                      type="submit"
                      disabled={isSubmittingMFA || mfaCode.trim().length < 6}
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-nexus-600 to-cyan-600 hover:from-nexus-500 hover:to-cyan-500 disabled:opacity-40 transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      {isSubmittingMFA ? <Spinner size="sm" /> : <Check size={14} />}
                      <span>Confirmer</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEnrollData(null);
                        setMfaCode('');
                        setMfaError(null);
                      }}
                      className="px-3 py-2 rounded-xl text-xs text-white/50 hover:text-white bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
                    >
                      Annuler
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>

          {/* Déconnexion */}
          <div className="pt-2 border-t border-white/8 flex justify-between items-center">
            <button
              type="button"
              onClick={async () => {
                await signOut();
                onClose();
              }}
              disabled={isLoading}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium text-white/70 hover:text-white bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
            >
              <LogOut size={14} />
              <span>Se déconnecter</span>
            </button>
          </div>

          {/* Zone de danger : Suppression du compte */}
          <div className="p-4 rounded-xl border border-red-500/20 bg-red-950/10 space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-red-400">
              <Trash2 size={14} />
              <span>Zone de danger — Droit à l'oubli</span>
            </div>
            <p className="text-[11px] text-white/50 leading-relaxed">
              La suppression de votre compte efface définitivement toutes vos conversations, souvenirs, projets et fichiers cloud associés sans possibilité de récupération.
            </p>

            {!isConfirmingDelete ? (
              <button
                type="button"
                onClick={() => setIsConfirmingDelete(true)}
                className="text-xs text-red-400 hover:text-red-300 underline cursor-pointer"
              >
                Supprimer mon compte et mes données
              </button>
            ) : (
              <div className="space-y-2 pt-2 border-t border-red-500/20">
                <label className="block text-[11px] text-red-300">
                  Tapez <strong className="text-white">SUPPRIMER</strong> pour confirmer :
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={deleteConfirmationText}
                    onChange={(e) => setDeleteConfirmationText(e.target.value)}
                    placeholder="SUPPRIMER"
                    className="flex-1 px-3 py-1.5 rounded-lg bg-black/50 border border-red-500/40 text-red-200 text-xs font-mono focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={deleteConfirmationText !== 'SUPPRIMER'}
                    className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 disabled:opacity-30 text-white font-semibold text-xs transition-colors cursor-pointer"
                  >
                    Confirmer
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsConfirmingDelete(false);
                      setDeleteConfirmationText('');
                    }}
                    className="px-2 py-1.5 text-xs text-white/50 hover:text-white"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
