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
  Clock,
  ArrowRight,
  Delete,
} from 'lucide-react';
import { cn } from '@/utils/cn';
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

const KEYPAD_MATRIX: Array<{ key: string; sub: string }> = [
  { key: '1', sub: '' },
  { key: '2', sub: 'ABC' },
  { key: '3', sub: 'DEF' },
  { key: '4', sub: 'GHI' },
  { key: '5', sub: 'JKL' },
  { key: '6', sub: 'MNO' },
  { key: '7', sub: 'PQRS' },
  { key: '8', sub: 'TUV' },
  { key: '9', sub: 'WXYZ' },
  { key: 'clear', sub: 'RESET' },
  { key: '0', sub: '+' },
  { key: 'backspace', sub: 'DEL' },
];

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

  // Ergonomie de connexion cybernetique
  const [loginMode, setLoginMode] = useState<'biometric' | 'pin'>('pin');
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutTimer, setLockoutTimer] = useState(0);

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
      setIsEditingEmail(false);

      if (isBiometricsSupported() && cfg.biometricEnabled) {
        setLoginMode('biometric');
      } else {
        setLoginMode('pin');
      }
    }
  }, [isOpen, user]);

  // Compte a rebours anti brute-force
  useEffect(() => {
    if (lockoutTimer <= 0) return;
    const interval = setInterval(() => {
      setLockoutTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [lockoutTimer]);

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

  const handleKeypadPress = (val: string) => {
    if (lockoutTimer > 0) return;
    setAuthError(null);
    if (val === 'clear') {
      setPinInput('');
    } else if (val === 'backspace') {
      setPinInput((prev) => prev.slice(0, -1));
    } else {
      if (pinInput.length < 12) {
        setPinInput((prev) => prev + val);
      }
    }
  };

  const handleUnlockWithPinAndEmail = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (lockoutTimer > 0) return;
    setAuthError(null);

    if (!isEmailAuthorizedAdmin(emailInput)) {
      setAuthError('Cette adresse e-mail ne figure pas sur la liste des Super-Administrateurs.');
      logAdminAudit('failed_attempt', false, `Refus acces e-mail : ${emailInput}`);
      return;
    }

    if (!pinInput || pinInput.length < 4) {
      setAuthError('Veuillez saisir un code PIN d au moins 4 chiffres.');
      return;
    }

    const isValidPin = await verifyMasterAdminPin(pinInput);
    if (!isValidPin) {
      const nextFails = failedAttempts + 1;
      setFailedAttempts(nextFails);
      if (nextFails >= 5) {
        setLockoutTimer(30);
        setFailedAttempts(0);
        setAuthError('5 tentatives infructueuses consecutives. Coffre temporairement verrouille pendant 30 secondes.');
      } else {
        setAuthError(`Code PIN maitre incorrect. Tentative ${nextFails}/5 avant verrouillage temporaire.`);
      }
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

    setFailedAttempts(0);
    unlockVaultSession();
    setIsUnlocked(true);
    setAuthError(null);
    reloadData();
    logAdminAudit('unlock_pin', true, `Deverrouillage reussi pour ${emailInput}`);
    showNotification('Authentification Super-Admin validee.');
  };

  const handleBiometricDirectUnlock = async () => {
    if (lockoutTimer > 0) return;
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

      setFailedAttempts(0);
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
        className={cn(
          'relative w-full max-h-[92dvh] sm:max-h-[90vh] flex flex-col overflow-hidden cursor-default text-xs transition-all duration-300',
          !isUnlocked
            ? 'max-w-sm sm:max-w-md bg-white/95 dark:bg-[#0c1022]/95 liquid-glass border border-amber-500/40 dark:border-amber-400/40 rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.4)] dark:shadow-[0_0_70px_rgba(245,158,11,0.25)] backdrop-blur-2xl'
            : 'max-w-5xl bg-white/95 dark:bg-[#090a18]/95 liquid-glass border border-amber-500/30 rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.3)]',
        )}
      >
        {/* Toast interne */}
        {successToast && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl bg-emerald-600 text-white font-medium shadow-lg flex items-center gap-2 animate-in slide-in-from-top duration-150">
            <Check size={14} />
            <span>{successToast}</span>
          </div>
        )}

        {/* ─── EN-TÊTE : PORTE BLINDÉE vs COCKPIT DÉVERROUILLÉ ─── */}
        {!isUnlocked ? (
          /* ====================================================================
             EN-TÊTE PORTE DU COFFRE (VAULT ENTRANCE) EN LIQUID-GLASS
             ==================================================================== */
          <div className="relative flex items-center justify-between px-4 sm:px-5 py-3 border-b border-amber-500/30 liquid-glass shrink-0">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-amber-400 to-transparent animate-pulse" />
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-700 flex items-center justify-center text-white shadow-md shadow-amber-500/30 shrink-0">
                <Shield size={16} />
              </div>
              <div className="text-left">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-xs tracking-wider text-amber-600 dark:text-amber-400">
                    NEXUS VAULT
                  </span>
                  <span className="text-[10px] text-slate-400 dark:text-white/40 font-mono">//</span>
                  <span className="px-1.5 py-0.2 rounded-md bg-amber-500/20 text-amber-700 dark:text-amber-300 font-mono text-[9px] font-bold uppercase tracking-wider">
                    Clairance 5
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-white/50 font-mono leading-tight">
                  ACCES RESTREINT AU PROPRIETAIRE
                </p>
              </div>
            </div>
            <ModalCloseButton onClick={onClose} />
          </div>
        ) : (
          /* ====================================================================
             EN-TÊTE COCKPIT SUPER-ADMIN DÉVERROUILLÉ EN LIQUID-GLASS
             ==================================================================== */
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200/80 dark:border-white/10 liquid-glass shrink-0">
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
        )}

        {/* CONTENU : Écran Verrouillé vs Cockpit Déverrouillé */}
        {!isUnlocked ? (
          /* ====================================================================
             ÉCRAN DE CONNEXION CYBERNÉTIQUE HAUTE SÉCURITÉ EN LIQUID-GLASS
             ==================================================================== */
          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 sm:p-5 space-y-3.5 flex flex-col items-center text-center w-full">
            {/* Arrière-plan subtil Matrix Grid */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(245,158,11,0.12),transparent_70%)] pointer-events-none" />
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none" />

            {/* Emblème Holographique Compact */}
            <div className="relative z-10 shrink-0 my-0.5">
              <div className="relative w-13 h-13 sm:w-14 sm:h-14 rounded-2xl liquid-glass border-2 border-amber-400/70 flex items-center justify-center text-amber-500 dark:text-amber-400 shadow-[0_0_25px_rgba(245,158,11,0.35)]">
                <Lock size={24} className="drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-slate-900 border-2 border-cyan-400 flex items-center justify-center text-cyan-400 shadow-md">
                  <Fingerprint size={11} />
                </div>
              </div>
            </div>

            {/* Titre & Sous-titre Technologique */}
            <div className="relative z-10 space-y-0.5 shrink-0">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white tracking-wide">
                Portail d Acces Super-Admin
              </h3>
              <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-tight">
                Authentification protegee FIDO2 & SHA-256 sous Liquid Glass.
              </p>
            </div>

            {/* Carte Passeport d'Identité Super-Admin en Liquid Glass */}
            <div className="relative z-10 w-full p-2.5 sm:p-3 rounded-2xl liquid-glass liquid-glass-card border border-amber-500/35 flex items-center justify-between gap-2.5 text-left shadow-sm shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="relative shrink-0">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-600 via-amber-500 to-amber-400 p-0.5 shadow-sm shadow-amber-500/40">
                    <div className="w-full h-full rounded-[10px] bg-slate-900 flex items-center justify-center font-bold text-xs text-amber-400 font-mono">
                      MA
                    </div>
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900 flex items-center justify-center text-white">
                    <Check size={7} strokeWidth={3} />
                  </div>
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-bold text-slate-900 dark:text-white text-xs truncate">
                      Marcos Assogba
                    </span>
                    <span className="px-1.5 py-0.2 rounded-md bg-amber-500/20 text-amber-700 dark:text-amber-300 font-mono text-[9px] font-bold uppercase tracking-wider">
                      Proprietaire
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate font-mono mt-0.5">
                    {emailInput}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsEditingEmail(!isEditingEmail)}
                className="px-2 py-1 rounded-lg liquid-glass-pill hover:border-amber-400 text-slate-700 dark:text-white/80 text-[10px] font-medium transition-colors shrink-0 cursor-pointer border border-slate-200/80 dark:border-white/10"
              >
                {isEditingEmail ? 'Fermer' : 'Changer'}
              </button>
            </div>

            {/* Saisie d'email personnalisé si activée */}
            {isEditingEmail && (
              <div className="relative z-10 w-full space-y-1 text-left animate-in fade-in duration-150 shrink-0">
                <label className="block text-[10px] font-semibold text-slate-700 dark:text-white/80">
                  Adresse e-mail administrateur autorisee :
                </label>
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="marcosassogba645@gmail.com"
                    className="flex-1 px-3 py-1.5 liquid-glass border border-slate-300/80 dark:border-white/15 rounded-xl text-slate-900 dark:text-white font-mono text-xs focus:outline-none focus:border-amber-500"
                  />
                  <button
                    type="button"
                    onClick={() => setIsEditingEmail(false)}
                    className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs cursor-pointer shadow-xs transition-colors"
                  >
                    OK
                  </button>
                </div>
              </div>
            )}

            {/* Sélecteur d'onglets de connexion : Biométrie vs Code PIN en Liquid Glass Pill */}
            <div className="relative z-10 w-full flex items-center p-1 rounded-2xl liquid-glass-pill border border-slate-200/80 dark:border-white/10 shadow-inner shrink-0">
              <button
                type="button"
                onClick={() => {
                  setLoginMode('biometric');
                  setAuthError(null);
                }}
                className={cn(
                  'flex-1 py-1.5 sm:py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer',
                  loginMode === 'biometric'
                    ? 'bg-gradient-to-r from-cyan-600 to-cyan-500 text-white shadow-md shadow-cyan-500/30'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white',
                )}
              >
                <Fingerprint size={14} />
                <span>Empreinte Digitale</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setLoginMode('pin');
                  setAuthError(null);
                }}
                className={cn(
                  'flex-1 py-1.5 sm:py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer',
                  loginMode === 'pin'
                    ? 'bg-gradient-to-r from-amber-600 to-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/30'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white',
                )}
              >
                <Key size={13} />
                <span>Code PIN & Pave</span>
              </button>
            </div>

            {/* Alerte de verrouillage temporaire anti brute-force */}
            {lockoutTimer > 0 && (
              <div className="relative z-10 w-full p-3.5 rounded-2xl bg-red-500/15 border-2 border-red-500/50 text-red-600 dark:text-red-300 flex items-center gap-3 text-left shrink-0">
                <Clock size={22} className="shrink-0 animate-spin text-red-500" />
                <div className="text-xs">
                  <p className="font-bold text-red-700 dark:text-red-200">Securite Anti-Intrusion Active</p>
                  <p className="text-[11px] opacity-90 mt-0.5">
                    Acces temporairement verrouille. Reessayez dans{' '}
                    <span className="font-mono font-bold text-sm text-red-600 dark:text-red-400">{lockoutTimer}s</span>.
                  </p>
                </div>
              </div>
            )}

            {/* Message d'erreur d'authentification */}
            {authError && lockoutTimer === 0 && (
              <div className="relative z-10 w-full p-2.5 rounded-xl bg-red-500/15 border border-red-500/40 text-red-600 dark:text-red-300 flex items-center gap-2 text-left text-xs animate-in fade-in duration-150 shrink-0">
                <ShieldAlert size={15} className="shrink-0 text-red-500" />
                <span>{authError}</span>
              </div>
            )}

            {/* ─── ONGLET 1 : RECONNAISSANCE BIOMÉTRIQUE ─── */}
            {loginMode === 'biometric' && (
              <div className="relative z-10 w-full py-1 flex flex-col items-center justify-center space-y-3 animate-in fade-in duration-150">
                {/* Grand Scanner Biométrique Tactile */}
                <div className="relative my-1">
                  <button
                    type="button"
                    onClick={handleBiometricDirectUnlock}
                    disabled={isVerifyingBio || lockoutTimer > 0}
                    className="group relative w-24 h-24 sm:w-28 sm:h-28 rounded-full p-1.5 liquid-glass border-2 border-cyan-400/50 flex items-center justify-center shadow-[0_0_35px_rgba(6,182,212,0.4)] hover:shadow-[0_0_55px_rgba(6,182,212,0.65)] transition-all cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="absolute -inset-2 rounded-full border border-dashed border-cyan-400/40 animate-spin [animation-duration:14s] pointer-events-none" />
                    <div className="absolute -inset-3.5 rounded-full border border-cyan-500/20 animate-pulse pointer-events-none" />

                    <div className="w-full h-full rounded-full liquid-glass flex flex-col items-center justify-center relative overflow-hidden">
                      <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_10px_#22d3ee] animate-pulse" />

                      {isVerifyingBio ? (
                        <RefreshCw size={36} className="text-cyan-500 dark:text-cyan-400 animate-spin" />
                      ) : (
                        <Fingerprint
                          size={42}
                          className="text-cyan-500 dark:text-cyan-400 group-hover:scale-110 transition-all duration-300 drop-shadow-[0_0_12px_rgba(34,211,238,0.7)]"
                        />
                      )}
                    </div>
                  </button>
                </div>

                <div className="text-center space-y-0.5">
                  <p className="font-semibold text-xs text-slate-800 dark:text-white">
                    {isVerifyingBio
                      ? 'Numerisation de l empreinte en cours...'
                      : 'Appuyez pour scanner votre empreinte'}
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    Windows Hello, Touch ID, Face ID et capteurs mobiles.
                  </p>
                </div>

                {isBiometricsSupported() && !config.biometricEnabled && (
                  <div className="w-full p-2.5 rounded-xl liquid-glass border border-cyan-500/30 flex items-center justify-between gap-2.5 text-left">
                    <div className="min-w-0">
                      <p className="font-bold text-xs text-cyan-700 dark:text-cyan-300">
                        Capteur detecte
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">
                        Enregistrez votre empreinte sur cet appareil.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleEnrollBiometrics}
                      disabled={isVerifyingBio || lockoutTimer > 0}
                      className="px-2.5 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-[10px] shrink-0 cursor-pointer shadow-xs disabled:opacity-50 transition-colors"
                    >
                      {isVerifyingBio ? 'Scan...' : 'Enregistrer'}
                    </button>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setLoginMode('pin')}
                  className="text-[10px] text-slate-500 dark:text-slate-400 hover:text-amber-500 dark:hover:text-amber-400 font-medium transition-colors flex items-center gap-1 pt-1 cursor-pointer"
                >
                  <Key size={12} />
                  <span>Basculer sur le code PIN maitre</span>
                </button>
              </div>
            )}

            {/* ─── ONGLET 2 : CODE PIN & PAVÉ TACTILE NUMÉRIQUE ─── */}
            {loginMode === 'pin' && (
              <form onSubmit={handleUnlockWithPinAndEmail} className="relative z-10 w-full space-y-3 text-left animate-in fade-in duration-150">
                {/* Pastilles PIN Lumineuses (PIN Dots) */}
                <div className="flex flex-col items-center justify-center space-y-1.5 py-0.5 shrink-0">
                  <div className="flex items-center justify-center gap-2.5">
                    {[0, 1, 2, 3, 4, 5].map((idx) => {
                      const isFilled = pinInput.length > idx;
                      return (
                        <div
                          key={idx}
                          className={cn(
                            'w-3.5 h-3.5 rounded-full transition-all duration-200 flex items-center justify-center liquid-glass border',
                            isFilled
                              ? 'bg-gradient-to-tr from-amber-500 to-amber-300 shadow-[0_0_14px_rgba(245,158,11,0.95)] scale-110 border-amber-300 dark:border-amber-200'
                              : 'border-slate-300/80 dark:border-white/20 bg-transparent',
                          )}
                        >
                          {isFilled && <div className="w-1 h-1 rounded-full bg-slate-950" />}
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                    <span>{config.isPinConfigured ? 'Protege SHA-256' : 'PIN initial : 0000'}</span>
                    <span>•</span>
                    <button
                      type="button"
                      onClick={() => setShowPin(!showPin)}
                      className="hover:text-amber-600 dark:hover:text-amber-400 cursor-pointer flex items-center gap-1"
                    >
                      {showPin ? <EyeOff size={11} /> : <Eye size={11} />}
                      <span>{showPin ? 'Masquer' : 'Afficher'}</span>
                    </button>
                  </div>
                  {showPin && pinInput.length > 0 && (
                    <div className="font-mono text-sm tracking-widest font-bold text-amber-600 dark:text-amber-400">
                      {pinInput}
                    </div>
                  )}
                </div>

                {/* Saisie clavier invisible pour capturer la frappe desktop physique */}
                <input
                  type="password"
                  value={pinInput}
                  onChange={(e) => {
                    if (lockoutTimer > 0) return;
                    setPinInput(e.target.value.replace(/[^0-9]/g, ''));
                  }}
                  autoFocus
                  maxLength={12}
                  className="sr-only"
                  tabIndex={0}
                />

                {/* Pavé Numérique Virtuel Compact (3x4) */}
                <div className="grid grid-cols-3 gap-1.5 sm:gap-2 max-w-[260px] mx-auto w-full shrink-0">
                  {KEYPAD_MATRIX.map((item) => {
                    if (item.key === 'clear') {
                      return (
                        <button
                          key={item.key}
                          type="button"
                          onClick={() => handleKeypadPress('clear')}
                          disabled={lockoutTimer > 0 || pinInput.length === 0}
                          className="h-10 sm:h-11 rounded-xl liquid-glass liquid-glass-card hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold text-xs flex flex-col items-center justify-center transition-all active:scale-95 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed border border-amber-500/40"
                        >
                          <span className="leading-none">C</span>
                          <span className="text-[7px] font-mono opacity-60">EFFACER</span>
                        </button>
                      );
                    }
                    if (item.key === 'backspace') {
                      return (
                        <button
                          key={item.key}
                          type="button"
                          onClick={() => handleKeypadPress('backspace')}
                          disabled={lockoutTimer > 0 || pinInput.length === 0}
                          className="h-10 sm:h-11 rounded-xl liquid-glass liquid-glass-card text-slate-600 dark:text-white/70 flex flex-col items-center justify-center transition-all active:scale-95 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed border border-slate-200/80 dark:border-white/10"
                        >
                          <Delete size={15} />
                          <span className="text-[7px] font-mono opacity-50">RETOUR</span>
                        </button>
                      );
                    }
                    return (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => handleKeypadPress(item.key)}
                        disabled={lockoutTimer > 0 || pinInput.length >= 12}
                        className="h-10 sm:h-11 rounded-xl liquid-glass liquid-glass-card hover:border-amber-400/60 text-slate-900 dark:text-white border border-slate-200/80 dark:border-white/10 flex flex-col items-center justify-center transition-all active:scale-95 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed group shadow-xs"
                      >
                        <span className="font-mono font-bold text-sm sm:text-base leading-none group-hover:text-amber-500 dark:group-hover:text-amber-400 transition-colors">
                          {item.key}
                        </span>
                        {item.sub && (
                          <span className="text-[7px] font-mono text-slate-400 dark:text-white/40 tracking-wider mt-0.5 leading-none">
                            {item.sub}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Bouton Soumettre le Code PIN en Liquid Glass Pill */}
                <div className="pt-1 shrink-0">
                  <button
                    type="submit"
                    disabled={lockoutTimer > 0 || pinInput.length < 4}
                    className="w-full py-2.5 px-4 rounded-xl liquid-glass-pill bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 disabled:opacity-35 disabled:cursor-not-allowed text-slate-950 font-bold flex items-center justify-center gap-2 shadow-lg shadow-amber-500/30 cursor-pointer transition-all text-xs tracking-wide"
                  >
                    <Key size={13} className="text-slate-950" />
                    <span>Deverrouiller le Coffre</span>
                    <ArrowRight size={13} className="text-slate-950" />
                  </button>
                </div>
              </form>
            )}

            {/* Pied de page : Garanties de Sécurité en Liquid Glass Capsules */}
            <div className="relative z-10 pt-2.5 border-t border-slate-200/80 dark:border-white/10 w-full grid grid-cols-3 gap-1.5 text-center text-[9px] text-slate-500 dark:text-slate-400 shrink-0">
              <div className="p-1.5 rounded-xl liquid-glass-pill flex flex-col items-center gap-0.5 border border-slate-200/80 dark:border-white/10">
                <ShieldCheck size={12} className="text-emerald-500" />
                <span className="font-mono tracking-wider">SHA-256</span>
              </div>
              <div className="p-1.5 rounded-xl liquid-glass-pill flex flex-col items-center gap-0.5 border border-slate-200/80 dark:border-white/10">
                <Fingerprint size={12} className="text-cyan-500 dark:text-cyan-400" />
                <span className="font-mono tracking-wider">WEBAUTHN</span>
              </div>
              <div className="p-1.5 rounded-xl liquid-glass-pill flex flex-col items-center gap-0.5 border border-slate-200/80 dark:border-white/10">
                <Clock size={12} className="text-amber-500 dark:text-amber-400" />
                <span className="font-mono tracking-wider">15 MIN</span>
              </div>
            </div>
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
