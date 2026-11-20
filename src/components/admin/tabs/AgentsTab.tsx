/**
 * src/components/admin/tabs/AgentsTab.tsx
 *
 * Onglet Gestionnaire d'Agents Specialises & System Prompts :
 * - Catalogue et etat des agents (Actif, Masque, Desactive)
 * - Editeur du Prompt Maitre global avec versioning et rollback
 */

import React, { useState } from 'react';
import {
  Bot,
  Cpu,
  ShieldAlert,
  Code2,
  FileText,
  Database,
  History,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  Plus,
} from 'lucide-react';
import {
  getManagedAgents,
  toggleAgentStatus,
  getSystemPromptVersions,
  publishNewPromptVersion,
  rollbackPromptVersion,
} from '../../../services/admin/adminAgentsService.ts';
import type { ManagedAgent, SystemPromptVersion } from '../../../types/admin.ts';

export const AgentsTab: React.FC = () => {
  const [agents, setAgents] = useState<ManagedAgent[]>(getManagedAgents);
  const [promptVersions, setPromptVersions] = useState<SystemPromptVersion[]>(getSystemPromptVersions);
  const activePrompt = promptVersions.find((p) => p.isActive) || promptVersions[0];

  const [promptDraft, setPromptDraft] = useState(activePrompt?.prompt || '');
  const [versionTitle, setVersionTitle] = useState('');
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const handleStatusChange = (agentId: string, status: ManagedAgent['status']) => {
    toggleAgentStatus(agentId, status);
    setAgents(getManagedAgents());
  };

  const handlePublishPrompt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!promptDraft.trim()) return;
    const title = versionTitle.trim() || `Mise à jour du ${new Date().toLocaleDateString()}`;
    const newVer = publishNewPromptVersion(title, promptDraft.trim());
    setPromptVersions(getSystemPromptVersions());
    setVersionTitle('');
    setFeedbackMsg(`Nouvelle version ${newVer.version} publiée avec succès !`);
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  const handleRollback = (versionId: string) => {
    const success = rollbackPromptVersion(versionId);
    if (success) {
      const updatedList = getSystemPromptVersions();
      setPromptVersions(updatedList);
      const newlyActive = updatedList.find((v) => v.isActive);
      if (newlyActive) setPromptDraft(newlyActive.prompt);
      setFeedbackMsg('Rollback appliqué avec succès !');
      setTimeout(() => setFeedbackMsg(null), 3000);
    }
  };

  const getAgentIcon = (iconName: string) => {
    switch (iconName) {
      case 'Cpu':
        return <Cpu size={16} className="text-blue-400" />;
      case 'ShieldAlert':
        return <ShieldAlert size={16} className="text-red-400" />;
      case 'Code2':
        return <Code2 size={16} className="text-purple-400" />;
      case 'FileText':
        return <FileText size={16} className="text-emerald-400" />;
      case 'Database':
        return <Database size={16} className="text-amber-400" />;
      default:
        return <Bot size={16} className="text-indigo-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* En-tete */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-linear-to-r from-purple-900/20 via-pink-900/10 to-transparent border border-purple-500/20">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Bot className="text-purple-400" size={18} />
            Gestionnaire d'Agents Spécialisés & System Prompts
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Activez vos personas IA spécialisés et gérez le comportement du Prompt Maître avec historique de versioning.
          </p>
        </div>
        {feedbackMsg && (
          <span className="text-xs text-emerald-400 flex items-center gap-1 font-medium animate-fade-in bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/20">
            <CheckCircle2 size={14} /> {feedbackMsg}
          </span>
        )}
      </div>

      {/* Catalogue d'agents */}
      <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 space-y-4">
        <div>
          <h4 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <Sparkles size={16} className="text-amber-400" />
            Catalogue d'Agents Disponibles ({agents.length})
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Choisissez quels agents sont accessibles publiquement, masqués dans l'interface ou temporairement désactivés.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {agents.map((agent) => (
            <div
              key={agent.id}
              className="p-3.5 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/5 space-y-2.5"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-slate-100 dark:bg-white/10">
                    {getAgentIcon(agent.avatarIcon)}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">
                      {agent.name}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      {agent.roleTitle}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleStatusChange(agent.id, 'active')}
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-all cursor-pointer ${
                      agent.status === 'active'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Actif
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStatusChange(agent.id, 'hidden')}
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-all cursor-pointer ${
                      agent.status === 'hidden'
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Masqué
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStatusChange(agent.id, 'disabled')}
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-all cursor-pointer ${
                      agent.status === 'disabled'
                        ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Désactivé
                  </button>
                </div>
              </div>

              <p className="text-[11px] text-slate-600 dark:text-slate-300 line-clamp-2">
                {agent.description}
              </p>

              <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-100 dark:border-white/5 font-mono">
                <span>Modèle : {agent.modelId}</span>
                <span>Temp : {agent.temperature}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Editeur de Prompt Maitre avec Versioning */}
      <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 space-y-4">
        <div>
          <h4 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <History size={16} className="text-indigo-400" />
            Éditeur du Prompt Maître & Versioning
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Ce prompt définit l'identité, les consignes strictes et le comportement racine de tout NEXUS AI.
          </p>
        </div>

        <form onSubmit={handlePublishPrompt} className="space-y-3">
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Titre de la nouvelle version (ex: Ajustement sécurité et ton empathique)..."
              value={versionTitle}
              onChange={(e) => setVersionTitle(e.target.value)}
              className="flex-1 px-3 py-1.5 text-xs rounded-lg bg-white dark:bg-black/30 border border-slate-300 dark:border-white/15 text-slate-900 dark:text-white"
            />
            <button
              type="submit"
              className="px-3.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Plus size={13} /> Publier la Version
            </button>
          </div>

          <textarea
            rows={5}
            value={promptDraft}
            onChange={(e) => setPromptDraft(e.target.value)}
            className="w-full p-3 text-xs font-mono rounded-lg bg-white dark:bg-black/30 border border-slate-300 dark:border-white/15 text-slate-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-purple-500"
            placeholder="Écrivez ici le prompt maître..."
          />
        </form>

        {/* Historique des versions avec Rollback */}
        <div className="space-y-2">
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <History size={13} /> Historique des versions déployées :
          </span>

          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {promptVersions.map((ver) => (
              <div
                key={ver.id}
                className={`p-3 rounded-lg border transition-all flex items-center justify-between gap-3 ${
                  ver.isActive
                    ? 'bg-purple-500/10 border-purple-500/40'
                    : 'bg-white dark:bg-white/5 border-slate-200 dark:border-white/5'
                }`}
              >
                <div className="overflow-hidden">
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold font-mono bg-slate-200 dark:bg-white/10 text-slate-800 dark:text-slate-200">
                      {ver.version}
                    </span>
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                      {ver.title}
                    </span>
                    {ver.isActive && (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-purple-500/20 text-purple-400 border border-purple-500/30">
                        En Ligne
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5 font-mono">
                    {ver.prompt}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
                    {new Date(ver.createdAt).toLocaleDateString()}
                  </span>
                  {!ver.isActive && (
                    <button
                      type="button"
                      onClick={() => handleRollback(ver.id)}
                      className="px-2.5 py-1 rounded-md bg-slate-200 dark:bg-white/10 hover:bg-purple-600 hover:text-white text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <RotateCcw size={11} /> Rollback
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
