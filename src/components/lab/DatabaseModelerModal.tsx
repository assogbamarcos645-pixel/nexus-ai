/**
 * src/components/lab/DatabaseModelerModal.tsx
 *
 * Studio visuel de modélisation de base de données relationnelle pour NEXUS LAB.
 * Permet de concevoir tables, colonnes, relations, clés étrangères et politiques RLS,
 * puis de générer instantanément le script SQL PostgreSQL/Supabase et les types TypeScript.
 */

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Database,
  Plus,
  Trash2,
  Copy,
  Check,
  Code2,
  ShieldCheck,
  Table as TableIcon,
  Sparkles,
  Layers,
} from 'lucide-react';
import type { DbSchema, DbTable, DbColumn, DbColumnType } from '@/types/databaseModeler';
import type { LabProject } from '@/types/lab';
import {
  generatePostgresSql,
  generateTypeScriptTypes,
  generateSupabaseClientSnippet,
  DEFAULT_SAAS_SCHEMA,
  DEFAULT_ECOMMERCE_SCHEMA,
  DEFAULT_BLOG_SCHEMA,
} from '@/services/lab/databaseModelerService';
import { ModalCloseButton } from '@/components/ui/ModalCloseButton';

interface DatabaseModelerModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeProject: LabProject | null;
  onInjectIntoProject: (schema: DbSchema) => void;
}

const AVAILABLE_TYPES: { label: string; value: DbColumnType }[] = [
  { label: 'UUID (Identifiant unique)', value: 'uuid' },
  { label: 'Text (Texte illimité)', value: 'text' },
  { label: 'Varchar (Chaîne courte)', value: 'varchar' },
  { label: 'Integer (Entier standard)', value: 'integer' },
  { label: 'Bigint (Grand entier)', value: 'bigint' },
  { label: 'Numeric (Monétaire / Décimal)', value: 'numeric' },
  { label: 'Boolean (Vrai / Faux)', value: 'boolean' },
  { label: 'Timestamptz (Date avec fuseau)', value: 'timestamptz' },
  { label: 'JSONB (Document structuré)', value: 'jsonb' },
];

export function DatabaseModelerModal({
  isOpen,
  onClose,
  activeProject: _activeProject,
  onInjectIntoProject,
}: DatabaseModelerModalProps) {
  const [schema, setSchema] = useState<DbSchema>(() => JSON.parse(JSON.stringify(DEFAULT_SAAS_SCHEMA)));
  const [selectedTableId, setSelectedTableId] = useState<string>(schema.tables[0]?.id || '');
  const [activeTab, setActiveTab] = useState<'tables' | 'rls' | 'code'>('tables');
  const [codeSubTab, setCodeSubTab] = useState<'sql' | 'typescript' | 'client'>('sql');
  const [copied, setCopied] = useState(false);
  const [injectedSuccess, setInjectedSuccess] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;
  if (typeof document === 'undefined') return null;

  const currentTable = schema.tables.find((t) => t.id === selectedTableId) || schema.tables[0];

  const handleCopyCode = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Ignorer
    }
  };

  const handleInject = () => {
    onInjectIntoProject(schema);
    setInjectedSuccess(true);
    setTimeout(() => {
      setInjectedSuccess(false);
      onClose();
    }, 1500);
  };

  const handleLoadPreset = (preset: 'saas' | 'ecommerce' | 'blog') => {
    let newSchema = DEFAULT_SAAS_SCHEMA;
    if (preset === 'ecommerce') newSchema = DEFAULT_ECOMMERCE_SCHEMA;
    if (preset === 'blog') newSchema = DEFAULT_BLOG_SCHEMA;

    const cloned = JSON.parse(JSON.stringify(newSchema));
    setSchema(cloned);
    setSelectedTableId(cloned.tables[0]?.id || '');
  };

  const handleAddTable = () => {
    const newId = 'tbl-' + Date.now();
    const newTable: DbTable = {
      id: newId,
      name: `nouvelle_table_${schema.tables.length + 1}`,
      comment: 'Description de la table',
      enableRls: true,
      columns: [
        {
          id: 'c1',
          name: 'id',
          type: 'uuid',
          isPrimaryKey: true,
          defaultValue: 'gen_random_uuid()',
        },
        {
          id: 'c2',
          name: 'created_at',
          type: 'timestamptz',
          defaultValue: 'now()',
          isNullable: false,
        },
      ],
    };

    setSchema((prev) => ({
      ...prev,
      tables: [...prev.tables, newTable],
    }));
    setSelectedTableId(newId);
  };

  const handleDeleteTable = (tableId: string) => {
    if (schema.tables.length <= 1) return;
    const remaining = schema.tables.filter((t) => t.id !== tableId);
    setSchema((prev) => ({
      ...prev,
      tables: remaining,
      policies: prev.policies.filter((p) => p.tableId !== tableId),
    }));
    if (selectedTableId === tableId) {
      setSelectedTableId(remaining[0].id);
    }
  };

  const handleUpdateTable = (tableId: string, updates: Partial<DbTable>) => {
    setSchema((prev) => ({
      ...prev,
      tables: prev.tables.map((t) => (t.id === tableId ? { ...t, ...updates } : t)),
    }));
  };

  const handleAddColumn = (tableId: string) => {
    const newCol: DbColumn = {
      id: 'col-' + Date.now(),
      name: 'nouveau_champ',
      type: 'text',
      isNullable: true,
    };
    setSchema((prev) => ({
      ...prev,
      tables: prev.tables.map((t) =>
        t.id === tableId ? { ...t, columns: [...t.columns, newCol] } : t,
      ),
    }));
  };

  const handleUpdateColumn = (tableId: string, columnId: string, updates: Partial<DbColumn>) => {
    setSchema((prev) => ({
      ...prev,
      tables: prev.tables.map((t) =>
        t.id === tableId
          ? {
              ...t,
              columns: t.columns.map((c) => (c.id === columnId ? { ...c, ...updates } : c)),
            }
          : t,
      ),
    }));
  };

  const handleDeleteColumn = (tableId: string, columnId: string) => {
    setSchema((prev) => ({
      ...prev,
      tables: prev.tables.map((t) =>
        t.id === tableId
          ? {
              ...t,
              columns: t.columns.filter((c) => c.id !== columnId),
            }
          : t,
      ),
    }));
  };

  const sqlPreview = generatePostgresSql(schema);
  const tsPreview = generateTypeScriptTypes(schema);
  const clientPreview = generateSupabaseClientSnippet();

  return createPortal(
    <div
      className="fixed inset-0 z-[150] flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 cursor-pointer"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-6xl w-[96vw] h-[90vh] flex flex-col rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl text-slate-100 overflow-hidden cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        {/* En-tête */}
        <div className="px-3.5 sm:px-6 py-3 sm:py-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-cyan-500/20 to-indigo-500/20 border border-cyan-500/30 text-cyan-400 shrink-0">
              <Database size={20} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-white truncate">Studio de Modélisation BDD</h3>
                <span className="hidden sm:inline-block text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono border border-cyan-500/30 shrink-0">
                  PostgreSQL & Supabase
                </span>
              </div>
              <p className="hidden sm:block text-xs text-slate-400 mt-0.5 truncate">
                Concevez vos entités, relations et règles RLS avec génération de code instantanée.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Presets rapides */}
            <div className="hidden sm:flex items-center gap-1.5 mr-2">
              <span className="text-[11px] text-slate-400 font-medium">Modèles :</span>
              <button
                type="button"
                onClick={() => handleLoadPreset('saas')}
                className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
              >
                SaaS Multi-Tenant
              </button>
              <button
                type="button"
                onClick={() => handleLoadPreset('ecommerce')}
                className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
              >
                E-Commerce
              </button>
              <button
                type="button"
                onClick={() => handleLoadPreset('blog')}
                className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
              >
                Blog
              </button>
            </div>

            <ModalCloseButton onClick={onClose} label="Fermer" title="Fermer" />
          </div>
        </div>

        {/* Barre de navigation interne */}
        <div className="px-3.5 sm:px-6 py-2 sm:py-2.5 border-b border-slate-800 bg-slate-900/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto scrollbar-none pb-1 sm:pb-0">
            <button
              type="button"
              onClick={() => setActiveTab('tables')}
              className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === 'tables'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <TableIcon size={14} className="shrink-0" />
              <span>Tables & Colonnes ({schema.tables.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('rls')}
              className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === 'rls'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <ShieldCheck size={14} className="shrink-0" />
              <span>Sécurité RLS ({schema.policies.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('code')}
              className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === 'code'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Code2 size={14} className="shrink-0" />
              <span>Code Généré</span>
            </button>
          </div>

          <div className="flex items-center justify-end gap-2 shrink-0">
            <button
              type="button"
              onClick={handleInject}
              disabled={injectedSuccess}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all shadow-md ${
                injectedSuccess
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white shadow-cyan-500/20'
              }`}
            >
              {injectedSuccess ? <Check size={14} /> : <Sparkles size={14} />}
              <span>{injectedSuccess ? 'Injecté avec succès !' : 'Injecter dans le projet'}</span>
            </button>
          </div>
        </div>

        {/* Contenu principal */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          {activeTab === 'tables' && (
            <>
              {/* Panneau gauche : Liste des tables */}
              <div className="w-full md:w-64 max-h-36 md:max-h-none border-b md:border-b-0 md:border-r border-slate-800 bg-slate-950/40 p-2.5 md:p-3 flex flex-col shrink-0">
                <div className="flex items-center justify-between mb-2 md:mb-3 px-1">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Tables
                  </span>
                  <button
                    type="button"
                    onClick={handleAddTable}
                    className="p-1 rounded-md bg-slate-800 hover:bg-slate-700 text-cyan-400 hover:text-cyan-300 transition-colors"
                    title="Ajouter une table"
                  >
                    <Plus size={14} />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin">
                  {schema.tables.map((t) => {
                    const isSelected = t.id === currentTable?.id;
                    return (
                      <div
                        key={t.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => setSelectedTableId(t.id)}
                        onKeyDown={(e) => e.key === 'Enter' && setSelectedTableId(t.id)}
                        className={`w-full p-2.5 rounded-xl text-left transition-all flex items-center justify-between cursor-pointer border ${
                          isSelected
                            ? 'bg-cyan-500/15 border-cyan-500/40 text-white shadow-xs'
                            : 'bg-slate-900/50 border-slate-800/80 text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                        }`}
                      >
                        <div className="min-w-0 flex items-center gap-2">
                          <Layers size={14} className={isSelected ? 'text-cyan-400' : 'text-slate-500'} />
                          <span className="text-xs font-semibold truncate font-mono">{t.name}</span>
                        </div>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                          {t.columns.length} col
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Panneau droit : Détail de la table sélectionnée */}
              {currentTable && (
                <div className="flex-1 flex flex-col overflow-y-auto bg-slate-900/60 p-3 sm:p-6 scrollbar-thin">
                  {/* Configuration générale de la table */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-3 sm:pb-4 border-b border-slate-800 shrink-0">
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-4 flex-1">
                      <div className="flex-1 max-w-full sm:max-w-xs">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                          Nom de la table (PostgreSQL)
                        </label>
                        <input
                          type="text"
                          value={currentTable.name}
                          onChange={(e) =>
                            handleUpdateTable(currentTable.id, {
                              name: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'),
                            })
                          }
                          className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500"
                        />
                      </div>
                      <div className="flex-1 max-w-full sm:max-w-sm">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                          Commentaire / Rôle
                        </label>
                        <input
                          type="text"
                          value={currentTable.comment || ''}
                          onChange={(e) =>
                            handleUpdateTable(currentTable.id, { comment: e.target.value })
                          }
                          placeholder="Ex: Utilisateurs de l'application"
                          className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-2 text-xs font-medium text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={currentTable.enableRls}
                          onChange={(e) =>
                            handleUpdateTable(currentTable.id, { enableRls: e.target.checked })
                          }
                          className="rounded border-slate-700 text-cyan-500 focus:ring-0"
                        />
                        <span>Activer RLS</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => handleDeleteTable(currentTable.id)}
                        disabled={schema.tables.length <= 1}
                        className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/20 disabled:opacity-40 transition-colors"
                        title="Supprimer la table"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Liste des colonnes avec défilement horizontal fluide pour éviter tout écrasement */}
                  <div className="flex-1 overflow-x-auto overflow-y-auto mt-4 scrollbar-thin border border-slate-800/80 rounded-xl bg-slate-950/40 p-3">
                    <table className="min-w-[780px] w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-slate-800 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                          <th className="pb-2 min-w-[150px]">Nom du champ</th>
                          <th className="pb-2 min-w-[170px]">Type</th>
                          <th className="pb-2 text-center min-w-[65px]">Clé (PK)</th>
                          <th className="pb-2 text-center min-w-[65px]">Requis</th>
                          <th className="pb-2 text-center min-w-[65px]">Unique</th>
                          <th className="pb-2 min-w-[140px]">Valeur par défaut</th>
                          <th className="pb-2 min-w-[160px]">Relation (Clé étrangère)</th>
                          <th className="pb-2 text-right min-w-[60px]">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 font-mono">
                        {currentTable.columns.map((col) => (
                          <tr key={col.id} className="hover:bg-slate-800/30 transition-colors">
                            <td className="py-2 pr-2">
                              <input
                                type="text"
                                value={col.name}
                                onChange={(e) =>
                                  handleUpdateColumn(currentTable.id, col.id, {
                                    name: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'),
                                  })
                                }
                                className="w-36 px-2 py-1 rounded bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500"
                              />
                            </td>
                            <td className="py-2 pr-2">
                              <select
                                value={col.type}
                                onChange={(e) =>
                                  handleUpdateColumn(currentTable.id, col.id, {
                                    type: e.target.value as DbColumnType,
                                  })
                                }
                                className="w-40 px-2 py-1 rounded bg-slate-950 border border-slate-800 text-xs text-cyan-300 focus:outline-none focus:border-cyan-500"
                              >
                                {AVAILABLE_TYPES.map((t) => (
                                  <option key={t.value} value={t.value}>
                                    {t.value.toUpperCase()}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="py-2 text-center">
                              <input
                                type="checkbox"
                                checked={!!col.isPrimaryKey}
                                onChange={(e) =>
                                  handleUpdateColumn(currentTable.id, col.id, {
                                    isPrimaryKey: e.target.checked,
                                  })
                                }
                                className="rounded border-slate-700 text-cyan-500 focus:ring-0"
                              />
                            </td>
                            <td className="py-2 text-center">
                              <input
                                type="checkbox"
                                checked={!col.isNullable}
                                onChange={(e) =>
                                  handleUpdateColumn(currentTable.id, col.id, {
                                    isNullable: !e.target.checked,
                                  })
                                }
                                className="rounded border-slate-700 text-cyan-500 focus:ring-0"
                              />
                            </td>
                            <td className="py-2 text-center">
                              <input
                                type="checkbox"
                                checked={!!col.isUnique}
                                onChange={(e) =>
                                  handleUpdateColumn(currentTable.id, col.id, {
                                    isUnique: e.target.checked,
                                  })
                                }
                                className="rounded border-slate-700 text-cyan-500 focus:ring-0"
                              />
                            </td>
                            <td className="py-2 pr-2">
                              <input
                                type="text"
                                value={col.defaultValue || ''}
                                onChange={(e) =>
                                  handleUpdateColumn(currentTable.id, col.id, {
                                    defaultValue: e.target.value,
                                  })
                                }
                                placeholder="ex: now(), gen_random_uuid()"
                                className="w-32 px-2 py-1 rounded bg-slate-950 border border-slate-800 text-[11px] text-slate-300 focus:outline-none focus:border-cyan-500"
                              />
                            </td>
                            <td className="py-2 pr-2">
                              <div className="flex items-center gap-1.5">
                                <input
                                  type="checkbox"
                                  checked={!!col.isForeignKey}
                                  onChange={(e) =>
                                    handleUpdateColumn(currentTable.id, col.id, {
                                      isForeignKey: e.target.checked,
                                    })
                                  }
                                  className="rounded border-slate-700 text-cyan-500 focus:ring-0"
                                />
                                {col.isForeignKey && (
                                  <select
                                    value={col.referencesTable || ''}
                                    onChange={(e) =>
                                      handleUpdateColumn(currentTable.id, col.id, {
                                        referencesTable: e.target.value,
                                        referencesColumn: 'id',
                                      })
                                    }
                                    className="w-28 px-1.5 py-1 rounded bg-slate-950 border border-slate-800 text-[11px] text-indigo-300"
                                  >
                                    <option value="">Sélectionner</option>
                                    {schema.tables
                                      .filter((t) => t.id !== currentTable.id)
                                      .map((t) => (
                                        <option key={t.id} value={t.name}>
                                          {t.name}
                                        </option>
                                      ))}
                                  </select>
                                )}
                              </div>
                            </td>
                            <td className="py-2 text-right">
                              <button
                                type="button"
                                onClick={() => handleDeleteColumn(currentTable.id, col.id)}
                                className="p-1 rounded text-slate-500 hover:text-red-400 transition-colors"
                              >
                                <Trash2 size={13} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    <button
                      type="button"
                      onClick={() => handleAddColumn(currentTable.id)}
                      className="mt-4 flex items-center gap-2 px-3 py-1.5 rounded-lg border border-dashed border-slate-700 hover:border-cyan-500 text-slate-400 hover:text-cyan-300 text-xs font-medium transition-all"
                    >
                      <Plus size={13} />
                      <span>Ajouter une colonne</span>
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {activeTab === 'rls' && (
            <div className="flex-1 p-6 overflow-y-auto scrollbar-thin">
              <div className="max-w-3xl space-y-4">
                <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-200 text-xs leading-relaxed">
                  <strong>Sécurité Row Level Security (RLS) :</strong> Supabase et PostgreSQL
                  isolent les données de chaque utilisateur via des politiques conditionnelles
                  appliquées au niveau de la base de données.
                </div>

                <div className="space-y-3">
                  {schema.policies.map((p) => {
                    const targetTable = schema.tables.find((t) => t.id === p.tableId);
                    return (
                      <div
                        key={p.id}
                        className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2 font-mono text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold text-[10px]">
                              {p.action}
                            </span>
                            <span className="text-white font-semibold">{p.name}</span>
                          </div>
                          <span className="text-slate-400 text-[11px]">
                            Table : <strong className="text-indigo-300">{targetTable?.name}</strong> (Rôle : {p.role})
                          </span>
                        </div>
                        <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800/80 text-cyan-200 text-[11px]">
                          USING ({p.usingExpression})
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'code' && (
            <div className="flex-1 flex flex-col overflow-hidden bg-slate-950">
              {/* Sous-onglets de code */}
              <div className="px-6 py-2 border-b border-slate-800 flex items-center justify-between shrink-0 bg-slate-900/40">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCodeSubTab('sql')}
                    className={`px-3 py-1 rounded-md text-xs font-semibold ${
                      codeSubTab === 'sql'
                        ? 'bg-cyan-500 text-slate-950'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    PostgreSQL / Supabase (schema.sql)
                  </button>
                  <button
                    type="button"
                    onClick={() => setCodeSubTab('typescript')}
                    className={`px-3 py-1 rounded-md text-xs font-semibold ${
                      codeSubTab === 'typescript'
                        ? 'bg-cyan-500 text-slate-950'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Interfaces TypeScript (database.ts)
                  </button>
                  <button
                    type="button"
                    onClick={() => setCodeSubTab('client')}
                    className={`px-3 py-1 rounded-md text-xs font-semibold ${
                      codeSubTab === 'client'
                        ? 'bg-cyan-500 text-slate-950'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Client Supabase
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const code =
                        codeSubTab === 'sql'
                          ? sqlPreview
                          : codeSubTab === 'typescript'
                          ? tsPreview
                          : clientPreview;
                      handleCopyCode(code);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
                  >
                    {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                    <span>{copied ? 'Copié !' : 'Copier'}</span>
                  </button>
                </div>
              </div>

              {/* Bloc de code */}
              <pre className="flex-1 p-6 overflow-auto text-xs font-mono text-cyan-300 leading-relaxed scrollbar-thin selection:bg-cyan-500 selection:text-black">
                {codeSubTab === 'sql' && sqlPreview}
                {codeSubTab === 'typescript' && tsPreview}
                {codeSubTab === 'client' && clientPreview}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
