/**
 * src/components/lab/DiffConfirmationModal.tsx
 *
 * Modale de confirmation et de visualisation du diff pour NEXUS DEV.
 * Affiche clairement les modifications proposées avant et après,
 * et exige une confirmation explicite de l'utilisateur avant d'appliquer
 * toute modification sur son fichier.
 */

import { useState } from 'react';
import { Check, Copy, AlertTriangle, ArrowRight } from 'lucide-react';
import type { DevProposal } from '@/types/lab';
import { ModalCloseButton } from '@/components/ui/ModalCloseButton';

interface DiffConfirmationModalProps {
  proposal: DevProposal | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmApply: (proposal: DevProposal) => void;
}

export function DiffConfirmationModal({
  proposal,
  isOpen,
  onClose,
  onConfirmApply,
}: DiffConfirmationModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !proposal) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(proposal.suggestedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="diff-modal-title"
    >
      <div className="relative w-full max-w-4xl max-h-[90dvh] flex flex-col rounded-2xl liquid-glass border border-slate-200/80 dark:border-nexus-500/30 shadow-[0_0_50px_rgba(0,0,0,0.3)] dark:shadow-[0_0_50px_rgba(124,13,244,0.35)] overflow-hidden legacy-theme text-slate-900 dark:text-white">
        {/* En-tête */}
        <div className="px-6 py-4 border-b border-slate-200/80 dark:border-white/10 liquid-glass flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="p-2 rounded-xl bg-nexus-600/15 dark:bg-nexus-600/20 text-nexus-700 dark:text-nexus-300 border border-nexus-500/30 shrink-0">
              <AlertTriangle size={18} />
            </div>
            <div className="min-w-0">
              <h3 id="diff-modal-title" className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                Confirmation des modifications — NEXUS DEV
              </h3>
              <p className="text-xs text-slate-500 dark:text-white/50 font-mono mt-0.5 truncate">
                Fichier cible : <span className="text-cyan-600 dark:text-cyan-300">{proposal.filePath}</span>
              </p>
            </div>
          </div>

          <ModalCloseButton
            onClick={onClose}
            label="Fermer"
            title="Fermer (Échap)"
          />
        </div>

        {/* Explication de la proposition */}
        <div className="p-4 liquid-glass border-b border-slate-200/80 dark:border-white/8 text-xs text-slate-700 dark:text-white/80 leading-relaxed shrink-0">
          <div className="flex items-center gap-2 text-nexus-600 dark:text-nexus-300 font-semibold mb-1">
            <span>Raison des modifications :</span>
            {proposal.isMock && (
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-nexus-500/15 text-nexus-700 dark:text-nexus-300 border border-nexus-500/30">
                Mode démonstration
              </span>
            )}
          </div>
          <p>{proposal.explanation}</p>
        </div>

        {/* Zone de comparaison (Diff côté à côté ou empilé) */}
        <div className="flex-1 overflow-y-auto scrollbar-thin p-4 grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-100/60 dark:bg-[#070712]">
          {/* Version actuelle */}
          <div className="flex flex-col rounded-xl border border-red-500/25 bg-red-500/10 dark:bg-red-950/20 overflow-hidden">
            <div className="px-3 py-1.5 bg-red-500/15 dark:bg-red-950/40 border-b border-red-500/20 text-[11px] font-mono text-red-700 dark:text-red-300 flex items-center justify-between">
              <span>Code actuel (avant)</span>
              <span className="text-[10px] text-red-600 dark:text-red-400/60">Sera remplacé</span>
            </div>
            <pre className="p-3 font-mono text-[11px] text-red-950 dark:text-white/70 overflow-x-auto whitespace-pre leading-relaxed select-text flex-1">
              {proposal.originalCode}
            </pre>
          </div>

          {/* Version proposée */}
          <div className="flex flex-col rounded-xl border border-emerald-500/25 bg-emerald-500/10 dark:bg-emerald-950/20 overflow-hidden">
            <div className="px-3 py-1.5 bg-emerald-500/15 dark:bg-emerald-950/40 border-b border-emerald-500/20 text-[11px] font-mono text-emerald-700 dark:text-emerald-300 flex items-center justify-between">
              <span>Code proposé (après)</span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">Nouvelle version</span>
            </div>
            <pre className="p-3 font-mono text-[11px] text-emerald-950 dark:text-emerald-100 overflow-x-auto whitespace-pre leading-relaxed select-text flex-1">
              {proposal.suggestedCode}
            </pre>
          </div>
        </div>

        {/* Barre d'action inférieure */}
        <div className="px-6 py-3.5 border-t border-slate-200/80 dark:border-white/10 liquid-glass flex flex-wrap items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-700 dark:text-white/70 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 transition-colors cursor-pointer"
          >
            {copied ? <Check size={14} className="text-emerald-500 dark:text-emerald-400" /> : <Copy size={14} />}
            <span>{copied ? 'Code copié !' : 'Copier le code proposé'}</span>
          </button>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl text-xs font-medium text-slate-600 dark:text-white/70 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 transition-colors cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="button"
              id="btn-confirm-replace-code"
              onClick={() => {
                onConfirmApply(proposal);
                onClose();
              }}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 shadow-[0_0_15px_rgba(16,185,129,0.35)] transition-all cursor-pointer"
            >
              <Check size={14} />
              <span>Confirmer et remplacer</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
