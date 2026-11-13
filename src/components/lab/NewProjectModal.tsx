/**
 * src/components/lab/NewProjectModal.tsx
 *
 * Modale de création d'un projet dans NEXUS LAB à partir des 5 modèles officiels.
 */

import { useState } from 'react';
import { Sparkles, Globe, Atom, Server, FileCode, Terminal } from 'lucide-react';
import { LAB_TEMPLATES } from '@/config/labTemplates';
import type { ProjectTemplateId } from '@/types/lab';
import { ModalCloseButton } from '@/components/ui/ModalCloseButton';

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateProject: (templateId: ProjectTemplateId, customName?: string) => void;
}

function getTemplateIcon(id: ProjectTemplateId) {
  switch (id) {
    case 'html-css-js':
      return <Globe size={20} className="text-orange-400" />;
    case 'react-vite':
      return <Atom size={20} className="text-cyan-400" />;
    case 'node-api':
      return <Server size={20} className="text-emerald-400" />;
    case 'php-app':
      return <FileCode size={20} className="text-indigo-400" />;
    case 'python-app':
      return <Terminal size={20} className="text-blue-400" />;
    default:
      return <Sparkles size={20} className="text-nexus-400" />;
  }
}

export function NewProjectModal({
  isOpen,
  onClose,
  onCreateProject,
}: NewProjectModalProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<ProjectTemplateId>('html-css-js');
  const [projectName, setProjectName] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreateProject(selectedTemplate, projectName.trim() || undefined);
    setProjectName('');
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="new-project-title"
    >
      <div className="relative w-full max-w-2xl max-h-[92dvh] sm:max-h-[90dvh] flex flex-col rounded-t-3xl sm:rounded-2xl liquid-glass border-t sm:border border-slate-200/80 dark:border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.3)] dark:shadow-[0_0_50px_rgba(124,13,244,0.35)] overflow-hidden legacy-theme text-slate-900 dark:text-white pb-safe">
        {/* Poignée tactile mobile style iOS */}
        <div className="sm:hidden w-10 h-1 bg-white/20 rounded-full mx-auto mt-2 mb-1 shrink-0" aria-hidden="true" />

        {/* En-tête */}
        <div className="px-6 py-4 border-b border-slate-200/80 dark:border-white/10 liquid-glass flex items-center justify-between gap-4 shrink-0">
          <div className="min-w-0 flex-1">
            <h3 id="new-project-title" className="text-sm font-semibold text-slate-900 dark:text-white truncate">
              Créer un nouveau projet — NEXUS LAB
            </h3>
            <p className="text-xs text-slate-500 dark:text-white/50 mt-0.5 truncate">
              Choisissez un modèle de démarrage pré-configuré.
            </p>
          </div>
          <ModalCloseButton
            onClick={onClose}
            label="Fermer"
            title="Fermer (Échap)"
          />
        </div>

        {/* Corps */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto scrollbar-thin flex-1">
          {/* Nom du projet */}
          <div>
            <label htmlFor="input-project-name" className="block text-xs font-semibold text-slate-700 dark:text-white/70 uppercase tracking-wider mb-1.5">
              Nom du projet (optionnel)
            </label>
            <input
              id="input-project-name"
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="Ex: Mon Cyber Dashboard, Nexus API v2..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/90 dark:bg-black/40 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-xs placeholder:text-slate-400 dark:placeholder:text-white/30 focus:outline-none focus:border-nexus-500 transition-colors shadow-xs"
            />
          </div>

          {/* Grille des 5 templates */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-white/70 uppercase tracking-wider mb-2">
              Sélectionnez un modèle de projet
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-72 overflow-y-auto scrollbar-thin pr-1">
              {LAB_TEMPLATES.map((tmpl) => {
                const isSelected = tmpl.id === selectedTemplate;
                return (
                  <div
                    key={tmpl.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedTemplate(tmpl.id)}
                    onKeyDown={(e) => e.key === 'Enter' && setSelectedTemplate(tmpl.id)}
                    className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all duration-150 flex flex-col justify-between liquid-glass-card ${
                      isSelected
                        ? 'bg-nexus-500/15 dark:bg-nexus-600/20 border-nexus-500 text-slate-900 dark:text-white shadow-[0_0_15px_rgba(124,13,244,0.25)] ring-1 ring-nexus-500/50'
                        : 'bg-white/60 dark:bg-white/4 border-slate-200/80 dark:border-white/6 text-slate-700 dark:text-white/70 hover:bg-slate-100 dark:hover:bg-white/8 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/8">
                          {getTemplateIcon(tmpl.id)}
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200/70 dark:bg-white/6 font-mono text-slate-700 dark:text-white/60">
                          {tmpl.badge}
                        </span>
                      </div>
                      <h4 className="text-xs font-semibold text-slate-900 dark:text-white mb-1">{tmpl.name}</h4>
                      <p className="text-[11px] text-slate-500 dark:text-white/50 line-clamp-2 leading-relaxed">
                        {tmpl.description}
                      </p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-200/80 dark:border-white/6 flex items-center justify-between text-[10px] text-slate-400 dark:text-white/40">
                      <span>{tmpl.defaultFiles.length} fichiers</span>
                      <span className="text-cyan-600 dark:text-cyan-300 font-medium">
                        {tmpl.executionType === 'browser-iframe' ? 'Aperçu direct' : 'Serveur requis'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-slate-200/80 dark:border-white/8 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-white/70 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 transition-colors cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              id="btn-create-project-submit"
              className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-nexus-600 to-cyan-600 hover:from-nexus-500 hover:to-cyan-500 shadow-[0_0_15px_rgba(124,13,244,0.4)] transition-all cursor-pointer"
            >
              Créer le projet
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
