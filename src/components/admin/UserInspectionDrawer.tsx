/**
 * src/components/admin/UserInspectionDrawer.tsx
 *
 * Tiroir d'Inspection Detaillee pour l'Espace Super-Admin (NEXUS AI) :
 * 1. Profil complet : Identifiant unique, e-mail, role, statut, date de creation, derniere activite
 * 2. Metriques d'utilisation : Requetes executees, total tokens, prompt vs completion, cout ($ USD), modele prefere
 * 3. Environnement : Systeme d'exploitation, navigateur, derniere adresse IP enregistree
 * 4. Gouvernance des Quotas : Modification dynamique du plafond mensuel de jetons avec jauges et presets
 * 5. Projets du Lab : Liste des espaces de travail, fichiers, gabarits et dates de mise a jour
 *
 * Design : Liquid-Glass natif avec animation de tiroir lateral (slide-over).
 * Regle absolue : ZERO-EMOJI.
 */

import { useState, useEffect } from 'react';
import {
  X,
  Copy,
  Check,
  User,
  Mail,
  Activity,
  Cpu,
  DollarSign,
  Sparkles,
  Laptop,
  Globe,
  Sliders,
  Folder,
  Calendar,
  Clock,
  Layers,
  UserCheck,
  UserX,
  FileCode,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import type { ManagedUser } from '@/types/admin';

interface UserInspectionDrawerProps {
  user: ManagedUser | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateRole: (userId: string, newRole: ManagedUser['role']) => void;
  onToggleStatus: (userId: string) => void;
  onUpdateQuota: (userId: string, quotaLimit: number) => void;
  onDeleteUser: (userId: string) => void;
}

const QUOTA_PRESETS = [
  { label: '50K Decouverte', value: 50000 },
  { label: '250K Standard', value: 250000 },
  { label: '1M Pro Dev', value: 1000000 },
  { label: '5M Entreprise', value: 5000000 },
  { label: '10M Illimite', value: 10000000 },
];

function formatDate(dateStr?: string): string {
  if (!dateStr) return 'Non renseignee';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return new Intl.DateTimeFormat('fr-FR', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(d);
  } catch {
    return dateStr;
  }
}

function formatRelativeTime(dateStr?: string): string {
  if (!dateStr) return 'Jamais actif';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const diffMs = Date.now() - d.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60) return 'A l instant';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `Il y a ${diffMin} min`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `Il y a ${diffHours} h`;
    const diffDays = Math.floor(diffHours / 24);
    return `Il y a ${diffDays} j`;
  } catch {
    return dateStr;
  }
}

export function UserInspectionDrawer({
  user,
  isOpen,
  onClose,
  onUpdateRole,
  onToggleStatus,
  onUpdateQuota,
  onDeleteUser,
}: UserInspectionDrawerProps) {
  const [copiedId, setCopiedId] = useState(false);
  const [quotaInput, setQuotaInput] = useState<number>(user?.tokenQuotaLimit || 100000);
  const [quotaSavedFeedback, setQuotaSavedFeedback] = useState(false);

  useEffect(() => {
    if (user) {
      setQuotaInput(user.tokenQuotaLimit || 100000);
      setQuotaSavedFeedback(false);
    }
  }, [user]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !user) return null;

  const handleCopyId = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(user.id);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  const handleApplyQuota = () => {
    onUpdateQuota(user.id, quotaInput);
    setQuotaSavedFeedback(true);
    setTimeout(() => setQuotaSavedFeedback(false), 2500);
  };

  const totalTokens = user.metrics.tokensConsumed || 1;
  const promptTokens = user.metrics.promptTokens || 0;
  const completionTokens = user.metrics.completionTokens || 0;
  const promptRatio = Math.round((promptTokens / totalTokens) * 100);
  const completionRatio = Math.max(0, 100 - promptRatio);

  const quotaLimit = user.tokenQuotaLimit || 1000000;
  const quotaUsedPercent = Math.min(100, Math.round((user.metrics.tokensConsumed / quotaLimit) * 100));

  const roleLabels: Record<ManagedUser['role'], string> = {
    super_admin: 'Super Administrateur',
    admin: 'Administrateur',
    pro_dev: 'Developpeur Pro',
    user: 'Utilisateur Standard',
    restricted: 'Acces Restreint',
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      {/* Arriere-plan semi-transparent avec flou liquide */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-md transition-opacity animate-in fade-in duration-200"
      />

      {/* Conteneur principal du Tiroir Lateral (Slide-Over) en Liquid-Glass */}
      <div className="relative w-full max-w-xl h-full liquid-glass bg-white/95 dark:bg-[#0c1022]/95 border-l border-amber-500/40 dark:border-amber-400/30 shadow-[0_0_80px_rgba(0,0,0,0.6)] flex flex-col z-10 transition-transform duration-300 animate-in slide-in-from-right">
        {/* En-tete du tiroir */}
        <div className="relative px-6 py-4 border-b border-amber-500/30 liquid-glass shrink-0 flex items-center justify-between">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-amber-400 to-transparent" />
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-700 flex items-center justify-center text-white shadow-md shadow-amber-500/30 font-bold font-mono text-base shrink-0">
              {user.fullName ? user.fullName[0].toUpperCase() : 'U'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base leading-tight">
                  Tiroir d Inspection Detaillee
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-300 font-mono text-[10px] font-bold">
                  {roleLabels[user.role]}
                </span>
              </div>
              <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                Observabilite chirurgicale du compte utilisateur
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
            title="Fermer le tiroir"
          >
            <X size={18} />
          </button>
        </div>

        {/* Corps scrollable du tiroir */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-slate-700 dark:text-slate-300">
          {/* SECTION 1 : PROFIL COMPLET */}
          <div className="liquid-glass liquid-glass-card rounded-2xl p-4 border border-slate-200/80 dark:border-white/10 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-white/10 pb-2.5">
              <span className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-xs uppercase tracking-wider">
                <User size={14} className="text-amber-500" />
                <span>Profil Complet du Compte</span>
              </span>
              <span
                className={cn(
                  'px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1',
                  user.status === 'active'
                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                    : 'bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30',
                )}
              >
                {user.status === 'active' ? <UserCheck size={11} /> : <UserX size={11} />}
                <span>{user.status === 'active' ? 'Compte Actif' : 'Compte Suspendu'}</span>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {/* Nom & Email */}
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 block uppercase font-mono">Nom et Prenom</span>
                <span className="font-bold text-slate-900 dark:text-white text-sm block">{user.fullName}</span>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 block uppercase font-mono">Adresse E-mail</span>
                <div className="flex items-center gap-1.5 font-mono text-slate-800 dark:text-slate-200">
                  <Mail size={12} className="text-slate-400" />
                  <span className="truncate">{user.email}</span>
                </div>
              </div>

              {/* ID Unique avec bouton Copier */}
              <div className="space-y-1 sm:col-span-2">
                <span className="text-[10px] text-slate-400 block uppercase font-mono">Identifiant Unique (UID)</span>
                <div className="flex items-center gap-2">
                  <div className="flex-1 px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-black/30 border border-slate-200 dark:border-white/10 font-mono text-[11px] text-amber-700 dark:text-amber-300 truncate">
                    {user.id}
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyId}
                    className="px-2.5 py-1.5 rounded-lg liquid-glass-pill hover:border-amber-400 flex items-center gap-1 font-mono text-[11px] text-slate-700 dark:text-slate-200 cursor-pointer transition-all"
                  >
                    {copiedId ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                    <span>{copiedId ? 'Copie !' : 'Copier'}</span>
                  </button>
                </div>
              </div>

              {/* Dates de creation et activite */}
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/5 space-y-1">
                <span className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
                  <Calendar size={11} className="text-amber-500" />
                  <span>Date de Creation</span>
                </span>
                <span className="font-mono text-slate-900 dark:text-white font-medium block">
                  {formatDate(user.createdAt)}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/5 space-y-1">
                <span className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
                  <Clock size={11} className="text-cyan-500" />
                  <span>Derniere Activite</span>
                </span>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-slate-900 dark:text-white font-medium">
                    {formatDate(user.lastSeen)}
                  </span>
                  <span className="text-[10px] font-mono text-cyan-600 dark:text-cyan-400">
                    {formatRelativeTime(user.lastSeen)}
                  </span>
                </div>
              </div>
            </div>

            {/* Gestion rapide du Role et Statut */}
            <div className="pt-2 border-t border-slate-200/80 dark:border-white/10 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-400 uppercase font-mono">Modifier le Role :</span>
                <select
                  value={user.role}
                  onChange={(e) => onUpdateRole(user.id, e.target.value as ManagedUser['role'])}
                  disabled={user.role === 'super_admin'}
                  className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-white/15 text-slate-900 dark:text-white font-medium text-xs disabled:opacity-50"
                >
                  <option value="super_admin">Super Administrateur</option>
                  <option value="admin">Administrateur</option>
                  <option value="pro_dev">Developpeur Pro</option>
                  <option value="user">Utilisateur Standard</option>
                  <option value="restricted">Restreint</option>
                </select>
              </div>

              {user.role !== 'super_admin' && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onToggleStatus(user.id)}
                    className={cn(
                      'px-3 py-1 rounded-lg font-semibold text-xs transition-colors cursor-pointer border',
                      user.status === 'active'
                        ? 'border-red-500/40 text-red-600 dark:text-red-400 hover:bg-red-500/10'
                        : 'border-emerald-500/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10',
                    )}
                  >
                    {user.status === 'active' ? 'Suspendre l acces' : 'Reactiver le compte'}
                  </button>

                  <button
                    type="button"
                    onClick={() => onDeleteUser(user.id)}
                    className="px-2.5 py-1 rounded-lg text-slate-400 hover:text-red-500 dark:hover:text-red-400 text-xs transition-colors cursor-pointer"
                    title="Supprimer definitivement"
                  >
                    Supprimer
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* SECTION 2 : METRIQUES D'UTILISATION */}
          <div className="liquid-glass liquid-glass-card rounded-2xl p-4 border border-slate-200/80 dark:border-white/10 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-white/10 pb-2.5">
              <span className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-xs uppercase tracking-wider">
                <Activity size={14} className="text-cyan-500" />
                <span>Metriques d Utilisation & Consommation</span>
              </span>
              <span className="font-mono text-cyan-600 dark:text-cyan-400 font-bold text-[11px]">
                {user.metrics.totalRequests} requetes executees
              </span>
            </div>

            {/* Cartes de valeurs clés */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/5 space-y-1">
                <span className="text-[10px] text-slate-400 block font-mono flex items-center gap-1">
                  <Cpu size={11} className="text-amber-500" />
                  <span>Total Tokens</span>
                </span>
                <span className="font-bold text-slate-900 dark:text-white font-mono text-sm block">
                  {user.metrics.tokensConsumed.toLocaleString()}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/5 space-y-1">
                <span className="text-[10px] text-slate-400 block font-mono flex items-center gap-1">
                  <DollarSign size={11} className="text-emerald-500" />
                  <span>Cout Estime ($)</span>
                </span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono text-sm block">
                  ${user.metrics.estimatedCostUsd.toFixed(2)} USD
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/5 space-y-1 sm:col-span-2">
                <span className="text-[10px] text-slate-400 block font-mono flex items-center gap-1">
                  <Sparkles size={11} className="text-indigo-500" />
                  <span>Modele IA Prefere</span>
                </span>
                <span className="font-semibold text-slate-900 dark:text-white truncate block">
                  {user.metrics.preferredModel}
                </span>
              </div>
            </div>

            {/* Repartition des Tokens : Prompt vs Completion */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/5 space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-semibold text-slate-900 dark:text-white flex items-center gap-1">
                  <span>Repartition Tokens : Invite (Prompt) vs Completion</span>
                </span>
                <span className="font-mono text-slate-400 text-[10px]">
                  {promptTokens.toLocaleString()} / {completionTokens.toLocaleString()}
                </span>
              </div>

              {/* Jauge bicolore horizontale */}
              <div className="w-full h-3 rounded-full bg-slate-200 dark:bg-black/40 overflow-hidden flex">
                <div
                  style={{ width: `${promptRatio}%` }}
                  className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-500"
                  title={`Prompt : ${promptRatio}% (${promptTokens.toLocaleString()} tokens)`}
                />
                <div
                  style={{ width: `${completionRatio}%` }}
                  className="h-full bg-gradient-to-r from-amber-500 to-amber-400 transition-all duration-500"
                  title={`Completion : ${completionRatio}% (${completionTokens.toLocaleString()} tokens)`}
                />
              </div>

              <div className="flex items-center justify-between text-[10px] font-mono pt-0.5">
                <span className="flex items-center gap-1.5 text-cyan-600 dark:text-cyan-400 font-bold">
                  <span className="w-2 h-2 rounded-full bg-cyan-500" />
                  <span>Prompt : {promptRatio}% ({promptTokens.toLocaleString()})</span>
                </span>
                <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-bold">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <span>Completion : {completionRatio}% ({completionTokens.toLocaleString()})</span>
                </span>
              </div>
            </div>
          </div>

          {/* SECTION 3 : ENVIRONNEMENT */}
          <div className="liquid-glass liquid-glass-card rounded-2xl p-4 border border-slate-200/80 dark:border-white/10 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-white/10 pb-2.5">
              <span className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-xs uppercase tracking-wider">
                <Laptop size={14} className="text-emerald-500" />
                <span>Environnement & Empreinte Client</span>
              </span>
              <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/10 font-mono text-[10px] text-slate-600 dark:text-slate-300">
                Securise
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/5 space-y-1">
                <span className="text-[10px] text-slate-400 block font-mono flex items-center gap-1">
                  <Laptop size={11} className="text-emerald-500" />
                  <span>Appareil & Navigateur</span>
                </span>
                <p className="font-medium text-slate-900 dark:text-white text-xs leading-snug">
                  {user.metrics.deviceInfo || 'Chrome 122 sur Windows (Capteur Biometrique)'}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/5 space-y-1">
                <span className="text-[10px] text-slate-400 block font-mono flex items-center gap-1">
                  <Globe size={11} className="text-cyan-500" />
                  <span>Derniere Adresse IP Enregistree</span>
                </span>
                <p className="font-mono font-bold text-slate-900 dark:text-white text-xs leading-snug">
                  {user.metrics.lastActiveIp || '192.168.1.1 (Reseau Prive Super-Admin)'}
                </p>
              </div>
            </div>
          </div>

          {/* SECTION 4 : GOUVERNANCE DES QUOTAS */}
          <div className="liquid-glass liquid-glass-card rounded-2xl p-4 border border-slate-200/80 dark:border-white/10 space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-white/10 pb-2.5">
              <span className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-xs uppercase tracking-wider">
                <Sliders size={14} className="text-amber-500" />
                <span>Gouvernance des Quotas Mensuels</span>
              </span>
              <span className="font-mono text-amber-600 dark:text-amber-400 font-bold text-[11px]">
                {quotaUsedPercent}% utilise
              </span>
            </div>

            {/* Jauge de consommation du quota */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-slate-500 dark:text-slate-400">
                  Consomme : <strong>{user.metrics.tokensConsumed.toLocaleString()}</strong> tokens
                </span>
                <span className="text-slate-900 dark:text-white font-bold">
                  Plafond : {quotaLimit.toLocaleString()} tokens
                </span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-slate-200 dark:bg-black/40 overflow-hidden">
                <div
                  style={{ width: `${quotaUsedPercent}%` }}
                  className={cn(
                    'h-full transition-all duration-500',
                    quotaUsedPercent > 90
                      ? 'bg-red-500'
                      : quotaUsedPercent > 70
                      ? 'bg-amber-500'
                      : 'bg-gradient-to-r from-emerald-500 to-cyan-500',
                  )}
                />
              </div>
            </div>

            {/* Presets rapides de quotas */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[10px] text-slate-400 uppercase font-mono block">
                Palettes Rapides de Quotas
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {QUOTA_PRESETS.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setQuotaInput(p.value)}
                    className={cn(
                      'px-2.5 py-1.5 rounded-xl liquid-glass-pill text-[11px] font-mono transition-all cursor-pointer text-left',
                      quotaInput === p.value
                        ? 'border-amber-500 dark:border-amber-400 bg-amber-500/15 text-amber-700 dark:text-amber-300 font-bold shadow-xs'
                        : 'border-slate-200/80 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:border-amber-400/50',
                    )}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Saisie personnalisee et validation */}
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="flex-1 relative">
                <input
                  type="number"
                  value={quotaInput}
                  onChange={(e) => setQuotaInput(Math.max(0, parseInt(e.target.value, 10) || 0))}
                  step={50000}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-white/15 font-mono text-xs text-slate-900 dark:text-white"
                  placeholder="Ex: 500000"
                />
                <span className="absolute right-3 top-2.5 text-[10px] font-mono text-slate-400">tokens</span>
              </div>
              <button
                type="button"
                onClick={handleApplyQuota}
                className="px-4 py-2 rounded-xl liquid-glass-pill bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/30 cursor-pointer transition-all"
              >
                {quotaSavedFeedback ? <Check size={14} className="text-slate-950" /> : <Sliders size={14} />}
                <span>{quotaSavedFeedback ? 'Quota Applique !' : 'Appliquer le Quota'}</span>
              </button>
            </div>
          </div>

          {/* SECTION 5 : PROJETS DU LAB */}
          <div className="liquid-glass liquid-glass-card rounded-2xl p-4 border border-slate-200/80 dark:border-white/10 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-white/10 pb-2.5">
              <span className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-xs uppercase tracking-wider">
                <Folder size={14} className="text-amber-500" />
                <span>Espaces de Travail & Projets du Lab</span>
              </span>
              <span className="font-mono text-amber-600 dark:text-amber-400 font-bold text-[11px]">
                {user.recentProjects?.length || 0} projet(s)
              </span>
            </div>

            {user.recentProjects && user.recentProjects.length > 0 ? (
              <div className="space-y-2">
                {user.recentProjects.map((project) => (
                  <div
                    key={project.id}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/70 dark:border-white/5 flex items-center justify-between gap-3 hover:border-amber-400/40 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                        <FileCode size={16} />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-semibold text-slate-900 dark:text-white text-xs truncate">
                          {project.name}
                        </h4>
                        <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400 pt-0.5">
                          <span>Gabarit : <strong className="text-slate-600 dark:text-slate-200 uppercase">{project.template}</strong></span>
                          <span>•</span>
                          <span>{project.fileCount} fichier(s)</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[10px] text-slate-400 font-mono block">Mise a jour</span>
                      <span className="text-[11px] font-mono text-slate-700 dark:text-slate-300 font-medium">
                        {formatDate(project.updatedAt)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center rounded-xl bg-slate-50/50 dark:bg-white/5 border border-dashed border-slate-300 dark:border-white/10 space-y-1.5">
                <Layers size={22} className="mx-auto text-slate-400" />
                <p className="text-slate-500 dark:text-slate-400 text-xs font-medium">
                  Aucun projet actif dans le Studio pour cet utilisateur
                </p>
                <p className="text-[10px] text-slate-400 font-mono">
                  Les projets crees ou clones apparaitront automatiquement ici.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Pied de page du tiroir */}
        <div className="p-4 border-t border-slate-200/80 dark:border-white/10 bg-slate-50 dark:bg-surface-900/40 flex items-center justify-between text-[11px] shrink-0">
          <span className="font-mono text-slate-400 text-[10px]">
            Super-Admin Inspection Suite • ID: {user.id}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg liquid-glass-pill hover:border-amber-400 text-slate-800 dark:text-white font-semibold text-xs cursor-pointer transition-all"
          >
            Fermer l Inspection
          </button>
        </div>
      </div>
    </div>
  );
}
