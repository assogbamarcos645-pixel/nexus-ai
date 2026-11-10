/**
 * src/components/lab/FileExplorer.tsx
 *
 * Explorateur de fichiers pour NEXUS LAB.
 * Affiche l'arborescence des fichiers du projet actif, permet la sélection,
 * l'ajout et la suppression de fichiers, et indique l'état de modification.
 */

import { FileText, FileCode, Plus, Trash2, Folder, Sparkles, Cloud, HardDrive } from 'lucide-react';
import { cn } from '@/utils/cn';
import type { LabProject, LabFile } from '@/types/lab';

interface FileExplorerProps {
  project: LabProject | null;
  activeFileId: string;
  hasUnsavedChanges: boolean;
  onSelectFile: (fileId: string) => void;
  onNewFileClick: () => void;
  onDeleteFile: (fileId: string) => void;
}

function getFileIcon(path: string) {
  const ext = path.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'html':
      return <FileCode size={14} className="text-orange-400 shrink-0" />;
    case 'css':
      return <FileCode size={14} className="text-cyan-400 shrink-0" />;
    case 'js':
    case 'jsx':
      return <FileCode size={14} className="text-amber-300 shrink-0" />;
    case 'ts':
    case 'tsx':
      return <FileCode size={14} className="text-sky-400 shrink-0" />;
    case 'json':
      return <FileCode size={14} className="text-emerald-400 shrink-0" />;
    case 'py':
      return <FileCode size={14} className="text-blue-400 shrink-0" />;
    case 'php':
      return <FileCode size={14} className="text-indigo-400 shrink-0" />;
    case 'md':
      return <FileText size={14} className="text-purple-300 shrink-0" />;
    default:
      return <FileText size={14} className="text-white/60 shrink-0" />;
  }
}

export function FileExplorer({
  project,
  activeFileId,
  hasUnsavedChanges,
  onSelectFile,
  onNewFileClick,
  onDeleteFile,
}: FileExplorerProps) {
  if (!project) {
    return (
      <aside className="w-full h-full bg-slate-100/80 dark:bg-surface-950/90 border-r border-slate-200/80 dark:border-white/6 p-4 text-slate-500 dark:text-white/40 text-xs">
        Aucun projet chargé.
      </aside>
    );
  }

  return (
    <aside
      id="nexus-lab-explorer"
      className="w-full h-full flex flex-col liquid-glass border-r border-slate-200/80 dark:border-white/10 select-none shrink-0"
    >
      {/* En-tête du projet */}
      <div className="p-3.5 border-b border-slate-200/80 dark:border-white/6 flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <Folder size={15} className="text-nexus-500 dark:text-nexus-400 shrink-0" />
          <div className="min-w-0">
            <h2 className="text-xs font-semibold text-slate-900 dark:text-white truncate" title={project.name}>
              {project.name}
            </h2>
            <div className="flex items-center gap-1.5 mt-0.5">
              {project.isDemo ? (
                <span className="inline-flex items-center gap-1 text-[9px] px-1.5 py-0.2 rounded bg-nexus-500/15 dark:bg-nexus-500/20 text-nexus-700 dark:text-nexus-300 border border-nexus-500/30 font-medium">
                  <Sparkles size={9} /> Démo
                </span>
              ) : project.isCloudSynced ? (
                <span className="inline-flex items-center gap-1 text-[9px] px-1.5 py-0.2 rounded bg-cyan-500/15 dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30 font-medium">
                  <Cloud size={9} /> Cloud
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[9px] px-1.5 py-0.2 rounded bg-slate-200/70 dark:bg-white/10 text-slate-600 dark:text-white/50 border border-slate-300/60 dark:border-white/10 font-medium">
                  <HardDrive size={9} /> Local
                </span>
              )}
              <span className="text-[10px] text-slate-500 dark:text-white/40 truncate">
                {project.files.length} fichier{project.files.length > 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>

        {/* Bouton nouveau fichier */}
        <button
          type="button"
          id="btn-add-file"
          onClick={onNewFileClick}
          title="Ajouter un fichier"
          className="p-1.5 rounded-md hover:bg-slate-200/70 dark:hover:bg-white/10 text-slate-600 dark:text-white/70 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
        >
          <Plus size={15} />
        </button>
      </div>

      {/* Liste des fichiers */}
      <div className="flex-1 overflow-y-auto scrollbar-thin p-2 space-y-0.5">
        <div className="px-2 py-1 text-[10px] font-semibold tracking-wider text-slate-400 dark:text-white/30 uppercase">
          Fichiers du projet
        </div>

        {project.files.map((file: LabFile) => {
          const isActive = file.id === activeFileId;
          const isUnsaved = isActive && hasUnsavedChanges;

          return (
            <div
              key={file.id}
              role="button"
              tabIndex={0}
              id={`file-item-${file.id}`}
              onClick={() => onSelectFile(file.id)}
              onKeyDown={(e) => e.key === 'Enter' && onSelectFile(file.id)}
              className={cn(
                'group flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs cursor-pointer transition-all duration-150',
                isActive
                  ? 'bg-nexus-600/15 dark:bg-nexus-600/25 text-nexus-700 dark:text-white border border-nexus-500/35 shadow-[0_0_10px_rgba(124,13,244,0.15)] font-medium'
                  : 'text-slate-700 dark:text-white/70 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-white/5 border border-transparent',
              )}
            >
              <div className="flex items-center gap-2 min-w-0">
                {getFileIcon(file.path)}
                <span className="truncate font-mono text-[11px]" title={file.path}>
                  {file.path}
                </span>
              </div>

              <div className="flex items-center gap-1.5 shrink-0 ml-2">
                {isUnsaved && (
                  <span
                    title="Modifications non enregistrées"
                    className="w-2 h-2 rounded-full bg-cyan-500 dark:bg-cyan-400 animate-pulse shadow-[0_0_6px_#22d3ee]"
                  />
                )}
                {project.files.length > 1 && (
                  <button
                    type="button"
                    title={`Supprimer ${file.name}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm(`Supprimer définitivement le fichier "${file.path}" ?`)) {
                        onDeleteFile(file.id);
                      }
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-500/20 hover:text-red-600 dark:hover:text-red-400 text-slate-400 dark:text-white/40 transition-all cursor-pointer"
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Notice de stockage dynamique (Cloud vs Local) */}
      <div className="p-3 border-t border-slate-200/80 dark:border-white/6 bg-slate-100/60 dark:bg-black/20 text-[10px] text-slate-500 dark:text-white/40 leading-tight">
        {project.isCloudSynced ? (
          <>
            <p className="flex items-center gap-1 text-cyan-300 font-medium">
              <Cloud size={11} />
              <span>Synchronisé Supabase Cloud</span>
            </p>
            <p className="mt-1 text-[9px] text-white/30">
              Isolé par RLS et accessible sur tous vos appareils connectés.
            </p>
          </>
        ) : (
          <>
            <p className="flex items-center gap-1">
              <HardDrive size={11} />
              <span>Stockage local navigateur</span>
            </p>
            <p className="mt-1 text-[9px] text-white/25">
              Projet conservé sur cette machine. Connectez-vous pour synchroniser.
            </p>
          </>
        )}
      </div>
    </aside>
  );
}
