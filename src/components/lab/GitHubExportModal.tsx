/**
 * src/components/lab/GitHubExportModal.tsx
 *
 * Fenêtre modale d'exportation directe One-Click vers GitHub pour NEXUS LAB.
 * Permet de créer un dépôt GitHub public ou privé et de synchroniser tous les fichiers du projet.
 */

import { useState, useEffect } from 'react';
import {
  FolderGit2,
  Lock,
  Globe,
  ExternalLink,
  Check,
  AlertCircle,
  Eye,
  EyeOff,
  Copy,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import type { LabProject } from '@/types/lab';
import {
  getSavedGitHubToken,
  saveGitHubToken,
  exportProjectToGitHub,
  type GitHubExportResult,
} from '@/services/lab/githubExportService';
import { ModalCloseButton } from '@/components/ui/ModalCloseButton';

interface GitHubExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: LabProject | null;
}

export function GitHubExportModal({ isOpen, onClose, project }: GitHubExportModalProps) {
  const [token, setToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [rememberToken, setRememberToken] = useState(true);
  const [repoName, setRepoName] = useState('');
  const [description, setDescription] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);

  const [isExporting, setIsExporting] = useState(false);
  const [progressStep, setProgressStep] = useState('');
  const [progressPercent, setProgressPercent] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [exportResult, setExportResult] = useState<GitHubExportResult | null>(null);
  const [copiedClone, setCopiedClone] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const saved = getSavedGitHubToken();
      if (saved) {
        setToken(saved);
      }
      if (project) {
        const slug = project.name
          .toLowerCase()
          .replace(/[^a-z0-9_-]/g, '-')
          .replace(/-+/g, '-');
        setRepoName(slug || 'mon-projet-nexus');
        setDescription(`Créé avec NEXUS AI • Modèle ${project.templateId || 'personnalisé'}`);
      }
      setErrorMsg(null);
      setExportResult(null);
      setProgressPercent(0);
      setProgressStep('');
    }
  }, [isOpen, project]);

  if (!isOpen || !project) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim()) {
      setErrorMsg('Veuillez renseigner votre Personal Access Token (PAT) GitHub.');
      return;
    }
    if (!repoName.trim()) {
      setErrorMsg('Veuillez indiquer un nom de dépôt valide.');
      return;
    }

    if (rememberToken) {
      saveGitHubToken(token);
    } else {
      saveGitHubToken('');
    }

    setIsExporting(true);
    setErrorMsg(null);
    setExportResult(null);

    const result = await exportProjectToGitHub({
      token,
      repoName,
      description,
      isPrivate,
      project,
      onProgress: (step, percent) => {
        setProgressStep(step);
        setProgressPercent(percent);
      },
    });

    setIsExporting(false);

    if (result.success) {
      setExportResult(result);
    } else {
      setErrorMsg(result.error || 'Erreur lors de l’exportation vers GitHub.');
    }
  };

  const handleCopyClone = (url: string) => {
    navigator.clipboard.writeText(`git clone ${url}.git`);
    setCopiedClone(true);
    setTimeout(() => setCopiedClone(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="github-modal-title"
    >
      <div className="relative w-full max-w-lg max-h-[90dvh] flex flex-col rounded-2xl liquid-glass border border-slate-200/80 dark:border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.3)] dark:shadow-[0_0_50px_rgba(124,13,244,0.35)] overflow-hidden legacy-theme text-slate-900 dark:text-white">
        {/* En-tête */}
        <div className="px-6 py-4 border-b border-slate-200/80 dark:border-white/10 liquid-glass flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="p-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md shrink-0">
              <FolderGit2 size={18} />
            </div>
            <div className="min-w-0">
              <h3 id="github-modal-title" className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                Exporter vers GitHub (One-Click)
              </h3>
              <p className="text-xs text-slate-500 dark:text-white/50 truncate">
                Projet : <span className="font-semibold text-cyan-600 dark:text-cyan-400">{project.name}</span>
              </p>
            </div>
          </div>
          <ModalCloseButton onClick={onClose} label="Fermer" title="Fermer (Échap)" />
        </div>

        {/* Corps */}
        <div className="p-6 space-y-5 overflow-y-auto scrollbar-thin flex-1">
          {exportResult ? (
            /* Écran de succès */
            <div className="py-4 space-y-4 text-center animate-in zoom-in-95 duration-200">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-500 flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(16,185,129,0.3)]">
                <Check size={28} />
              </div>

              <div>
                <h4 className="text-base font-bold text-slate-900 dark:text-white">Dépôt GitHub créé et publié !</h4>
                <p className="text-xs text-slate-600 dark:text-white/70 mt-1">
                  Tous les fichiers du projet ont été synchronisés avec succès.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-mono text-left break-all flex items-center justify-between gap-2">
                <span className="text-cyan-600 dark:text-cyan-300">{exportResult.repoUrl}</span>
                <button
                  type="button"
                  onClick={() => handleCopyClone(exportResult.repoUrl || '')}
                  className="flex items-center gap-1 px-2 py-1 rounded bg-slate-200 dark:bg-white/10 hover:bg-slate-300 dark:hover:bg-white/20 text-[11px] font-sans font-medium shrink-0 cursor-pointer"
                  title="Copier la commande git clone"
                >
                  {copiedClone ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                  <span>{copiedClone ? 'Copié' : 'Clone'}</span>
                </button>
              </div>

              <div className="flex gap-2 justify-center pt-2">
                <a
                  href={exportResult.repoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-xs text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-md transition-all hover:scale-105 active:scale-95"
                >
                  <span>Ouvrir sur GitHub</span>
                  <ExternalLink size={14} />
                </a>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl text-xs font-medium text-slate-700 dark:text-white/80 hover:bg-slate-200/60 dark:hover:bg-white/10"
                >
                  Terminer
                </button>
              </div>
            </div>
          ) : (
            /* Formulaire d'export */
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Message d'erreur éventuel */}
              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-300 text-xs flex items-start gap-2">
                  <AlertCircle size={15} className="shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Nom du dépôt */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-white/70 uppercase tracking-wider mb-1.5">
                  Nom du dépôt GitHub
                </label>
                <input
                  type="text"
                  value={repoName}
                  onChange={(e) => setRepoName(e.target.value)}
                  placeholder="mon-projet-nexus"
                  disabled={isExporting}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-white/15 bg-white dark:bg-black/40 focus:outline-none focus:ring-2 focus:ring-cyan-400 text-slate-900 dark:text-white font-mono"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-white/70 uppercase tracking-wider mb-1.5">
                  Description du projet (optionnel)
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Courte présentation du projet"
                  disabled={isExporting}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-white/15 bg-white dark:bg-black/40 focus:outline-none focus:ring-2 focus:ring-cyan-400 text-slate-900 dark:text-white"
                />
              </div>

              {/* Visibilité (Public / Privé) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-white/70 uppercase tracking-wider mb-1.5">
                  Visibilité du dépôt
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setIsPrivate(false)}
                    disabled={isExporting}
                    className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                      !isPrivate
                        ? 'border-cyan-500 bg-cyan-500/10 text-cyan-600 dark:text-cyan-300'
                        : 'border-slate-200 dark:border-white/10 text-slate-500 hover:text-slate-800 dark:hover:text-white'
                    }`}
                  >
                    <Globe size={14} />
                    <span>Public</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsPrivate(true)}
                    disabled={isExporting}
                    className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                      isPrivate
                        ? 'border-purple-500 bg-purple-500/10 text-purple-600 dark:text-purple-300'
                        : 'border-slate-200 dark:border-white/10 text-slate-500 hover:text-slate-800 dark:hover:text-white'
                    }`}
                  >
                    <Lock size={14} />
                    <span>Privé</span>
                  </button>
                </div>
              </div>

              {/* GitHub Token */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-white/70 uppercase tracking-wider">
                    GitHub Personal Access Token (PAT)
                  </label>
                  <a
                    href="https://github.com/settings/tokens/new?scopes=repo&description=NEXUS+AI+Export"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-1"
                  >
                    <span>Créer un token (scope: repo)</span>
                    <ExternalLink size={11} />
                  </a>
                </div>
                <div className="relative">
                  <input
                    type={showToken ? 'text' : 'password'}
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                    disabled={isExporting}
                    className="w-full px-3 py-2 pr-9 text-xs rounded-xl border border-slate-300 dark:border-white/15 bg-white dark:bg-black/40 focus:outline-none focus:ring-2 focus:ring-cyan-400 text-slate-900 dark:text-white font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowToken(!showToken)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
                  >
                    {showToken ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                <label className="flex items-center gap-2 mt-2 text-[11px] text-slate-500 dark:text-white/60 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberToken}
                    onChange={(e) => setRememberToken(e.target.checked)}
                    className="rounded text-cyan-500 focus:ring-cyan-400"
                  />
                  <span>Mémoriser ce token dans le navigateur de cet appareil</span>
                </label>
              </div>

              {/* Barre de progression pendant l'export */}
              {isExporting && (
                <div className="p-3.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 space-y-2 animate-in fade-in">
                  <div className="flex items-center justify-between text-xs text-cyan-700 dark:text-cyan-300 font-medium">
                    <span className="flex items-center gap-1.5">
                      <RefreshCw size={13} className="animate-spin" />
                      {progressStep || 'Initialisation...'}
                    </span>
                    <span className="font-mono">{progressPercent}%</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-white/10 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-cyan-500 to-indigo-500 h-1.5 transition-all duration-200"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Bouton de soumission */}
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isExporting}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-white/70 hover:bg-slate-200/60 dark:hover:bg-white/10 cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isExporting || !token.trim() || !repoName.trim()}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-500 hover:opacity-90 shadow-md hover:scale-105 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
                >
                  <Sparkles size={14} />
                  <span>{isExporting ? 'Exportation en cours...' : 'Créer & Exporter vers GitHub'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
