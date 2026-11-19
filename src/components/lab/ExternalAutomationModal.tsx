/**
 * src/components/lab/ExternalAutomationModal.tsx
 *
 * Modale dediee a l'automatisation externe (Cron, Timers, Webhooks entrants/sortants)
 * accessible directement depuis l'espace de developpement NEXUS LAB.
 */

import { createPortal } from 'react-dom';
import { Radio } from 'lucide-react';
import { AutomationCenter } from '@/components/control-center/AutomationCenter';
import { ModalCloseButton } from '@/components/ui/ModalCloseButton';

interface ExternalAutomationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ExternalAutomationModal({
  isOpen,
  onClose,
}: ExternalAutomationModalProps) {
  if (!isOpen) return null;
  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      className="fixed inset-0 z-[150] flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200 cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-4xl bg-white dark:bg-[#0c0d1e] border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden cursor-default"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-200 dark:border-white/8 bg-slate-50/80 dark:bg-surface-900/40 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-cyan-500/20 shrink-0">
              <Radio size={16} />
            </div>
            <div className="min-w-0">
              <h2 className="text-xs sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Automatisation Externe & Webhooks</span>
                <span className="hidden sm:inline-block text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-600 dark:text-cyan-300 font-semibold uppercase tracking-wider shrink-0">
                  CRON & API
                </span>
              </h2>
              <p className="hidden sm:block text-xs text-slate-500 dark:text-white/60 truncate">
                Planification de routines en boucle ouverte, synchronisation GitHub, notifications Slack et Discord.
              </p>
            </div>
          </div>
          <ModalCloseButton onClick={onClose} />
        </div>

        {/* Corps avec AutomationCenter */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
          <AutomationCenter />
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 border-t border-slate-200 dark:border-white/8 bg-slate-50 dark:bg-surface-900/40 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <span>Moteur d'automatisation actif en arriere-plan.</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg border border-slate-300 dark:border-white/10 text-slate-700 dark:text-white/80 hover:bg-slate-100 dark:hover:bg-white/5 font-medium cursor-pointer"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
