/**
 * src/components/lab/LabToolbar.tsx
 *
 * Barre d'en-tête supérieure réarrangée pour NEXUS LAB.
 * Fournit le sélecteur de projet avec badge d'environnement,
 * le sélecteur de disposition centré (Code seul / Split côte-à-côte / Aperçu seul),
 * et les raccourcis d'exécution/sauvegarde sans aucun chevauchement.
 */

import { useState } from 'react';
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
  Columns,
  SquareCode,
  Smartphone,
  HardDrive,
  Cloud,
  History,
  FolderGit2,
  MoreHorizontal,
  X,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import type { LabProject, LabFile, LabTab, LabLayoutMode } from '@/types/lab';
import { useTranslation } from '@/hooks/useTranslation';
import { ModalCloseButton } from '@/components/ui/ModalCloseButton';

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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
                'hidden md:flex items-center justify-center p-1.5 rounded-lg border transition-all cursor-pointer text-xs shrink-0',
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
          <div className="relative min-w-0 max-w-[140px] sm:max-w-[170px] md:max-w-[180px]">
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

        {/* Zone 2 (Centre) : Sélecteur de Mode de Disposition (Ultra-large 2XL uniquement) */}
        {onChangeLayoutMode && (
          <div className="hidden 2xl:flex items-center justify-self-center shrink-0 bg-slate-200/80 dark:bg-white/8 p-0.5 rounded-xl border border-slate-300/80 dark:border-white/10 shadow-xs z-10 mx-1">
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

          {/* Bouton Sauvegarder (avec dot indicateur tactile) */}
          <button
            type="button"
            id="btn-toolbar-save"
            onClick={onSave}
            disabled={!hasUnsavedChanges || isSaving}
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer shrink-0',
              hasUnsavedChanges
                ? 'bg-nexus-600 text-white hover:bg-nexus-500 shadow-[0_0_12px_rgba(124,13,244,0.4)]'
                : 'bg-slate-100 dark:bg-white/4 text-slate-400 dark:text-white/30 border border-slate-200 dark:border-white/6 cursor-not-allowed',
            )}
            title="Enregistrer (Ctrl+S)"
          >
            <Save size={13} />
            <span className="hidden lg:inline">{isSaving ? '...' : 'Enregistrer'}</span>
            {hasUnsavedChanges && (
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse lg:hidden" />
            )}
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
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 dark:text-white/80 hover:text-slate-900 dark:hover:text-white bg-slate-100/80 dark:bg-white/5 hover:bg-slate-200/80 dark:hover:bg-white/10 border border-slate-200/80 dark:border-white/8 transition-all cursor-pointer shrink-0"
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

          {/* Bouton Assistant IA NEXUS DEV */}
          <button
            type="button"
            id="btn-toolbar-nexus-dev"
            onClick={onToggleDevAssistant}
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-white transition-all cursor-pointer shrink-0',
              isDevAssistantOpen
                ? 'bg-nexus-700 border border-cyan-400 ring-2 ring-cyan-400/40 shadow-[0_0_18px_rgba(6,182,212,0.5)]'
                : 'bg-gradient-to-r from-nexus-600 to-cyan-600 hover:from-nexus-500 hover:to-cyan-500 shadow-[0_0_12px_rgba(6,182,212,0.35)]',
            )}
            title={isDevAssistantOpen ? "Fermer l'assistant IA NEXUS DEV" : "Ouvrir l'assistant IA NEXUS DEV"}
          >
            <Sparkles size={13} className="text-cyan-200" />
            <span className="inline lg:hidden font-medium text-[11px]">Assistant IA</span>
            <span className="hidden lg:inline">Assistant IA NEXUS DEV</span>
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

          {/* Bouton Plus d'actions (...) sur Mobile */}
          <button
            type="button"
            id="btn-toolbar-more-mobile"
            onClick={() => setIsMobileMenuOpen((v) => !v)}
            className="flex sm:hidden items-center justify-center p-1.5 rounded-lg text-slate-600 hover:text-slate-900 dark:text-white/70 dark:hover:text-white bg-slate-100/80 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 transition-colors cursor-pointer shrink-0"
            title="Toutes les options du projet"
            aria-label="Menu du projet"
          >
            <MoreHorizontal size={14} />
          </button>
        </div>
      </div>

      {/* Barre d'onglets complète et réactive (Mobile, Tablette et PC) */}
      <nav
        aria-label="Barre d'onglets principale de navigation"
        className="flex items-center justify-between md:justify-center md:gap-2 liquid-glass-pill p-1 text-xs gap-1 w-full max-w-2xl mx-auto shadow-xs overflow-x-auto scrollbar-none"
      >
        {/* Onglet Fichiers */}
        <button
          type="button"
          id="btn-tab-explorer"
          onClick={() => {
            onChangeTab('explorer');
            if (onToggleExplorer && !showExplorer) {
              onToggleExplorer();
            }
          }}
          className={cn(
            'flex-1 md:flex-initial flex items-center justify-center gap-1.5 py-1.5 px-2 md:px-3 rounded-lg transition-all cursor-pointer text-xs font-medium shrink-0',
            activeTab === 'explorer' || showExplorer
              ? 'bg-nexus-600 text-white font-semibold shadow-xs'
              : 'text-slate-600 dark:text-white/60 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-white/5',
          )}
          title="Explorateur de fichiers"
        >
          <Layers size={13} className="shrink-0" />
          <span className="truncate">{t('lab.explorer')}</span>
        </button>

        {/* Onglet Code */}
        <button
          type="button"
          id="btn-tab-editor"
          onClick={() => {
            onChangeTab('editor');
            if (onChangeLayoutMode) {
              onChangeLayoutMode('code-only');
            }
          }}
          className={cn(
            'flex-1 md:flex-initial flex items-center justify-center gap-1.5 py-1.5 px-2 md:px-3 rounded-lg transition-all cursor-pointer text-xs font-medium shrink-0',
            (activeTab === 'editor' && layoutMode !== 'split') || layoutMode === 'code-only'
              ? 'bg-nexus-600 text-white font-semibold shadow-xs'
              : 'text-slate-600 dark:text-white/60 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-white/5',
          )}
          title="Éditeur de code"
        >
          <Code2 size={13} className="shrink-0" />
          <span className="truncate">{t('lab.editor')}</span>
        </button>

        {/* Onglet Split (disponible sur écran large / tablette / PC) */}
        {onChangeLayoutMode && (
          <button
            type="button"
            id="btn-tab-split"
            onClick={() => {
              onChangeLayoutMode('split');
              onChangeTab('editor');
            }}
            className={cn(
              'hidden sm:flex items-center justify-center gap-1.5 py-1.5 px-2.5 md:px-3 rounded-lg transition-all cursor-pointer text-xs font-medium shrink-0',
              layoutMode === 'split'
                ? 'bg-nexus-600 text-white font-semibold shadow-xs'
                : 'text-slate-600 dark:text-white/60 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-white/5',
            )}
            title="Affichage côte-à-côte (Split)"
          >
            <Columns size={13} className="shrink-0" />
            <span className="truncate">Split</span>
          </button>
        )}

        {/* Onglet Aperçu */}
        <button
          type="button"
          id="btn-tab-preview"
          onClick={() => {
            if (!showPreview && onTogglePreview) {
              onTogglePreview();
            }
            if (onChangeLayoutMode) {
              onChangeLayoutMode('preview-only');
            }
            onChangeTab('preview');
          }}
          className={cn(
            'flex-1 md:flex-initial flex items-center justify-center gap-1.5 py-1.5 px-2 md:px-3 rounded-lg transition-all cursor-pointer text-xs font-medium shrink-0',
            layoutMode === 'preview-only' || activeTab === 'preview'
              ? 'bg-nexus-600 text-white font-semibold shadow-xs'
              : 'text-slate-600 dark:text-white/60 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-white/5',
          )}
          title="Aperçu interactif"
        >
          <Play size={13} className="shrink-0" />
          <span className="truncate">{t('lab.preview')}</span>
        </button>

        {/* Onglet Assistant IA NEXUS DEV */}
        <button
          type="button"
          id="btn-tab-assistant"
          onClick={() => {
            onChangeTab('assistant');
            onToggleDevAssistant();
          }}
          className={cn(
            'flex-1 md:flex-initial flex items-center justify-center gap-1.5 py-1.5 px-2 md:px-3 rounded-lg transition-all cursor-pointer text-xs min-w-0 font-medium shrink-0',
            activeTab === 'assistant' || isDevAssistantOpen
              ? 'bg-gradient-to-r from-nexus-600 to-cyan-600 text-white shadow-xs ring-1 ring-cyan-400/40 font-semibold'
              : 'text-slate-600 dark:text-white/60 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-white/5',
          )}
          title="Ouvrir l'Assistant IA NEXUS DEV"
        >
          <Sparkles
            size={13}
            className={cn(
              'shrink-0',
              activeTab === 'assistant' || isDevAssistantOpen ? 'text-cyan-200 animate-pulse' : 'text-cyan-500 dark:text-cyan-400',
            )}
          />
          <span className="truncate">{t('lab.assistant')}</span>
        </button>

        {/* Onglet Multi-Agents Swarm (visible sur tablette et PC) */}
        {onToggleSwarm && (
          <button
            type="button"
            id="btn-tab-swarm"
            onClick={onToggleSwarm}
            className={cn(
              'hidden sm:flex items-center justify-center gap-1.5 py-1.5 px-2.5 md:px-3 rounded-lg transition-all cursor-pointer text-xs font-medium shrink-0',
              isSwarmOpen
                ? 'bg-gradient-to-r from-nexus-600 via-indigo-600 to-cyan-600 text-white shadow-xs ring-1 ring-indigo-400/40 font-semibold'
                : 'text-slate-600 dark:text-white/60 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-white/5',
            )}
            title="Ouvrir le Multi-Agents Swarm"
          >
            <Users
              size={13}
              className={cn(
                'shrink-0',
                isSwarmOpen ? 'text-indigo-200 animate-pulse' : 'text-indigo-500 dark:text-indigo-400',
              )}
            />
            <span className="truncate">Swarm</span>
          </button>
        )}
      </nav>

      {/* Feuille d'actions mobile (Action Sheet style iOS/Android) */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-150 cursor-pointer"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <div
            className="w-full max-w-md bg-white dark:bg-surface-950 rounded-t-3xl sm:rounded-2xl border-t sm:border border-slate-200 dark:border-white/10 shadow-2xl p-4 flex flex-col gap-2 pb-safe animate-in slide-in-from-bottom duration-200 cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Poignée tactile mobile style iOS (tap pour fermer) */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(false)}
              className="w-full flex justify-center pt-1 pb-2 bg-transparent cursor-pointer shrink-0"
              aria-label="Fermer"
            >
              <div className="w-12 h-1 bg-slate-300 dark:bg-white/20 rounded-full" />
            </button>

            <div className="flex items-center justify-between pb-2 border-b border-slate-200/80 dark:border-white/10 gap-3">
              <span className="text-xs font-semibold text-slate-800 dark:text-white uppercase tracking-wider truncate">
                Actions du Projet • {activeProject?.name || 'Lab'}
              </span>
              <ModalCloseButton
                onClick={() => setIsMobileMenuOpen(false)}
                label="Fermer"
                title="Fermer le menu (Échap)"
                compact
              />
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onNewProjectClick();
                }}
                className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-800 dark:text-white text-xs font-medium cursor-pointer transition-colors"
              >
                <FolderPlus size={16} className="text-nexus-500" />
                <span>Nouveau Projet</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onNewFileClick();
                }}
                className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-800 dark:text-white text-xs font-medium cursor-pointer transition-colors"
              >
                <FilePlus size={16} className="text-cyan-500" />
                <span>Nouveau Fichier</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onSave();
                }}
                disabled={!hasUnsavedChanges || isSaving}
                className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-800 dark:text-white text-xs font-medium cursor-pointer transition-colors disabled:opacity-40"
              >
                <Save size={16} className="text-nexus-600" />
                <span>{isSaving ? 'Enregistrement...' : 'Enregistrer'}</span>
              </button>

              {onOpenHistory && (
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onOpenHistory();
                  }}
                  className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-800 dark:text-white text-xs font-medium cursor-pointer transition-colors"
                >
                  <History size={16} className="text-amber-500" />
                  <span>Historique {snapshotCount > 0 ? `(${snapshotCount})` : ''}</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onExportZip();
                }}
                disabled={isExporting}
                className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-800 dark:text-white text-xs font-medium cursor-pointer transition-colors"
              >
                <Download size={16} className="text-emerald-500" />
                <span>Exporter ZIP</span>
              </button>

              {onOpenGitHubExport && (
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onOpenGitHubExport();
                  }}
                  className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-800 dark:text-white text-xs font-medium cursor-pointer transition-colors"
                >
                  <FolderGit2 size={16} className="text-purple-500" />
                  <span>Export GitHub</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  if (window.confirm('Réinitialiser tous les projets démo à leur état initial ?')) {
                    onResetDemo();
                  }
                }}
                className="col-span-2 flex items-center justify-center gap-2 p-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 text-xs font-medium cursor-pointer transition-colors"
              >
                <RotateCcw size={15} />
                <span>Réinitialiser les Projets Démo</span>
              </button>
            </div>

            {/* Bouton Annuler / Fermer style iOS en bas de feuille */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(false)}
              className="w-full mt-2 py-3 rounded-2xl bg-slate-200/90 dark:bg-white/10 hover:bg-slate-300 dark:hover:bg-white/15 text-slate-900 dark:text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
            >
              <X size={15} />
              <span>Fermer le menu</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
