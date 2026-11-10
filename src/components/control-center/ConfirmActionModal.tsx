/**
 * src/components/control-center/ConfirmActionModal.tsx
 *
 * Modale de confirmation sécurisée avec le thème Cosmic Intelligence
 * pour les actions sensibles du Centre de Contrôle.
 */

import { AlertTriangle } from 'lucide-react';
import { ModalCloseButton } from '@/components/ui/ModalCloseButton';

interface ConfirmActionModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmActionModal({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirmer',
  cancelLabel = 'Annuler',
  isDestructive = false,
  onConfirm,
  onCancel,
}: ConfirmActionModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-150">
      <div className="relative w-full max-w-md rounded-2xl bg-surface-900 border border-white/10 shadow-[0_0_50px_rgba(124,13,244,0.3)] p-6 space-y-4">
        {/* Fermeture */}
        <ModalCloseButton
          onClick={onCancel}
          label="Fermer"
          title="Fermer (Échap)"
          className="absolute top-4 right-4"
        />

        {/* En-tête avec icône */}
        <div className="flex items-start gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              isDestructive
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                : 'bg-nexus-500/20 text-nexus-400 border border-nexus-500/30'
            }`}
          >
            <AlertTriangle size={20} />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-wide">{title}</h3>
            <p className="text-xs text-white/70 mt-1 leading-relaxed">{message}</p>
          </div>
        </div>

        {/* Boutons d'action */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-white/8">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-xl text-xs font-medium text-white/70 hover:text-white hover:bg-white/5 border border-white/10 transition-all cursor-pointer"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-4 py-2 rounded-xl text-xs font-semibold text-white shadow-md transition-all cursor-pointer ${
              isDestructive
                ? 'bg-rose-600 hover:bg-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.4)]'
                : 'bg-gradient-to-r from-nexus-600 to-cyan-600 hover:from-nexus-500 hover:to-cyan-500 shadow-[0_0_15px_rgba(124,13,244,0.4)]'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

