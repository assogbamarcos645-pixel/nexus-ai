/**
 * src/components/lab/NexusSwarmDrawer.tsx
 *
 * Volet interactif pour le Multi-Agents « Swarm » (Équipe Autonome de Développement).
 * Affiche le fil d'échanges en direct du trio de spécialistes :
 * - L'Architecte (structure & API)
 * - Le Frontend UI (React 19 & Tailwind CSS)
 * - L'Auditeur QA (tests Vitest & accessibilité WCAG)
 *
 * Permet de suivre la convergence en temps réel et d'appliquer le code au projet.
 */

import { useState, useEffect, useRef } from 'react';
import {
  Play,
  Square,
  Copy,
  Check,
  RotateCcw,
  Layers,
  LayoutTemplate,
  ShieldCheck,
  CheckCircle2,
  FileCode,
  ArrowRight,
  Sparkles,
  Plus,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import type { LabFile, DevProposal } from '@/types/lab';
import type { SwarmSessionState, SwarmSpecialistRole } from '@/types/swarm';
import { SWARM_SPECIALISTS, runSwarmSession } from '@/services/lab/swarmService';
import { chat } from '@/services/ai/aiService';
import { ModalCloseButton } from '@/components/ui/ModalCloseButton';

interface NexusSwarmDrawerProps {
  isOpen: boolean;
  file: LabFile | null;
  onClose: () => void;
  onRequestDiff: (proposal: DevProposal) => void;
  onAddFile?: (path: string, content: string) => void;
}

const QUICK_SWARM_PROMPTS = [
  'Modal interactif accessible avec trap de focus et fermeture Escape',
  'Formulaire d’authentification sécurisé avec validation et états',
  'Tableau de bord de métriques avec filtres et pagination fluide',
  'Lecteur média interactif avec commandes clavier conformes WCAG AA',
];

export function NexusSwarmDrawer({
  isOpen,
  file,
  onClose,
  onRequestDiff,
  onAddFile,
}: NexusSwarmDrawerProps) {
  const [taskPrompt, setTaskPrompt] = useState('');
  const [sessionState, setSessionState] = useState<SwarmSessionState | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [createdFiles, setCreatedFiles] = useState<Record<string, boolean>>({});
  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Défilement automatique vers le dernier échange
  useEffect(() => {
    if (sessionState?.messages?.length) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [sessionState?.messages?.length, sessionState?.convergencePercent]);

  // Écoute de la touche Échap pour fermer le volet
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isRunning) {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isRunning, onClose]);

  const handleLaunchSwarm = async (customPrompt?: string) => {
    const promptToRun = customPrompt ?? taskPrompt;
    if (!promptToRun.trim() || isRunning) return;

    abortControllerRef.current = new AbortController();
    setIsRunning(true);

    try {
      await runSwarmSession({
        taskPrompt: promptToRun,
        contextFile: file,
        onUpdate: (state) => {
          setSessionState(state);
        },
        signal: abortControllerRef.current.signal,
        aiCaller: async (prompt, signal) => {
          const res = await chat(
            {
              message: prompt,
              agentId: 'nexus',
            },
            signal,
          );
          return res.content;
        },
      });
    } catch {
      // Annulation ou fin de session
    } finally {
      setIsRunning(false);
      abortControllerRef.current = null;
    }
  };

  const handleStopSwarm = () => {
    abortControllerRef.current?.abort();
    setIsRunning(false);
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const handleCreateFile = (filename: string, content: string) => {
    if (!onAddFile) return;
    const targetPath = filename.includes('/') ? filename : `src/${filename}`;
    onAddFile(targetPath, content);
    setCreatedFiles((prev) => ({ ...prev, [filename]: true }));
    setTimeout(() => {
      setCreatedFiles((prev) => ({ ...prev, [filename]: false }));
    }, 3000);
  };

  const handleApplyToActiveFile = () => {
    if (!sessionState?.finalSynthesis || !file) return;

    const proposal: DevProposal = {
      id: `swarm-prop-${Date.now()}`,
      filePath: file.path,
      explanation: sessionState.finalSynthesis.summary,
      originalCode: file.content,
      suggestedCode: sessionState.finalSynthesis.productionCode,
      timestamp: new Date(),
      isMock: false,
    };

    onRequestDiff(proposal);
  };

  if (!isOpen) return null;

  const convergencePercent = sessionState?.convergencePercent ?? 0;
  const isConverged = sessionState?.status === 'converged';

  return (
    <>
      {/* Arrière-plan sombre cliquable pour fermer le volet sur mobile / tablette / bureau */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 transition-opacity cursor-pointer animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
        title="Fermer le Swarm"
      />

      <div
        id="nexus-swarm-drawer"
        aria-label="Swarm Multi-Agents"
        className="fixed inset-y-0 right-0 z-50 w-full sm:w-[620px] lg:w-[740px] bg-white/95 dark:bg-[#070714]/95 border-l border-slate-200/90 dark:border-white/10 shadow-2xl backdrop-blur-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-300 pt-[max(env(safe-area-inset-top,0px),0.5rem)]"
      >
        {/* Poignée tactile mobile style iOS (tap pour fermer) */}
        <button
          type="button"
          onClick={onClose}
          className="sm:hidden w-full flex justify-center pt-2 pb-1 bg-transparent cursor-pointer shrink-0"
          aria-label="Fermer le volet"
          title="Fermer"
        >
          <div className="w-12 h-1 bg-slate-300 dark:bg-white/30 rounded-full" />
        </button>

      {/* 1. Barre d'en-tête du Swarm */}
      <header className="h-14 px-5 border-b border-slate-200/80 dark:border-white/10 bg-slate-100/60 dark:bg-[#06060f] flex items-center justify-between gap-4 shrink-0 select-none">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-nexus-600 via-indigo-600 to-cyan-500 flex items-center justify-center text-white font-bold shadow-md shrink-0">
            <Sparkles size={16} />
          </div>
          <div className="min-w-0">
            <h1 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2 truncate">
              <span>Multi-Agents Swarm</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-nexus-500/10 text-nexus-600 dark:text-nexus-400 border border-nexus-500/20 shrink-0">
                Intelligence Collective
              </span>
            </h1>
            <p className="text-[11px] text-slate-500 dark:text-white/40 truncate">
              Trio autonome : L'Architecte • Le Frontend UI • L'Auditeur QA
            </p>
          </div>
        </div>

        <ModalCloseButton
          onClick={onClose}
          label="Fermer"
          title="Fermer le Swarm (Échap)"
        />
      </header>

      {/* 2. Tableau de bord des 3 spécialistes & Jauge de convergence */}
      <div className="p-4 border-b border-slate-200/80 dark:border-white/10 bg-slate-50/70 dark:bg-[#080816]/70 shrink-0 space-y-3">
        {/* Trio de spécialistes */}
        <div className="grid grid-cols-3 gap-2">
          {(['architect', 'frontend', 'qa'] as SwarmSpecialistRole[]).map((role) => {
            const spec = SWARM_SPECIALISTS[role];
            const isActive = sessionState?.activeSpecialist === role;
            const hasSpoken = sessionState?.messages.some((m) => m.specialistRole === role);

            return (
              <div
                key={role}
                className={cn(
                  'p-2.5 rounded-xl border transition-all flex flex-col justify-between text-left relative overflow-hidden',
                  isActive
                    ? 'border-cyan-500/50 bg-cyan-500/10 shadow-[0_0_15px_rgba(6,182,212,0.15)] ring-1 ring-cyan-500/40'
                    : hasSpoken
                    ? 'border-slate-200 dark:border-white/10 bg-white/70 dark:bg-white/5'
                    : 'border-slate-200/60 dark:border-white/5 bg-slate-100/40 dark:bg-white/[0.02] opacity-60',
                )}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    {role === 'architect' && <Layers size={13} className="text-blue-500" />}
                    {role === 'frontend' && <LayoutTemplate size={13} className="text-cyan-400" />}
                    {role === 'qa' && <ShieldCheck size={13} className="text-emerald-500" />}
                    <span className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                      {spec.name}
                    </span>
                  </div>
                  {hasSpoken && (
                    <CheckCircle2 size={12} className="text-emerald-500 shrink-0" />
                  )}
                </div>
                <p className="text-[10px] text-slate-500 dark:text-white/40 line-clamp-1">
                  {spec.tagline}
                </p>
                {isActive && (
                  <span className="mt-1 text-[9px] font-mono text-cyan-600 dark:text-cyan-400 animate-pulse font-medium">
                    En délibération...
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Jauge de convergence */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px] font-mono">
            <span className="text-slate-500 dark:text-white/50">Convergence de l'équipe :</span>
            <span
              className={cn(
                'font-bold',
                isConverged
                  ? 'text-emerald-500'
                  : 'text-cyan-600 dark:text-cyan-400',
              )}
            >
              {convergencePercent}% {isConverged && '(Consensus unanime)'}
            </span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-nexus-600 via-cyan-500 to-emerald-400 transition-all duration-500 rounded-full"
              style={{ width: `${convergencePercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* 3. Fil d'échanges visible en temps réel */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
        {!sessionState || sessionState.messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 dark:text-white/30 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-nexus-500/10 border border-nexus-500/20 flex items-center justify-center text-nexus-500">
              <Sparkles size={24} />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-700 dark:text-white/80">
                Aucune mission Swarm active
              </p>
              <p className="text-xs text-slate-400 dark:text-white/40 mt-1 max-w-md">
                Décrivez un objectif complexe ci-dessous. L'Architecte, Le Frontend UI et L'Auditeur QA
                collaboreront simultanément pour concevoir, coder et auditer la solution.
              </p>
            </div>

            {/* Suggestions d'amorçage rapide */}
            <div className="w-full max-w-lg pt-4 space-y-2">
              <p className="text-[11px] font-mono uppercase tracking-wider text-slate-400 dark:text-white/30">
                Missions types recommandées :
              </p>
              <div className="flex flex-col gap-1.5">
                {QUICK_SWARM_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => {
                      setTaskPrompt(prompt);
                      handleLaunchSwarm(prompt);
                    }}
                    className="text-left text-xs p-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 hover:border-nexus-500/40 hover:bg-nexus-500/5 transition-all text-slate-700 dark:text-white/70"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          sessionState.messages.map((msg) => {
            const spec = SWARM_SPECIALISTS[msg.specialistRole];
            return (
              <div
                key={msg.id}
                className="rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white/90 dark:bg-[#0c0d1c]/90 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300"
              >
                {/* En-tête du message du spécialiste */}
                <div className="px-4 py-2.5 border-b border-slate-100 dark:border-white/5 bg-slate-50/80 dark:bg-[#0e0f22] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        'px-2 py-0.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border',
                        spec.accentBg,
                        spec.badgeBorder,
                        spec.badgeText,
                      )}
                    >
                      {msg.specialistRole === 'architect' && <Layers size={12} />}
                      {msg.specialistRole === 'frontend' && <LayoutTemplate size={12} />}
                      {msg.specialistRole === 'qa' && <ShieldCheck size={12} />}
                      <span>{spec.name}</span>
                    </span>
                    <span className="text-xs font-medium text-slate-800 dark:text-white/90">
                      {msg.title}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 dark:text-white/30">
                    Phase {msg.phase}
                  </span>
                </div>

                {/* Contenu textuel et raisonnement */}
                <div className="p-4 space-y-3 text-xs leading-relaxed text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                  {msg.content}

                  {/* Checkpoints de validation */}
                  {msg.checkpoints && msg.checkpoints.length > 0 && (
                    <div className="pt-2 border-t border-slate-100 dark:border-white/5 space-y-1">
                      {msg.checkpoints.map((cp, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-[11px] text-slate-600 dark:text-white/60">
                          <CheckCircle2 size={12} className="text-emerald-500 shrink-0" />
                          <span>{cp}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Artefact de code associé */}
                  {msg.codeArtifact && (
                    <div className="mt-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-900 dark:bg-[#05050c] overflow-hidden">
                      <div className="px-3 py-1.5 bg-slate-800/80 dark:bg-black/50 border-b border-slate-700 dark:border-white/10 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FileCode size={13} className="text-cyan-400" />
                          <span className="text-[11px] font-mono text-slate-200 font-semibold">
                            {msg.codeArtifact.filename}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">
                            ({msg.codeArtifact.description})
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {onAddFile && (
                            <button
                              type="button"
                              onClick={() =>
                                handleCreateFile(msg.codeArtifact!.filename, msg.codeArtifact!.code)
                              }
                              className="flex items-center gap-1 text-[10px] text-cyan-400 hover:text-cyan-300 cursor-pointer transition-colors"
                              title="Créer ce fichier dans le projet NEXUS LAB"
                            >
                              {createdFiles[msg.codeArtifact.filename] ? (
                                <>
                                  <Check size={11} className="text-emerald-400" />
                                  <span className="text-emerald-400 font-medium">Ajouté</span>
                                </>
                              ) : (
                                <>
                                  <Plus size={11} />
                                  <span>Créer dans le projet</span>
                                </>
                              )}
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleCopy(msg.codeArtifact!.code, msg.id)}
                            className="flex items-center gap-1 text-[10px] text-slate-300 hover:text-white cursor-pointer transition-colors"
                          >
                            {copiedCode === msg.id ? (
                              <>
                                <Check size={11} className="text-emerald-400" />
                                <span className="text-emerald-400">Copié</span>
                              </>
                            ) : (
                              <>
                                <Copy size={11} />
                                <span>Copier</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                      <pre className="p-3 text-[11px] font-mono text-cyan-200/90 overflow-x-auto max-h-56 scrollbar-thin">
                        <code>{msg.codeArtifact.code}</code>
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}

        {/* Bloc récapitulatif final de convergence */}
        {isConverged && sessionState?.finalSynthesis && (
          <div className="rounded-2xl border-2 border-emerald-500/40 bg-emerald-500/5 p-4 space-y-3 animate-in fade-in duration-300">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-500" />
                <h3 className="text-xs font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">
                  Consensus Unanime Atteint
                </h3>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 font-bold">
                WCAG 2.1 AA • Vitest Ready
              </span>
            </div>

            <p className="text-xs text-slate-700 dark:text-slate-300">
              {sessionState.finalSynthesis.summary}
            </p>

            <div className="flex flex-wrap items-center gap-2 pt-2">
              {file && (
                <button
                  type="button"
                  id="btn-swarm-apply-diff"
                  onClick={handleApplyToActiveFile}
                  className="flex-1 min-w-[200px] flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-nexus-600 hover:bg-nexus-500 shadow-lg shadow-nexus-600/30 transition-all cursor-pointer"
                >
                  <ArrowRight size={14} />
                  <span>Appliquer au fichier actif (Diff)</span>
                </button>
              )}
              {onAddFile && sessionState.finalSynthesis.testsCode && (
                <button
                  type="button"
                  onClick={() => {
                    const base = file?.name?.replace(/\.(tsx|jsx|ts|js)$/, '') || 'InteractiveWidget';
                    handleCreateFile(`${base}.test.tsx`, sessionState.finalSynthesis!.testsCode);
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 transition-all cursor-pointer"
                  title="Créer la suite de tests Vitest dans le projet"
                >
                  {createdFiles[`${file?.name?.replace(/\.(tsx|jsx|ts|js)$/, '') || 'InteractiveWidget'}.test.tsx`] ? (
                    <>
                      <Check size={13} className="text-emerald-400" />
                      <span>Tests créés !</span>
                    </>
                  ) : (
                    <>
                      <Plus size={13} />
                      <span>Créer les tests (.test.tsx)</span>
                    </>
                  )}
                </button>
              )}
              <button
                type="button"
                onClick={() =>
                  handleCopy(sessionState.finalSynthesis!.productionCode, 'final-prod')
                }
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-white bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/15 transition-all cursor-pointer"
              >
                {copiedCode === 'final-prod' ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                <span>Copier le composant</span>
              </button>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 4. Barre de saisie de mission & Contrôles — Safe area & anti-zoom 16px */}
      <footer className="p-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] sm:pb-4 border-t border-slate-200/80 dark:border-white/10 bg-slate-50 dark:bg-[#06060f] shrink-0 space-y-2">
        <div className="flex items-center gap-2">
          <input
            type="text"
            id="swarm-task-input"
            value={taskPrompt}
            onChange={(e) => setTaskPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !isRunning) {
                e.preventDefault();
                handleLaunchSwarm();
              }
            }}
            disabled={isRunning}
            placeholder="Ex : Créer un formulaire d'abonnement accessible avec validation..."
            className="flex-1 px-3.5 py-2 rounded-xl text-[16px] sm:text-xs bg-white dark:bg-white/5 border border-slate-300 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-nexus-500/50"
          />

          {isRunning ? (
            <button
              type="button"
              id="btn-swarm-stop"
              onClick={handleStopSwarm}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-red-600 dark:text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 transition-all cursor-pointer shrink-0"
              title="Interrompre le Swarm"
            >
              <Square size={13} />
              <span>Arrêter</span>
            </button>
          ) : (
            <button
              type="button"
              id="btn-swarm-launch"
              onClick={() => handleLaunchSwarm()}
              disabled={!taskPrompt.trim()}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-nexus-600 hover:bg-nexus-500 shadow-md transition-all cursor-pointer disabled:opacity-40 shrink-0"
              title="Lancer la mission Multi-Agents"
            >
              <Play size={13} />
              <span>Lancer le Swarm</span>
            </button>
          )}

          {sessionState && !isRunning && (
            <button
              type="button"
              onClick={() => {
                setSessionState(null);
                setTaskPrompt('');
              }}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-white/5 transition-colors cursor-pointer shrink-0"
              title="Réinitialiser"
            >
              <RotateCcw size={14} />
            </button>
          )}
        </div>
      </footer>
    </div>
    </>
  );
}
