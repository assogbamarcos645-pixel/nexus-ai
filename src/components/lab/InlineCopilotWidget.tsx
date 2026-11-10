/**
 * src/components/lab/InlineCopilotWidget.tsx
 *
 * Widget flottant « Copilot Inline » (style Cursor IDE) pour NEXUS LAB.
 * Déclenché par Ctrl+K, il permet d'exécuter des commandes naturelles directement
 * sur le code sélectionné ou le curseur, et affiche un diff visuel interactif
 * avec surlignage vert/rouge et confirmation par Enter / Esc.
 */

import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  Sparkles,
  Zap,
  Check,
  X,
  RotateCcw,
  CornerDownLeft,
  ChevronRight,
  Code2,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import type { LabFile, CodeSelectionRange, InlineCopilotProposal } from '@/types/lab';
import { generateInlineCodeProposal } from '@/services/lab/inlineCopilotService';
import { computeLineDiff, getDiffStats } from '@/utils/diffUtils';
import { ModalCloseButton } from '@/components/ui/ModalCloseButton';

interface InlineCopilotWidgetProps {
  isOpen: boolean;
  file: LabFile;
  fullContent: string;
  selectedCode: string;
  selectionRange: CodeSelectionRange | null;
  cursorPosition: { lineNumber: number; column: number } | null;
  topOffset?: number;
  onClose: () => void;
  onAccept: (proposal: InlineCopilotProposal) => void;
}

const QUICK_COMMANDS = [
  { label: 'Navbar Tailwind', prompt: 'Ajoute une barre de navigation Tailwind responsive avec menu mobile' },
  { label: 'Fix re-render', prompt: 'Corrige ce bug de re-render React en stabilisant les hooks' },
  { label: 'Factoriser', prompt: 'Factorise cette fonction pour améliorer la lisibilité et la performance' },
  { label: 'Try/Catch', prompt: 'Ajoute une gestion robuste des erreurs avec try/catch' },
];

export function InlineCopilotWidget({
  isOpen,
  file,
  fullContent,
  selectedCode,
  selectionRange,
  cursorPosition,
  topOffset = 24,
  onClose,
  onAccept,
}: InlineCopilotWidgetProps) {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [proposal, setProposal] = useState<InlineCopilotProposal | null>(null);
  const [error, setError] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const widgetRef = useRef<HTMLDivElement>(null);

  const hasSelection = Boolean(selectedCode && selectedCode.trim().length > 0 && selectionRange);

  const handleClose = useCallback(() => {
    setProposal(null);
    setError(null);
    onClose();
  }, [onClose]);

  const handleAccept = useCallback((prop: InlineCopilotProposal) => {
    setProposal(null);
    setError(null);
    onAccept(prop);
  }, [onAccept]);

  // Focus automatique du champ de saisie à l'ouverture
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Diff calculé entre le bloc d'origine et la proposition générée
  const diffLines = useMemo(() => {
    if (!proposal) return [];
    return computeLineDiff(proposal.originalSnippet, proposal.suggestedSnippet);
  }, [proposal]);

  const stats = useMemo(() => {
    return getDiffStats(diffLines);
  }, [diffLines]);

  // Exécution de la génération de code
  const handleGenerate = async (customPrompt?: string) => {
    const textToUse = customPrompt ?? prompt;
    if (!textToUse.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await generateInlineCodeProposal({
        file,
        prompt: textToUse.trim(),
        selectedCode,
        selectionRange,
        fullContent,
        cursorPosition,
      });
      setProposal(result);
    } catch (err: unknown) {
      console.error('[COPILOT INLINE] Erreur de génération:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors de la génération');
    } finally {
      setIsLoading(false);
    }
  };

  // Gestion des raccourcis clavier dans le widget
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Échap pour fermer / rejeter
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        handleClose();
        return;
      }

      // Entrée pour accepter la proposition lorsqu'elle est affichée
      if (e.key === 'Enter' && proposal && !isLoading) {
        // Ne pas intercepter si on est en train de modifier le prompt
        if (document.activeElement === inputRef.current && !proposal) {
          return;
        }
        e.preventDefault();
        e.stopPropagation();
        handleAccept(proposal);
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [isOpen, proposal, isLoading, handleClose, handleAccept]);

  if (!isOpen) return null;

  return (
    <div
      ref={widgetRef}
      id="nexus-copilot-inline-widget"
      role="dialog"
      aria-label="Assistant IA Copilot Inline"
      className="absolute left-4 right-4 md:left-12 md:right-12 z-40 max-w-4xl mx-auto rounded-2xl liquid-glass border border-cyan-500/40 dark:border-cyan-500/30 bg-slate-900/95 dark:bg-[#070718]/95 backdrop-blur-xl shadow-[0_16px_50px_rgba(0,0,0,0.65),0_0_30px_rgba(6,182,212,0.2)] text-white overflow-hidden transition-all duration-200 animate-in fade-in zoom-in-95"
      style={{
        top: `${Math.max(12, Math.min(topOffset, 420))}px`,
      }}
    >
      {/* Barre supérieure d'en-tête */}
      <div className="px-4 py-2.5 border-b border-white/10 flex items-center justify-between bg-white/5">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white shadow-[0_0_10px_rgba(6,182,212,0.4)] shrink-0">
            <Sparkles size={13} className="text-white" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-300">
              COPILOT INLINE
            </span>
            <kbd className="px-1.5 py-0.5 text-[10px] font-mono rounded bg-white/10 text-white/70 border border-white/15">
              Ctrl+K
            </kbd>
          </div>

          <span className="text-white/20">|</span>

          {/* Badge de contexte (Sélection ou Position) */}
          <div className="text-[11px] font-mono text-cyan-300/90 truncate flex items-center gap-1.5">
            {hasSelection && selectionRange ? (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                <span>
                  Sélection : Lignes {selectionRange.startLineNumber}–{selectionRange.endLineNumber} (
                  {selectedCode.length} car.)
                </span>
              </>
            ) : (
              <>
                <Code2 size={12} className="text-cyan-400" />
                <span>
                  Ligne {cursorPosition?.lineNumber ?? 1} • {file.name}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Bouton Fermer */}
        <ModalCloseButton
          onClick={handleClose}
          label="Fermer"
          title="Fermer (Échap)"
          compact
        />
      </div>

      {/* Zone de saisie d'invite */}
      <div className="p-3.5 space-y-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleGenerate();
          }}
          className="flex items-center gap-2"
        >
          <div className="relative flex-1">
            <input
              ref={inputRef}
              type="text"
              id="copilot-inline-input"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={isLoading}
              placeholder="Décrivez votre modification... (ex: « Ajoute une barre de navigation Tailwind responsive »)"
              className="w-full bg-black/40 border border-white/15 focus:border-cyan-400/80 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-white/35 outline-none transition-all focus:ring-2 focus:ring-cyan-500/20 pr-10 font-sans"
            />
            {prompt && !isLoading && (
              <button
                type="button"
                onClick={() => setPrompt('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <button
            type="submit"
            disabled={!prompt.trim() || isLoading}
            id="copilot-inline-btn-generate"
            className={cn(
              'px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shrink-0',
              prompt.trim() && !isLoading
                ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                : 'bg-white/5 text-white/30 cursor-not-allowed border border-white/10',
            )}
          >
            {isLoading ? (
              <>
                <Zap size={14} className="animate-spin text-cyan-300" />
                <span>Génération...</span>
              </>
            ) : (
              <>
                <span>Générer</span>
                <CornerDownLeft size={13} className="opacity-70" />
              </>
            )}
          </button>
        </form>

        {/* Suggestions rapides cliquables */}
        {!proposal && !isLoading && (
          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
            <span className="text-[10px] text-white/40 font-medium mr-1">Suggestions :</span>
            {QUICK_COMMANDS.map((cmd) => (
              <button
                key={cmd.label}
                type="button"
                onClick={() => {
                  setPrompt(cmd.prompt);
                  handleGenerate(cmd.prompt);
                }}
                className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-white/5 hover:bg-white/10 text-cyan-300 hover:text-cyan-200 border border-white/10 hover:border-cyan-500/30 transition-all cursor-pointer flex items-center gap-1"
              >
                <ChevronRight size={10} className="text-cyan-400" />
                <span>{cmd.label}</span>
              </button>
            ))}
          </div>
        )}

        {/* État de chargement animé */}
        {isLoading && (
          <div className="py-5 flex flex-col items-center justify-center gap-3 animate-pulse">
            <div className="w-full h-1 rounded-full bg-slate-800 overflow-hidden relative">
              <div className="h-full bg-gradient-to-r from-cyan-500 via-indigo-500 to-cyan-400 animate-[nexus-aurora_2s_ease-in-out_infinite] w-1/2 rounded-full" />
            </div>
            <p className="text-xs text-cyan-300/80 font-mono flex items-center gap-2">
              <Zap size={13} className="text-cyan-400 animate-spin" />
              Génération du code par NEXUS AI en cours...
            </p>
          </div>
        )}

        {/* Message d'erreur éventuel */}
        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center justify-between">
            <span>{error}</span>
            <button
              type="button"
              onClick={() => handleGenerate()}
              className="text-xs font-semibold underline text-rose-200 hover:text-white"
            >
              Réessayer
            </button>
          </div>
        )}

        {/* Diff Visuel Interactif (Le Cœur du Coup de Cœur) */}
        {proposal && !isLoading && (
          <div className="space-y-3 pt-1 animate-in fade-in duration-200">
            {/* Résumé de l'explication et statistiques du diff */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-2 text-xs text-white/90">
                <Check size={14} className="text-emerald-400 shrink-0" />
                <span className="font-medium">{proposal.explanation}</span>
                {proposal.isMock && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                    Mode Démo
                  </span>
                )}
              </div>

              {/* Badges de diff (+N / -M) */}
              <div className="flex items-center gap-1.5 text-[11px] font-mono shrink-0 ml-3">
                <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 font-semibold">
                  +{stats.additions}
                </span>
                <span className="px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-400 border border-rose-500/25 font-semibold">
                  -{stats.deletions}
                </span>
              </div>
            </div>

            {/* Visualiseur de Diff interactif */}
            <div className="rounded-xl border border-white/10 bg-[#050510] overflow-hidden max-h-72 overflow-y-auto scrollbar-thin">
              <div className="divide-y divide-white/5 font-mono text-[11px] leading-relaxed">
                {diffLines.length === 0 ? (
                  <div className="p-4 text-center text-xs text-white/40">Aucune modification détectée.</div>
                ) : (
                  diffLines.map((line, idx) => {
                    const isAdded = line.type === 'added';
                    const isRemoved = line.type === 'removed';

                    return (
                      <div
                        key={idx}
                        className={cn(
                          'flex items-stretch transition-colors select-text',
                          isAdded && 'bg-emerald-950/40 text-emerald-200 border-l-2 border-emerald-500',
                          isRemoved && 'bg-rose-950/40 text-rose-300/80 line-through border-l-2 border-rose-500',
                          !isAdded && !isRemoved && 'text-white/60 hover:bg-white/[0.02]',
                        )}
                      >
                        {/* Numéros de ligne */}
                        <div className="w-10 px-2 py-0.5 text-right text-[10px] text-white/30 select-none border-r border-white/5 bg-black/20 shrink-0 font-mono">
                          {line.oldLineNumber ?? ''}
                        </div>
                        <div className="w-10 px-2 py-0.5 text-right text-[10px] text-white/30 select-none border-r border-white/5 bg-black/20 shrink-0 font-mono">
                          {line.newLineNumber ?? ''}
                        </div>

                        {/* Marqueur + / - */}
                        <div className="w-6 py-0.5 text-center font-bold select-none shrink-0">
                          {isAdded && <span className="text-emerald-400">+</span>}
                          {isRemoved && <span className="text-rose-400">-</span>}
                        </div>

                        {/* Contenu de la ligne */}
                        <div className="flex-1 px-2 py-0.5 whitespace-pre overflow-x-auto">
                          {line.text || ' '}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Barre d'action finale : Accepter (Enter) / Rejeter (Esc) */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-white/10">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setProposal(null);
                    setTimeout(() => inputRef.current?.focus(), 50);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-white/70 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-colors cursor-pointer"
                >
                  <RotateCcw size={12} />
                  <span>Ajuster la consigne</span>
                </button>
                <div className="hidden sm:flex items-center gap-2 text-[11px] text-white/40">
                  <span>Raccourcis :</span>
                  <span className="text-emerald-400">Entrée = Accepter</span>
                  <span>•</span>
                  <span className="text-rose-400">Échap = Rejeter</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Bouton Rejeter */}
                <button
                  type="button"
                  id="copilot-inline-btn-reject"
                  onClick={handleClose}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-rose-300 hover:text-white bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 transition-all cursor-pointer"
                >
                  <X size={13} />
                  <span>Rejeter (Esc)</span>
                </button>

                {/* Bouton Accepter */}
                <button
                  type="button"
                  id="copilot-inline-btn-accept"
                  onClick={() => handleAccept(proposal)}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-semibold text-slate-950 bg-gradient-to-r from-emerald-400 to-cyan-400 hover:from-emerald-300 hover:to-cyan-300 shadow-[0_0_20px_rgba(52,211,153,0.4)] transition-all cursor-pointer"
                >
                  <Check size={14} className="stroke-[2.5]" />
                  <span>Accepter (Enter)</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
