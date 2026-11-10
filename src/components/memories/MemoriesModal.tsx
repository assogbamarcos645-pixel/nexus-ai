/**
 * src/components/memories/MemoriesModal.tsx
 *
 * Fenêtre modale de gestion des souvenirs IA (Memories).
 * Permet à l'utilisateur de consulter, ajouter, filtrer et supprimer les souvenirs
 * enregistrés par l'IA dans la table PostgreSQL `memories`, protégée par RLS.
 * Si l'utilisateur n'est pas connecté, présente le composant `AuthGate`.
 */

import { useState, useEffect, useMemo } from 'react';
import {
  Brain,
  Plus,
  Trash2,
  Search,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Database,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from '@/hooks/useTranslation';
import { fetchCloudMemories, saveMemoryToCloud, deleteMemoryFromCloud } from '@/services/sync/syncService';
import { AuthGate } from '@/components/auth/AuthGate';
import { Spinner } from '@/components/ui/Spinner';
import { ModalCloseButton } from '@/components/ui/ModalCloseButton';
import { generateUUID } from '@/utils/uuid';
import type { UserMemory } from '@/types/auth';

interface MemoriesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAuth: () => void;
}

type MemoryCategoryFilter = 'all' | 'preference' | 'context' | 'fact' | 'project';

export function MemoriesModal({ isOpen, onClose, onOpenAuth }: MemoriesModalProps) {
  const { user, isAuthenticated } = useAuth();
  const { t, formatDate } = useTranslation();

  const [memories, setMemories] = useState<UserMemory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<MemoryCategoryFilter>('all');

  // Formulaire d'ajout
  const [isAdding, setIsAdding] = useState(false);
  const [newKey, setNewKey] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState<UserMemory['category']>('fact');
  const [isSaving, setIsSaving] = useState(false);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Chargement des souvenirs depuis le cloud
  useEffect(() => {
    let active = true;
    if (isOpen && isAuthenticated && user) {
      Promise.resolve().then(() => {
        if (active) setIsLoading(true);
      });
      fetchCloudMemories(user.id)
        .then((data) => {
          if (active) setMemories(data);
        })
        .catch((err) => {
          console.error('[NEXUS MEMORIES] Erreur chargement:', err);
        })
        .finally(() => {
          if (active) setIsLoading(false);
        });
    }
    return () => {
      active = false;
    };
  }, [isOpen, isAuthenticated, user]);

  // Filtrage
  const filteredMemories = useMemo(() => {
    return memories.filter((m) => {
      const matchesCategory = selectedCategory === 'all' || m.category === selectedCategory;
      const matchesSearch =
        !searchQuery.trim() ||
        m.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.content.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [memories, selectedCategory, searchQuery]);

  if (!isOpen) return null;

  const handleAddMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newKey.trim() || !newContent.trim() || isSaving) return;

    setIsSaving(true);
    setErrorNotice(null);

    const memoryItem: Omit<UserMemory, 'userId'> = {
      id: generateUUID(),
      key: newKey.trim(),
      content: newContent.trim(),
      category: newCategory,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const res = await saveMemoryToCloud(user.id, memoryItem);
    setIsSaving(false);

    if (res.success) {
      setMemories((prev) => [
        {
          ...memoryItem,
          userId: user.id,
        },
        ...prev,
      ]);
      setNewKey('');
      setNewContent('');
      setIsAdding(false);
      setSuccessNotice('Souvenir IA enregistré avec succès dans votre espace cloud.');
      setTimeout(() => setSuccessNotice(null), 2500);
    } else {
      setErrorNotice(res.error || 'Impossible d’enregistrer le souvenir.');
    }
  };

  const handleDeleteMemory = async (id: string) => {
    if (!user) return;
    const ok = await deleteMemoryFromCloud(user.id, id);
    if (ok) {
      setMemories((prev) => prev.filter((m) => m.id !== id));
    }
  };

  const getCategoryBadge = (cat: UserMemory['category']) => {
    switch (cat) {
      case 'preference':
        return <span className="px-2 py-0.5 rounded text-[10px] bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">Préférence</span>;
      case 'context':
        return <span className="px-2 py-0.5 rounded text-[10px] bg-purple-500/15 text-purple-300 border border-purple-500/30">Contexte</span>;
      case 'project':
        return <span className="px-2 py-0.5 rounded text-[10px] bg-amber-500/15 text-amber-300 border border-amber-500/30">Projet</span>;
      case 'fact':
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">Fait</span>;
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="memories-modal-title"
    >
      <div className="relative w-full max-w-2xl rounded-2xl bg-surface-950 border border-nexus-500/30 shadow-[0_0_50px_rgba(124,13,244,0.35)] overflow-hidden flex flex-col max-h-[85dvh]">
        {/* En-tête */}
        <div className="px-6 py-4 border-b border-white/8 bg-surface-900/90 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="p-2 rounded-xl bg-gradient-to-br from-nexus-500 to-cyan-500 text-white shadow-[0_0_15px_rgba(124,13,244,0.5)] shrink-0">
              <Brain size={18} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 id="memories-modal-title" className="text-sm font-semibold text-white truncate">
                  {t('memories.title')}
                </h3>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-nexus-500/20 text-nexus-300 font-semibold border border-nexus-500/30 shrink-0">
                  Cloud RLS
                </span>
              </div>
              <p className="text-xs text-white/50 mt-0.5 truncate">
                {t('memories.subtitle')}
              </p>
            </div>
          </div>

          <ModalCloseButton
            onClick={onClose}
            label={t('common.close')}
            title="Fermer (Échap)"
          />
        </div>

        {/* Corps */}
        {!isAuthenticated ? (
          <div className="p-6">
            <AuthGate
              title="La mémoire IA nécessite un compte connecté"
              description="Vos souvenirs IA sont personnalisés, isolés par clé de chiffrement et synchronisés sur PostgreSQL avec Row Level Security. Connectez-vous pour que vos agents retiennent vos préférences."
              onOpenAuth={() => {
                onClose();
                onOpenAuth();
              }}
            />
          </div>
        ) : (
          <div className="p-6 flex-1 flex flex-col overflow-hidden space-y-4">
            {/* Barre d'outils et recherche */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0">
              {/* Barre de recherche */}
              <div className="relative flex-1">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('common.search')}
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs placeholder:text-white/30 focus:outline-none focus:border-nexus-500 transition-colors"
                />
              </div>

              {/* Bouton ajouter */}
              <button
                type="button"
                onClick={() => setIsAdding((prev) => !prev)}
                className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white bg-nexus-600 hover:bg-nexus-500 shadow-sm transition-all cursor-pointer shrink-0"
              >
                <Plus size={14} />
                <span>{isAdding ? t('common.cancel') : t('memories.addMemory')}</span>
              </button>
            </div>

            {/* Filtres par catégorie */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs shrink-0 scrollbar-none">
              {(
                [
                  { id: 'all', label: t('memories.categories.all') },
                  { id: 'fact', label: t('memories.categories.fact') },
                  { id: 'preference', label: t('memories.categories.preference') },
                  { id: 'context', label: t('memories.categories.context') },
                  { id: 'project', label: t('memories.categories.project') },
                ] as const
              ).map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer shrink-0 ${
                    selectedCategory === cat.id
                      ? 'bg-nexus-600 text-white font-medium shadow-sm'
                      : 'text-white/60 hover:text-white bg-white/5'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Notifications */}
            {successNotice && (
              <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 size={14} className="shrink-0" />
                <span>{successNotice}</span>
              </div>
            )}

            {errorNotice && (
              <div className="p-2.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
                <AlertCircle size={14} className="shrink-0" />
                <span>{errorNotice}</span>
              </div>
            )}

            {/* Formulaire d'ajout déroulant */}
            {isAdding && (
              <form
                onSubmit={handleAddMemory}
                className="p-4 rounded-xl bg-surface-900 border border-nexus-500/30 space-y-3 shrink-0 animate-in fade-in duration-150"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-cyan-300 flex items-center gap-1.5">
                    <Sparkles size={13} />
                    <span>Nouveau souvenir d'agent</span>
                  </span>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="bg-black/50 border border-white/10 text-white text-xs rounded-lg px-2.5 py-1 focus:outline-none"
                  >
                    <option value="fact">Fait</option>
                    <option value="preference">Préférence</option>
                    <option value="context">Contexte</option>
                    <option value="project">Projet</option>
                  </select>
                </div>

                <div>
                  <input
                    type="text"
                    required
                    value={newKey}
                    onChange={(e) => setNewKey(e.target.value)}
                    placeholder="Clé / Sujet (ex: Framework préféré, Langue par défaut...)"
                    className="w-full px-3 py-1.5 rounded-lg bg-black/40 border border-white/10 text-white text-xs placeholder:text-white/30 focus:outline-none focus:border-nexus-500"
                  />
                </div>

                <div>
                  <textarea
                    required
                    rows={2}
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    placeholder="Contenu du souvenir mémorisé par l'IA..."
                    className="w-full px-3 py-1.5 rounded-lg bg-black/40 border border-white/10 text-white text-xs placeholder:text-white/30 focus:outline-none focus:border-nexus-500 resize-none"
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAdding(false)}
                    className="px-3 py-1 rounded-lg text-xs text-white/50 hover:text-white"
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white bg-nexus-600 hover:bg-nexus-500 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isSaving ? <Spinner size="sm" /> : <Plus size={13} />}
                    <span>{t('memories.saveMemory')}</span>
                  </button>
                </div>
              </form>
            )}

            {/* Liste des souvenirs */}
            <div className="flex-1 overflow-y-auto scrollbar-thin space-y-2 pr-1">
              {isLoading ? (
                <div className="py-12 flex flex-col items-center justify-center gap-2 text-white/50 text-xs">
                  <Spinner size="md" />
                  <span>{t('common.loading')}</span>
                </div>
              ) : filteredMemories.length === 0 ? (
                <div className="py-12 text-center text-white/40 text-xs space-y-2">
                  <Database size={24} className="mx-auto text-white/20" />
                  <p>{t('memories.noMemories')}</p>
                </div>
              ) : (
                filteredMemories.map((mem) => (
                  <div
                    key={mem.id}
                    className="p-3.5 rounded-xl bg-surface-900 border border-white/6 hover:border-nexus-500/30 transition-all flex items-start justify-between gap-3 group"
                  >
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-semibold text-white tracking-wide">{mem.key}</span>
                        {getCategoryBadge(mem.category)}
                      </div>
                      <p className="text-xs text-white/70 leading-relaxed font-mono text-[11px]">
                        {mem.content}
                      </p>
                      <span className="text-[10px] text-white/30 block pt-0.5">
                        {formatDate(mem.createdAt)}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteMemory(mem.id)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer shrink-0"
                      title={t('common.delete')}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
