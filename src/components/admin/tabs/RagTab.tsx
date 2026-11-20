/**
 * src/components/admin/tabs/RagTab.tsx
 *
 * Onglet Base de Connaissances RAG Globale :
 * - Observabilite RAG (requetes, vecteurs, latence de recherche)
 * - Gestion des documents d'entreprise indexes (statut, chunks, vecteurs)
 * - Ajout et indexation de nouveaux documents
 */

import React, { useState } from 'react';
import {
  BookOpen,
  FileText,
  FileCode,
  FileArchive,
  Search,
  UploadCloud,
  CheckCircle2,
  Trash2,
  Database,
  Layers,
  Clock,
  Sparkles,
} from 'lucide-react';
import {
  getRagDocuments,
  addRagDocument,
  deleteRagDocument,
  getRagMetrics,
} from '../../../services/admin/adminRagService.ts';
import type { RagDocument, RagMetrics } from '../../../types/admin.ts';

export const RagTab: React.FC = () => {
  const [documents, setDocuments] = useState<RagDocument[]>(getRagDocuments);
  const [metrics, setMetrics] = useState<RagMetrics>(getRagMetrics);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('Architecture');
  const [newFileType, setNewFileType] = useState<RagDocument['fileType']>('markdown');
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const handleAddDocument = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    addRagDocument(newTitle.trim(), newCategory, newFileType, Math.floor(Math.random() * 150) + 50);
    setDocuments(getRagDocuments());
    setMetrics(getRagMetrics());
    setNewTitle('');
    setFeedbackMsg('Nouveau document vectorisé et indexé avec succès !');
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  const handleDelete = (docId: string) => {
    deleteRagDocument(docId);
    setDocuments(getRagDocuments());
    setMetrics(getRagMetrics());
  };

  const getFileIcon = (type: RagDocument['fileType']) => {
    switch (type) {
      case 'pdf':
        return <FileArchive size={15} className="text-red-400" />;
      case 'markdown':
        return <FileCode size={15} className="text-blue-400" />;
      default:
        return <FileText size={15} className="text-slate-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* En-tete */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-linear-to-r from-teal-900/20 via-cyan-900/10 to-transparent border border-teal-500/20">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <BookOpen className="text-teal-400" size={18} />
            Base de Connaissances RAG & Observabilité Vectorielle
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Gérez la documentation globale injectée dans le contexte RAG de tous les utilisateurs et surveillez la latence vectorielle.
          </p>
        </div>
        {feedbackMsg && (
          <span className="text-xs text-emerald-400 flex items-center gap-1 font-medium animate-fade-in bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/20">
            <CheckCircle2 size={14} /> {feedbackMsg}
          </span>
        )}
      </div>

      {/* Cartes Metriques RAG */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/5">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Documents Indexés</span>
            <Database size={14} className="text-teal-400" />
          </div>
          <div className="text-xl font-bold font-mono text-slate-900 dark:text-white">
            {metrics.totalDocuments}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Base Supabase Vector</div>
        </div>

        <div className="p-3.5 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/5">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Vecteurs & Chunks</span>
            <Layers size={14} className="text-blue-400" />
          </div>
          <div className="text-xl font-bold font-mono text-slate-900 dark:text-white">
            {metrics.totalVectors.toLocaleString()}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">{metrics.totalChunks} fragments textuels</div>
        </div>

        <div className="p-3.5 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/5">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Requêtes RAG</span>
            <Search size={14} className="text-purple-400" />
          </div>
          <div className="text-xl font-bold font-mono text-slate-900 dark:text-white">
            {metrics.totalQueries.toLocaleString()}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Taux pertinence : 94.2%</div>
        </div>

        <div className="p-3.5 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/5">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Latence Moyenne</span>
            <Clock size={14} className="text-amber-400" />
          </div>
          <div className="text-xl font-bold font-mono text-emerald-400">
            {metrics.averageLatencyMs} ms
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Distance Cosine pgvector</div>
        </div>
      </div>

      {/* Formulaire d'ajout / indexation */}
      <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
          <UploadCloud size={14} className="text-teal-400" />
          Indexation d'un Nouveau Document de Référence
        </h4>

        <form onSubmit={handleAddDocument} className="grid grid-cols-1 sm:grid-cols-12 gap-2">
          <div className="sm:col-span-6">
            <input
              type="text"
              placeholder="Titre du document (ex: Guide Déploiement Kubernetes v1.3)..."
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="w-full px-3 py-1.5 text-xs rounded-lg bg-white dark:bg-black/30 border border-slate-300 dark:border-white/15 text-slate-900 dark:text-white"
            />
          </div>

          <div className="sm:col-span-3">
            <select
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-white dark:bg-black/30 border border-slate-300 dark:border-white/15 text-slate-900 dark:text-white"
            >
              <option value="Architecture">Architecture</option>
              <option value="Securite">Sécurité</option>
              <option value="API & Dev">API & Dev</option>
              <option value="Frontend">Frontend</option>
              <option value="Business">Business</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <select
              value={newFileType}
              onChange={(e) => setNewFileType(e.target.value as RagDocument['fileType'])}
              className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-white dark:bg-black/30 border border-slate-300 dark:border-white/15 text-slate-900 dark:text-white"
            >
              <option value="markdown">Markdown (.md)</option>
              <option value="pdf">PDF (.pdf)</option>
              <option value="txt">Texte (.txt)</option>
            </select>
          </div>

          <div className="sm:col-span-1">
            <button
              type="submit"
              className="w-full py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold flex items-center justify-center cursor-pointer shadow-xs"
            >
              <Sparkles size={13} />
            </button>
          </div>
        </form>
      </div>

      {/* Liste des documents vectorises */}
      <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
          Documents Actuellement Indexés dans le Contexte RAG ({documents.length})
        </h4>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400">
                <th className="py-2 px-3">Document</th>
                <th className="py-2 px-3">Catégorie</th>
                <th className="py-2 px-3">Taille</th>
                <th className="py-2 px-3">Vecteurs</th>
                <th className="py-2 px-3">Statut</th>
                <th className="py-2 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-white/5">
              {documents.map((doc) => (
                <tr key={doc.id} className="hover:bg-slate-100/50 dark:hover:bg-white/5">
                  <td className="py-2 px-3 font-medium text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    {getFileIcon(doc.fileType)}
                    <span className="truncate max-w-xs">{doc.title}</span>
                  </td>
                  <td className="py-2 px-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-slate-300">
                      {doc.category}
                    </span>
                  </td>
                  <td className="py-2 px-3 font-mono text-slate-500">{doc.sizeKb} Ko</td>
                  <td className="py-2 px-3 font-mono text-teal-400 font-semibold">
                    {doc.vectorsCount} chunks
                  </td>
                  <td className="py-2 px-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 flex items-center gap-1 w-max">
                      <CheckCircle2 size={11} /> {doc.status}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-right">
                    <button
                      type="button"
                      onClick={() => handleDelete(doc.id)}
                      className="p-1 text-slate-400 hover:text-red-400 transition-colors cursor-pointer"
                      title="Supprimer le document du RAG"
                    >
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
