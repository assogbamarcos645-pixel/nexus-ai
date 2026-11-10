/**
 * src/components/lab/LabToolbar.tsx
 *
 * Barre d'en-tête supérieure réarrangée pour NEXUS LAB.
 * Fournit le sélecteur de projet avec badge d'environnement,
 * le sélecteur de disposition centré (Code seul / Split côte-à-côte / Aperçu seul),
 * et les raccourcis d'exécution/sauvegarde sans aucun chevauchement.
 */

import {
  FolderPlus,
  FilePlus,
  Save,
  Download,
  RotateCcw,
  Sparkles,
  Users,
  ChevronDown,
  Layers,
  Code2,
  Play,
  Bot,
  Eye,
  EyeOff,
  Columns,
  SquareCode,
  Smartphone,
  HardDrive,
  Cloud,
  History,
  FolderGit2,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import type { LabProject, LabFile, LabTab, LabLayoutMode } from '@/types/lab';
import { useTranslation } from '@/hooks/useTranslation';

interface LabToolbarProps {
  projects: LabProject[];
  activeProject: LabProject | null;
  activeFile?: LabFile | null;
  activeTab: LabTab;
  layoutMode?: LabLayoutMode;
  onChangeLayoutMode?: (mode: LabLayoutMode) => void;
  hasUnsavedChanges: boolean;
  isSaving: boolean;
  isExporting: boolean;
  showPreview?: boolean;
  onTogglePreview?: () => void;
  showExplorer?: boolean;
  onToggleExplorer?: () => void;
  onSelectProject: (id: string) => void;
  onNewProjectClick: () => void;
  onNewFileClick: () => void;
  onSave: () => void;
  onResetDemo: () => void;
  onExportZip: () => void;
  onOpenHistory?: () => void;
  onOpenGitHubExport?: () => void;
  snapshotCount?: number;
  isDevAssistantOpen?: boolean;
  onToggleDevAssistant: () => void;
  isSwarmOpen?: boolean;
  onToggleSwarm?: () => void;
  onChangeTab: (tab: LabTab) => void;
}

export function LabToolbar({
  projects,
  activeProject,
  activeTab,
  layoutMode = 'split',
  onChangeLayoutMode,
  hasUnsavedChanges,
  isSaving,
  isExporting,
  showPreview = true,
  onTogglePreview,
  showExplorer = true,
  onToggleExplorer,
  onSelectProject,
  onNewProjectClick,
  onNewFileClick,
  onSave,
  onResetDemo,
  onExportZip,
  onOpenHistory,
  onOpenGitHubExport,
  snapshotCount = 0,
  isDevAssistantOpen = false,
  onToggleDevAssistant,
  isSwarmOpen = false,
  onToggleSwarm,
  onChangeTab,
}: LabToolbarProps) {
  const { t } = useTranslation();

  return (
    <header
      id="nexus-lab-toolbar"
      className="liquid-glass border-b border-slate-200/80 dark:border-white/10 px-3 py-1.5 flex flex-col gap-1.5 shrink-0 select-none z-10"
    >
      <div className="flex items-center justify-between md:grid md:grid-cols-[auto_auto_1fr] lg:grid-cols-[1fr_auto_1fr] gap-1.5 sm:gap-3 w-full min-w-0">
        {/* Zone 1 (Gauche) : Sélecteur de projet & Badge (Largeur contrôlée sans débordement) */}
        <div className="flex items-center gap-1.5 min-w-0 justify-self-start shrink">
          {/* Bouton Toggle Explorer */}
          {onToggleExplorer && (
            <button
              type="button"
              id="btn-toolbar-toggle-explorer"
              onClick={onToggleExplorer}
              className={cn(
                'flex items-center justify-center p-1.5 rounded-lg border transition-all cursor-pointer text-xs shrink-0',
                showExplorer
                  ? 'bg-nexus-500/15 dark:bg-nexus-500/20 text-nexus-700 dark:text-nexus-300 border-nexus-500/30'
                  : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-white/60 border-slate-200 dark:border-white/10 hover:text-slate-900 dark:hover:text-white',
              )}
              title={showExplorer ? "Masquer l'explorateur (Ctrl+B)" : "Afficher l'explorateur (Ctrl+B)"}
              aria-label="Toggle Explorateur"
            >
              <Layers size={14} />
            </button>
          )}

          {/* Sélecteur de projet actif */}
          <div className="relative min-w-0 max-w-[130px] sm:max-w-[160px] md:max-w-[180px]">
            <select
              id="select-active-project"
              value={activeProject?.id || ''}
              onChange={(e) => onSelectProject(e.target.value)}
              className="appearance-none bg-white/90 dark:bg-surface-900 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-xs font-semibold rounded-lg pl-2.5 pr-7 py-1.5 focus:outline-none focus:border-nexus-500 cursor-pointer shadow-xs hover:border-slate-300 dark:hover:border-white/20 transition-colors w-full truncate"
            >
              {projects.length === 0 ? (
                <option value="" className="bg-white dark:bg-surface-950 text-slate-500 dark:text-white/50">
                  Aucun projet (Vierge)
                </option>
              ) : (
                projects.map((proj) => (
                  <option key={proj.id} value={proj.id} className="bg-white dark:bg-surface-950 text-slate-900 dark:text-white">
                    {proj.name} {proj.isDemo ? '(Démo)' : proj.isCloudSynced ? '(Cloud)' : '(Local)'}
                  </option>
                ))
              )}
            </select>
            <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 dark:text-white/50 pointer-events-none" />
          </div>

          {/* Badge type de projet */}
          {activeProject && (
            <div className="hidden 2xl:flex items-center gap-1.5 shrink-0">
              {activeProject.isDemo ? (
                <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-nexus-500/15 text-nexus-600 dark:text-nexus-300 border border-nexus-500/30 font-medium font-mono">
                  <Sparkles size={10} /> Démo
                </span>
              ) : activeProject.isCloudSynced ? (
                <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-600 dark:text-cyan-300 border border-cyan-500/30 font-medium font-mono">
                  <Cloud size={10} /> Cloud
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-slate-200/70 dark:bg-white/10 text-slate-600 dark:text-white/60 border border-slate-300/60 dark:border-white/10 font-medium font-mono">
                  <HardDrive size={10} /> Local
                </span>
              )}
            </div>
          )}
        </div>

        {/* Zone 2 (Centre) : Sélecteur de Mode de Disposition (Split / Code Seul / Aperçu Seul) - COMPACT SANS DÉBORDEMENT */}
        {onChangeLayoutMode && (
          <div className="hidden md:flex items-center justify-self-center shrink-0 bg-slate-200/80 dark:bg-white/8 p-0.5 rounded-xl border border-slate-300/80 dark:border-white/10 shadow-xs z-10 mx-1">
            <button
              type="button"
              onClick={() => onChangeLayoutMode('code-only')}
              className={cn(
                'flex items-center gap-1 p-1.5 xl:px-2 xl:py-1 rounded-lg text-xs font-medium transition-all cursor-pointer shrink-0',
                layoutMode === 'code-only'
                  ? 'bg-white dark:bg-surface-900 text-nexus-600 dark:text-cyan-300 shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-white/60 hover:text-slate-900 dark:hover:text-white',
              )}
              title="Afficher l'éditeur de code en plein écran"
            >
              <SquareCode size={13} />
              <span className="hidden xl:inline">Code</span>
            </button>

            <button
              type="button"
              onClick={() => onChangeLayoutMode('split')}
              className={cn(
                'flex items-center gap-1 p-1.5 xl:px-2 xl:py-1 rounded-lg text-xs font-medium transition-all cursor-pointer shrink-0',
                layoutMode === 'split'
                  ? 'bg-white dark:bg-surface-900 text-nexus-600 dark:text-cyan-300 shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-white/60 hover:text-slate-900 dark:hover:text-white',
              )}
              title="Affichage côte-à-côte : Éditeur de code + Prévisualisation en direct"
            >
              <Columns size={13} />
              <span className="hidden xl:inline">Split</span>
            </button>

            <button
              type="button"
              onClick={() => onChangeLayoutMode('preview-only')}
              className={cn(
                'flex items-center gap-1 p-1.5 xl:px-2 xl:py-1 rounded-lg text-xs font-medium transition-all cursor-pointer shrink-0',
                layoutMode === 'preview-only'
                  ? 'bg-white dark:bg-surface-900 text-nexus-600 dark:text-cyan-300 shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-white/60 hover:text-slate-900 dark:hover:text-white',
              )}
              title="Afficher la prévisualisation en plein écran"
            >
              <Smartphone size={13} />
              <span className="hidden xl:inline">Aperçu</span>
            </button>
          </div>
        )}

        {/* Zone 3 (Droite) : Actions rapides globales - STRICTEMENT ALIGNÉ À DROITE SANS COLLISION */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 justify-self-end">
          {/* Bouton nouveau projet */}
          <button
            type="button"
            id="btn-toolbar-new-project"
            onClick={onNewProjectClick}
            className="hidden 2xl:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 dark:text-white/80 hover:text-slate-900 dark:hover:text-white bg-slate-100/80 dark:bg-white/5 hover:bg-slate-200/80 dark:hover:bg-white/10 border border-slate-200/80 dark:border-white/8 transition-all cursor-pointer shrink-0"
            title="Créer un nouveau projet"
          >
            <FolderPlus size={13} className="text-nexus-500 dark:text-nexus-400" />
            <span>Nouveau</span>
          </button>

          {/* Bouton nouveau fichier */}
          <button
            type="button"
            id="btn-toolbar-new-file"
            onClick={onNewFileClick}
            className="hidden 2xl:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 dark:text-white/80 hover:text-slate-900 dark:hover:text-white bg-slate-100/80 dark:bg-white/5 hover:bg-slate-200/80 dark:hover:bg-white/10 border border-slate-200/80 dark:border-white/8 transition-all cursor-pointer shrink-0"
            title="Ajouter un fichier"
          >
            <FilePlus size={13} className="text-cyan-600 dark:text-cyan-400" />
            <span>Fichier</span>
          </button>

          {/* Bouton Sauvegarder */}
          <button
            type="button"
            id="btn-toolbar-save"
            onClick={onSave}
            disabled={!hasUnsavedChanges || isSaving}
            className={cn(
              'flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer shrink-0',
              hasUnsavedChanges
                ? 'bg-nexus-600 text-white hover:bg-nexus-500 shadow-[0_0_12px_rgba(124,13,244,0.4)]'
                : 'bg-slate-100 dark:bg-white/4 text-slate-400 dark:text-white/30 border border-slate-200 dark:border-white/6 cursor-not-allowed',
            )}
            title="Enregistrer (Ctrl+S)"
          >
            <Save size={13} />
            <span className="hidden lg:inline">{isSaving ? '...' : 'Enregistrer'}</span>
          </button>

          {/* Bouton Exporter ZIP */}
          <button
            type="button"
            id="btn-toolbar-export-zip"
            onClick={onExportZip}
            disabled={isExporting}
            className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 dark:text-white/80 hover:text-slate-900 dark:hover:text-white bg-slate-100/80 dark:bg-white/5 hover:bg-slate-200/80 dark:hover:bg-white/10 border border-slate-200/80 dark:border-white/8 transition-all cursor-pointer shrink-0"
            title="Exporter tout le projet sous format archive ZIP"
          >
            <Download size={13} className="text-emerald-500 dark:text-emerald-400" />
            <span className="hidden 2xl:inline">{isExporting ? '...' : 'Export ZIP'}</span>
          </button>

          {/* Bouton Export GitHub One-Click */}
          {onOpenGitHubExport && (
            <button
              type="button"
              id="btn-toolbar-export-github"
              onClick={onOpenGitHubExport}
              className="hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 dark:text-white/80 hover:text-slate-900 dark:hover:text-white bg-slate-100/80 dark:bg-white/5 hover:bg-slate-200/80 dark:hover:bg-white/10 border border-slate-200/80 dark:border-white/8 transition-all cursor-pointer shrink-0"
              title="Exporter directement le projet sur un dépôt GitHub"
            >
              <FolderGit2 size={13} className="text-purple-600 dark:text-purple-400" />
              <span className="hidden 2xl:inline">GitHub</span>
            </button>
          )}

          {/* Bouton Historique & Snapshots */}
          {onOpenHistory && (
            <button
              type="button"
              id="btn-toolbar-history"
              onClick={onOpenHistory}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 dark:text-white/80 hover:text-slate-900 dark:hover:text-white bg-slate-100/80 dark:bg-white/5 hover:bg-slate-200/80 dark:hover:bg-white/10 border border-slate-200/80 dark:border-white/8 transition-all cursor-pointer shrink-0"
              title="Historique des versions et instantanés (Rollback)"
            >
              <History size={13} className="text-amber-500 dark:text-amber-400" />
              <span className="hidden xl:inline">Historique</span>
              {snapshotCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-amber-500/20 text-amber-700 dark:text-amber-300 font-semibold">
                  {snapshotCount}
                </span>
              )}
            </button>
          )}

          {/* Bouton Réinitialiser la démo */}
          <button
            type="button"
            id="btn-toolbar-reset-demo"
            onClick={() => {
              if (
                window.confirm(
                  'Réinitialiser tous les projets de démonstration à leur état initial ? Les modifications non enregistrées seront perdues.',
                )
              ) {
                onResetDemo();
              }
            }}
            className="hidden 2xl:flex items-center p-1.5 rounded-lg text-xs text-slate-400 dark:text-white/40 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-white/5 transition-all cursor-pointer shrink-0"
            title="Réinitialiser les projets de démonstration"
            aria-label="Réinitialiser la démo"
          >
            <RotateCcw size={13} />
          </button>

          {/* Bouton Toggle Aperçu pour petits écrans */}
          {onTogglePreview && (
            <button
              type="button"
              id="btn-toolbar-toggle-preview"
              onClick={onTogglePreview}
              className={cn(
                'flex md:hidden items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer shrink-0',
                showPreview
                  ? 'bg-nexus-500/15 dark:bg-nexus-500/20 text-nexus-700 dark:text-nexus-300 border-nexus-500/30'
                  : 'bg-slate-100/80 dark:bg-white/5 text-slate-600 dark:text-white/60 border-slate-200/80 dark:border-white/8',
              )}
              title={showPreview ? t('lab.hidePreview') : t('lab.showPreview')}
            >
              {showPreview ? <EyeOff size={13} /> : <Eye size={13} />}
            </button>
          )}

          {/* Bouton Assistant IA NEXUS DEV */}
          <button
            type="button"
            id="btn-toolbar-nexus-dev"
            onClick={onToggleDevAssistant}
            className={cn(
              'flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-lg text-xs font-semibold text-white transition-all cursor-pointer shrink-0',
              isDevAssistantOpen
                ? 'bg-nexus-700 border border-cyan-400 ring-2 ring-cyan-400/40 shadow-[0_0_18px_rgba(6,182,212,0.5)]'
                : 'bg-gradient-to-r from-nexus-600 to-cyan-600 hover:from-nexus-500 hover:to-cyan-500 shadow-[0_0_12px_rgba(6,182,212,0.35)]',
            )}
            title={isDevAssistantOpen ? "Fermer l'assistant IA NEXUS DEV" : "Ouvrir l'assistant IA NEXUS DEV"}
          >
            <Sparkles size={13} className="text-cyan-200" />
            <span className="hidden lg:inline">NEXUS DEV</span>
            <span className="hidden sm:inline lg:hidden">DEV</span>
          </button>

          {/* Bouton Multi-Agents Swarm (Équipe Autonome) */}
          {onToggleSwarm && (
            <button
              type="button"
              id="btn-toolbar-nexus-swarm"
              onClick={onToggleSwarm}
              className={cn(
                'flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-lg text-xs font-semibold text-white transition-all cursor-pointer shrink-0',
                isSwarmOpen
                  ? 'bg-nexus-700 border border-indigo-400 ring-2 ring-indigo-400/40 shadow-[0_0_18px_rgba(124,13,244,0.5)]'
                  : 'bg-gradient-to-r from-nexus-600 via-indigo-600 to-cyan-600 hover:opacity-90 shadow-[0_0_12px_rgba(124,13,244,0.35)]',
              )}
              title={isSwarmOpen ? "Fermer le Swarm Multi-Agents" : "Ouvrir le Swarm Multi-Agents (Équipe Autonome)"}
            >
              <Users size={13} className="text-nexus-200" />
              <span className="hidden sm:inline">Swarm</span>
            </button>
          )}
        </div>
      </div>

      {/* Barre d'onglets pour petits écrans tactiles */}
      <div className="flex md:hidden items-center justify-around liquid-glass-pill p-1 text-xs gap-1">
        <button
          type="button"
          onClick={() => onChangeTab('explorer')}
          className={cn(
            'flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg transition-all cursor-pointer text-xs',
            activeTab === 'explorer' ? 'bg-nexus-600 text-white font-medium shadow-xs' : 'text-slate-600 dark:text-white/60 hover:text-slate-900 dark:hover:text-white',
          )}
        >
          <Layers size={13} className="shrink-0" />
          <span className="truncate">{t('lab.explorer')}</span>
        </button>
        <button
          type="button"
          onClick={() => onChangeTab('editor')}
          className={cn(
            'flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg transition-all cursor-pointer text-xs',
            activeTab === 'editor' ? 'bg-nexus-600 text-white font-medium shadow-xs' : 'text-slate-600 dark:text-white/60 hover:text-slate-900 dark:hover:text-white',
          )}
        >
          <Code2 size={13} className="shrink-0" />
          <span className="truncate">{t('lab.editor')}</span>
        </button>
        <button
          type="button"
          onClick={() => {
            if (!showPreview && onTogglePreview) {
              onTogglePreview();
            }
            onChangeTab('preview');
          }}
          className={cn(
            'flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg transition-all cursor-pointer text-xs',
            activeTab === 'preview' ? 'bg-nexus-600 text-white font-medium shadow-xs' : 'text-slate-600 dark:text-white/60 hover:text-slate-900 dark:hover:text-white',
          )}
        >
          <Play size={13} className="shrink-0" />
          <span className="truncate">{t('lab.preview')}</span>
        </button>
        <button
          type="button"
          onClick={() => onChangeTab('assistant')}
          className={cn(
            'flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg transition-all cursor-pointer text-xs',
            activeTab === 'assistant' ? 'bg-nexus-600 text-white font-medium shadow-xs' : 'text-slate-600 dark:text-white/60 hover:text-slate-900 dark:hover:text-white',
          )}
        >
          <Bot size={13} className="shrink-0" />
          <span className="truncate">{t('lab.assistant')}</span>
        </button>
      </div>
    </header>
  );
}
