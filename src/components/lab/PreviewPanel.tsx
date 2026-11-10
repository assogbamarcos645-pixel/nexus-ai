/**
 * src/components/lab/PreviewPanel.tsx
 *
 * Panneau de prévisualisation sécurisé et dynamique pour NEXUS LAB.
 * - Runtime React 19 + TypeScript + Vite compilé instantanément in-browser (JSX/TSX).
 * - Compilation Tailwind CSS en direct avec Hot Reload instantané (sub-seconde).
 * - Mode clic-to-edit (« Inspect & Tweak ») pour retoucher les maquettes Gemini 2.5 d'un simple clic.
 * - Curseur Comparatif Avant / Après (superposition interactive entre capture d'origine et code généré).
 * - Simulateur Node.js API REST avec exécution et test des requêtes en direct.
 * - Iframe isolée sécurisée (sandbox sans allow-same-origin pour interdire l'accès aux secrets).
 * - Simulation responsive fluide (Bureau, Tablette, Mobile) et console d'exécution intégrée.
 */

import { useState, useEffect, useRef, useMemo } from 'react';
import {
  RefreshCw,
  Terminal,
  Server,
  ExternalLink,
  ShieldAlert,
  Check,
  Copy,
  ArrowLeft,
  X,
  Monitor,
  Tablet,
  Smartphone,
  Zap,
  MousePointerClick,
  SlidersHorizontal,
} from 'lucide-react';
import type { LabProject, LabFile, ConsoleMessage, InspectedElementInfo } from '@/types/lab';
import { LAB_TEMPLATES } from '@/config/labTemplates';
import { bundleProjectForPreview } from '@/services/lab/runtimeService';
import { InspectTweakWidget } from './InspectTweakWidget';
import { MockupComparator } from './MockupComparator';
import { executeInspectTweak } from '@/services/lab/inspectTweakService';

interface PreviewPanelProps {
  project: LabProject | null;
  onExportZip: () => void;
  onBackToEditor?: () => void;
  onClosePreview?: () => void;
  onUpdateProjectFiles?: (files: LabFile[]) => void;
  onUpdateMockupImage?: (image: string | undefined) => void;
  activeFile?: LabFile | null;
}

export function PreviewPanel({
  project,
  onExportZip,
  onBackToEditor,
  onClosePreview,
  onUpdateProjectFiles,
  onUpdateMockupImage,
  activeFile,
}: PreviewPanelProps) {
  const [reloadKey, setReloadKey] = useState(0);
  const [contentVersion, setContentVersion] = useState(0);
  const [renderedHtml, setRenderedHtml] = useState<string>('');
  const [isCompiling, setIsCompiling] = useState(false);
  const [logs, setLogs] = useState<ConsoleMessage[]>([]);
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);
  const [deviceMode, setDeviceMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');

  // États pour « Inspect & Tweak » (Mode Clic-to-Edit) et Curseur Comparatif Avant/Après
  const [isInspectMode, setIsInspectMode] = useState(false);
  const [inspectedElement, setInspectedElement] = useState<InspectedElementInfo | null>(null);
  const [isTweaking, setIsTweaking] = useState(false);
  const [tweakSuccessToast, setTweakSuccessToast] = useState<string | null>(null);
  const [isComparatorOpen, setIsComparatorOpen] = useState(false);

  const iframeRef = useRef<HTMLIFrameElement>(null);

  const template = useMemo(() => {
    if (!project) return null;
    return LAB_TEMPLATES.find((t) => t.id === project.templateId) ?? LAB_TEMPLATES[0];
  }, [project]);

  const isServerProject = template?.executionType === 'server-required';
  const isReactVite =
    project?.templateId === 'react-vite' ||
    Boolean(project?.files.some((f) => f.path.endsWith('.tsx') || f.path.endsWith('.jsx')));
  const isNodeApi = project?.templateId === 'node-api';

  const [viewMode, setViewMode] = useState<'preview' | 'server'>('preview');

  // Compilation et assemblage sub-seconde (HMR in-browser)
  useEffect(() => {
    let isCancelled = false;

    if (!project) {
      const timer = setTimeout(() => {
        if (!isCancelled) setRenderedHtml('');
      }, 0);
      return () => {
        isCancelled = true;
        clearTimeout(timer);
      };
    }

    const timer = setTimeout(async () => {
      try {
        setIsCompiling(true);
        const html = await bundleProjectForPreview(project);
        if (!isCancelled) {
          setRenderedHtml(html);
          setContentVersion((v) => v + 1);
        }
      } catch (err) {
        console.warn('[PREVIEW COMPILER] Erreur de bundle:', err);
      } finally {
        if (!isCancelled) {
          setIsCompiling(false);
        }
      }
    }, 180); // Délai sub-seconde (180ms) pour une réactivité instantanée

    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [project]);

  // Écoute des messages postMessage de l'iframe de manière sécurisée
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Contrôle de sécurité strict : refuser tout message n'émanant pas de l'iframe d'aperçu
      if (!iframeRef.current || event.source !== iframeRef.current.contentWindow) {
        return;
      }

      // 1. Logs console
      if (event.data && event.data.type === 'nexus-preview-log') {
        const newLog: ConsoleMessage = {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          type: event.data.logType || 'log',
          message: event.data.message || '',
          time: new Date().toLocaleTimeString('fr-FR'),
        };

        setLogs((prev) => [...prev.slice(-49), newLog]);
        window.dispatchEvent(new CustomEvent('nexus-runtime-log', { detail: newLog }));
      }

      // 2. Sélection d'élément inspecté (« Inspect & Tweak »)
      if (event.data && event.data.type === 'nexus-inspect-selected' && event.data.element) {
        setInspectedElement(event.data.element);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Synchronisation du mode inspecteur avec l'iframe lors de l'activation/désactivation ou du rechargement
  useEffect(() => {
    const notifyIframe = () => {
      if (iframeRef.current?.contentWindow) {
        iframeRef.current.contentWindow.postMessage(
          { type: 'nexus-set-inspect-mode', enabled: isInspectMode },
          '*'
        );
      }
    };

    // Notification immédiate + courte temporisation après rendu iframe
    notifyIframe();
    const t = setTimeout(notifyIframe, 250);

    if (!isInspectMode) {
      setInspectedElement(null);
    }

    return () => clearTimeout(t);
  }, [isInspectMode, renderedHtml]);

  // Envoi de modifications inline de style vers l'iframe
  const handleApplyInlineStyle = (styles: Record<string, string>) => {
    iframeRef.current?.contentWindow?.postMessage(
      { type: 'nexus-apply-inline-style', styles },
      '*'
    );
  };

  // Traitement de la demande de retouche ciblée via l'agent IA (Gemini 2.5 / NEXUS DEV)
  const handleSubmitTweak = async (promptText: string) => {
    if (!project || !inspectedElement) return;

    setIsTweaking(true);
    try {
      const result = await executeInspectTweak({
        project,
        element: inspectedElement,
        prompt: promptText,
        activeFile,
      });

      if (onUpdateProjectFiles) {
        onUpdateProjectFiles(result.updatedProject.files);
      }

      setTweakSuccessToast(result.explanation);
      setTimeout(() => setTweakSuccessToast(null), 3500);

      // Réinitialiser la sélection dans l'iframe
      iframeRef.current?.contentWindow?.postMessage({ type: 'nexus-clear-selection' }, '*');
      setInspectedElement(null);
    } catch (err) {
      console.error('[INSPECT TWEAK] Erreur lors de la retouche:', err);
    } finally {
      setIsTweaking(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(text);
    setTimeout(() => setCopiedCmd(null), 1500);
  };

  if (!project || !template) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-slate-100/80 dark:bg-surface-950 p-6 text-slate-500 dark:text-white/40 text-xs">
        Aucun projet chargé pour la prévisualisation.
      </div>
    );
  }

  // Composant Iframe réutilisé dans la vue normale et dans le comparateur
  const previewIframe = (
    <iframe
      key={`${project.id}-${reloadKey}-${contentVersion}`}
      ref={iframeRef}
      title="Aperçu NEXUS LAB"
      srcDoc={renderedHtml}
      /* RÈGLE DE SÉCURITÉ : sandbox sans allow-same-origin pour interdire l'accès aux secrets de l'application hôte */
      sandbox="allow-scripts allow-modals allow-forms"
      className="w-full h-full border-none bg-white dark:bg-[#070712]"
    />
  );

  return (
    <div id="nexus-lab-preview-container" className="w-full h-full flex flex-col liquid-glass overflow-hidden relative">
      {/* Barre supérieure de l'aperçu */}
      <header className="h-11 px-2.5 sm:px-3 border-b border-slate-200/80 dark:border-white/10 liquid-glass flex items-center justify-between shrink-0 z-30 gap-2 overflow-hidden">
        <div className="flex items-center gap-1.5 min-w-0 shrink">
          {onBackToEditor && (
            <button
              type="button"
              onClick={onBackToEditor}
              className="md:hidden flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-white text-xs font-medium cursor-pointer shrink-0"
              title="Retourner au code"
            >
              <ArrowLeft size={13} />
              <span>Code</span>
            </button>
          )}
          <span className="text-xs font-semibold text-slate-900 dark:text-white truncate">
            Aperçu
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30 font-medium truncate max-w-[110px] hidden sm:inline-block">
            {isReactVite ? 'React 19' : isNodeApi ? 'Express' : template.badge}
          </span>
          {isCompiling && (
            <span className="flex items-center gap-1 text-[10px] text-cyan-400 font-mono animate-pulse shrink-0">
              <Zap size={10} />
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          {/* BOUTON 1 : Mode Clic-to-Edit (« Inspect & Tweak ») */}
          <button
            type="button"
            id="btn-inspect-tweak"
            onClick={() => {
              setIsInspectMode((v) => !v);
              if (isInspectMode) {
                setInspectedElement(null);
              }
            }}
            className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer shrink-0 ${
              isInspectMode
                ? 'bg-purple-600 text-white shadow-[0_0_12px_rgba(168,85,247,0.5)] border border-purple-400/40'
                : 'text-slate-600 dark:text-white/70 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-white/10'
            }`}
            title="Mode Clic-to-Edit : Cliquez sur un élément pour retoucher avec l'IA"
            aria-pressed={isInspectMode}
          >
            <MousePointerClick size={13} className={isInspectMode ? 'animate-bounce text-white' : ''} />
            <span className="hidden xl:inline">Inspect & Tweak</span>
            {isInspectMode && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            )}
          </button>

          {/* BOUTON 2 : Curseur Comparatif Avant / Après */}
          <button
            type="button"
            id="btn-mockup-comparator"
            onClick={() => setIsComparatorOpen((v) => !v)}
            className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer shrink-0 ${
              isComparatorOpen
                ? 'bg-nexus-600 text-white shadow-[0_0_12px_rgba(124,13,244,0.5)] border border-nexus-400/40'
                : 'text-slate-600 dark:text-white/70 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-white/10'
            }`}
            title="Curseur Comparatif Avant / Après : Superposition interactive avec la maquette"
            aria-pressed={isComparatorOpen}
          >
            <SlidersHorizontal size={13} />
            <span className="hidden xl:inline">Avant / Après</span>
          </button>

          {/* Sélecteur de viewport responsive (Desktop / Tablette / Mobile) */}
          <div className="hidden 2xl:flex items-center bg-slate-200/60 dark:bg-surface-900 p-0.5 rounded-lg border border-slate-300/80 dark:border-white/8 text-[11px] shrink-0">
            <button
              type="button"
              onClick={() => setDeviceMode('desktop')}
              className={`p-1 rounded transition-all cursor-pointer ${
                deviceMode === 'desktop'
                  ? 'bg-nexus-600 text-white shadow-xs'
                  : 'text-slate-500 dark:text-white/50 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Plein écran Bureau (100%)"
              aria-label="Mode Bureau"
            >
              <Monitor size={12} />
            </button>
            <button
              type="button"
              onClick={() => setDeviceMode('tablet')}
              className={`p-1 rounded transition-all cursor-pointer ${
                deviceMode === 'tablet'
                  ? 'bg-nexus-600 text-white shadow-xs'
                  : 'text-slate-500 dark:text-white/50 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Format Tablette (768px)"
              aria-label="Mode Tablette"
            >
              <Tablet size={12} />
            </button>
            <button
              type="button"
              onClick={() => setDeviceMode('mobile')}
              className={`p-1 rounded transition-all cursor-pointer ${
                deviceMode === 'mobile'
                  ? 'bg-nexus-600 text-white shadow-xs'
                  : 'text-slate-500 dark:text-white/50 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Format Mobile (375px)"
              aria-label="Mode Mobile"
            >
              <Smartphone size={12} />
            </button>
          </div>

          {/* Bascule entre Aperçu direct et Fiche serveur si projet backend pur sans simulateur */}
          {isServerProject && !isReactVite && !isNodeApi && (
            <div className="flex items-center gap-1 bg-slate-200/60 dark:bg-surface-900 p-0.5 rounded-lg border border-slate-300/80 dark:border-white/8 text-[11px] shrink-0">
              <button
                type="button"
                onClick={() => setViewMode('preview')}
                className={`px-1.5 py-0.5 rounded transition-all font-medium cursor-pointer ${
                  viewMode === 'preview'
                    ? 'bg-nexus-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-white/60 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Aperçu
              </button>
              <button
                type="button"
                onClick={() => setViewMode('server')}
                className={`px-1.5 py-0.5 rounded transition-all font-medium cursor-pointer ${
                  viewMode === 'server'
                    ? 'bg-nexus-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-white/60 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Serveur
              </button>
            </div>
          )}

          {/* Bouton Actualiser */}
          <button
            type="button"
            id="btn-refresh-preview"
            onClick={() => {
              setLogs([]);
              setReloadKey((k) => k + 1);
            }}
            className="flex items-center gap-1 p-1 sm:px-2 sm:py-1 rounded text-xs text-slate-600 dark:text-white/70 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-white/10 transition-colors cursor-pointer shrink-0"
            title="Rafraîchir la prévisualisation"
          >
            <RefreshCw size={12} />
            <span className="hidden 2xl:inline">Actualiser</span>
          </button>

          {/* Bouton Fermer l'aperçu */}
          {onClosePreview && (
            <button
              type="button"
              id="btn-close-preview"
              onClick={onClosePreview}
              className="hidden md:flex p-1 rounded text-slate-400 hover:text-slate-700 dark:text-white/40 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-white/10 transition-colors cursor-pointer shrink-0"
              title="Masquer le panneau d'aperçu"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </header>

      {/* Toast de confirmation de retouche réussie */}
      {tweakSuccessToast && (
        <div
          role="status"
          aria-live="polite"
          className="absolute top-12 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-950/95 border border-purple-400/40 text-purple-200 text-xs shadow-[0_8px_30px_rgba(168,85,247,0.4)] backdrop-blur-md animate-in slide-in-from-top-2 duration-150"
        >
          <Check size={14} className="text-emerald-400 shrink-0" />
          <span>{tweakSuccessToast}</span>
        </div>
      )}

      {/* Bannière d'indication du Mode Clic-to-Edit quand aucun élément n'est encore sélectionné */}
      {isInspectMode && !inspectedElement && (
        <div className="px-3 py-1.5 bg-gradient-to-r from-purple-950/80 via-slate-900/90 to-cyan-950/80 border-b border-purple-500/20 flex items-center justify-between text-[11px] text-purple-200 shrink-0 z-20 gap-2">
          <div className="flex items-center gap-1.5 min-w-0 truncate">
            <MousePointerClick size={12} className="text-purple-400 animate-pulse shrink-0" />
            <span className="truncate">
              <strong>Clic-to-Edit :</strong> Cliquez sur un élément pour demander une retouche à l'IA.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsInspectMode(false)}
            className="text-slate-400 hover:text-white text-[10px] underline shrink-0 cursor-pointer"
          >
            Fermer
          </button>
        </div>
      )}

      {/* Contenu principal de l'aperçu */}
      {viewMode === 'preview' ? (
        <div className="flex-1 flex flex-col relative overflow-hidden bg-slate-200/50 dark:bg-black/50">
          {/* Si le mode Comparateur Avant / Après est activé */}
          {isComparatorOpen ? (
            <MockupComparator
              mockupImage={project.mockupImage}
              onUpdateMockupImage={(img) => {
                if (onUpdateMockupImage) {
                  onUpdateMockupImage(img);
                }
              }}
              deviceMode={deviceMode}
              onClose={() => setIsComparatorOpen(false)}
            >
              {previewIframe}
            </MockupComparator>
          ) : (
            /* Mode d'aperçu standard avec simulation responsive */
            <div className="flex-1 relative flex items-center justify-center p-2 sm:p-4 overflow-auto">
              <div
                className={`transition-all duration-300 h-full w-full bg-white dark:bg-[#070712] shadow-xl overflow-hidden relative ${
                  deviceMode === 'tablet'
                    ? 'max-w-[768px] max-h-[1024px] rounded-2xl border-2 border-slate-700/60 dark:border-slate-800'
                    : deviceMode === 'mobile'
                    ? 'max-w-[375px] max-h-[667px] rounded-3xl border-4 border-slate-700/80 dark:border-slate-800'
                    : 'max-w-full rounded-none'
                }`}
              >
                {previewIframe}
              </div>

              {/* Widget d'itération directe « Inspect & Tweak » lorsqu'un élément est sélectionné */}
              {isInspectMode && inspectedElement && (
                <InspectTweakWidget
                  element={inspectedElement}
                  onClose={() => {
                    setInspectedElement(null);
                    iframeRef.current?.contentWindow?.postMessage({ type: 'nexus-clear-selection' }, '*');
                  }}
                  onSubmitTweak={handleSubmitTweak}
                  onApplyInlineStyle={handleApplyInlineStyle}
                  isLoading={isTweaking}
                />
              )}
            </div>
          )}

          {/* Mini-console de logs */}
          <div className="h-28 border-t border-slate-200/80 dark:border-white/8 bg-slate-100/95 dark:bg-surface-950/95 flex flex-col shrink-0 font-mono text-[11px]">
            <div className="px-3 py-1 bg-slate-200/70 dark:bg-surface-900 border-b border-slate-300/60 dark:border-white/6 flex items-center justify-between text-slate-500 dark:text-white/40 text-[10px]">
              <span className="flex items-center gap-1.5">
                <Terminal size={11} /> Console de prévisualisation (Vite Runtime)
              </span>
              <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-medium">
                HMR actif
              </span>
            </div>
            <div className="flex-1 overflow-y-auto scrollbar-thin p-2 space-y-1">
              {logs.length === 0 ? (
                <div className="text-slate-400 dark:text-white/30 italic text-[10px]">
                  Prêt. Les sorties console.log() et les événements React apparaîtront ici.
                </div>
              ) : (
                logs.map((log) => (
                  <div key={log.id} className="flex items-start gap-2">
                    <span className="text-white/30 text-[9px] shrink-0">{log.time}</span>
                    <span
                      className={
                        log.type === 'error'
                          ? 'text-red-400'
                          : log.type === 'warn'
                          ? 'text-amber-300'
                          : 'text-cyan-200'
                      }
                    >
                      [{log.type.toUpperCase()}]
                    </span>
                    <span className="text-slate-800 dark:text-slate-200 break-all">{log.message}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Vue serveur & commandes locales pour projets PHP / Python */
        <div className="flex-1 p-6 overflow-y-auto max-w-xl mx-auto w-full flex flex-col justify-between">
          <div className="space-y-6">
            <div className="p-4 rounded-2xl bg-nexus-950/40 border border-nexus-500/20 shadow-sm">
              <div className="flex items-start gap-3">
                <Server className="text-nexus-400 shrink-0 mt-0.5" size={20} />
                <div>
                  <h3 className="text-sm font-semibold text-white">Environnement serveur dédié</h3>
                  <p className="text-xs text-white/70 mt-1 leading-relaxed">
                    Ce projet utilise un runtime backend (<strong>{template.name}</strong>).
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-surface-900/70 border border-white/8 space-y-3.5">
              <h4 className="text-xs font-semibold text-white/80 uppercase tracking-wider">
                Spécifications d'exécution
              </h4>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-white/4">
                  <span className="text-white/50">Runtime requis :</span>
                  <span className="font-mono text-cyan-300 font-medium">
                    {template.serverRequirements?.runtime}
                  </span>
                </div>

                {template.serverRequirements?.port && (
                  <div className="flex justify-between py-1 border-b border-white/4">
                    <span className="text-white/50">Port d'écoute local :</span>
                    <span className="font-mono text-purple-300">
                      http://localhost:{template.serverRequirements.port}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-surface-900/70 border border-white/8 space-y-3">
              <h4 className="text-xs font-semibold text-white/80 uppercase tracking-wider flex items-center justify-between">
                <span>Démarrage sur votre machine</span>
                <span className="text-[10px] text-white/40 normal-case">Cliquez pour copier</span>
              </h4>

              <div className="space-y-2">
                <div>
                  <span className="text-[11px] text-white/50 block mb-1">1. Installation :</span>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-black/40 border border-white/8 font-mono text-xs text-emerald-300">
                    <code>{template.serverRequirements?.installCommand}</code>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(template.serverRequirements?.installCommand || '')}
                      className="p-1 text-white/50 hover:text-white cursor-pointer"
                      title="Copier la commande"
                    >
                      {copiedCmd === template.serverRequirements?.installCommand ? (
                        <Check size={13} className="text-emerald-400" />
                      ) : (
                        <Copy size={13} />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <span className="text-[11px] text-white/50 block mb-1">2. Lancement :</span>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-black/40 border border-white/8 font-mono text-xs text-cyan-300">
                    <code>{template.serverRequirements?.runCommand}</code>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(template.serverRequirements?.runCommand || '')}
                      className="p-1 text-white/50 hover:text-white cursor-pointer"
                      title="Copier la commande"
                    >
                      {copiedCmd === template.serverRequirements?.runCommand ? (
                        <Check size={13} className="text-cyan-400" />
                      ) : (
                        <Copy size={13} />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-white/6">
            <button
              type="button"
              onClick={onExportZip}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-nexus-600 to-cyan-600 hover:from-nexus-500 hover:to-cyan-500 text-white font-medium text-xs flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(124,13,244,0.4)] transition-all cursor-pointer"
            >
              <ExternalLink size={14} />
              <span>Exporter l'archive ZIP prête à l'emploi</span>
            </button>
            <p className="text-[10px] text-white/30 text-center mt-2 flex items-center justify-center gap-1">
              <ShieldAlert size={11} /> Aucune clé secrète ni token n'est inclus dans l'export.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
