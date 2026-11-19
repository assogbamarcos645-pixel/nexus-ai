/**
 * src/components/lab/LabToolbar.tsx
 *
 * Barre d'en-tête supérieure réarrangée pour NEXUS LAB.
 * Fournit le sélecteur de projet avec badge d'environnement,
 * le sélecteur de disposition centré (Code seul / Split côte-à-côte / Aperçu seul),
 * et les raccourcis d'exécution/sauvegarde sans aucun chevauchement.
 */

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
  Rocket,
  Database,
  Mic,
  ShieldCheck,
  ChevronRight,
  Radio,
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
  onOpenCloudDeploy?: () => void;
  onOpenTemplateHub?: () => void;
  onOpenDbModeler?: () => void;
  onOpenVoiceLive?: () => void;
  onOpenTestGenerator?: () => void;
  onOpenTeamCollab?: () => void;
  onOpenAutomation?: () => void;
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
  onOpenCloudDeploy,
  onOpenTemplateHub,
  onOpenDbModeler,
  onOpenVoiceLive,
  onOpenTestGenerator,
  onOpenTeamCollab,
  onOpenAutomation,
  snapshotCount = 0,
  isDevAssistantOpen = false,
  onToggleDevAssistant,
  isSwarmOpen = false,
  onToggleSwarm,
  onChangeTab,
}: LabToolbarProps) {
  const { t } = useTranslation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isToolsDropdownOpen, setIsToolsDropdownOpen] = useState(false);
  const toolsDropdownRef = useRef<HTMLDivElement>(null);

  // Fermer les popovers/menus lors de la touche Échap
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsToolsDropdownOpen(false);
        setIsMobileMenuOpen(false);
      }
    }

    if (isToolsDropdownOpen || isMobileMenuOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isToolsDropdownOpen, isMobileMenuOpen]);

  return (
    <header
      id="nexus-lab-toolbar"
      className={cn(
        'liquid-glass border-b border-slate-200/80 dark:border-white/10 px-3 py-1.5 flex flex-col gap-1.5 shrink-0 select-none transition-all',
        isToolsDropdownOpen ? 'relative z-50' : 'relative z-30',
      )}
    >
      <div className="flex items-center justify-between gap-1.5 sm:gap-3 w-full min-w-0">
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
          <div className="relative min-w-0 max-w-[120px] sm:max-w-[170px] md:max-w-[180px]">
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

          {/* Menu "Outils Pro" regroupant Modèles, Studio BDD, Vocal Live, Tests & Équipe */}
          <div className="relative shrink-0" ref={toolsDropdownRef}>
            <button
              type="button"
              id="btn-toolbar-pro-tools"
              onClick={() => setIsToolsDropdownOpen((prev) => !prev)}
              aria-expanded={isToolsDropdownOpen}
              className={cn(
                'flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 border shadow-xs',
                isToolsDropdownOpen
                  ? 'bg-gradient-to-r from-nexus-600 to-indigo-600 text-white border-nexus-400 shadow-[0_0_18px_rgba(124,13,244,0.4)] ring-2 ring-nexus-400/30'
                  : 'bg-white/90 dark:bg-white/8 text-slate-800 dark:text-white/90 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/80 dark:hover:bg-white/12 border-slate-300 dark:border-white/15',
              )}
              title="Outils Pro (6 fonctionnalités d'ingénierie avancée)"
            >
              <div className="w-4 h-4 rounded-md bg-gradient-to-tr from-cyan-400 to-indigo-500 flex items-center justify-center text-white shrink-0 shadow-xs">
                <Sparkles size={10} />
              </div>
              <span className="hidden sm:inline font-semibold">Outils Pro</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-nexus-500/20 text-nexus-600 dark:text-cyan-300 border border-nexus-500/30">
                6
              </span>
              <ChevronDown
                size={12}
                className={cn(
                  'transition-transform duration-200 text-slate-400 dark:text-slate-300',
                  isToolsDropdownOpen && 'rotate-180 text-white',
                )}
              />
            </button>
          </div>

          {/* Bouton Sauvegarder (avec dot indicateur tactile) */}
          <button
            type="button"
            id="btn-toolbar-save"
            onClick={onSave}
            disabled={!hasUnsavedChanges || isSaving}
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer shrink-0',
              hasUnsavedChanges
                ? 'bg-nexus-600 text-white hover:bg-nexus-500 shadow-[0_0_12px_rgba(124,13,244,0.4)]'
                : 'bg-slate-100 dark:bg-white/4 text-slate-400 dark:text-white/30 border border-slate-200 dark:border-white/6 cursor-not-allowed',
            )}
            title="Enregistrer (Ctrl+S)"
          >
            <Save size={13} />
            <span className="hidden xl:inline">{isSaving ? '...' : 'Enregistrer'}</span>
            {hasUnsavedChanges && (
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse xl:hidden" />
            )}
          </button>

          {/* Bouton Déploiement Cloud 1-Clic */}
          {onOpenCloudDeploy && (
            <button
              type="button"
              id="btn-toolbar-deploy-cloud"
              onClick={onOpenCloudDeploy}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-cyan-500 via-indigo-600 to-purple-600 hover:from-cyan-400 hover:to-purple-500 shadow-md shadow-cyan-500/20 transition-all cursor-pointer shrink-0"
              title="Déployer ce projet en 1 clic sur Vercel, Netlify ou générer un HTML autonome"
            >
              <Rocket size={13} className="text-white" />
              <span className="hidden sm:inline">Déployer</span>
            </button>
          )}

          {/* Bouton Assistant IA NEXUS DEV */}
          <button
            type="button"
            id="btn-toolbar-nexus-dev"
            onClick={onToggleDevAssistant}
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-white transition-all cursor-pointer shrink-0',
              isDevAssistantOpen
                ? 'bg-nexus-700 border border-cyan-400 ring-2 ring-cyan-400/40 shadow-[0_0_18px_rgba(6,182,212,0.5)]'
                : 'bg-gradient-to-r from-nexus-600 to-cyan-600 hover:from-nexus-500 hover:to-cyan-500 shadow-[0_0_12px_rgba(6,182,212,0.35)]',
            )}
            title={isDevAssistantOpen ? "Fermer l'assistant IA NEXUS DEV" : "Ouvrir l'assistant IA NEXUS DEV"}
          >
            <Sparkles size={13} className="text-cyan-200" />
            <span className="hidden xl:inline">Assistant IA</span>
          </button>

          {/* Actions secondaires sur écran 2XL (≥ 1536px) */}
          {onOpenHistory && (
            <button
              type="button"
              id="btn-toolbar-history"
              onClick={onOpenHistory}
              className="hidden 2xl:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium text-slate-700 dark:text-white/80 hover:text-slate-900 dark:hover:text-white bg-slate-100/80 dark:bg-white/5 hover:bg-slate-200/80 dark:hover:bg-white/10 border border-slate-200/80 dark:border-white/8 transition-all cursor-pointer shrink-0"
              title="Historique des versions et instantanés (Rollback)"
            >
              <History size={13} className="text-amber-500 dark:text-amber-400" />
              <span>Historique</span>
              {snapshotCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-amber-500/20 text-amber-700 dark:text-amber-300 font-semibold">
                  {snapshotCount}
                </span>
              )}
            </button>
          )}

          <button
            type="button"
            id="btn-toolbar-export-zip"
            onClick={onExportZip}
            disabled={isExporting}
            className="hidden 2xl:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium text-slate-700 dark:text-white/80 hover:text-slate-900 dark:hover:text-white bg-slate-100/80 dark:bg-white/5 hover:bg-slate-200/80 dark:hover:bg-white/10 border border-slate-200/80 dark:border-white/8 transition-all cursor-pointer shrink-0"
            title="Exporter tout le projet sous format archive ZIP"
          >
            <Download size={13} className="text-emerald-500 dark:text-emerald-400" />
            <span>Export ZIP</span>
          </button>

          {onOpenGitHubExport && (
            <button
              type="button"
              id="btn-toolbar-export-github"
              onClick={onOpenGitHubExport}
              className="hidden 2xl:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium text-slate-700 dark:text-white/80 hover:text-slate-900 dark:hover:text-white bg-slate-100/80 dark:bg-white/5 hover:bg-slate-200/80 dark:hover:bg-white/10 border border-slate-200/80 dark:border-white/8 transition-all cursor-pointer shrink-0"
              title="Exporter directement le projet sur un dépôt GitHub"
            >
              <FolderGit2 size={13} className="text-purple-600 dark:text-purple-400" />
              <span>GitHub</span>
            </button>
          )}

          <button
            type="button"
            id="btn-toolbar-new-file"
            onClick={onNewFileClick}
            className="hidden 2xl:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium text-slate-700 dark:text-white/80 hover:text-slate-900 dark:hover:text-white bg-slate-100/80 dark:bg-white/5 hover:bg-slate-200/80 dark:hover:bg-white/10 border border-slate-200/80 dark:border-white/8 transition-all cursor-pointer shrink-0"
            title="Ajouter un fichier"
          >
            <FilePlus size={13} className="text-cyan-600 dark:text-cyan-400" />
            <span>Fichier</span>
          </button>

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
            className="hidden 2xl:flex items-center p-1.5 rounded-xl text-xs text-slate-400 dark:text-white/40 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-white/5 transition-all cursor-pointer shrink-0"
            title="Réinitialiser les projets de démonstration"
            aria-label="Réinitialiser la démo"
          >
            <RotateCcw size={13} />
          </button>

          {onToggleSwarm && (
            <button
              type="button"
              id="btn-toolbar-nexus-swarm"
              onClick={onToggleSwarm}
              className={cn(
                'hidden 2xl:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-white transition-all cursor-pointer shrink-0',
                isSwarmOpen
                  ? 'bg-nexus-700 border border-indigo-400 ring-2 ring-indigo-400/40 shadow-[0_0_18px_rgba(124,13,244,0.5)]'
                  : 'bg-gradient-to-r from-nexus-600 via-indigo-600 to-cyan-600 hover:opacity-90 shadow-[0_0_12px_rgba(124,13,244,0.35)]',
              )}
              title={isSwarmOpen ? "Fermer le Swarm Multi-Agents" : "Ouvrir le Swarm Multi-Agents (Équipe Autonome)"}
            >
              <Users size={13} className="text-nexus-200" />
              <span>Swarm</span>
            </button>
          )}

          {/* Bouton Plus d'actions (⋯) sur tous les écrans < 2XL : garantit 0 collision */}
          <button
            type="button"
            id="btn-toolbar-more-actions"
            onClick={() => setIsMobileMenuOpen(true)}
            className="flex 2xl:hidden items-center justify-center p-1.5 px-2 rounded-xl text-slate-700 dark:text-white/80 hover:text-slate-900 dark:hover:text-white bg-slate-100/90 hover:bg-slate-200/90 dark:bg-white/5 dark:hover:bg-white/10 border border-slate-200/80 dark:border-white/10 transition-colors cursor-pointer shrink-0 shadow-xs"
            title="Toutes les options du projet (Historique, Exports, Fichiers...)"
            aria-label="Toutes les options du projet"
          >
            <MoreHorizontal size={15} />
            {snapshotCount > 0 && (
              <span className="ml-1 w-1.5 h-1.5 rounded-full bg-amber-400" />
            )}
          </button>
        </div>
      </div>

      {/* Popover Centré & Réduit pour les Outils Pro (Portail document.body, Zero Collision) */}
      {isToolsDropdownOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150 cursor-pointer"
            role="dialog"
            aria-modal="true"
            aria-label="Suite d'ingénierie NEXUS Outils Pro"
            onClick={() => setIsToolsDropdownOpen(false)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-[450px] rounded-2xl bg-white dark:bg-[#0c0e24] border border-slate-200 dark:border-indigo-500/40 shadow-2xl p-3 sm:p-3.5 flex flex-col gap-2 animate-in zoom-in-95 duration-150 cursor-default ring-1 ring-black/5 dark:ring-white/10 max-h-[85vh] overflow-y-auto scrollbar-thin text-slate-900 dark:text-slate-100"
            >
              {/* En-tête du modal Outils Pro */}
              <div className="px-1 py-1 border-b border-slate-100 dark:border-white/8 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-gradient-to-tr from-cyan-500 to-indigo-600 text-white shadow-xs">
                    <Sparkles size={16} />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                      Suite d'Ingénierie NEXUS • Outils Pro
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      5 modules avancés pour concevoir, tester et collaborer
                    </p>
                  </div>
                </div>
                <ModalCloseButton
                  onClick={() => setIsToolsDropdownOpen(false)}
                  label="Fermer"
                  title="Fermer (Échap)"
                  compact
                />
              </div>

              {/* Liste compacte et lisible des 5 outils pro */}
              <div className="flex flex-col gap-1.5 pt-0.5">
                {/* 1. Hub de Modèles */}
                {onOpenTemplateHub && (
                  <button
                    type="button"
                    id="btn-toolbar-template-hub"
                    onClick={() => {
                      setIsToolsDropdownOpen(false);
                      onOpenTemplateHub();
                    }}
                    className="w-full flex items-center gap-2.5 p-2 sm:p-2.5 rounded-xl hover:bg-slate-100/90 dark:hover:bg-white/8 text-left transition-all cursor-pointer group border border-slate-100 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/15 shadow-2xs"
                    role="menuitem"
                  >
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-tr from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-500 dark:text-cyan-400 shrink-0 group-hover:scale-105 transition-transform shadow-2xs">
                      <Sparkles size={18} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs sm:text-[13px] font-bold text-slate-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-300 transition-colors">
                          Hub de Modèles Modernes
                        </span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-cyan-500/15 text-cyan-600 dark:text-cyan-300 font-mono font-bold">
                          6 MODÈLES
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-600 dark:text-slate-300 line-clamp-1 mt-0.5">
                        SaaS, E-Commerce, Portfolios, Apps IA prêtes à cloner
                      </div>
                    </div>
                    <ChevronRight size={14} className="text-slate-400 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all shrink-0" />
                  </button>
                )}

                {/* 2. Studio BDD */}
                {onOpenDbModeler && (
                  <button
                    type="button"
                    id="btn-toolbar-db-modeler"
                    onClick={() => {
                      setIsToolsDropdownOpen(false);
                      onOpenDbModeler();
                    }}
                    className="w-full flex items-center gap-2.5 p-2 sm:p-2.5 rounded-xl hover:bg-slate-100/90 dark:hover:bg-white/8 text-left transition-all cursor-pointer group border border-slate-100 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/15 shadow-2xs"
                    role="menuitem"
                  >
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-500 dark:text-indigo-400 shrink-0 group-hover:scale-105 transition-transform shadow-2xs">
                      <Database size={18} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs sm:text-[13px] font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors">
                          Studio BDD Supabase
                        </span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 font-mono font-bold">
                          SQL & RLS
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-600 dark:text-slate-300 line-clamp-1 mt-0.5">
                        Conception tables relationnelles, clés étrangères & migrations
                      </div>
                    </div>
                    <ChevronRight size={14} className="text-slate-400 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all shrink-0" />
                  </button>
                )}

                {/* 3. Mode Vocal Live */}
                {onOpenVoiceLive && (
                  <button
                    type="button"
                    id="btn-toolbar-voice-live"
                    onClick={() => {
                      setIsToolsDropdownOpen(false);
                      onOpenVoiceLive();
                    }}
                    className="w-full flex items-center gap-2.5 p-2 sm:p-2.5 rounded-xl hover:bg-cyan-500/10 text-left transition-all cursor-pointer group border border-transparent hover:border-cyan-500/30 shadow-2xs"
                    role="menuitem"
                  >
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-tr from-cyan-500/20 to-teal-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shrink-0 group-hover:scale-105 transition-transform shadow-2xs">
                      <Mic size={18} className="animate-pulse" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs sm:text-[13px] font-bold text-cyan-600 dark:text-cyan-300">
                          Mode Vocal Live
                        </span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-cyan-500/20 text-cyan-400 font-mono font-bold flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                          LIVE
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-600 dark:text-slate-300 line-clamp-1 mt-0.5">
                        Discussion vocale bidirectionnelle fluide avec l'IA
                      </div>
                    </div>
                    <ChevronRight size={14} className="text-cyan-400 group-hover:translate-x-1 transition-all shrink-0" />
                  </button>
                )}

                {/* 4. Tests 1-Clic */}
                {onOpenTestGenerator && (
                  <button
                    type="button"
                    id="btn-toolbar-test-generator"
                    onClick={() => {
                      setIsToolsDropdownOpen(false);
                      onOpenTestGenerator();
                    }}
                    className="w-full flex items-center gap-2.5 p-2 sm:p-2.5 rounded-xl hover:bg-emerald-500/10 text-left transition-all cursor-pointer group border border-transparent hover:border-emerald-500/30 shadow-2xs"
                    role="menuitem"
                  >
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-500 dark:text-emerald-400 shrink-0 group-hover:scale-105 transition-transform shadow-2xs">
                      <ShieldCheck size={18} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs sm:text-[13px] font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-300 transition-colors">
                          Tests Automatisés 1-Clic
                        </span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 font-mono font-bold">
                          VITEST & E2E
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-600 dark:text-slate-300 line-clamp-1 mt-0.5">
                        Génération instantanée de suites unitaires & Playwright
                      </div>
                    </div>
                    <ChevronRight size={14} className="text-slate-400 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all shrink-0" />
                  </button>
                )}

                {/* 5. Mode Équipe */}
                {onOpenTeamCollab && (
                  <button
                    type="button"
                    id="btn-toolbar-team-collab"
                    onClick={() => {
                      setIsToolsDropdownOpen(false);
                      onOpenTeamCollab();
                    }}
                    className="w-full flex items-center gap-2.5 p-2 sm:p-2.5 rounded-xl hover:bg-purple-500/10 text-left transition-all cursor-pointer group border border-transparent hover:border-purple-500/30 shadow-2xs"
                    role="menuitem"
                  >
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-tr from-purple-500/20 to-pink-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0 group-hover:scale-105 transition-transform shadow-2xs">
                      <Users size={18} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs sm:text-[13px] font-bold text-purple-600 dark:text-purple-300">
                          Mode Équipe Multijoueur
                        </span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-purple-500/20 text-purple-400 font-mono font-bold">
                          PAIR CODE
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-600 dark:text-slate-300 line-clamp-1 mt-0.5">
                        Collaboration en direct, curseurs partagés & copilote IA
                      </div>
                    </div>
                    <ChevronRight size={14} className="text-purple-400 group-hover:translate-x-1 transition-all shrink-0" />
                  </button>
                )}

                {/* 6. Automatisations & Webhooks */}
                {onOpenAutomation && (
                  <button
                    type="button"
                    id="btn-toolbar-automation"
                    onClick={() => {
                      setIsToolsDropdownOpen(false);
                      onOpenAutomation();
                    }}
                    className="w-full flex items-center gap-2.5 p-2 sm:p-2.5 rounded-xl hover:bg-cyan-500/10 text-left transition-all cursor-pointer group border border-transparent hover:border-cyan-500/30 shadow-2xs"
                    role="menuitem"
                  >
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-tr from-cyan-500/20 to-purple-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-500 dark:text-cyan-300 shrink-0 group-hover:scale-105 transition-transform shadow-2xs">
                      <Radio size={18} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs sm:text-[13px] font-bold text-slate-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-300 transition-colors">
                          Automatisations & Webhooks
                        </span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-cyan-500/15 text-cyan-600 dark:text-cyan-300 font-mono font-bold">
                          CRON & API
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-600 dark:text-slate-300 line-clamp-1 mt-0.5">
                        Routines planifiées, sauvegardes et webhooks Slack, Discord & GitHub
                      </div>
                    </div>
                    <ChevronRight size={14} className="text-slate-400 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all shrink-0" />
                  </button>
                )}
              </div>

              {/* Pied du modal */}
              <div className="px-2.5 py-1.5 border-t border-slate-100 dark:border-white/8 bg-slate-50/80 dark:bg-white/4 rounded-xl flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 shrink-0">
                <span>Cliquez sur un outil pour l'ouvrir</span>
                <span className="font-mono text-[10px]">Échap</span>
              </div>
            </div>
          </div>,
          document.body,
        )}

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

      {/* Menu Modal des Actions du Projet (⋯) - Centré, Portalisé & Anti-Dépassement Header */}
      {isMobileMenuOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150 cursor-pointer"
            role="dialog"
            aria-modal="true"
            aria-label="Actions du Projet"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <div
              className="w-full max-w-md max-h-[85vh] bg-white dark:bg-surface-950 rounded-2xl border border-slate-200 dark:border-white/10 shadow-2xl p-3.5 sm:p-4 flex flex-col gap-2 animate-in zoom-in-95 duration-150 cursor-default overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* En-tête du modal */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-200/80 dark:border-white/10 gap-3 shrink-0">
                <span className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider truncate">
                  Actions du Projet • {activeProject?.name || 'Lab'}
                </span>
                <ModalCloseButton
                  onClick={() => setIsMobileMenuOpen(false)}
                  label="Fermer"
                  title="Fermer le menu (Échap)"
                  compact
                />
              </div>

              {/* Grille défilable de boutons sans dépassement vertical */}
              <div className="grid grid-cols-2 gap-2 pt-1 overflow-y-auto pr-1 scrollbar-thin max-h-[calc(85vh-110px)]">
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

                {onOpenTemplateHub && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onOpenTemplateHub();
                    }}
                    className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-800 dark:text-white text-xs font-medium cursor-pointer transition-colors"
                  >
                    <Sparkles size={16} className="text-cyan-400" />
                    <span>Modèles Modernes</span>
                  </button>
                )}

                {onOpenDbModeler && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onOpenDbModeler();
                    }}
                    className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-800 dark:text-white text-xs font-medium cursor-pointer transition-colors"
                  >
                    <Database size={16} className="text-indigo-400" />
                    <span>Studio BDD</span>
                  </button>
                )}

                {onOpenVoiceLive && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onOpenVoiceLive();
                    }}
                    className="flex items-center gap-2 p-2.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 text-xs font-semibold cursor-pointer transition-colors"
                  >
                    <Mic size={16} className="text-cyan-400" />
                    <span>Mode Vocal Live</span>
                  </button>
                )}

                {onOpenTestGenerator && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onOpenTestGenerator();
                    }}
                    className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 text-xs font-semibold cursor-pointer transition-colors"
                  >
                    <ShieldCheck size={16} className="text-emerald-400" />
                    <span>Tests Vitest & E2E</span>
                  </button>
                )}

                {onOpenTeamCollab && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onOpenTeamCollab();
                    }}
                    className="flex items-center gap-2 p-2.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 text-xs font-semibold cursor-pointer transition-colors"
                  >
                    <Users size={16} className="text-purple-400" />
                    <span>Mode Équipe</span>
                  </button>
                )}

                {onOpenAutomation && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onOpenAutomation();
                    }}
                    className="flex items-center gap-2 p-2.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 text-xs font-semibold cursor-pointer transition-colors"
                  >
                    <Radio size={16} className="text-cyan-400" />
                    <span>Automatisations & Webhooks</span>
                  </button>
                )}

                {onOpenCloudDeploy && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onOpenCloudDeploy();
                    }}
                    className="flex items-center gap-2 p-2.5 rounded-xl bg-gradient-to-r from-cyan-500/20 to-purple-600/20 text-cyan-600 dark:text-cyan-300 text-xs font-semibold cursor-pointer transition-colors"
                  >
                    <Rocket size={16} className="text-cyan-500" />
                    <span>Déploiement Cloud</span>
                  </button>
                )}

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

              {/* Bouton Annuler / Fermer */}
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-full mt-1 py-2.5 rounded-xl bg-slate-200/90 dark:bg-white/10 hover:bg-slate-300 dark:hover:bg-white/15 text-slate-900 dark:text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors shrink-0"
              >
                <X size={15} />
                <span>Fermer le menu</span>
              </button>
            </div>
          </div>,
          document.body,
        )}
    </header>
  );
}
