/**
 * src/components/admin/AdminVaultModal.tsx
 *
 * Espace Super-Admin exclusif avec triple facteur de securite :
 * 1. Adresse e-mail administrateur verifiee
 * 2. Code PIN / mot de passe maitre
 * 3. Reconnaissance par empreinte digitale (WebAuthn / Windows Hello / Touch ID)
 */

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Fingerprint,
  Lock,
  Unlock,
  Key,
  AlertTriangle,
  RefreshCw,
  Clock,
  Eye,
  EyeOff,
  Power,
  Trash2,
  Check,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { ModalCloseButton } from '@/components/ui/ModalCloseButton';
import type {
  AdminSecurityConfig,
  AdminAuditEntry,
  ManagedUser,
} from '@/types/admin';
import {
  getAdminConfig,
  saveAdminConfig,
  isVaultUnlocked,
  unlockVaultSession,
  lockVaultSession,
  isEmailAuthorizedAdmin,
  verifyMasterAdminPin,
  setMasterAdminPin,
  isBiometricsSupported,
  registerBiometricCredential,
  verifyBiometricCredential,
  getAdminAuditLogs,
  clearAdminAuditLogs,
  getManagedUsers,
  updateManagedUserRole,
  toggleManagedUserStatus,
  toggleMaintenanceMode,
  triggerEmergencyKillswitch,
  logAdminAudit,
} from '@/services/admin/adminSecurityService';

interface AdminVaultModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AdminVaultModal({ isOpen, onClose }: AdminVaultModalProps) {
  const { user } = useAuth();
  const [config, setConfig] = useState<AdminSecurityConfig>(getAdminConfig());
  const [isUnlocked, setIsUnlocked] = useState(isVaultUnlocked());
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'security' | 'audit'>('overview');

  // Champs de saisie du déverrouillage
  const [emailInput, setEmailInput] = useState('');
  const [pinInput, setPinInput] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [isVerifyingBio, setIsVerifyingBio] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Données de l'espace admin
  const [managedUsers, setManagedUsers] = useState<ManagedUser[]>([]);
  const [auditLogs, setAuditLogs] = useState<AdminAuditEntry[]>([]);

  // Configuration sécurité PIN
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [isChangingPin, setIsChangingPin] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const cfg = getAdminConfig();
      setConfig(cfg);
      setIsUnlocked(isVaultUnlocked());
      setManagedUsers(getManagedUsers());
      setAuditLogs(getAdminAuditLogs());
      setAuthError(null);
      setPinInput('');
      setEmailInput(user?.email || cfg.primaryAdminEmail);
    }
  }, [isOpen, user]);

  const showNotification = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 3000);
  };

  const handleManualLock = () => {
    lockVaultSession();
    setIsUnlocked(false);
    setPinInput('');
    showNotification('Coffre-fort verrouille.');
  };

  const handleUnlockWithPinAndEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    // 1. Contrôle Email
    if (!isEmailAuthorizedAdmin(emailInput)) {
      setAuthError('Cette adresse e-mail ne figure pas sur la liste des Super-Administrateurs.');
      logAdminAudit('failed_attempt', false, `Refus acces e-mail : ${emailInput}`);
      return;
    }

    // 2. Contrôle PIN
    const isValidPin = await verifyMasterAdminPin(pinInput);
    if (!isValidPin) {
      setAuthError('Code PIN maitre incorrect.');
      logAdminAudit('failed_attempt', false, `Echec code PIN pour ${emailInput}`);
      return;
    }

    // 3. Contrôle Empreinte si activée
    if (config.biometricEnabled) {
      setIsVerifyingBio(true);
      const bioRes = await verifyBiometricCredential();
      setIsVerifyingBio(false);
      if (!bioRes.success) {
        setAuthError(bioRes.error || 'Reconnaissance biometrique echouee.');
        return;
      }
    }

    unlockVaultSession();
    setIsUnlocked(true);
    setAuthError(null);
    logAdminAudit('unlock_pin', true, `Deverrouillage reussi pour ${emailInput}`);
    showNotification('Authentification Super-Admin validee.');
  };

  const handleBiometricDirectUnlock = async () => {
    setAuthError(null);
    setIsVerifyingBio(true);

    try {
      if (!isEmailAuthorizedAdmin(emailInput)) {
        setAuthError('Veuillez renseigner un e-mail administrateur autorise avant de scanner votre empreinte.');
        return;
      }

      const bioRes = await verifyBiometricCredential();
      if (!bioRes.success) {
        setAuthError(bioRes.error || 'Empreinte digitale non reconnue.');
        return;
      }

      unlockVaultSession();
      setIsUnlocked(true);
      logAdminAudit('unlock_biometric', true, `Deverrouillage biometrique valide pour ${emailInput}`);
      showNotification('Empreinte digitale reconnue avec succes.');
    } finally {
      setIsVerifyingBio(false);
    }
  };

  const handleEnrollBiometrics = async () => {
    setAuthError(null);
    setIsVerifyingBio(true);
    try {
      const res = await registerBiometricCredential(emailInput || config.primaryAdminEmail);
      if (res.success) {
        setConfig(getAdminConfig());
        showNotification('Capteur biometrique enregistre sur cet appareil.');
      } else {
        setAuthError(res.error || 'Erreur lors de l enregistrement biometrique.');
      }
    } finally {
      setIsVerifyingBio(false);
    }
  };

  const handleSaveNewPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPin.length < 4) {
      showNotification('Le code PIN doit comporter au moins 4 caracteres.');
      return;
    }
    if (newPin !== confirmPin) {
      showNotification('Les codes PIN ne correspondent pas.');
      return;
    }
    const success = await setMasterAdminPin(newPin);
    if (success) {
      setConfig(getAdminConfig());
      setIsChangingPin(false);
      setNewPin('');
      setConfirmPin('');
      showNotification('Code PIN maitre mis a jour avec succes.');
    }
  };

  const handleToggleMaintenance = () => {
    const nextState = !config.maintenanceMode;
    toggleMaintenanceMode(nextState);
    setConfig(getAdminConfig());
    showNotification(nextState ? 'Mode maintenance active.' : 'Mode maintenance desactive.');
  };

  const handleKillswitch = () => {
    if (
      window.confirm(
        'ATTENTION : Activer le Killswitch d urgence va deconnecter immediatement toutes les sessions actives et basculer l application en mode maintenance. Confirmer ?',
      )
    ) {
      triggerEmergencyKillswitch();
      setIsUnlocked(false);
      onClose();
    }
  };

  const handleUserRoleChange = (userId: string, role: ManagedUser['role']) => {
    updateManagedUserRole(userId, role);
    setManagedUsers(getManagedUsers());
    showNotification('Role utilisateur mis a jour.');
  };

  const handleUserStatusToggle = (userId: string) => {
    toggleManagedUserStatus(userId);
    setManagedUsers(getManagedUsers());
    showNotification('Statut utilisateur modifie.');
  };

  const handleClearLogs = () => {
    clearAdminAuditLogs();
    setAuditLogs([]);
    showNotification('Historique d audit efface.');
  };

  if (!isOpen) return null;
  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      className="fixed inset-0 z-[160] flex items-center justify-center p-3 sm:p-5 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-200 cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-4xl bg-white dark:bg-[#090a18] border border-amber-500/30 rounded-3xl shadow-[0_0_50px_rgba(245,158,11,0.2)] flex flex-col max-h-[92vh] overflow-hidden cursor-default text-xs"
      >
        {/* Toast interne */}
        {successToast && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl bg-emerald-600 text-white font-medium shadow-lg flex items-center gap-2 animate-in slide-in-from-top duration-150">
            <Check size={14} />
            <span>{successToast}</span>
          </div>
        )}

        {/* En-tête Super-Admin */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-white/10 bg-gradient-to-r from-amber-500/10 via-slate-100 dark:via-white/5 to-transparent shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-700 flex items-center justify-center text-white shadow-md shadow-amber-500/30 shrink-0">
              <Shield size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-sm text-slate-900 dark:text-white">
                  Espace Super-Admin & Coffre-Fort
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 font-mono text-[10px] font-bold uppercase tracking-wider">
                  Niveau 3 • Biometrique
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-white/60">
                Gouvernance absolue, gestion des utilisateurs et controle biometrique exclusif.
              </p>
            </div>
          </div>
          <ModalCloseButton onClick={onClose} />
        </div>

        {/* CONTENU : Écran Verrouillé vs Écran Déverrouillé */}
        {!isUnlocked ? (
          /* ====================================================================
             ÉCRAN DE VÉRIFICATION MULTI-FACTEURS (Email + PIN + Empreinte)
             ==================================================================== */
          <div className="p-6 md:p-8 overflow-y-auto space-y-6 flex flex-col items-center justify-center text-center max-w-lg mx-auto w-full">
            <div className="relative">
              <div className="w-20 h-20 rounded-3xl bg-amber-500/15 border-2 border-amber-500/40 flex items-center justify-center text-amber-500 shadow-[0_0_35px_rgba(245,158,11,0.3)]">
                <Lock size={36} />
              </div>
              <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-slate-900 border-2 border-cyan-400 flex items-center justify-center text-cyan-400 shadow-md">
                <Fingerprint size={16} />
              </div>
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
                Acces Restreint au Super-Administrateur
              </h3>
              <p className="text-slate-500 dark:text-white/70 leading-relaxed text-xs">
                Cet espace est strictement reserve au proprietaire de NEXUS AI. Authentifiez-vous par e-mail, code PIN maitre ou capteur d'empreinte digitale.
              </p>
            </div>

            {authError && (
              <div className="w-full p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-600 dark:text-red-400 flex items-center gap-2 text-left">
                <ShieldAlert size={16} className="shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            {/* Formulaire de validation Email + PIN */}
            <form onSubmit={handleUnlockWithPinAndEmail} className="w-full space-y-3.5 text-left">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-white/80 mb-1">
                  Adresse e-mail administrateur
                </label>
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="marcosassogba645@gmail.com"
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-white/5 border border-slate-300 dark:border-white/10 rounded-xl text-slate-900 dark:text-white font-mono text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-white/80 mb-1 flex items-center justify-between">
                  <span>Code PIN Maitre Secret</span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    {config.isPinConfigured ? 'PIN 4 a 8 chiffres' : 'PIN par defaut : 0000'}
                  </span>
                </label>
                <div className="relative">
                  <input
                    type={showPin ? 'text' : 'password'}
                    value={pinInput}
                    onChange={(e) => setPinInput(e.target.value)}
                    placeholder="Entrez votre PIN..."
                    required
                    maxLength={12}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-white/5 border border-slate-300 dark:border-white/10 rounded-xl text-slate-900 dark:text-white font-mono text-xs focus:outline-none focus:border-amber-500 tracking-widest"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
                  >
                    {showPin ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-white font-bold flex items-center justify-center gap-2 shadow-md shadow-amber-500/25 cursor-pointer transition-all"
                >
                  <Key size={14} />
                  <span>Deverrouiller avec PIN</span>
                </button>

                {/* Bouton Empreinte Digitale */}
                {isBiometricsSupported() && config.biometricEnabled && (
                  <button
                    type="button"
                    onClick={handleBiometricDirectUnlock}
                    disabled={isVerifyingBio}
                    className="py-2.5 px-4 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/40 text-cyan-800 dark:text-cyan-300 font-bold flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                  >
                    {isVerifyingBio ? (
                      <RefreshCw size={14} className="animate-spin" />
                    ) : (
                      <Fingerprint size={16} />
                    )}
                    <span>Scanner l'Empreinte</span>
                  </button>
                )}
              </div>
            </form>

            {/* Enregistrement de l'empreinte si pas encore enregistrée */}
            {isBiometricsSupported() && !config.biometricEnabled && (
              <div className="w-full p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-between gap-2 text-left">
                <div className="space-y-0.5">
                  <div className="font-semibold text-cyan-800 dark:text-cyan-300 flex items-center gap-1.5">
                    <Fingerprint size={14} />
                    <span>Activer la reconnaissance par empreinte</span>
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-cyan-200/70">
                    Liez le capteur biométrique de votre appareil (Touch ID, Windows Hello, Android) à votre compte admin.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleEnrollBiometrics}
                  disabled={isVerifyingBio}
                  className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-[11px] shrink-0 cursor-pointer transition-colors shadow-xs"
                >
                  {isVerifyingBio ? 'Scan...' : 'Enregistrer'}
                </button>
              </div>
            )}
          </div>
        ) : (
          /* ====================================================================
             ÉCRAN DÉVERROUILLÉ : TOUR DE CONTRÔLE SUPER-ADMINISTRATEUR
             ==================================================================== */
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Barre d'onglets Admin */}
            <div className="flex items-center justify-between px-5 py-2.5 bg-slate-100 dark:bg-white/5 border-b border-slate-200 dark:border-white/10 shrink-0 overflow-x-auto">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setActiveTab('overview')}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                    activeTab === 'overview'
                      ? 'bg-white dark:bg-white/10 text-amber-600 dark:text-amber-300 shadow-xs'
                      : 'text-slate-600 dark:text-white/60 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Vue d'ensemble
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('users')}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                    activeTab === 'users'
                      ? 'bg-white dark:bg-white/10 text-amber-600 dark:text-amber-300 shadow-xs'
                      : 'text-slate-600 dark:text-white/60 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Utilisateurs ({managedUsers.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('security')}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                    activeTab === 'security'
                      ? 'bg-white dark:bg-white/10 text-amber-600 dark:text-amber-300 shadow-xs'
                      : 'text-slate-600 dark:text-white/60 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Securite & PIN
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('audit')}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                    activeTab === 'audit'
                      ? 'bg-white dark:bg-white/10 text-amber-600 dark:text-amber-300 shadow-xs'
                      : 'text-slate-600 dark:text-white/60 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Journal d'Audit ({auditLogs.length})
                </button>
              </div>

              {/* Bouton de verrouillage immédiat */}
              <button
                type="button"
                onClick={handleManualLock}
                className="px-3 py-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Lock size={12} />
                <span>Verrouiller</span>
              </button>
            </div>

            {/* Corps selon l'onglet actif */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
              {/* ONGLET 1 : VUE D'ENSEMBLE */}
              {activeTab === 'overview' && (
                <div className="space-y-4">
                  {/* Status Banner */}
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-cyan-500/10 to-transparent border border-amber-500/30 flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Unlock size={16} className="text-amber-500" />
                        <span className="font-bold text-sm text-slate-900 dark:text-white">
                          Session Super-Administrateur Verifiee
                        </span>
                      </div>
                      <p className="text-slate-500 dark:text-white/70">
                        Connecte sous : <strong className="text-amber-600 dark:text-amber-300">{config.primaryAdminEmail}</strong>
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleToggleMaintenance}
                        className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
                          config.maintenanceMode
                            ? 'bg-red-600 text-white'
                            : 'bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-white'
                        }`}
                      >
                        <Power size={13} />
                        <span>{config.maintenanceMode ? 'Maintenance ACTIVE' : 'Mode Normal'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Cartes d'action d'urgence */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 space-y-2">
                      <div className="flex items-center justify-between text-slate-500 dark:text-white/60">
                        <span>Biometrie</span>
                        <Fingerprint size={16} className={config.biometricEnabled ? 'text-cyan-400' : 'text-slate-400'} />
                      </div>
                      <div className="text-base font-bold text-slate-900 dark:text-white">
                        {config.biometricEnabled ? 'Empreinte Active' : 'Non active'}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-white/50">
                        Verification instantanee sur smartphone et PC.
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 space-y-2">
                      <div className="flex items-center justify-between text-slate-500 dark:text-white/60">
                        <span>Code PIN Maitre</span>
                        <Key size={16} className="text-amber-500" />
                      </div>
                      <div className="text-base font-bold text-slate-900 dark:text-white">
                        {config.isPinConfigured ? 'PIN Configure' : 'PIN par defaut (0000)'}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-white/50">
                        Protection cryptographique par hachage SHA-256.
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 space-y-2">
                      <div className="flex items-center justify-between text-slate-500 dark:text-white/60">
                        <span>Verrouillage Auto</span>
                        <Clock size={16} className="text-indigo-400" />
                      </div>
                      <div className="text-base font-bold text-slate-900 dark:text-white">
                        {config.autoLockMinutes} minutes
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-white/50">
                        Fermeture automatique de session en cas d'inactivite.
                      </p>
                    </div>
                  </div>

                  {/* Killswitch d'Urgence */}
                  <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/25 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <div className="font-bold text-red-600 dark:text-red-400 flex items-center gap-1.5 text-xs">
                        <AlertTriangle size={15} />
                        <span>Killswitch d'Urgence Global</span>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-white/70">
                        Revoque toutes les sessions ouvertes, coupe les connexions et active la maintenance privee en 1 clic.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleKillswitch}
                      className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shrink-0 cursor-pointer shadow-md shadow-red-600/30 transition-all"
                    >
                      Declencher le Killswitch
                    </button>
                  </div>
                </div>
              )}

              {/* ONGLET 2 : UTILISATEURS */}
              {activeTab === 'users' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-slate-900 dark:text-white text-xs">
                      Comptes & Permissions Administratives
                    </h3>
                    <span className="text-slate-400 text-[11px]">
                      {managedUsers.length} utilisateurs enregistres
                    </span>
                  </div>

                  <div className="space-y-2">
                    {managedUsers.map((u) => (
                      <div
                        key={u.id}
                        className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5"
                      >
                        <div className="space-y-0.5 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 dark:text-white truncate">
                              {u.fullName}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                                u.role === 'super_admin'
                                  ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300'
                                  : u.role === 'admin'
                                  ? 'bg-indigo-500/20 text-indigo-700 dark:text-indigo-300'
                                  : 'bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-white/60'
                              }`}
                            >
                              {u.role}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-white/50 font-mono">
                            {u.email}
                          </p>
                        </div>

                        {u.role !== 'super_admin' && (
                          <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                            <select
                              value={u.role}
                              onChange={(e) => handleUserRoleChange(u.id, e.target.value as any)}
                              className="px-2 py-1 bg-white dark:bg-surface-900 border border-slate-300 dark:border-white/10 rounded-lg text-xs"
                            >
                              <option value="admin">Admin</option>
                              <option value="user">Utilisateur standard</option>
                              <option value="restricted">Restreint (Lecture seule)</option>
                            </select>

                            <button
                              type="button"
                              onClick={() => handleUserStatusToggle(u.id)}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold cursor-pointer ${
                                u.status === 'active'
                                  ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                                  : 'bg-red-500/15 text-red-700 dark:text-red-300'
                              }`}
                            >
                              {u.status === 'active' ? 'Actif' : 'Suspendu'}
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ONGLET 3 : SÉCURITÉ & PIN */}
              {activeTab === 'security' && (
                <div className="space-y-4">
                  {/* Modifier le PIN */}
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Key size={15} className="text-amber-500" />
                        <span className="font-bold text-slate-900 dark:text-white">
                          Code PIN Maitre Secret
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsChangingPin(!isChangingPin)}
                        className="text-xs text-amber-600 dark:text-amber-400 font-semibold hover:underline cursor-pointer"
                      >
                        {isChangingPin ? 'Annuler' : 'Modifier le code PIN'}
                      </button>
                    </div>

                    {isChangingPin ? (
                      <form onSubmit={handleSaveNewPin} className="space-y-3 pt-2">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-medium text-slate-700 dark:text-white/80 mb-1">
                              Nouveau code PIN (min 4 caracteres)
                            </label>
                            <input
                              type="password"
                              value={newPin}
                              onChange={(e) => setNewPin(e.target.value)}
                              placeholder="••••"
                              required
                              className="w-full px-3 py-2 bg-white dark:bg-surface-900 border border-slate-300 dark:border-white/10 rounded-lg font-mono text-xs"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-medium text-slate-700 dark:text-white/80 mb-1">
                              Confirmer le nouveau PIN
                            </label>
                            <input
                              type="password"
                              value={confirmPin}
                              onChange={(e) => setConfirmPin(e.target.value)}
                              placeholder="••••"
                              required
                              className="w-full px-3 py-2 bg-white dark:bg-surface-900 border border-slate-300 dark:border-white/10 rounded-lg font-mono text-xs"
                            />
                          </div>
                        </div>

                        <div className="flex justify-end">
                          <button
                            type="submit"
                            className="px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs cursor-pointer"
                          >
                            Enregistrer le nouveau PIN
                          </button>
                        </div>
                      </form>
                    ) : (
                      <p className="text-[11px] text-slate-500 dark:text-white/60">
                        Votre code PIN maitre est actif et chiffre avec SHA-256. Il est demande a chaque tentative de deverrouillage.
                      </p>
                    )}
                  </div>

                  {/* Gestion Empreinte Digitale */}
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Fingerprint size={16} className="text-cyan-400" />
                        <span className="font-bold text-slate-900 dark:text-white">
                          Capteur Biometrique WebAuthn
                        </span>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-600 dark:text-cyan-300 font-bold font-mono">
                        {config.biometricEnabled ? 'Lie a cet appareil' : 'Non configure'}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-500 dark:text-white/60 leading-relaxed">
                      L'empreinte digitale permet une authentification instantanee a l'aide du capteur physique de votre telephone Android / iPhone ou du lecteur d'empreinte / Windows Hello de votre ordinateur.
                    </p>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleEnrollBiometrics}
                        disabled={isVerifyingBio}
                        className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                      >
                        <Fingerprint size={14} />
                        <span>{config.biometricEnabled ? 'Mettre a jour l empreinte' : 'Enregistrer une empreinte'}</span>
                      </button>

                      {config.biometricEnabled && (
                        <button
                          type="button"
                          onClick={() => {
                            saveAdminConfig({ ...config, biometricEnabled: false, biometricCredentialId: undefined });
                            setConfig(getAdminConfig());
                            showNotification('Capteur biometrique desactive.');
                          }}
                          className="px-3 py-1.5 rounded-lg border border-red-500/30 text-red-500 hover:bg-red-500/10 font-medium text-xs cursor-pointer"
                        >
                          Dissocier le capteur
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* ONGLET 4 : JOURNAL D'AUDIT */}
              {activeTab === 'audit' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-slate-900 dark:text-white text-xs">
                      Historique de Securite & Tentatives d'Acces
                    </h3>
                    {auditLogs.length > 0 && (
                      <button
                        type="button"
                        onClick={handleClearLogs}
                        className="text-red-500 hover:text-red-600 text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 size={11} />
                        <span>Effacer les logs</span>
                      </button>
                    )}
                  </div>

                  {auditLogs.length === 0 ? (
                    <div className="p-6 text-center text-slate-400 text-xs rounded-xl border border-dashed border-slate-200 dark:border-white/10">
                      Aucun evenement de securite recent.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-72 overflow-y-auto">
                      {auditLogs.map((log) => (
                        <div
                          key={log.id}
                          className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-between gap-2 text-[11px]"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span
                              className={`w-2 h-2 rounded-full shrink-0 ${
                                log.success ? 'bg-emerald-500' : 'bg-red-500'
                              }`}
                            />
                            <span className="font-semibold text-slate-900 dark:text-white truncate">
                              {log.details}
                            </span>
                          </div>

                          <div className="text-right text-[10px] font-mono text-slate-400 shrink-0">
                            {new Date(log.timestamp).toLocaleTimeString('fr-FR')}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="p-3 sm:p-4 border-t border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-surface-900/40 flex items-center justify-between text-[11px] text-slate-500 shrink-0">
          <span className="flex items-center gap-1">
            <ShieldCheck size={13} className="text-amber-500" />
            <span>NEXUS AI Super-Admin Security Protocol v3.0</span>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1 rounded-lg border border-slate-300 dark:border-white/10 text-slate-700 dark:text-white/80 hover:bg-slate-100 dark:hover:bg-white/5 font-medium cursor-pointer"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
