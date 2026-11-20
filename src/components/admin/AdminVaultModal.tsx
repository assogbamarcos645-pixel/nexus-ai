/**
 * src/components/admin/AdminVaultModal.tsx
 *
 * Espace Super-Admin exclusif avec observabilite totale et controle exhaustif :
 * 1. Triple facteur de securite biometrique (Email, PIN SHA-256, Empreinte WebAuthn)
 * 2. Observabilite totale du systeme (telemetrie temps reel, moteurs IA, couts, sante)
 * 3. Gestion et vue exhaustive de tous les utilisateurs (metriques individuelles, quotas, roles, fiches)
 * 4. Mode maintenance et Killswitch d'urgence
 */

import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Fingerprint,
  Lock,
  Unlock,
  Key,
  Users,
  AlertTriangle,
  RefreshCw,
  Eye,
  EyeOff,
  Power,
  Trash2,
  Check,
  Search,
  Download,
  Cpu,
  Globe,
  HardDrive,
  UserCheck,
  UserX,
  X,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { ModalCloseButton } from '@/components/ui/ModalCloseButton';
import type {
  AdminSecurityConfig,
  AdminAuditEntry,
  ManagedUser,
  SystemFullMetrics,
} from '@/types/admin';
import {
  getAdminConfig,
  saveAdminConfig,
  isVaultUnlocked,
  unlockVaultSession,
  lockVaultSession,
  isEmailAuthorizedAdmin,
  addAllowedAdminEmail,
  removeAllowedAdminEmail,
  verifyMasterAdminPin,
  setMasterAdminPin,
  isBiometricsSupported,
  registerBiometricCredential,
  verifyBiometricCredential,
  getAdminAuditLogs,
  clearAdminAuditLogs,
  getManagedUsers,
  updateManagedUserRole,
  updateManagedUserQuota,
  toggleManagedUserStatus,
  deleteManagedUser,
  exportUsersDataAsJson,
  exportUsersDataAsCsv,
  getSystemFullMetrics,
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

  // Authentification & Deverrouillage
  const [emailInput, setEmailInput] = useState('');
  const [pinInput, setPinInput] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [isVerifyingBio, setIsVerifyingBio] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Donnees systeme et utilisateurs
  const [managedUsers, setManagedUsers] = useState<ManagedUser[]>([]);
  const [systemMetrics, setSystemMetrics] = useState<SystemFullMetrics>(getSystemFullMetrics());
  const [auditLogs, setAuditLogs] = useState<AdminAuditEntry[]>([]);

  // Recherche et filtres utilisateurs
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<string>('all');
  const [selectedUserForDetail, setSelectedUserForDetail] = useState<ManagedUser | null>(null);

  // Configuration securite & PIN
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [isChangingPin, setIsChangingPin] = useState(false);
  const [newAdminEmail, setNewAdminEmail] = useState('');

  // Quota utilisateur temporaire en édition
  const [editingQuotaValue, setEditingQuotaValue] = useState<number>(100000);

  useEffect(() => {
    if (isOpen) {
      const cfg = getAdminConfig();
      setConfig(cfg);
      setIsUnlocked(isVaultUnlocked());
      setManagedUsers(getManagedUsers());
      setSystemMetrics(getSystemFullMetrics());
      setAuditLogs(getAdminAuditLogs());
      setAuthError(null);
      setPinInput('');
      setEmailInput(user?.email || cfg.primaryAdminEmail);
      setSelectedUserForDetail(null);
    }
  }, [isOpen, user]);

  const showNotification = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 3000);
  };

  const reloadData = () => {
    setManagedUsers(getManagedUsers());
    setSystemMetrics(getSystemFullMetrics());
    setAuditLogs(getAdminAuditLogs());
    setConfig(getAdminConfig());
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

    if (!isEmailAuthorizedAdmin(emailInput)) {
      setAuthError('Cette adresse e-mail ne figure pas sur la liste des Super-Administrateurs.');
      logAdminAudit('failed_attempt', false, `Refus acces e-mail : ${emailInput}`);
      return;
    }

    const isValidPin = await verifyMasterAdminPin(pinInput);
    if (!isValidPin) {
      setAuthError('Code PIN maitre incorrect.');
      logAdminAudit('failed_attempt', false, `Echec code PIN pour ${emailInput}`);
      return;
    }

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
    reloadData();
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
      reloadData();
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

  const handleAddAdminEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminEmail.trim()) return;
    const ok = addAllowedAdminEmail(newAdminEmail.trim());
    if (ok) {
      setConfig(getAdminConfig());
      setNewAdminEmail('');
      showNotification('Nouvel e-mail administrateur autorise.');
    }
  };

  const handleRemoveAdminEmail = (email: string) => {
    const ok = removeAllowedAdminEmail(email);
    if (ok) {
      setConfig(getAdminConfig());
      showNotification('E-mail administrateur retire.');
    }
  };

  const handleToggleMaintenance = () => {
    const nextState = !config.maintenanceMode;
    toggleMaintenanceMode(nextState);
    setConfig(getAdminConfig());
    setSystemMetrics(getSystemFullMetrics());
    showNotification(nextState ? 'Mode maintenance active.' : 'Mode maintenance desactive.');
  };

  const handleKillswitch = () => {
    if (
      window.confirm(
        'ATTENTION : Activer le Killswitch d urgence va deconnecter immediatement toutes les sessions actives et basculer l application en mode maintenance privee. Confirmer ?',
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

  const handleDeleteUser = (userId: string) => {
    if (window.confirm('Etes-vous sur de vouloir supprimer definitivement cet utilisateur ?')) {
      const ok = deleteManagedUser(userId);
      if (ok) {
        setManagedUsers(getManagedUsers());
        if (selectedUserForDetail?.id === userId) setSelectedUserForDetail(null);
        showNotification('Utilisateur supprime.');
      }
    }
  };

  const handleSaveUserQuota = (userId: string) => {
    updateManagedUserQuota(userId, editingQuotaValue);
    setManagedUsers(getManagedUsers());
    if (selectedUserForDetail && selectedUserForDetail.id === userId) {
      setSelectedUserForDetail({ ...selectedUserForDetail, tokenQuotaLimit: editingQuotaValue });
    }
    showNotification(`Quota ajuste a ${editingQuotaValue.toLocaleString()} tokens.`);
  };

  const handleExportJson = () => {
    const jsonStr = exportUsersDataAsJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nexus_users_audit_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showNotification('Exportation JSON telechargee.');
  };

  const handleExportCsv = () => {
    const csvStr = exportUsersDataAsCsv();
    const blob = new Blob([csvStr], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nexus_users_metrics_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showNotification('Exportation CSV telechargee.');
  };

  const handleClearLogs = () => {
    clearAdminAuditLogs();
    setAuditLogs([]);
    showNotification('Historique d audit efface.');
  };

  // Filtrage réactif de la liste des utilisateurs
  const filteredUsers = useMemo(() => {
    return managedUsers.filter((u) => {
      const matchesSearch =
        u.fullName.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
        u.id.toLowerCase().includes(userSearchQuery.toLowerCase());

      const matchesRole =
        userRoleFilter === 'all'
          ? true
          : userRoleFilter === 'active'
          ? u.status === 'active'
          : userRoleFilter === 'suspended'
          ? u.status === 'suspended'
          : u.role === userRoleFilter;

      return matchesSearch && matchesRole;
    });
  }, [managedUsers, userSearchQuery, userRoleFilter]);

  if (!isOpen) return null;
  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      className="fixed inset-0 z-[160] flex items-center justify-center p-2.5 sm:p-5 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-200 cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-5xl bg-white dark:bg-[#090a18] border border-amber-500/30 rounded-3xl shadow-[0_0_60px_rgba(245,158,11,0.25)] flex flex-col max-h-[94vh] overflow-hidden cursor-default text-xs"
      >
        {/* Toast interne */}
        {successToast && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl bg-emerald-600 text-white font-medium shadow-lg flex items-center gap-2 animate-in slide-in-from-top duration-150">
            <Check size={14} />
            <span>{successToast}</span>
          </div>
        )}

        {/* En-tete Super-Admin */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 dark:border-white/10 bg-gradient-to-r from-amber-500/15 via-slate-100 dark:via-white/5 to-transparent shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 via-amber-600 to-amber-700 flex items-center justify-center text-white shadow-md shadow-amber-500/30 shrink-0">
              <Shield size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-sm text-slate-900 dark:text-white">
                  Espace Super-Admin & Observabilite Totale
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 font-mono text-[10px] font-bold uppercase tracking-wider">
                  Controle Absolu
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-white/60">
                Gouvernance globale des utilisateurs, telemetrie en temps reel et securite biometrique.
              </p>
            </div>
          </div>
          <ModalCloseButton onClick={onClose} />
        </div>

        {/* CONTENU : Écran Verrouillé vs Cockpit Déverrouillé */}
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
                    {config.isPinConfigured ? 'PIN securise' : 'PIN par defaut : 0000'}
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

            {isBiometricsSupported() && !config.biometricEnabled && (
              <div className="w-full p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-between gap-2 text-left">
                <div className="space-y-0.5">
                  <div className="font-semibold text-cyan-800 dark:text-cyan-300 flex items-center gap-1.5">
                    <Fingerprint size={14} />
                    <span>Lier votre empreinte digitale</span>
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-cyan-200/70">
                    Activez la reconnaissance biometrique sur ce smartphone ou ordinateur.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleEnrollBiometrics}
                  disabled={isVerifyingBio}
                  className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-[11px] shrink-0 cursor-pointer shadow-xs"
                >
                  {isVerifyingBio ? 'Scan...' : 'Enregistrer'}
                </button>
              </div>
            )}
          </div>
        ) : (
          /* ====================================================================
             ÉCRAN DÉVERROUILLÉ : COCKPIT SUPER-ADMIN & OBSERVABILITÉ TOTALE
             ==================================================================== */
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Barre d'indicateurs de tête */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 bg-slate-50 dark:bg-white/4 border-b border-slate-200 dark:border-white/10 shrink-0 text-xs">
              <div className="p-2.5 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/5">
                <div className="flex items-center justify-between text-slate-400 text-[11px] mb-1">
                  <span>Utilisateurs Enregistres</span>
                  <Users size={13} className="text-amber-500" />
                </div>
                <div className="text-base font-bold text-slate-900 dark:text-white font-mono">
                  {systemMetrics.totalUsersCount} ({systemMetrics.activeUsersCount} actifs)
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/5">
                <div className="flex items-center justify-between text-slate-400 text-[11px] mb-1">
                  <span>Tokens Cumules</span>
                  <Cpu size={13} className="text-cyan-400" />
                </div>
                <div className="text-base font-bold text-slate-900 dark:text-white font-mono">
                  {systemMetrics.totalTokensConsumed.toLocaleString()}
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/5">
                <div className="flex items-center justify-between text-slate-400 text-[11px] mb-1">
                  <span>Depenses Totales</span>
                  <Globe size={13} className="text-emerald-400" />
                </div>
                <div className="text-base font-bold text-slate-900 dark:text-white font-mono">
                  {systemMetrics.totalEstimatedCostUsd.toFixed(2)}$ USD
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/5">
                <div className="flex items-center justify-between text-slate-400 text-[11px] mb-1">
                  <span>Projets & Versions Lab</span>
                  <HardDrive size={13} className="text-indigo-400" />
                </div>
                <div className="text-base font-bold text-slate-900 dark:text-white font-mono">
                  {systemMetrics.totalProjectsCount} projets / {systemMetrics.totalSnapshotsCount} snaps
                </div>
              </div>
            </div>

            {/* Barre de navigation d'onglets */}
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
                  Vue d'ensemble & Moteurs IA
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
                  Vue Utilisateurs ({managedUsers.length})
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
                  Securite Biometrique & PIN
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
                  Audit ({auditLogs.length})
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={reloadData}
                  title="Actualiser les metriques"
                  className="p-1.5 text-slate-500 hover:text-slate-800 dark:text-white/60 dark:hover:text-white cursor-pointer"
                >
                  <RefreshCw size={13} />
                </button>
                <button
                  type="button"
                  onClick={handleManualLock}
                  className="px-3 py-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Lock size={12} />
                  <span>Verrouiller</span>
                </button>
              </div>
            </div>

            {/* Corps selon l'onglet actif */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
              {/* ================================================================
                 ONGLET 1 : VUE D'ENSEMBLE & TÉLÉMÉTRIE DES MOTEURS IA
                 ================================================================ */}
              {activeTab === 'overview' && (
                <div className="space-y-4">
                  {/* Status Super-Admin */}
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-cyan-500/10 to-transparent border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Unlock size={16} className="text-amber-500" />
                        <span className="font-bold text-sm text-slate-900 dark:text-white">
                          Session Super-Administrateur Verifiee
                        </span>
                      </div>
                      <p className="text-slate-500 dark:text-white/70">
                        Compte titulaire exclusif : <strong className="text-amber-600 dark:text-amber-300">{config.primaryAdminEmail}</strong>
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

                  {/* Sante en direct des Moteurs IA */}
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/4 border border-slate-200 dark:border-white/10 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Cpu size={15} className="text-cyan-400" />
                        <h3 className="font-bold text-slate-900 dark:text-white">
                          Sante & Latence des Fournisseurs d'Intelligence Artificielle
                        </h3>
                      </div>
                      <span className="text-[11px] text-slate-400 font-mono">
                        Moteur actif : {systemMetrics.activeAiProvider.toUpperCase()} ({systemMetrics.activeAiModel})
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                      {systemMetrics.providersHealth.map((p) => (
                        <div
                          key={p.id}
                          className="p-3 rounded-xl bg-white dark:bg-surface-900 border border-slate-200 dark:border-white/10 flex items-center justify-between"
                        >
                          <div className="space-y-0.5">
                            <span className="font-bold text-slate-900 dark:text-white truncate block">
                              {p.name}
                            </span>
                            <span className="text-[10px] text-slate-400 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              <span>Operationnel</span>
                            </span>
                          </div>
                          <div className="text-right font-mono text-[11px] font-bold text-cyan-500">
                            {p.latencyMs}ms
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Actions critiques : Killswitch */}
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

              {/* ================================================================
                 ONGLET 2 : VUE EXHAUSTIVE DE TOUS LES UTILISATEURS
                 ================================================================ */}
              {activeTab === 'users' && (
                <div className="space-y-4">
                  {/* Barre d'outils de gestion et d'export */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2 flex-1">
                      <div className="relative flex-1">
                        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          value={userSearchQuery}
                          onChange={(e) => setUserSearchQuery(e.target.value)}
                          placeholder="Rechercher par nom, e-mail ou identifiant..."
                          className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-xs focus:outline-none focus:border-amber-500"
                        />
                      </div>

                      <select
                        value={userRoleFilter}
                        onChange={(e) => setUserRoleFilter(e.target.value)}
                        className="px-3 py-1.5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-medium cursor-pointer"
                      >
                        <option value="all">Tous les utilisateurs</option>
                        <option value="active">Actifs uniquement</option>
                        <option value="suspended">Suspendus</option>
                        <option value="super_admin">Super-Administrateurs</option>
                        <option value="pro_dev">Developpeurs Pro</option>
                        <option value="user">Utilisateurs standards</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={handleExportJson}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/15 font-semibold text-slate-700 dark:text-white flex items-center gap-1.5 cursor-pointer"
                      >
                        <Download size={13} />
                        <span>Export JSON</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleExportCsv}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/15 font-semibold text-slate-700 dark:text-white flex items-center gap-1.5 cursor-pointer"
                      >
                        <Download size={13} />
                        <span>Export CSV</span>
                      </button>
                    </div>
                  </div>

                  {/* Liste complète des utilisateurs */}
                  <div className="space-y-2.5">
                    {filteredUsers.length === 0 ? (
                      <div className="p-8 text-center text-slate-400 rounded-2xl border border-dashed border-slate-200 dark:border-white/10">
                        Aucun utilisateur ne correspond a votre recherche.
                      </div>
                    ) : (
                      filteredUsers.map((u) => (
                        <div
                          key={u.id}
                          className={`p-3.5 sm:p-4 rounded-2xl border transition-all ${
                            u.status === 'suspended'
                              ? 'bg-red-500/5 border-red-500/20 opacity-70'
                              : 'bg-slate-50/80 dark:bg-white/4 border-slate-200 dark:border-white/10 hover:border-amber-500/30'
                          }`}
                        >
                          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
                            {/* Identité */}
                            <div className="space-y-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-slate-900 dark:text-white text-xs sm:text-[13px]">
                                  {u.fullName}
                                </span>
                                <span
                                  className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase ${
                                    u.role === 'super_admin'
                                      ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300'
                                      : u.role === 'pro_dev'
                                      ? 'bg-cyan-500/20 text-cyan-700 dark:text-cyan-300'
                                      : u.role === 'admin'
                                      ? 'bg-indigo-500/20 text-indigo-700 dark:text-indigo-300'
                                      : 'bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-white/60'
                                  }`}
                                >
                                  {u.role}
                                </span>
                                <span
                                  className={`px-2 py-0.2 rounded-full text-[9px] font-bold ${
                                    u.status === 'active'
                                      ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300'
                                      : 'bg-red-500/20 text-red-600 dark:text-red-300'
                                  }`}
                                >
                                  {u.status === 'active' ? 'Compte Actif' : 'Suspendu'}
                                </span>
                              </div>

                              <p className="text-[11px] font-mono text-slate-500 dark:text-white/60">
                                {u.email} • ID : <span className="text-slate-400">{u.id}</span>
                              </p>

                              {/* Métriques détaillées par utilisateur */}
                              <div className="flex flex-wrap items-center gap-2.5 pt-1 text-[11px] text-slate-600 dark:text-white/70">
                                <span className="font-mono">
                                  <strong>{u.metrics.totalRequests}</strong> req.
                                </span>
                                <span>•</span>
                                <span className="font-mono">
                                  <strong>{u.metrics.tokensConsumed.toLocaleString()}</strong> tokens ({u.metrics.estimatedCostUsd.toFixed(2)}$)
                                </span>
                                <span>•</span>
                                <span>
                                  Modele : <strong>{u.metrics.preferredModel}</strong>
                                </span>
                                <span>•</span>
                                <span>
                                  Projets Lab : <strong>{u.metrics.projectsCount}</strong>
                                </span>
                              </div>
                            </div>

                            {/* Actions administratives */}
                            <div className="flex items-center gap-2 shrink-0 self-end lg:self-center">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedUserForDetail(u);
                                  setEditingQuotaValue(u.tokenQuotaLimit || 100000);
                                }}
                                className="px-2.5 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 font-semibold text-[11px] cursor-pointer"
                              >
                                Fiche Complete
                              </button>

                              {u.role !== 'super_admin' && (
                                <>
                                  <select
                                    value={u.role}
                                    onChange={(e) => handleUserRoleChange(u.id, e.target.value as any)}
                                    className="px-2 py-1 bg-white dark:bg-surface-900 border border-slate-300 dark:border-white/10 rounded-lg text-xs"
                                  >
                                    <option value="admin">Admin</option>
                                    <option value="pro_dev">Dev Pro</option>
                                    <option value="user">Utilisateur</option>
                                    <option value="restricted">Restreint</option>
                                  </select>

                                  <button
                                    type="button"
                                    onClick={() => handleUserStatusToggle(u.id)}
                                    className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                                      u.status === 'active'
                                        ? 'border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10'
                                        : 'border-red-500/30 text-red-500 hover:bg-red-500/10'
                                    }`}
                                    title={u.status === 'active' ? 'Suspendre l utilisateur' : 'Reactiver l utilisateur'}
                                  >
                                    {u.status === 'active' ? <UserCheck size={13} /> : <UserX size={13} />}
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleDeleteUser(u.id)}
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 dark:hover:text-red-400 cursor-pointer"
                                    title="Supprimer definitivement"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* ================================================================
                 ONGLET 3 : SÉCURITÉ BIOMÉTRIQUE & CODES MAÎTRES
                 ================================================================ */}
              {activeTab === 'security' && (
                <div className="space-y-4">
                  {/* Code PIN Maître */}
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/4 border border-slate-200 dark:border-white/10 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Key size={16} className="text-amber-500" />
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
                            className="px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs cursor-pointer shadow-xs"
                          >
                            Enregistrer le nouveau PIN
                          </button>
                        </div>
                      </form>
                    ) : (
                      <p className="text-[11px] text-slate-500 dark:text-white/60">
                        Votre code PIN maitre est actif et chiffre avec SHA-256. Il protege l'acces au coffre meme en l'absence de capteur biometrique.
                      </p>
                    )}
                  </div>

                  {/* Gestion Empreinte Digitale */}
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/4 border border-slate-200 dark:border-white/10 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Fingerprint size={16} className="text-cyan-400" />
                        <span className="font-bold text-slate-900 dark:text-white">
                          Capteur Biometrique WebAuthn (Touch ID, Windows Hello, Android)
                        </span>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-600 dark:text-cyan-300 font-bold font-mono">
                        {config.biometricEnabled ? 'Lie a cet appareil' : 'Non configure'}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-500 dark:text-white/60 leading-relaxed">
                      L'empreinte digitale permet une authentification instantanee sans saisir de mot de passe en utilisant le materiel integre a votre smartphone ou ordinateur.
                    </p>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleEnrollBiometrics}
                        disabled={isVerifyingBio}
                        className="px-3.5 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
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
                          className="px-3 py-1.5 rounded-xl border border-red-500/30 text-red-500 hover:bg-red-500/10 font-medium text-xs cursor-pointer"
                        >
                          Dissocier le capteur
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Liste blanche des e-mails Super-Admin */}
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/4 border border-slate-200 dark:border-white/10 space-y-3">
                    <div className="flex items-center gap-2">
                      <ShieldCheck size={16} className="text-emerald-500" />
                      <span className="font-bold text-slate-900 dark:text-white">
                        Liste Blanche des E-mails Super-Administrateurs
                      </span>
                    </div>

                    <form onSubmit={handleAddAdminEmail} className="flex gap-2">
                      <input
                        type="email"
                        value={newAdminEmail}
                        onChange={(e) => setNewAdminEmail(e.target.value)}
                        placeholder="Ajouter une adresse e-mail autorisee..."
                        className="flex-1 px-3 py-1.5 bg-white dark:bg-surface-900 border border-slate-200 dark:border-white/10 rounded-xl text-xs"
                      />
                      <button
                        type="submit"
                        className="px-3 py-1.5 rounded-xl bg-slate-900 dark:bg-white/10 text-white font-semibold text-xs cursor-pointer"
                      >
                        Autoriser
                      </button>
                    </form>

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {config.allowedAdminEmails.map((em) => (
                        <span
                          key={em}
                          className="px-2.5 py-1 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-800 dark:text-amber-300 font-mono text-[11px] flex items-center gap-1.5"
                        >
                          <span>{em}</span>
                          {em.toLowerCase() !== config.primaryAdminEmail.toLowerCase() && (
                            <button
                              type="button"
                              onClick={() => handleRemoveAdminEmail(em)}
                              className="text-amber-500 hover:text-red-500 cursor-pointer"
                            >
                              <X size={12} />
                            </button>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ================================================================
                 ONGLET 4 : JOURNAL D'AUDIT DE SÉCURITÉ
                 ================================================================ */}
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
                    <div className="space-y-2 max-h-80 overflow-y-auto">
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
                            <span className="text-[9px] font-mono text-slate-400 truncate hidden sm:inline">
                              ({log.ipOrDevice})
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

        {/* Modal de détail d'un utilisateur */}
        {selectedUserForDetail && (
          <div className="absolute inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150">
            <div className="bg-white dark:bg-[#0f1026] border border-amber-500/40 rounded-2xl max-w-lg w-full p-5 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-500 font-bold flex items-center justify-center">
                    {selectedUserForDetail.fullName[0]}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                      {selectedUserForDetail.fullName}
                    </h4>
                    <p className="text-[11px] font-mono text-slate-400">{selectedUserForDetail.email}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedUserForDetail(null)}
                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
                >
                  <X size={15} />
                </button>
              </div>

              {/* Statistiques détaillées de l'utilisateur */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5">
                  <span className="text-slate-400 text-[10px] block">Tokens Consommes</span>
                  <span className="font-bold text-slate-900 dark:text-white font-mono text-sm">
                    {selectedUserForDetail.metrics.tokensConsumed.toLocaleString()}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5">
                  <span className="text-slate-400 text-[10px] block">Cout Estime ($)</span>
                  <span className="font-bold text-slate-900 dark:text-white font-mono text-sm">
                    {selectedUserForDetail.metrics.estimatedCostUsd.toFixed(2)}$ USD
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5">
                  <span className="text-slate-400 text-[10px] block">Modele Favori</span>
                  <span className="font-semibold text-slate-900 dark:text-white truncate block">
                    {selectedUserForDetail.metrics.preferredModel}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5">
                  <span className="text-slate-400 text-[10px] block">Projets Lab</span>
                  <span className="font-bold text-slate-900 dark:text-white font-mono text-sm">
                    {selectedUserForDetail.metrics.projectsCount} projets
                  </span>
                </div>
              </div>

              {/* Quota personnalisé */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 space-y-2">
                <label className="block font-semibold text-slate-800 dark:text-white text-xs">
                  Plafond de Quota Personnalise (Tokens)
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={editingQuotaValue}
                    onChange={(e) => setEditingQuotaValue(parseInt(e.target.value, 10) || 0)}
                    step={10000}
                    className="flex-1 px-3 py-1.5 bg-white dark:bg-surface-900 border border-slate-200 dark:border-white/10 rounded-lg font-mono text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => handleSaveUserQuota(selectedUserForDetail.id)}
                    className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs cursor-pointer shadow-xs"
                  >
                    Sauvegarder
                  </button>
                </div>
              </div>

              {/* Projets récents créés */}
              {selectedUserForDetail.recentProjects && selectedUserForDetail.recentProjects.length > 0 && (
                <div className="space-y-1.5">
                  <span className="font-semibold text-slate-400 text-[10px] uppercase tracking-wider block">
                    Projets Récents dans le Studio
                  </span>
                  <div className="space-y-1">
                    {selectedUserForDetail.recentProjects.map((p) => (
                      <div
                        key={p.id}
                        className="p-2 rounded-lg bg-slate-50 dark:bg-white/5 flex items-center justify-between text-xs"
                      >
                        <span className="font-medium text-slate-900 dark:text-white">{p.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{p.fileCount} fichiers</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedUserForDetail(null)}
                  className="px-4 py-1.5 rounded-lg bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-white font-semibold text-xs cursor-pointer"
                >
                  Fermer la fiche
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="p-3 sm:p-4 border-t border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-surface-900/40 flex items-center justify-between text-[11px] text-slate-500 shrink-0">
          <span className="flex items-center gap-1.5">
            <ShieldCheck size={14} className="text-amber-500" />
            <span>NEXUS AI Super-Admin Security Protocol v3.0 • Observabilite Active</span>
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
