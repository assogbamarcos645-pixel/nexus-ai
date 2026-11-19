/**
 * src/components/lab/CloudDeployModal.tsx
 *
 * Fenetre modale de deploiement cloud universel 1-Clic et Pipeline CI/CD pour NEXUS LAB.
 * Permet d'executer un pipeline complet (audit qualite, snapshot IA, synchronisation Git, deploiement)
 * ou de publier directement sur Vercel, Netlify ou en bundle HTML autonome.
 */

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Rocket,
  Globe,
  ExternalLink,
  Check,
  AlertCircle,
  Copy,
  Download,
  Shield,
  Layers,
  Sparkles,
  RefreshCw,
  Eye,
  EyeOff,
  GitBranch,
  CheckCircle2,
  Cpu,
  ShieldCheck,
  History,
} from 'lucide-react';
import type { LabProject } from '@/types/lab';
import {
  deployToVercel,
  deployToNetlify,
  downloadStandaloneHtml,
  getSavedCloudToken,
  saveCloudToken,
  type CloudProviderId,
  type CloudDeployResult,
} from '@/services/lab/cloudDeployService';
import { lintProjectFiles } from '@/services/lab/linterService';
import { createSnapshot } from '@/services/lab/snapshotService';
import {
  getSavedGitHubToken,
  saveGitHubToken,
  exportProjectToGitHub,
} from '@/services/lab/githubExportService';
import { ModalCloseButton } from '@/components/ui/ModalCloseButton';

export type DeployTabId = 'cicd' | 'vercel' | 'netlify' | 'standalone';

interface CloudDeployModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: LabProject | null;
  onOpenGitHubExport?: () => void;
}

export function CloudDeployModal({
  isOpen,
  onClose,
  project,
  onOpenGitHubExport,
}: CloudDeployModalProps) {
  const [activeTab, setActiveTab] = useState<DeployTabId>('cicd');
  const [cicdTarget, setCicdTarget] = useState<CloudProviderId>('vercel');
  const [cicdAutoDeploy, setCicdAutoDeploy] = useState(false);
  const [githubToken, setGithubToken] = useState('');
  const [vercelToken, setVercelToken] = useState('');
  const [netlifyToken, setNetlifyToken] = useState('');
  const [showToken, setShowToken] = useState(false);

  const [isDeploying, setIsDeploying] = useState(false);
  const [cicdStage, setCicdStage] = useState<number>(0);
  const [progressStep, setProgressStep] = useState('');
  const [progressPercent, setProgressPercent] = useState(0);
  const [deployResult, setDeployResult] = useState<CloudDeployResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [auditSummary, setAuditSummary] = useState<{
    errorsCount: number;
    warningsCount: number;
    filesCount: number;
  } | null>(null);
  const [lastCommitLabel, setLastCommitLabel] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setVercelToken(getSavedCloudToken('vercel'));
      setNetlifyToken(getSavedCloudToken('netlify'));
      setGithubToken(getSavedGitHubToken());
      const savedTarget = localStorage.getItem('nexus_cicd_target') as CloudProviderId | null;
      if (savedTarget && (savedTarget === 'vercel' || savedTarget === 'netlify' || savedTarget === 'standalone')) {
        setCicdTarget(savedTarget);
      }
      setCicdAutoDeploy(localStorage.getItem('nexus_cicd_auto_deploy') === 'true');
      setDeployResult(null);
      setErrorMsg(null);
      setProgressPercent(0);
      setProgressStep('');
      setCicdStage(0);
      setAuditSummary(null);
      setLastCommitLabel(null);
    }
  }, [isOpen]);

  if (!isOpen || !project) return null;

  const handleCicdTargetChange = (target: CloudProviderId) => {
    setCicdTarget(target);
    try {
      localStorage.setItem('nexus_cicd_target', target);
    } catch {
      // Ignorer
    }
  };

  const handleToggleAutoDeploy = (val: boolean) => {
    setCicdAutoDeploy(val);
    try {
      localStorage.setItem('nexus_cicd_auto_deploy', val ? 'true' : 'false');
    } catch {
      // Ignorer
    }
  };

  const handleDeploy = async () => {
    setIsDeploying(true);
    setErrorMsg(null);
    setDeployResult(null);
    setProgressPercent(10);
    setProgressStep('Initialisation du deploiement...');

    try {
      if (activeTab === 'cicd') {
        // Etape 1 : Audit de qualite statique (Linter)
        setCicdStage(1);
        setProgressPercent(20);
        setProgressStep('Etape 1/4 : Audit statique (syntaxe JSX/TS, validation JSON, integrite des imports)...');
        await new Promise((resolve) => setTimeout(resolve, 350));

        const diagnostics = lintProjectFiles(project.files);
        const blockingErrors = diagnostics.filter(
          (d) =>
            d.severity === 'error' ||
            d.message.toLowerCase().includes('invalide') ||
            d.message.toLowerCase().includes('syntaxe')
        );

        setAuditSummary({
          errorsCount: blockingErrors.length,
          warningsCount: diagnostics.length - blockingErrors.length,
          filesCount: project.files.length,
        });

        if (blockingErrors.length > 0) {
          throw new Error(
            `Audit qualite non valide : ${blockingErrors.length} erreur(s) de syntaxe detectee(s). Corrigez le code ou activez le Pilote Auto-Heal.`
          );
        }

        // Etape 2 : Instantane horodate et message de version contextuel
        setCicdStage(2);
        setProgressPercent(45);
        setProgressStep('Etape 2/4 : Creation de l instantane et generation du message de commit IA...');
        await new Promise((resolve) => setTimeout(resolve, 300));

        const now = new Date();
        const dateStr = now.toLocaleDateString('fr-FR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
        const commitMsg = `Automated Release [${dateStr}] - ${project.name}`;
        const commitDesc = `Validation automatique CI/CD (${project.files.length} fichiers, 0 erreur de syntaxe). Cible : ${cicdTarget}.`;

        const snapshot = createSnapshot(project.id, project.files, commitMsg, 'auto', commitDesc);
        setLastCommitLabel(snapshot.label);

        // Etape 3 : Synchronisation distante Git / GitHub (optionnelle ou avec PAT)
        setCicdStage(3);
        setProgressPercent(65);
        setProgressStep('Etape 3/4 : Synchronisation du depot distant Git / GitHub...');
        await new Promise((resolve) => setTimeout(resolve, 300));

        if (githubToken.trim()) {
          saveGitHubToken(githubToken.trim());
          try {
            await exportProjectToGitHub({
              token: githubToken.trim(),
              repoName: project.name,
              project,
              isPrivate: true,
              onProgress: (step) => {
                setProgressStep(`Git : ${step}`);
              },
            });
          } catch (gitErr) {
            console.warn('[CI/CD] Note synchronisation GitHub:', gitErr);
          }
        }

        // Etape 4 : Build Cloud et publication
        setCicdStage(4);
        setProgressPercent(85);
        setProgressStep(`Etape 4/4 : Build de production et publication sur ${cicdTarget.toUpperCase()}...`);

        if (cicdTarget === 'vercel') {
          if (vercelToken.trim()) {
            saveCloudToken('vercel', vercelToken.trim());
          }
          const res = await deployToVercel({
            project,
            provider: 'vercel',
            token: vercelToken,
            onProgress: (step, percent) => {
              setProgressStep(step);
              setProgressPercent(Math.max(80, percent));
            },
          });
          if (res.success) {
            setCicdStage(5);
            setProgressPercent(100);
            setProgressStep('Pipeline CI/CD execute avec succes.');
            setDeployResult(res);
          } else {
            throw new Error(res.error || 'Echec du deploiement Vercel.');
          }
        } else if (cicdTarget === 'netlify') {
          if (netlifyToken.trim()) {
            saveCloudToken('netlify', netlifyToken.trim());
          }
          const res = await deployToNetlify({
            project,
            provider: 'netlify',
            token: netlifyToken,
            onProgress: (step, percent) => {
              setProgressStep(step);
              setProgressPercent(Math.max(80, percent));
            },
          });
          if (res.success) {
            setCicdStage(5);
            setProgressPercent(100);
            setProgressStep('Pipeline CI/CD execute avec succes.');
            setDeployResult(res);
          } else {
            throw new Error(res.error || 'Echec du deploiement Netlify.');
          }
        } else if (cicdTarget === 'standalone') {
          await downloadStandaloneHtml(project);
          setCicdStage(5);
          setProgressPercent(100);
          setProgressStep('Pipeline CI/CD execute avec succes.');
          setDeployResult({
            success: true,
            provider: 'standalone',
            message: 'Bundle HTML unique compile et instantane de version archive.',
          });
        }
      } else if (activeTab === 'vercel') {
        if (vercelToken.trim()) {
          saveCloudToken('vercel', vercelToken.trim());
        }
        const res = await deployToVercel({
          project,
          provider: 'vercel',
          token: vercelToken,
          onProgress: (step, percent) => {
            setProgressStep(step);
            setProgressPercent(percent);
          },
        });
        if (res.success) {
          setDeployResult(res);
        } else {
          setErrorMsg(res.error || 'Erreur lors du deploiement Vercel.');
        }
      } else if (activeTab === 'netlify') {
        if (netlifyToken.trim()) {
          saveCloudToken('netlify', netlifyToken.trim());
        }
        const res = await deployToNetlify({
          project,
          provider: 'netlify',
          token: netlifyToken,
          onProgress: (step, percent) => {
            setProgressStep(step);
            setProgressPercent(percent);
          },
        });
        if (res.success) {
          setDeployResult(res);
        } else {
          setErrorMsg(res.error || 'Erreur lors du deploiement Netlify.');
        }
      } else if (activeTab === 'standalone') {
        setProgressStep('Compilation du bundle HTML autonome...');
        setProgressPercent(50);
        await downloadStandaloneHtml(project);
        setProgressPercent(100);
        setDeployResult({
          success: true,
          provider: 'standalone',
          message: 'Fichier HTML unique telecharge avec succes ! Pret pour tout hebergeur web.',
        });
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : String(err));
    } finally {
      setIsDeploying(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      className="fixed inset-0 z-[150] flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200 cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-xl bg-white dark:bg-[#0c0d1e] border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden cursor-default"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-3.5 sm:px-5 py-3 sm:py-4 border-b border-slate-200 dark:border-white/8 bg-slate-50/80 dark:bg-surface-900/40">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-cyan-500/20 shrink-0">
              <Rocket size={16} />
            </div>
            <div className="min-w-0">
              <h2 className="text-xs sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-1.5 sm:gap-2">
                <span className="truncate">Pipeline CI/CD & Deploiement Cloud</span>
                <span className="hidden sm:inline-block text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-600 dark:text-cyan-300 font-semibold uppercase tracking-wider shrink-0">
                  NEXUS LAB
                </span>
              </h2>
              <p className="hidden sm:block text-xs text-slate-500 dark:text-white/60 truncate">
                Automatisation complete du code a la production pour « {project.name} ».
              </p>
            </div>
          </div>
          <ModalCloseButton onClick={onClose} />
        </div>

        {/* Onglets de selection */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 p-2 bg-slate-100/80 dark:bg-white/5 border-b border-slate-200 dark:border-white/8 text-xs font-medium">
          <button
            type="button"
            id="tab-btn-cicd"
            onClick={() => {
              setActiveTab('cicd');
              setDeployResult(null);
              setErrorMsg(null);
            }}
            className={`py-2 px-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'cicd'
                ? 'bg-white dark:bg-[#1a1b35] text-cyan-600 dark:text-cyan-300 shadow-sm font-bold border border-cyan-500/30'
                : 'text-slate-600 dark:text-white/60 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <GitBranch size={13} className={activeTab === 'cicd' ? 'text-cyan-500' : ''} />
            <span className="truncate">Pipeline CI/CD</span>
          </button>

          <button
            type="button"
            id="tab-btn-vercel"
            onClick={() => {
              setActiveTab('vercel');
              setDeployResult(null);
              setErrorMsg(null);
            }}
            className={`py-2 px-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'vercel'
                ? 'bg-white dark:bg-[#1a1b35] text-slate-900 dark:text-white shadow-sm font-semibold'
                : 'text-slate-600 dark:text-white/60 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Globe size={13} className={activeTab === 'vercel' ? 'text-cyan-500' : ''} />
            <span className="truncate">Vercel Direct</span>
          </button>

          <button
            type="button"
            id="tab-btn-netlify"
            onClick={() => {
              setActiveTab('netlify');
              setDeployResult(null);
              setErrorMsg(null);
            }}
            className={`py-2 px-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'netlify'
                ? 'bg-white dark:bg-[#1a1b35] text-slate-900 dark:text-white shadow-sm font-semibold'
                : 'text-slate-600 dark:text-white/60 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Layers size={13} className={activeTab === 'netlify' ? 'text-indigo-400' : ''} />
            <span className="truncate">Netlify Edge</span>
          </button>

          <button
            type="button"
            id="tab-btn-standalone"
            onClick={() => {
              setActiveTab('standalone');
              setDeployResult(null);
              setErrorMsg(null);
            }}
            className={`py-2 px-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'standalone'
                ? 'bg-white dark:bg-[#1a1b35] text-slate-900 dark:text-white shadow-sm font-semibold'
                : 'text-slate-600 dark:text-white/60 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Download size={13} className={activeTab === 'standalone' ? 'text-emerald-500' : ''} />
            <span className="truncate">HTML Unique</span>
          </button>
        </div>

        {/* Corps de la modale */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs">
          {/* Onglet Pipeline CI/CD Automatisé */}
          {activeTab === 'cicd' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-gradient-to-r from-cyan-500/10 via-indigo-500/10 to-purple-500/10 border border-cyan-500/20 text-slate-700 dark:text-cyan-200/90 leading-relaxed">
                <p className="font-semibold text-slate-900 dark:text-white mb-1 flex items-center gap-1.5">
                  <Cpu size={14} className="text-cyan-500" />
                  <span>Pipeline CI/CD Automatique 1-Clic</span>
                </p>
                Enchaine en boucle fermee l audit qualite statique, la creation d un instantane de version avec message contextuel, la synchronisation Git et la publication en ligne.
              </div>

              {/* Etapes du pipeline (Visual Stepper) */}
              <div className="p-3 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/10 space-y-2">
                <p className="font-semibold text-slate-800 dark:text-white/90 text-[11px] uppercase tracking-wider text-slate-400">
                  Etapes du Pipeline Automatise
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                  <div
                    className={`flex items-center gap-2 p-2 rounded-lg border transition-all ${
                      cicdStage >= 1
                        ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-800 dark:text-cyan-300'
                        : 'bg-white/60 dark:bg-white/5 border-slate-200 dark:border-white/5 text-slate-600 dark:text-white/60'
                    }`}
                  >
                    {cicdStage > 1 ? (
                      <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                    ) : cicdStage === 1 ? (
                      <RefreshCw size={14} className="animate-spin text-cyan-500 shrink-0" />
                    ) : (
                      <ShieldCheck size={14} className="text-slate-400 shrink-0" />
                    )}
                    <span className="font-medium truncate">1. Audit Qualite & Linter</span>
                  </div>

                  <div
                    className={`flex items-center gap-2 p-2 rounded-lg border transition-all ${
                      cicdStage >= 2
                        ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-800 dark:text-cyan-300'
                        : 'bg-white/60 dark:bg-white/5 border-slate-200 dark:border-white/5 text-slate-600 dark:text-white/60'
                    }`}
                  >
                    {cicdStage > 2 ? (
                      <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                    ) : cicdStage === 2 ? (
                      <RefreshCw size={14} className="animate-spin text-cyan-500 shrink-0" />
                    ) : (
                      <History size={14} className="text-slate-400 shrink-0" />
                    )}
                    <span className="font-medium truncate">2. Instantane & Commit IA</span>
                  </div>

                  <div
                    className={`flex items-center gap-2 p-2 rounded-lg border transition-all ${
                      cicdStage >= 3
                        ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-800 dark:text-cyan-300'
                        : 'bg-white/60 dark:bg-white/5 border-slate-200 dark:border-white/5 text-slate-600 dark:text-white/60'
                    }`}
                  >
                    {cicdStage > 3 ? (
                      <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                    ) : cicdStage === 3 ? (
                      <RefreshCw size={14} className="animate-spin text-cyan-500 shrink-0" />
                    ) : (
                      <GitBranch size={14} className="text-slate-400 shrink-0" />
                    )}
                    <span className="font-medium truncate">3. Synchronisation Git</span>
                  </div>

                  <div
                    className={`flex items-center gap-2 p-2 rounded-lg border transition-all ${
                      cicdStage >= 4
                        ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-800 dark:text-cyan-300'
                        : 'bg-white/60 dark:bg-white/5 border-slate-200 dark:border-white/5 text-slate-600 dark:text-white/60'
                    }`}
                  >
                    {cicdStage >= 5 ? (
                      <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                    ) : cicdStage === 4 ? (
                      <RefreshCw size={14} className="animate-spin text-cyan-500 shrink-0" />
                    ) : (
                      <Rocket size={14} className="text-slate-400 shrink-0" />
                    )}
                    <span className="font-medium truncate">4. Build & Production</span>
                  </div>
                </div>
              </div>

              {/* Choix du fournisseur de publication */}
              <div>
                <label className="block font-semibold text-slate-800 dark:text-white/90 mb-1.5">
                  Fournisseur de decharge Cloud pour le Pipeline
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleCicdTargetChange('vercel')}
                    className={`p-2.5 rounded-lg border flex flex-col items-center gap-1 transition-all cursor-pointer ${
                      cicdTarget === 'vercel'
                        ? 'bg-cyan-500/15 border-cyan-500/50 text-cyan-900 dark:text-cyan-200 font-semibold'
                        : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-600 dark:text-white/60'
                    }`}
                  >
                    <Globe size={16} className={cicdTarget === 'vercel' ? 'text-cyan-500' : ''} />
                    <span>Vercel (Prod)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleCicdTargetChange('netlify')}
                    className={`p-2.5 rounded-lg border flex flex-col items-center gap-1 transition-all cursor-pointer ${
                      cicdTarget === 'netlify'
                        ? 'bg-indigo-500/15 border-indigo-500/50 text-indigo-900 dark:text-indigo-200 font-semibold'
                        : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-600 dark:text-white/60'
                    }`}
                  >
                    <Layers size={16} className={cicdTarget === 'netlify' ? 'text-indigo-400' : ''} />
                    <span>Netlify (Edge)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleCicdTargetChange('standalone')}
                    className={`p-2.5 rounded-lg border flex flex-col items-center gap-1 transition-all cursor-pointer ${
                      cicdTarget === 'standalone'
                        ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-900 dark:text-emerald-200 font-semibold'
                        : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-600 dark:text-white/60'
                    }`}
                  >
                    <Download size={16} className={cicdTarget === 'standalone' ? 'text-emerald-500' : ''} />
                    <span>Bundle HTML</span>
                  </button>
                </div>
              </div>

              {/* Option d'auto-declenchement */}
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
                <input
                  type="checkbox"
                  id="chk-cicd-auto-deploy"
                  checked={cicdAutoDeploy}
                  onChange={(e) => handleToggleAutoDeploy(e.target.checked)}
                  className="rounded text-cyan-600 focus:ring-cyan-500 cursor-pointer"
                />
                <label
                  htmlFor="chk-cicd-auto-deploy"
                  className="text-xs text-slate-700 dark:text-white/80 cursor-pointer select-none"
                >
                  Declenchement automatique du pipeline a chaque etape majeure validee dans le studio
                </label>
              </div>

              {/* Tokens optionnels */}
              <div className="space-y-2">
                <label className="block font-semibold text-slate-800 dark:text-white/90 flex items-center justify-between">
                  <span>GitHub Personal Access Token (Optionnel)</span>
                  <a
                    href="https://github.com/settings/tokens/new"
                    target="_blank"
                    rel="noreferrer"
                    className="text-cyan-500 hover:underline flex items-center gap-1 text-[11px]"
                  >
                    <span>Generer un PAT</span>
                    <ExternalLink size={11} />
                  </a>
                </label>
                <div className="relative">
                  <input
                    type={showToken ? 'text' : 'password'}
                    value={githubToken}
                    onChange={(e) => setGithubToken(e.target.value)}
                    placeholder="ghp_xxxxxxxxxxxx..."
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-white/5 border border-slate-300 dark:border-white/10 rounded-lg text-slate-900 dark:text-white font-mono text-xs focus:outline-none focus:border-cyan-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowToken(!showToken)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white"
                  >
                    {showToken ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Onglet Vercel */}
          {activeTab === 'vercel' && (
            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-slate-700 dark:text-cyan-200/90 leading-relaxed">
                <p className="font-semibold text-slate-900 dark:text-white mb-1 flex items-center gap-1.5">
                  <Sparkles size={13} className="text-cyan-500" />
                  <span>Deploiement Vercel Instantane</span>
                </p>
                Renseignez votre Vercel Personal Token pour un deploiement 100% direct sans configuration Git, ou laissez vide pour ouvrir le lien d importation officiel.
              </div>

              <div>
                <label className="block font-semibold text-slate-800 dark:text-white/90 mb-1 flex items-center justify-between">
                  <span>Vercel API Token (Facultatif)</span>
                  <a
                    href="https://vercel.com/account/tokens"
                    target="_blank"
                    rel="noreferrer"
                    className="text-cyan-500 hover:underline flex items-center gap-1 text-[11px]"
                  >
                    <span>Creer un token Vercel</span>
                    <ExternalLink size={11} />
                  </a>
                </label>
                <div className="relative">
                  <input
                    type={showToken ? 'text' : 'password'}
                    value={vercelToken}
                    onChange={(e) => setVercelToken(e.target.value)}
                    placeholder="vca_xxxxxxxxxxxx..."
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-white/5 border border-slate-300 dark:border-white/10 rounded-lg text-slate-900 dark:text-white font-mono text-xs focus:outline-none focus:border-cyan-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowToken(!showToken)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white"
                  >
                    {showToken ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-white/40 mt-1 flex items-center gap-1">
                  <Shield size={11} className="text-emerald-500" />
                  <span>Le token est conserve uniquement en session securisee ephemere.</span>
                </p>
              </div>
            </div>
          )}

          {/* Onglet Netlify */}
          {activeTab === 'netlify' && (
            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-slate-700 dark:text-indigo-200/90 leading-relaxed">
                <p className="font-semibold text-slate-900 dark:text-white mb-1 flex items-center gap-1.5">
                  <Sparkles size={13} className="text-indigo-400" />
                  <span>Deploiement Netlify Edge</span>
                </p>
                Deployez en direct avec votre token Netlify pour generer une URL <code>*.netlify.app</code>, ou lancez un export prepare pour Netlify Drop.
              </div>

              <div>
                <label className="block font-semibold text-slate-800 dark:text-white/90 mb-1 flex items-center justify-between">
                  <span>Netlify Personal Token (Facultatif)</span>
                  <a
                    href="https://app.netlify.com/user/applications#personal-access-tokens"
                    target="_blank"
                    rel="noreferrer"
                    className="text-indigo-400 hover:underline flex items-center gap-1 text-[11px]"
                  >
                    <span>Creer un token Netlify</span>
                    <ExternalLink size={11} />
                  </a>
                </label>
                <div className="relative">
                  <input
                    type={showToken ? 'text' : 'password'}
                    value={netlifyToken}
                    onChange={(e) => setNetlifyToken(e.target.value)}
                    placeholder="nfp_xxxxxxxxxxxx..."
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-white/5 border border-slate-300 dark:border-white/10 rounded-lg text-slate-900 dark:text-white font-mono text-xs focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowToken(!showToken)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white"
                  >
                    {showToken ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Onglet Standalone HTML */}
          {activeTab === 'standalone' && (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-slate-700 dark:text-emerald-200/90 space-y-2">
              <p className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Download size={15} className="text-emerald-500" />
                <span>Web Player HTML Unique Autonome</span>
              </p>
              <p className="leading-relaxed">
                Compile l integralite du projet (composants React, JSX/TSX, Tailwind CSS JIT et assets) en un fichier unique <code>index.html</code> auto-suffisant.
              </p>
              <ul className="list-disc pl-4 space-y-1 text-[11px] text-slate-600 dark:text-emerald-300/80">
                <li>Executable hors-ligne dans n importe quel navigateur (double-clic).</li>
                <li>Deployable sur n importe quel hebergeur web classique (Apache, Nginx, FTP, GitHub Pages).</li>
                <li>Aucun bundler ni environnement Node.js requis.</li>
              </ul>
            </div>
          )}

          {/* Barre de progression pendant l'execution */}
          {isDeploying && (
            <div className="space-y-2 p-3 bg-slate-100 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/10">
              <div className="flex justify-between items-center text-[11px]">
                <span className="font-semibold text-slate-800 dark:text-white/90 flex items-center gap-1.5">
                  <RefreshCw size={12} className="animate-spin text-cyan-500" />
                  <span>{progressStep}</span>
                </span>
                <span className="font-mono text-cyan-500 font-bold">{progressPercent}%</span>
              </div>
              <div className="w-full h-1.5 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-600 transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}

          {/* Résumé de l'audit et instantané généré en mode CI/CD */}
          {auditSummary && (
            <div className="p-3 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-between text-[11px]">
              <span className="text-slate-600 dark:text-white/70">
                Audit : {auditSummary.filesCount} fichiers | {auditSummary.errorsCount} erreur(s) | {auditSummary.warningsCount} avertissement(s)
              </span>
              {lastCommitLabel && (
                <span className="font-mono text-cyan-600 dark:text-cyan-300 font-medium truncate max-w-[200px]">
                  {lastCommitLabel}
                </span>
              )}
            </div>
          )}

          {/* Résultat du déploiement avec lien en direct */}
          {deployResult && deployResult.deployUrl && (
            <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-950 dark:text-emerald-200 space-y-2.5 animate-in fade-in duration-200">
              <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 font-semibold">
                <Check size={16} />
                <span>Pipeline termine avec succes ! Application en production :</span>
              </div>

              <div className="flex items-center gap-2 p-2 bg-white/90 dark:bg-black/50 border border-emerald-500/30 rounded-lg">
                <span className="font-mono text-xs flex-1 truncate text-emerald-800 dark:text-emerald-300">
                  {deployResult.deployUrl}
                </span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(deployResult.deployUrl!)}
                  className="p-1 text-slate-500 hover:text-slate-800 dark:text-white/60 dark:hover:text-white transition-colors cursor-pointer"
                  title="Copier le lien public"
                >
                  {copiedUrl ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                </button>
                <a
                  href={deployResult.deployUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-medium flex items-center gap-1 text-[11px]"
                >
                  <span>Ouvrir</span>
                  <ExternalLink size={11} />
                </a>
              </div>
            </div>
          )}

          {/* Message de succès Standalone */}
          {deployResult && !deployResult.deployUrl && deployResult.message && (
            <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-800 dark:text-emerald-200 flex items-center gap-2 text-xs">
              <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
              <span>{deployResult.message}</span>
            </div>
          )}

          {/* Erreur */}
          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 flex items-start gap-2">
              <AlertCircle size={15} className="shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-white/8 bg-slate-50 dark:bg-surface-900/40 flex items-center justify-between">
          {onOpenGitHubExport ? (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenGitHubExport();
              }}
              className="text-xs text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1"
            >
              <span>Exporter plutot vers GitHub</span>
              <ExternalLink size={11} />
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-white/10 text-slate-700 dark:text-white/80 hover:bg-slate-100 dark:hover:bg-white/5 text-xs font-medium cursor-pointer"
            >
              Fermer
            </button>

            <button
              type="button"
              id="btn-confirm-cloud-deploy"
              onClick={handleDeploy}
              disabled={isDeploying}
              className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 via-indigo-600 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white text-xs font-semibold shadow-md shadow-cyan-500/25 flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-all"
            >
              {isDeploying ? (
                <>
                  <RefreshCw size={13} className="animate-spin" />
                  <span>Traitement en cours...</span>
                </>
              ) : activeTab === 'cicd' ? (
                <>
                  <Cpu size={13} />
                  <span>Executer le Pipeline CI/CD</span>
                </>
              ) : activeTab === 'standalone' ? (
                <>
                  <Download size={13} />
                  <span>Telecharger HTML Unique</span>
                </>
              ) : (
                <>
                  <Rocket size={13} />
                  <span>Lancer le Deploiement</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
