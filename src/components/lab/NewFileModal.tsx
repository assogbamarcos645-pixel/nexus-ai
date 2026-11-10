/**
 * src/components/lab/NewFileModal.tsx
 *
 * Modale de création de fichier pour NEXUS LAB.
 * Valide en temps réel les chemins afin d'interdire les chemins dangereux,
 * les sorties de répertoire (..), et les caractères réservés.
 */

import { useState } from 'react';
import { FilePlus, Check, AlertCircle } from 'lucide-react';
import { sanitizeAndValidatePath } from '@/services/lab/projectService';
import { ModalCloseButton } from '@/components/ui/ModalCloseButton';

interface NewFileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddFile: (path: string) => { success: boolean; error?: string };
}

export function NewFileModal({ isOpen, onClose, onAddFile }: NewFileModalProps) {
  const [filePath, setFilePath] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const validation = sanitizeAndValidatePath(filePath);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validation.valid) {
      setErrorMsg(validation.error || 'Chemin invalide');
      return;
    }

    const result = onAddFile(validation.normalizedPath);
    if (!result.success) {
      setErrorMsg(result.error || 'Erreur lors de l’ajout du fichier');
      return;
    }

    setFilePath('');
    setErrorMsg(null);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="new-file-title"
    >
      <div className="relative w-full max-w-md max-h-[90dvh] flex flex-col rounded-2xl liquid-glass border border-slate-200/80 dark:border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.3)] dark:shadow-[0_0_50px_rgba(124,13,244,0.35)] overflow-hidden legacy-theme text-slate-900 dark:text-white">
        {/* En-tête */}
        <div className="px-5 py-4 border-b border-slate-200/80 dark:border-white/10 liquid-glass flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="p-1.5 rounded-lg bg-nexus-600/20 text-nexus-700 dark:text-nexus-300 border border-nexus-500/30 shrink-0">
              <FilePlus size={16} />
            </div>
            <div className="min-w-0">
              <h3 id="new-file-title" className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                Ajouter un fichier
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-white/50 truncate">Chemin relatif au projet</p>
            </div>
          </div>
          <ModalCloseButton
            onClick={onClose}
            label="Fermer"
            title="Fermer (Échap)"
          />
        </div>

        {/* Corps */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto scrollbar-thin flex-1">
          <div>
            <label htmlFor="input-file-path" className="block text-xs font-semibold text-slate-700 dark:text-white/70 uppercase tracking-wider mb-1.5">
              Nom ou chemin du fichier
            </label>
            <input
              id="input-file-path"
              type="text"
              autoFocus
              value={filePath}
              onChange={(e) => {
                setFilePath(e.target.value);
                setErrorMsg(null);
              }}
              placeholder="Ex: styles/custom.css ou utils/api.ts"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/90 dark:bg-black/40 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white font-mono text-xs placeholder:text-slate-400 dark:placeholder:text-white/30 focus:outline-none focus:border-nexus-500 transition-colors shadow-xs"
            />
          </div>

          {/* Validation en temps réel */}
          {filePath.trim() && (
            <div className="text-[11px] font-mono">
              {validation.valid ? (
                <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
                  <Check size={13} />
                  <span>Chemin sécurisé : {validation.normalizedPath}</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-red-600 dark:text-red-400 font-medium">
                  <AlertCircle size={13} />
                  <span>{validation.error}</span>
                </div>
              )}
            </div>
          )}

          {/* Message d'erreur soumission */}
          {errorMsg && (
            <div className="p-2.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-600 dark:text-red-300 text-xs">
              {errorMsg}
            </div>
          )}

          <div className="p-3 rounded-xl bg-slate-100/80 dark:bg-white/4 border border-slate-200/80 dark:border-white/6 text-[10px] text-slate-500 dark:text-white/40 space-y-1">
            <p><strong>Conseil sécurité :</strong> Les chemins relatifs ("..") et les chemins absolus ("/") sont automatiquement rejetés.</p>
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-white/70 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 transition-colors cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={!filePath.trim() || !validation.valid}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-nexus-600 to-cyan-600 hover:from-nexus-500 hover:to-cyan-500 disabled:opacity-40 shadow-[0_0_15px_rgba(124,13,244,0.4)] transition-all cursor-pointer"
            >
              Créer le fichier
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
