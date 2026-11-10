/**
 * src/components/lab/NexusLab.tsx
 *
 * Espace de travail réarrangé « NEXUS LAB ».
 * Architecture inspirée des IDE modernes (VS Code / Cursor) :
 * - ActivityBar latérale ultra-fine avec accès rapide aux fonctions clés
 * - Barre d'en-tête épurée avec sélecteur de projet, fil d'Ariane et bascule de disposition
 * - Explorateur de fichiers pliable
 * - Éditeur de code avec système d'onglets de fichiers et barre d'état dynamique
 * - Panneau de prévisualisation sécurisé avec simulation responsive (Desktop/Tablette/Mobile)
 * - Assistant IA intégré NEXUS DEV
 */

import { useState, useCallback, useEffect } from 'react';
import { useNexusLab } from '@/hooks/useNexusLab';
import { ActivityBar } from './ActivityBar';
import { LabToolbar } from './LabToolbar';
import { FileExplorer } from './FileExplorer';
import { CodeEditor } from './CodeEditor';
import { PreviewPanel } from './PreviewPanel';
import { NexusDevDrawer } from './NexusDevDrawer';
import { NexusSwarmDrawer } from './NexusSwarmDrawer';
import { DiffConfirmationModal } from './DiffConfirmationModal';
import { NewProjectModal } from './NewProjectModal';
import { NewFileModal } from './NewFileModal';
import { SnapshotHistoryModal } from './SnapshotHistoryModal';
import { GitHubExportModal } from './GitHubExportModal';
import type { DevProposal, LabLayoutMode } from '@/types/lab';
import { Check, Info, AlertCircle, X, Sparkles, Plus, FolderPlus } from 'lucide-react';

export function NexusLab() {
  const {
    projects,
    activeProject,
    setActiveProjectId,
    activeFile,
    activeFileId,
    setActiveFileId,
    editorContent,
    setEditorContent,
    hasUnsavedChanges,
    isSaving,
    isExporting,
    activeTab,
    setActiveTab,
    notification,
    clearNotification,
    saveActiveFile,
    createProject,
    addFile,
    deleteFile,
    resetDemoProjects,
    downloadZip,
    applyProposal,
    snapshots,
    createManualSnapshot,
    rollbackToSnapshot,
    deleteSnapshotById,
    activeProjectWithDrafts,
    updateProjectFiles,
    updateProjectMockupImage,
  } = useNexusLab();

  // États des modales, volets et modes de disposition
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [isNewFileModalOpen, setIsNewFileModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isGitHubModalOpen, setIsGitHubModalOpen] = useState(false);
  const [isDevAssistantOpen, setIsDevAssistantOpen] = useState(false);
  const [isSwarmOpen, setIsSwarmOpen] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [showExplorer, setShowExplorer] = useState(true);
  const [layoutMode, setLayoutMode] = useState<LabLayoutMode>('split');
  const [activeProposalForDiff, setActiveProposalForDiff] = useState<DevProposal | null>(null);
  const [isMobile, setIsMobile] = useState(() => (typeof window !== 'undefined' ? window.innerWidth < 768 : false));

  // Écoute du redimensionnement d'écran pour adapter la disposition
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleTogglePreview = useCallback(() => {
    if (isMobile) {
      setActiveTab((curr) => {
        if (curr === 'preview') {
          return 'editor';
        }
        setShowPreview(true);
        return 'preview';
      });
    } else {
      setShowPreview((prev) => {
        const next = !prev;
        if (!next) {
          setLayoutMode('code-only');
        } else {
          setLayoutMode('split');
        }
        return next;
      });
    }
  }, [isMobile, setActiveTab]);

  const handleLayoutModeChange = useCallback(
    (mode: LabLayoutMode) => {
      setLayoutMode(mode);
      if (mode === 'code-only') {
        setShowPreview(false);
        setActiveTab('editor');
      } else if (mode === 'preview-only') {
        setShowPreview(true);
        setActiveTab('preview');
      } else {
        // split
        setShowPreview(true);
        setActiveTab('editor');
      }
    },
    [setActiveTab],
  );

  const handleRequestDiff = (proposal: DevProposal) => {
    setActiveProposalForDiff(proposal);
  };

  return (
    <div
      id="nexus-lab-root"
      className="flex-1 flex h-full bg-slate-50/70 dark:bg-[#070712] text-slate-900 dark:text-white overflow-hidden relative legacy-theme"
    >
      {/* 1. Activity Bar Latérale (Style IDE Cursor / VS Code) */}
      <ActivityBar
        showExplorer={showExplorer}
        onToggleExplorer={() => setShowExplorer((prev) => !prev)}
        isDevAssistantOpen={isDevAssistantOpen || activeTab === 'assistant'}
        onToggleDevAssistant={() => {
          if (isDevAssistantOpen || activeTab === 'assistant') {
            setIsDevAssistantOpen(false);
            if (activeTab === 'assistant') setActiveTab('editor');
          } else {
            setIsDevAssistantOpen(true);
            setIsSwarmOpen(false);
          }
        }}
        isSwarmOpen={isSwarmOpen}
        onToggleSwarm={() => {
          setIsSwarmOpen((prev) => {
            const next = !prev;
            if (next) setIsDevAssistantOpen(false);
            return next;
          });
        }}
        onNewProjectClick={() => setIsNewProjectModalOpen(true)}
        onNewFileClick={() => setIsNewFileModalOpen(true)}
        hasUnsavedChanges={hasUnsavedChanges}
        isSaving={isSaving}
        onSave={saveActiveFile}
        isExporting={isExporting}
        onExportZip={downloadZip}
        onOpenHistory={() => setIsHistoryModalOpen(true)}
        snapshotsCount={snapshots.length}
        onOpenGitHubExport={() => setIsGitHubModalOpen(true)}
        onResetDemo={resetDemoProjects}
        filesCount={activeProject?.files.length ?? 0}
      />

      {/* 2. Zone Principale de l'IDE */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Barre d'en-tête réarrangée */}
        <LabToolbar
          projects={projects}
          activeProject={activeProject}
          activeFile={activeFile}
          activeTab={activeTab}
          layoutMode={layoutMode}
          onChangeLayoutMode={handleLayoutModeChange}
          hasUnsavedChanges={hasUnsavedChanges}
          isSaving={isSaving}
          isExporting={isExporting}
          onOpenHistory={() => setIsHistoryModalOpen(true)}
          snapshotCount={snapshots.length}
          onOpenGitHubExport={() => setIsGitHubModalOpen(true)}
          onSelectProject={(id) => {
            setActiveProjectId(id);
            setActiveTab('editor');
          }}
          onNewProjectClick={() => setIsNewProjectModalOpen(true)}
          onNewFileClick={() => setIsNewFileModalOpen(true)}
          onSave={saveActiveFile}
          onResetDemo={resetDemoProjects}
          onExportZip={downloadZip}
          isDevAssistantOpen={isDevAssistantOpen || activeTab === 'assistant'}
          onToggleDevAssistant={() => {
            if (isDevAssistantOpen || activeTab === 'assistant') {
              setIsDevAssistantOpen(false);
              if (activeTab === 'assistant') setActiveTab('editor');
            } else {
              setIsDevAssistantOpen(true);
              setIsSwarmOpen(false);
            }
          }}
          isSwarmOpen={isSwarmOpen}
          onToggleSwarm={() => {
            setIsSwarmOpen((prev) => {
              const next = !prev;
              if (next) setIsDevAssistantOpen(false);
              return next;
            });
          }}
          showExplorer={showExplorer}
          onToggleExplorer={() => setShowExplorer((prev) => !prev)}
          showPreview={showPreview}
          onTogglePreview={handleTogglePreview}
          onChangeTab={setActiveTab}
        />

        {/* Notification Toast */}
        {notification && (
          <div
            role="status"
            aria-live="polite"
            className="absolute top-14 right-4 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface-900 border border-white/10 shadow-[0_4px_20px_rgba(0,0,0,0.5)] text-xs text-white animate-in slide-in-from-top-2 duration-150"
          >
            {notification.type === 'success' && <Check size={14} className="text-emerald-400" />}
            {notification.type === 'info' && <Info size={14} className="text-cyan-400" />}
            {notification.type === 'error' && <AlertCircle size={14} className="text-red-400" />}
            <span>{notification.message}</span>
            <button
              type="button"
              onClick={clearNotification}
              className="ml-2 text-white/40 hover:text-white cursor-pointer"
              aria-label="Fermer la notification"
            >
              <X size={13} />
            </button>
          </div>
        )}

        {/* Espace de travail de l'IDE : Explorateur + Éditeur + Prévisualisation */}
        <main className="flex-1 flex overflow-hidden relative min-w-0">
          {projects.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center select-none bg-transparent animate-nexus-fade-up">
              <div className="w-16 h-16 rounded-3xl bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-center mb-5 shadow-[0_0_40px_rgba(99,102,241,0.2)]">
                <Sparkles size={28} className="text-indigo-500 dark:text-indigo-400" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-2">
                NEXUS LAB • Espace Vierge
              </h2>
              <p className="text-sm text-slate-600 dark:text-white/60 max-w-md mx-auto mb-8 leading-relaxed">
                Votre espace de développement est totalement vide et prêt. Écrivez votre code de zéro ou décrivez votre idée pour vibe-coder avec l’IA.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  id="btn-lab-create-blank"
                  onClick={() => createProject('blank', 'Mon Projet')}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-[0_0_20px_rgba(99,102,241,0.4)] transition-all cursor-pointer"
                >
                  <Plus size={15} />
                  <span>Créer un projet vierge</span>
                </button>
                <button
                  type="button"
                  id="btn-lab-vibe-code"
                  onClick={() => {
                    createProject('blank', 'Nouveau Projet');
                    setIsDevAssistantOpen(true);
                  }}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 text-cyan-700 dark:text-cyan-300 text-xs font-semibold shadow-sm transition-all cursor-pointer"
                >
                  <Sparkles size={15} className="text-cyan-600 dark:text-cyan-400" />
                  <span>Assistant NEXUS DEV</span>
                </button>
                <button
                  type="button"
                  id="btn-lab-browse-templates"
                  onClick={() => setIsNewProjectModalOpen(true)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-white/90 text-xs font-semibold shadow-sm transition-all cursor-pointer"
                >
                  <FolderPlus size={15} className="text-nexus-500 dark:text-nexus-400" />
                  <span>Modèles (React, Web, Node...)</span>
                </button>
                <button
                  type="button"
                  id="btn-lab-load-demo"
                  onClick={resetDemoProjects}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-white/70 hover:text-emerald-500 dark:hover:text-emerald-400 text-xs font-semibold shadow-sm transition-all cursor-pointer"
                >
                  <Sparkles size={15} className="text-emerald-500 dark:text-emerald-400" />
                  <span>Charger les Démos</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Panneau 1 : Explorateur de fichiers */}
              <div
                className={`h-full shrink-0 ${
                  isMobile
                    ? activeTab === 'explorer'
                      ? 'flex flex-1 w-full'
                      : 'hidden'
                    : showExplorer
                    ? 'flex md:w-52 lg:w-56'
                    : 'hidden'
                }`}
              >
                <FileExplorer
                  project={activeProject}
                  activeFileId={activeFileId}
                  hasUnsavedChanges={hasUnsavedChanges}
                  onSelectFile={(id) => {
                    setActiveFileId(id);
                    setActiveTab('editor');
                  }}
                  onNewFileClick={() => setIsNewFileModalOpen(true)}
                  onDeleteFile={deleteFile}
                />
              </div>

              {/* Panneau 2 : Éditeur de code */}
              <div
                className={`h-full min-w-0 flex flex-col ${
                  isMobile
                    ? activeTab === 'editor'
                      ? 'flex flex-1 w-full'
                      : 'hidden'
                    : layoutMode === 'preview-only'
                    ? 'hidden'
                    : layoutMode === 'code-only'
                    ? 'flex flex-1 w-full'
                    : 'flex flex-1 md:w-1/2 md:flex-1'
                }`}
              >
                <CodeEditor
                  file={activeFile}
                  content={editorContent}
                  hasUnsavedChanges={hasUnsavedChanges}
                  isSaving={isSaving}
                  onChange={setEditorContent}
                  onSave={saveActiveFile}
                  onAskDev={() => setIsDevAssistantOpen(true)}
                  showPreview={showPreview}
                  onTogglePreview={handleTogglePreview}
                  allFiles={activeProjectWithDrafts?.files || activeProject?.files}
                  project={activeProjectWithDrafts}
                  onUpdateProjectFiles={updateProjectFiles}
                  onSelectFile={(id) => {
                    setActiveFileId(id);
                    setActiveTab('editor');
                  }}
                  onNewFileClick={() => setIsNewFileModalOpen(true)}
                />
              </div>

              {/* Panneau 3 : Prévisualisation en direct */}
              <div
                className={`h-full border-l border-slate-200/80 dark:border-white/10 ${
                  isMobile
                    ? activeTab === 'preview'
                      ? 'flex flex-1 w-full min-w-0 flex-col'
                      : 'hidden'
                    : layoutMode === 'code-only'
                    ? 'hidden'
                    : layoutMode === 'preview-only'
                    ? 'flex flex-1 w-full min-w-0 flex-col'
                    : showPreview
                    ? 'flex flex-1 md:w-1/2 md:flex-1 min-w-0 flex-col'
                    : 'hidden'
                }`}
              >
                <PreviewPanel
                  project={activeProjectWithDrafts}
                  onExportZip={downloadZip}
                  onBackToEditor={() => {
                    setActiveTab('editor');
                    setLayoutMode('split');
                  }}
                  onClosePreview={() => {
                    setShowPreview(false);
                    setLayoutMode('code-only');
                  }}
                  onUpdateProjectFiles={updateProjectFiles}
                  onUpdateMockupImage={updateProjectMockupImage}
                  activeFile={activeFile}
                />
              </div>
            </>
          )}
        </main>
      </div>

      {/* Volet Assistant NEXUS DEV */}
      <NexusDevDrawer
        isOpen={isDevAssistantOpen || activeTab === 'assistant'}
        file={activeFile}
        onClose={() => {
          setIsDevAssistantOpen(false);
          if (activeTab === 'assistant') setActiveTab('editor');
        }}
        onRequestDiff={handleRequestDiff}
      />

      {/* Volet Multi-Agents Swarm (Équipe Autonome : Architecte • Frontend • QA) */}
      <NexusSwarmDrawer
        isOpen={isSwarmOpen}
        file={activeFile}
        onClose={() => setIsSwarmOpen(false)}
        onRequestDiff={handleRequestDiff}
        onAddFile={(path, content) => addFile(path, content)}
      />

      {/* Modale de confirmation du Diff */}
      <DiffConfirmationModal
        proposal={activeProposalForDiff}
        isOpen={Boolean(activeProposalForDiff)}
        onClose={() => setActiveProposalForDiff(null)}
        onConfirmApply={applyProposal}
      />

      {/* Modale Nouveau Projet */}
      <NewProjectModal
        isOpen={isNewProjectModalOpen}
        onClose={() => setIsNewProjectModalOpen(false)}
        onCreateProject={createProject}
      />

      {/* Modale Nouveau Fichier */}
      <NewFileModal
        isOpen={isNewFileModalOpen}
        onClose={() => setIsNewFileModalOpen(false)}
        onAddFile={addFile}
      />

      {/* Modale Historique & Snapshots (Rollback) */}
      <SnapshotHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        projectName={activeProject?.name || 'Projet'}
        snapshots={snapshots}
        onRollback={rollbackToSnapshot}
        onCreateSnapshot={createManualSnapshot}
        onDeleteSnapshot={deleteSnapshotById}
      />

      {/* Modale Export One-Click vers GitHub */}
      <GitHubExportModal
        isOpen={isGitHubModalOpen}
        onClose={() => setIsGitHubModalOpen(false)}
        project={activeProjectWithDrafts || activeProject}
      />
    </div>
  );
}
