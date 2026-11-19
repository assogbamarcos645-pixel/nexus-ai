/**
 * src/components/lab/TemplateHubModal.tsx
 *
 * Hub de Templates Modernes (#3) pour NEXUS LAB.
 * Bibliothèque de modèles complets prêts à cloner :
 *  - Dashboard SaaS & Analytics
 *  - Boutique E-Commerce & Panier Interactif
 *  - Studio IA Génératif & Chat Multimodal
 *  - Portfolio Développeur & Créatif 3D
 *  - Landing Page SaaS Haute Conversion
 *  - Documentation & Blog Technique
 *  - Modèles Fondamentaux (React Vite, Node API, HTML/CSS/JS, Python, PHP, Vierge)
 */

import { useState, useMemo } from 'react';
import {
  Sparkles,
  Search,
  LayoutDashboard,
  ShoppingBag,
  Rocket,
  User,
  BookOpen,
  Atom,
  Globe,
  Server,
  FileCode,
  Terminal,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { LAB_TEMPLATES } from '@/config/labTemplates';
import type { ProjectTemplate, ProjectTemplateId } from '@/types/lab';
import { ModalCloseButton } from '@/components/ui/ModalCloseButton';

interface TemplateHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (templateId: ProjectTemplateId, customName?: string) => void;
}

type TemplateCategory =
  | 'all'
  | 'saas'
  | 'ecommerce'
  | 'ai'
  | 'portfolio'
  | 'landing'
  | 'docs'
  | 'core';

const CATEGORIES: { id: TemplateCategory; label: string; icon: string }[] = [
  { id: 'all', label: 'Tous les modèles', icon: '✨' },
  { id: 'saas', label: 'SaaS & Analytiques', icon: '📊' },
  { id: 'ecommerce', label: 'E-Commerce', icon: '🛍️' },
  { id: 'ai', label: 'Applications IA', icon: '⚡' },
  { id: 'portfolio', label: 'Portfolios & 3D', icon: '🎨' },
  { id: 'landing', label: 'Landing Pages', icon: '🚀' },
  { id: 'docs', label: 'Blog & Docs', icon: '📖' },
  { id: 'core', label: 'Bases & Runtimes', icon: '⚙️' },
];

function getTemplateCategory(id: string): TemplateCategory {
  if (id === 'saas-dashboard') return 'saas';
  if (id === 'ecommerce-store') return 'ecommerce';
  if (id === 'ai-studio' || id === 'nexus' || id === 'codex' || id === 'scholar') return 'ai';
  if (id === 'portfolio-cosmic') return 'portfolio';
  if (id === 'landing-page') return 'landing';
  if (id === 'markdown-blog') return 'docs';
  return 'core';
}

function renderTemplateIcon(id: string) {
  switch (id) {
    case 'saas-dashboard':
      return <LayoutDashboard size={20} className="text-cyan-400" />;
    case 'ecommerce-store':
      return <ShoppingBag size={20} className="text-purple-400" />;
    case 'ai-studio':
      return <Sparkles size={20} className="text-indigo-400" />;
    case 'portfolio-cosmic':
      return <User size={20} className="text-pink-400" />;
    case 'landing-page':
      return <Rocket size={20} className="text-amber-400" />;
    case 'markdown-blog':
      return <BookOpen size={20} className="text-emerald-400" />;
    case 'react-vite':
      return <Atom size={20} className="text-cyan-400" />;
    case 'node-api':
      return <Server size={20} className="text-emerald-400" />;
    case 'php-app':
      return <FileCode size={20} className="text-indigo-400" />;
    case 'python-app':
      return <Terminal size={20} className="text-blue-400" />;
    case 'html-css-js':
      return <Globe size={20} className="text-orange-400" />;
    default:
      return <Layers size={20} className="text-cyan-400" />;
  }
}

export function TemplateHubModal({
  isOpen,
  onClose,
  onSelectTemplate,
}: TemplateHubModalProps) {
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [customProjectName, setCustomProjectName] = useState('');

  const filteredTemplates = useMemo(() => {
    return LAB_TEMPLATES.filter((tmpl) => {
      // Filtre catégorie
      const cat = getTemplateCategory(tmpl.id);
      if (selectedCategory !== 'all' && cat !== selectedCategory) {
        return false;
      }

      // Filtre recherche
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = tmpl.name.toLowerCase().includes(query);
        const matchesDesc = tmpl.description.toLowerCase().includes(query);
        const matchesBadge = tmpl.badge?.toLowerCase().includes(query);
        return matchesName || matchesDesc || matchesBadge;
      }

      return true;
    });
  }, [selectedCategory, searchQuery]);

  if (!isOpen) return null;

  const handleClone = (tmpl: ProjectTemplate) => {
    onSelectTemplate(tmpl.id, customProjectName.trim() || undefined);
    setCustomProjectName('');
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-5xl h-[88vh] flex flex-col rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl text-slate-100 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* En-tête */}
        <div className="px-6 py-5 border-b border-slate-800 bg-slate-950/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-cyan-500/20 to-purple-500/20 border border-cyan-500/30 text-cyan-400 shadow-md">
              <Sparkles size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white tracking-tight">Hub de Templates Modernes</h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono border border-cyan-500/30">
                  {LAB_TEMPLATES.length} modèles prêts à l'emploi
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Démarrez votre projet sur une base d'ingénierie robuste, typée et responsive.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Barre de Recherche */}
            <div className="relative w-full sm:w-64">
              <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher un modèle..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700/80 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 shadow-inner"
              />
            </div>
            <ModalCloseButton onClick={onClose} label="Fermer" title="Fermer" />
          </div>
        </div>

        {/* Barre de Filtres Catégories */}
        <div className="px-6 py-2.5 border-b border-slate-800 bg-slate-900/80 flex items-center gap-2 overflow-x-auto scrollbar-thin shrink-0">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat.id
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>

        {/* Grille des Modèles */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
          {filteredTemplates.length === 0 ? (
            <div className="text-center py-20 text-slate-500 text-xs">
              Aucun modèle ne correspond à votre recherche « {searchQuery} ».
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTemplates.map((tmpl) => (
                <div
                  key={tmpl.id}
                  className="p-5 rounded-2xl border transition-all flex flex-col justify-between group shadow-xl bg-slate-900/60 border-slate-800/80 hover:border-cyan-500/40 hover:bg-slate-900"
                >
                    <div>
                      {/* En-tête de la carte */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 group-hover:border-cyan-500/30 transition-colors">
                          {renderTemplateIcon(tmpl.id)}
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-medium border border-slate-700/60">
                          {tmpl.badge || 'Modèle'}
                        </span>
                      </div>

                      <h4 className="font-bold text-sm text-white mb-1.5 group-hover:text-cyan-300 transition-colors">
                        {tmpl.name}
                      </h4>
                      <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed mb-4">
                        {tmpl.description}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono">
                        <span>{tmpl.defaultFiles.length} fichiers</span>
                        <span>•</span>
                        <span className="text-cyan-400 font-sans font-medium">Aperçu direct</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleClone(tmpl)}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 shadow-md shadow-cyan-500/20 transition-all cursor-pointer"
                      >
                        <span>Cloner</span>
                        <ArrowRight size={13} />
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
