/**
 * src/components/lab/ActivityBar.tsx
 *
 * Barre d'activité latérale ultra-fine (style VS Code / Cursor IDE) pour NEXUS LAB.
 * Regroupe les actions fondamentales de l'environnement de développement :
 * Explorateur de fichiers, Assistant IA NEXUS DEV, Nouveau projet, Nouveau fichier,
 * Sauvegarde, Exportation ZIP et Réinitialisation de la démo.
 */

import {
  FolderTree,
  Sparkles,
  Users,
  FolderPlus,
  FilePlus,
  Save,
  Download,
  RotateCcw,
  History,
  FolderGit2,
} from 'lucide-react';
import { cn } from '@/utils/cn';

interface ActivityBarProps {
  showExplorer: boolean;
  onToggleExplorer: () => void;
  isDevAssistantOpen: boolean;
  onToggleDevAssistant: () => void;
  isSwarmOpen?: boolean;
  onToggleSwarm?: () => void;
  onNewProjectClick: () => void;
  onNewFileClick: () => void;
  hasUnsavedChanges: boolean;
  isSaving: boolean;
  onSave: () => void;
  isExporting: boolean;
  onExportZip: () => void;
  onOpenHistory?: () => void;
  snapshotsCount?: number;
  onOpenGitHubExport?: () => void;
  onResetDemo: () => void;
  filesCount?: number;
}

export function ActivityBar({
  showExplorer,
  onToggleExplorer,
  isDevAssistantOpen,
  onToggleDevAssistant,
  isSwarmOpen = false,
  onToggleSwarm,
  onNewProjectClick,
  onNewFileClick,
  hasUnsavedChanges,
  isSaving,
  onSave,
  isExporting,
  onExportZip,
  onOpenHistory,
  snapshotsCount = 0,
  onOpenGitHubExport,
  onResetDemo,
  filesCount = 0,
}: ActivityBarProps) {
  return (
    <aside
      id="nexus-lab-activity-bar"
      aria-label="Barre d'activité de l'IDE"
      className="hidden md:flex flex-col items-center justify-between w-12 h-full py-2.5 bg-slate-100/90 dark:bg-[#06060e] border-r border-slate-200/80 dark:border-white/8 select-none shrink-0 z-20"
    >
      {/* Groupe d'actions primaires supérieures */}
      <div className="flex flex-col items-center gap-1.5 w-full">
        {/* Toggle Explorateur de fichiers */}
        <div className="relative group/btn flex items-center justify-center w-full">
          <button
            type="button"
            id="activity-btn-explorer"
            onClick={onToggleExplorer}
            className={cn(
              'relative p-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center',
              showExplorer
                ? 'bg-nexus-600/15 dark:bg-nexus-500/20 text-nexus-600 dark:text-nexus-400 shadow-[0_0_12px_rgba(124,13,244,0.25)]'
                : 'text-slate-500 dark:text-white/45 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-white/5',
            )}
            title={showExplorer ? "Masquer l'explorateur de fichiers" : "Afficher l'explorateur de fichiers"}
            aria-label="Explorateur de fichiers"
          >
            {showExplorer && (
              <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-nexus-500 rounded-r" />
            )}
            <FolderTree size={18} />
            {filesCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[15px] h-[15px] px-1 rounded-full bg-nexus-600 text-[9px] font-mono font-bold text-white flex items-center justify-center">
                {filesCount}
              </span>
            )}
          </button>
        </div>

        {/* Toggle Assistant IA NEXUS DEV */}
        <div className="relative group/btn flex items-center justify-center w-full">
          <button
            type="button"
            id="activity-btn-nexus-dev"
            onClick={onToggleDevAssistant}
            className={cn(
              'relative p-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center',
              isDevAssistantOpen
                ? 'bg-gradient-to-r from-nexus-600 to-cyan-600 text-white shadow-[0_0_16px_rgba(6,182,212,0.4)]'
                : 'text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 hover:bg-cyan-500/10',
            )}
            title="Assistant IA NEXUS DEV (Vibe-Coding)"
            aria-label="Assistant IA NEXUS DEV"
          >
            {isDevAssistantOpen && (
              <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-cyan-400 rounded-r" />
            )}
            <Sparkles size={18} className={isDevAssistantOpen ? 'animate-pulse' : ''} />
          </button>
        </div>

        {/* Toggle Multi-Agents Swarm (Équipe Autonome de Développement) */}
        {onToggleSwarm && (
          <div className="relative group/btn flex items-center justify-center w-full">
            <button
              type="button"
              id="activity-btn-nexus-swarm"
              onClick={onToggleSwarm}
              className={cn(
                'relative p-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center',
                isSwarmOpen
                  ? 'bg-gradient-to-r from-nexus-600 via-indigo-600 to-cyan-500 text-white shadow-[0_0_16px_rgba(124,13,244,0.4)]'
                  : 'text-nexus-600 dark:text-nexus-400 hover:text-nexus-700 dark:hover:text-nexus-300 hover:bg-nexus-500/10',
              )}
              title="Multi-Agents Swarm (Équipe Autonome : Architecte • Frontend • QA)"
              aria-label="Multi-Agents Swarm"
            >
              {isSwarmOpen && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-nexus-400 rounded-r" />
              )}
              <Users size={18} className={isSwarmOpen ? 'animate-pulse' : ''} />
            </button>
          </div>
        )}

        <div className="w-6 h-px bg-slate-200 dark:bg-white/10 my-1" />

        {/* Nouveau Projet */}
        <div className="relative group/btn flex items-center justify-center w-full">
          <button
            type="button"
            id="activity-btn-new-project"
            onClick={onNewProjectClick}
            className="p-2.5 rounded-xl text-slate-500 dark:text-white/45 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-white/5 transition-all cursor-pointer"
            title="Créer un nouveau projet (Modèles disponibles)"
            aria-label="Créer un nouveau projet"
          >
            <FolderPlus size={17} />
          </button>
        </div>

        {/* Nouveau Fichier */}
        <div className="relative group/btn flex items-center justify-center w-full">
          <button
            type="button"
            id="activity-btn-new-file"
            onClick={onNewFileClick}
            className="p-2.5 rounded-xl text-slate-500 dark:text-white/45 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-white/5 transition-all cursor-pointer"
            title="Ajouter un nouveau fichier au projet actif"
            aria-label="Ajouter un nouveau fichier"
          >
            <FilePlus size={17} />
          </button>
        </div>
      </div>

      {/* Groupe d'actions inférieures (Sauvegarde, Export, Reset démo) */}
      <div className="flex flex-col items-center gap-1.5 w-full">
        {/* Sauvegarder */}
        <div className="relative group/btn flex items-center justify-center w-full">
          <button
            type="button"
            id="activity-btn-save"
            onClick={onSave}
            disabled={!hasUnsavedChanges || isSaving}
            className={cn(
              'relative p-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center',
              hasUnsavedChanges
                ? 'bg-nexus-600 text-white hover:bg-nexus-500 shadow-[0_0_12px_rgba(124,13,244,0.4)]'
                : 'text-slate-400 dark:text-white/30 hover:text-slate-700 dark:hover:text-white/60 cursor-not-allowed opacity-60',
            )}
            title={hasUnsavedChanges ? 'Enregistrer les modifications (Ctrl+S)' : 'Aucune modification non enregistrée'}
            aria-label="Enregistrer le fichier actif"
          >
            <Save size={17} />
            {hasUnsavedChanges && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            )}
          </button>
        </div>

        {/* Exporter ZIP */}
        <div className="relative group/btn flex items-center justify-center w-full">
          <button
            type="button"
            id="activity-btn-export-zip"
            onClick={onExportZip}
            disabled={isExporting}
            className="p-2.5 rounded-xl text-slate-500 dark:text-white/45 hover:text-emerald-500 dark:hover:text-emerald-400 hover:bg-emerald-500/10 transition-all cursor-pointer"
            title="Télécharger l'archive ZIP du projet"
            aria-label="Télécharger l'archive ZIP du projet"
          >
            <Download size={17} />
          </button>
        </div>

        {/* Exporter vers GitHub */}
        {onOpenGitHubExport && (
          <div className="relative group/btn flex items-center justify-center w-full">
            <button
              type="button"
              id="activity-btn-export-github"
              onClick={onOpenGitHubExport}
              className="p-2.5 rounded-xl text-slate-500 dark:text-white/45 hover:text-purple-500 dark:hover:text-purple-400 hover:bg-purple-500/10 transition-all cursor-pointer"
              title="Exporter vers GitHub"
              aria-label="Exporter vers GitHub"
            >
              <FolderGit2 size={17} />
            </button>
          </div>
        )}

        {/* Historique des versions (Snapshots) */}
        {onOpenHistory && (
          <div className="relative group/btn flex items-center justify-center w-full">
            <button
              type="button"
              id="activity-btn-history"
              onClick={onOpenHistory}
              className="relative p-2.5 rounded-xl text-slate-500 dark:text-white/45 hover:text-amber-500 dark:hover:text-amber-400 hover:bg-amber-500/10 transition-all cursor-pointer"
              title="Historique des instantanés (Rollback)"
              aria-label="Historique des instantanés"
            >
              <History size={17} />
              {snapshotsCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[15px] h-[15px] px-1 rounded-full bg-amber-500 text-[9px] font-mono font-bold text-slate-950 flex items-center justify-center">
                  {snapshotsCount}
                </span>
              )}
            </button>
          </div>
        )}

        {/* Réinitialiser la démo */}
        <div className="relative group/btn flex items-center justify-center w-full">
          <button
            type="button"
            id="activity-btn-reset-demo"
            onClick={() => {
              if (
                window.confirm(
                  'Réinitialiser tous les projets de démonstration à leur état initial ? Les modifications non enregistrées seront perdues.',
                )
              ) {
                onResetDemo();
              }
            }}
            className="p-2.5 rounded-xl text-slate-400 dark:text-white/30 hover:text-slate-700 dark:hover:text-white/80 hover:bg-slate-200/60 dark:hover:bg-white/5 transition-all cursor-pointer"
            title="Réinitialiser les projets de démonstration"
            aria-label="Réinitialiser la démo"
          >
            <RotateCcw size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
