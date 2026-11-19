/**
 * src/components/lab/CloudDeployModal.tsx
 *
 * Fenêtre modale de déploiement cloud universel 1-Clic pour NEXUS LAB.
 * Permet de publier instantanément le projet sur Vercel, Netlify ou de générer un fichier Standalone.
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
import { ModalCloseButton } from '@/components/ui/ModalCloseButton';

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
  const [activeTab, setActiveTab] = useState<CloudProviderId>('vercel');
  const [vercelToken, setVercelToken] = useState('');
  const [netlifyToken, setNetlifyToken] = useState('');
  const [showToken, setShowToken] = useState(false);

  const [isDeploying, setIsDeploying] = useState(false);
  const [progressStep, setProgressStep] = useState('');
  const [progressPercent, setProgressPercent] = useState(0);
  const [deployResult, setDeployResult] = useState<CloudDeployResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedUrl, setCopiedUrl] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setVercelToken(getSavedCloudToken('vercel'));
      setNetlifyToken(getSavedCloudToken('netlify'));
      setDeployResult(null);
      setErrorMsg(null);
      setProgressPercent(0);
      setProgressStep('');
    }
  }, [isOpen]);

  if (!isOpen || !project) return null;

  const handleDeploy = async () => {
    setIsDeploying(true);
    setErrorMsg(null);
    setDeployResult(null);
    setProgressPercent(10);
    setProgressStep('Initialisation du déploiement...');

    try {
      if (activeTab === 'vercel') {
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
          setErrorMsg(res.error || 'Erreur lors du déploiement Vercel.');
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
          setErrorMsg(res.error || 'Erreur lors du déploiement Netlify.');
        }
      } else if (activeTab === 'standalone') {
        setProgressStep('Compilation du bundle HTML autonome...');
        setProgressPercent(50);
        await downloadStandaloneHtml(project);
        setProgressPercent(100);
        setDeployResult({
          success: true,
          provider: 'standalone',
          message: 'Fichier HTML unique téléchargé avec succès ! Prêt pour tout hébergeur web.',
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
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-white/8 bg-slate-50/80 dark:bg-surface-900/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-cyan-500/20">
              <Rocket size={16} />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Déploiement Cloud en 1 Clic</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-600 dark:text-cyan-300 font-semibold uppercase tracking-wider">
                  NEXUS LAB
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-white/60">
                Publiez votre projet « {project.name} » sur le web public en direct.
              </p>
            </div>
          </div>
          <ModalCloseButton onClick={onClose} />
        </div>

        {/* Onglets de sélection du fournisseur Cloud */}
        <div className="grid grid-cols-3 gap-1 p-2 bg-slate-100/80 dark:bg-white/5 border-b border-slate-200 dark:border-white/8 text-xs font-medium">
          <button
            type="button"
            onClick={() => {
              setActiveTab('vercel');
              setDeployResult(null);
              setErrorMsg(null);
            }}
            className={`py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'vercel'
                ? 'bg-white dark:bg-[#1a1b35] text-slate-900 dark:text-white shadow-sm font-semibold'
                : 'text-slate-600 dark:text-white/60 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Globe size={14} className={activeTab === 'vercel' ? 'text-cyan-500' : ''} />
            <span>Vercel Cloud</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('netlify');
              setDeployResult(null);
              setErrorMsg(null);
            }}
            className={`py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'netlify'
                ? 'bg-white dark:bg-[#1a1b35] text-slate-900 dark:text-white shadow-sm font-semibold'
                : 'text-slate-600 dark:text-white/60 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Layers size={14} className={activeTab === 'netlify' ? 'text-indigo-400' : ''} />
            <span>Netlify Cloud</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('standalone');
              setDeployResult(null);
              setErrorMsg(null);
            }}
            className={`py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'standalone'
                ? 'bg-white dark:bg-[#1a1b35] text-slate-900 dark:text-white shadow-sm font-semibold'
                : 'text-slate-600 dark:text-white/60 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Download size={14} className={activeTab === 'standalone' ? 'text-emerald-500' : ''} />
            <span>HTML Unique</span>
          </button>
        </div>

        {/* Corps de la modale */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {/* Onglet Vercel */}
          {activeTab === 'vercel' && (
            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-slate-700 dark:text-cyan-200/90 leading-relaxed">
                <p className="font-semibold text-slate-900 dark:text-white mb-1 flex items-center gap-1.5">
                  <Sparkles size={13} className="text-cyan-500" />
                  <span>Déploiement Vercel Instantané</span>
                </p>
                Renseignez votre Vercel Personal Token pour un déploiement 100% direct sans configuration Git, ou laissez vide pour ouvrir le lien d'importation officiel.
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
                    <span>Créer un token Vercel</span>
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
                  <span>Le token est conservé uniquement en session sécurisée éphémère.</span>
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
                  <span>Déploiement Netlify Edge</span>
                </p>
                Déployez en direct avec votre token Netlify pour générer une URL <code>*.netlify.app</code>, ou lancez un export préparé pour Netlify Drop.
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
                    <span>Créer un token Netlify</span>
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
                Compile l'intégralité du projet (composants React, JSX/TSX, Tailwind CSS JIT et assets) en un fichier unique <code>index.html</code> auto-suffisant.
              </p>
              <ul className="list-disc pl-4 space-y-1 text-[11px] text-slate-600 dark:text-emerald-300/80">
                <li>Exécutable hors-ligne dans n'importe quel navigateur (double-clic).</li>
                <li>Déployable sur n'importe quel hébergeur web classique (Apache, Nginx, FTP, GitHub Pages).</li>
                <li>Aucun bundler ni environnement Node.js requis.</li>
              </ul>
            </div>
          )}

          {/* Barre de progression pendant le déploiement */}
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
                  className="h-full bg-gradient-to-r from-cyan-500 to-indigo-600 transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}

          {/* Résultat du déploiement avec lien en direct */}
          {deployResult && deployResult.deployUrl && (
            <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-950 dark:text-emerald-200 space-y-2.5 animate-in fade-in duration-200">
              <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 font-semibold">
                <Check size={16} />
                <span>Déploiement réussi ! Votre application est en ligne :</span>
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
              <span>Exporter plutôt vers GitHub</span>
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
                  <span>Déploiement en cours...</span>
                </>
              ) : activeTab === 'standalone' ? (
                <>
                  <Download size={13} />
                  <span>Télécharger HTML Unique</span>
                </>
              ) : (
                <>
                  <Rocket size={13} />
                  <span>Lancer le Déploiement</span>
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
