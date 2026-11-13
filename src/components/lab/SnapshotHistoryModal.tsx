/**
 * src/components/lab/SnapshotHistoryModal.tsx
 *
 * Fenêtre modale d'historique des instantanés (Snapshots & Rollback) pour NEXUS LAB.
 * Permet de visualiser les points de restauration du projet, de créer un instantané manuel
 * et de revenir à tout moment à un état antérieur en un seul clic.
 */

import { useState } from 'react';
import {
  History,
  RotateCcw,
  Plus,
  Trash2,
  FileCode,
  Calendar,
  Sparkles,
  Bot,
  User,
  ShieldCheck,
  Check,
} from 'lucide-react';
import type { ProjectSnapshot } from '@/types/snapshot';
import { ModalCloseButton } from '@/components/ui/ModalCloseButton';

interface SnapshotHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectName: string;
  snapshots: ProjectSnapshot[];
  onRollback: (snapshotId: string) => void;
  onCreateSnapshot: (label: string, description?: string) => void;
  onDeleteSnapshot: (snapshotId: string) => void;
}

export function SnapshotHistoryModal({
  isOpen,
  onClose,
  projectName,
  snapshots,
  onRollback,
  onCreateSnapshot,
  onDeleteSnapshot,
}: SnapshotHistoryModalProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [restoredId, setRestoredId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabel.trim()) return;
    onCreateSnapshot(newLabel.trim(), newDescription.trim() || undefined);
    setNewLabel('');
    setNewDescription('');
    setIsCreating(false);
  };

  const handleRollbackClick = (snapshotId: string) => {
    onRollback(snapshotId);
    setRestoredId(snapshotId);
    setTimeout(() => {
      setRestoredId(null);
      onClose();
    }, 1200);
  };

  const getAuthorBadge = (author: ProjectSnapshot['author']) => {
    switch (author) {
      case 'user':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
            <User size={10} /> Utilisateur
          </span>
        );
      case 'ai-dev':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30">
            <Sparkles size={10} /> NEXUS DEV
          </span>
        );
      case 'ai-swarm':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30">
            <Bot size={10} /> Swarm Multi-Agents
          </span>
        );
      case 'auto':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-200/80 dark:bg-white/10 text-slate-600 dark:text-white/60 border border-slate-300 dark:border-white/15">
            <ShieldCheck size={10} /> Sauvegarde auto
          </span>
        );
    }
  };

  const formatTimestamp = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return (
        d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) +
        ' • ' +
        d.toLocaleDateString()
      );
    } catch {
      return isoString;
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200 cursor-pointer"
      role="dialog"
      aria-modal="true"
      aria-labelledby="history-modal-title"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl flex flex-col rounded-t-3xl sm:rounded-2xl liquid-glass border-t sm:border border-slate-200/80 dark:border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.3)] dark:shadow-[0_0_50px_rgba(124,13,244,0.35)] overflow-hidden legacy-theme text-slate-900 dark:text-white max-h-[92dvh] pb-safe cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Poignée tactile mobile style iOS (tap pour fermer) */}
        <button
          type="button"
          onClick={onClose}
          className="sm:hidden w-full flex justify-center pt-2.5 pb-1 bg-transparent cursor-pointer shrink-0"
          aria-label="Fermer"
        >
          <div className="w-12 h-1 bg-white/20 rounded-full" />
        </button>

        {/* En-tête */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-200/80 dark:border-white/10 liquid-glass flex items-center justify-between gap-3 sm:gap-4 shrink-0">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="p-2 rounded-xl bg-purple-600/15 dark:bg-purple-600/20 text-purple-600 dark:text-purple-400 border border-purple-500/30 shrink-0">
              <History size={18} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 id="history-modal-title" className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                  Instantanés & Historique de versions
                </h3>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-nexus-500/10 text-nexus-600 dark:text-nexus-400 border border-nexus-500/20 shrink-0">
                  {snapshots.length} point{snapshots.length > 1 ? 's' : ''}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-white/50 mt-0.5 truncate">
                Projet : <span className="font-semibold text-cyan-600 dark:text-cyan-400">{projectName}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isCreating && (
              <button
                type="button"
                onClick={() => setIsCreating(true)}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-sm hover:scale-105 active:scale-95 transition-all cursor-pointer shrink-0"
              >
                <Plus size={14} />
                <span className="hidden sm:inline">Créer un instantané</span>
                <span className="sm:hidden">Instantané</span>
              </button>
            )}
            <ModalCloseButton onClick={onClose} label="Fermer" title="Fermer (Échap)" />
          </div>
        </div>

        {/* Formulaire de création manuelle */}
        {isCreating && (
          <form
            onSubmit={handleCreateSubmit}
            className="p-4 border-b border-purple-500/20 bg-purple-500/5 space-y-3 shrink-0 animate-in slide-in-from-top-2 duration-150"
          >
            <div className="text-xs font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300">
              Nouvel instantané manuel
            </div>
            <div className="space-y-2">
              <input
                type="text"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                placeholder="Nom du point de restauration (ex: Version stable avant refonte)"
                autoFocus
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-white/10 bg-white dark:bg-black/30 focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-900 dark:text-white"
              />
              <input
                type="text"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Description facultative"
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-white/10 bg-white dark:bg-black/30 focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-900 dark:text-white"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="px-3 py-1 rounded-lg text-xs font-medium text-slate-600 dark:text-white/60 hover:bg-slate-200/60 dark:hover:bg-white/10"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={!newLabel.trim()}
                className="px-3 py-1 rounded-lg text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 disabled:opacity-50"
              >
                Enregistrer l'instantané
              </button>
            </div>
          </form>
        )}

        {/* Liste des instantanés */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3 scrollbar-thin">
          {snapshots.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-3 text-purple-500">
                <History size={22} />
              </div>
              <h4 className="text-sm font-semibold text-slate-800 dark:text-white">Aucun instantané enregistré</h4>
              <p className="text-xs text-slate-500 dark:text-white/50 max-w-sm mt-1">
                Les instantanés sont créés automatiquement avant chaque modification par l'IA (Copilote ou Swarm). Vous pouvez aussi en créer manuellement dès maintenant.
              </p>
            </div>
          ) : (
            snapshots.map((snap) => {
              const isRestored = restoredId === snap.id;
              return (
                <div
                  key={snap.id}
                  className="p-3.5 rounded-xl border border-slate-200/80 dark:border-white/10 bg-white/60 dark:bg-white/[0.03] hover:border-purple-500/40 transition-all flex items-start justify-between gap-3 group"
                >
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-xs text-slate-900 dark:text-white truncate">
                        {snap.label}
                      </span>
                      {getAuthorBadge(snap.author)}
                    </div>

                    {snap.description && (
                      <p className="text-[11px] text-slate-600 dark:text-white/60 line-clamp-2">
                        {snap.description}
                      </p>
                    )}

                    <div className="flex items-center gap-3 text-[10px] text-slate-400 dark:text-white/40 font-mono pt-0.5">
                      <span className="flex items-center gap-1">
                        <Calendar size={11} /> {formatTimestamp(snap.timestamp)}
                      </span>
                      <span className="flex items-center gap-1">
                        <FileCode size={11} /> {snap.fileCount} fichier{snap.fileCount > 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleRollbackClick(snap.id)}
                      disabled={isRestored}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-purple-700 dark:text-purple-300 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-xs"
                      title="Restaurer le projet à cet instant précis"
                    >
                      {isRestored ? (
                        <>
                          <Check size={13} className="text-emerald-500" />
                          <span className="text-emerald-600 dark:text-emerald-400">Restauré !</span>
                        </>
                      ) : (
                        <>
                          <RotateCcw size={13} />
                          <span>Restaurer</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => onDeleteSnapshot(snap.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                      title="Supprimer cet instantané"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
