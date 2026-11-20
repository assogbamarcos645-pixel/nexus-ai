/**
 * src/components/admin/tabs/GatewayTab.tsx
 *
 * Onglet Passerelle IA & Routage Dynamique (AI Gateway) :
 * - Ordre de bascule (fallback) automatique et seuil de latence
 * - Matrice des permissions de modeles par role
 * - Toggles Guardrails & Moderation
 */

import React, { useState } from 'react';
import {
  Cpu,
  ArrowUpDown,
  ShieldCheck,
  ShieldAlert,
  Zap,
  CheckCircle2,
  Lock,
  Plus,
  Trash2,
} from 'lucide-react';
import {
  getGatewayConfig,
  saveGatewayConfig,
  AVAILABLE_PROVIDERS,
  AVAILABLE_MODELS,
} from '../../../services/admin/adminGatewayService.ts';
import type { GatewayConfig, RoleModelPermissions } from '../../../types/admin.ts';

export const GatewayTab: React.FC = () => {
  const [config, setConfig] = useState<GatewayConfig>(getGatewayConfig);
  const [newBlockedTerm, setNewBlockedTerm] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleProviderOrderChange = (index: number, direction: 'up' | 'down') => {
    const newOrder = [...config.providerOrder];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newOrder.length) return;

    const temp = newOrder[index];
    newOrder[index] = newOrder[targetIndex];
    newOrder[targetIndex] = temp;

    const updated = { ...config, providerOrder: newOrder };
    setConfig(updated);
    saveGatewayConfig(updated);
  };

  const handleToggleRoleModel = (role: keyof RoleModelPermissions, modelId: string) => {
    const currentList = config.rolePermissions[role] || [];
    const exists = currentList.includes(modelId);
    const updatedList = exists
      ? currentList.filter((m) => m !== modelId)
      : [...currentList, modelId];

    const updated = {
      ...config,
      rolePermissions: {
        ...config.rolePermissions,
        [role]: updatedList,
      },
    };
    setConfig(updated);
    saveGatewayConfig(updated);
  };

  const handleToggleGuardrail = (key: 'promptInjectionBlocker' | 'piiAndSecretMasking') => {
    const updated = {
      ...config,
      guardrails: {
        ...config.guardrails,
        [key]: !config.guardrails[key],
      },
    };
    setConfig(updated);
    saveGatewayConfig(updated);
  };

  const handleAddBlockedTerm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBlockedTerm.trim()) return;
    const term = newBlockedTerm.trim();
    if (config.guardrails.customBlockedTerms.includes(term)) return;

    const updated = {
      ...config,
      guardrails: {
        ...config.guardrails,
        customBlockedTerms: [...config.guardrails.customBlockedTerms, term],
      },
    };
    setConfig(updated);
    saveGatewayConfig(updated);
    setNewBlockedTerm('');
  };

  const handleRemoveBlockedTerm = (term: string) => {
    const updated = {
      ...config,
      guardrails: {
        ...config.guardrails,
        customBlockedTerms: config.guardrails.customBlockedTerms.filter((t) => t !== term),
      },
    };
    setConfig(updated);
    saveGatewayConfig(updated);
  };

  const handleLatencyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    const updated = { ...config, latencyThresholdMs: val };
    setConfig(updated);
    saveGatewayConfig(updated);
  };

  const handleSaveAll = () => {
    saveGatewayConfig(config);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const roles: Array<{ key: keyof RoleModelPermissions; label: string }> = [
    { key: 'super_admin', label: 'Super-Admin' },
    { key: 'pro_dev', label: 'Pro Dev' },
    { key: 'user', label: 'User Standard' },
    { key: 'restricted', label: 'Restreint' },
  ];

  return (
    <div className="space-y-6">
      {/* En-tete */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-linear-to-r from-blue-900/20 via-indigo-900/10 to-transparent border border-blue-500/20">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Cpu className="text-blue-400" size={18} />
            Passerelle IA & Routage Dynamique
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Gérez l'ordre de bascule automatique, les seuils de tolérance et les autorisations de modèles par rôle.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {saveSuccess && (
            <span className="text-xs text-emerald-400 flex items-center gap-1 font-medium animate-fade-in">
              <CheckCircle2 size={14} /> Synchronisé
            </span>
          )}
          <button
            type="button"
            onClick={handleSaveAll}
            className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            Enregistrer
          </button>
        </div>
      </div>

      {/* Section 1 : Ordre de bascule & Fallback */}
      <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Zap size={16} className="text-amber-400" />
              Ordre de Bascule Automatique (Fallback Chaining)
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              En cas d'échec ou de dépassement de latence, la passerelle bascule dans cet ordre précis.
            </p>
          </div>
          <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
            <input
              type="checkbox"
              checked={config.fallbackEnabled}
              onChange={(e) => {
                const updated = { ...config, fallbackEnabled: e.target.checked };
                setConfig(updated);
                saveGatewayConfig(updated);
              }}
              className="rounded-sm accent-blue-600"
            />
            <span className="text-slate-700 dark:text-slate-200">Fallback Actif</span>
          </label>
        </div>

        {/* Seuil de latence */}
        <div className="bg-white dark:bg-black/20 p-3 rounded-lg border border-slate-200 dark:border-white/5">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-slate-600 dark:text-slate-300">
              Seuil de basculement sur latence excessive :
            </span>
            <span className="font-mono font-bold text-blue-500">{config.latencyThresholdMs} ms</span>
          </div>
          <input
            type="range"
            min={500}
            max={5000}
            step={100}
            value={config.latencyThresholdMs}
            onChange={handleLatencyChange}
            className="w-full accent-blue-600 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-400 mt-1">
            <span>500 ms (Strict)</span>
            <span>1500 ms (Recommandé)</span>
            <span>5000 ms (Tolérant)</span>
          </div>
        </div>

        {/* Liste reordonnable */}
        <div className="space-y-2">
          {config.providerOrder.map((provId, idx) => {
            const providerInfo = AVAILABLE_PROVIDERS.find((p) => p.id === provId);
            if (!providerInfo) return null;
            const isFirst = idx === 0;
            const isLast = idx === config.providerOrder.length - 1;

            return (
              <div
                key={provId}
                className="flex items-center justify-between p-2.5 rounded-lg bg-white dark:bg-white/5 border border-slate-200 dark:border-white/5"
              >
                <div className="flex items-center gap-3">
                  <span className="w-5 h-5 rounded-full bg-blue-500/10 text-blue-500 text-[11px] font-bold flex items-center justify-center font-mono">
                    {idx + 1}
                  </span>
                  <div>
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-100">
                      {providerInfo.name}
                    </span>
                    <span className="text-[10px] text-slate-400 ml-2">
                      (défaut : {providerInfo.defaultModel})
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                    ~{providerInfo.latencyMs} ms
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={isFirst}
                      onClick={() => handleProviderOrderChange(idx, 'up')}
                      className="p-1 rounded-sm text-slate-400 hover:text-white disabled:opacity-30 cursor-pointer"
                      title="Monter d'un rang"
                    >
                      <ArrowUpDown size={13} className="rotate-180" />
                    </button>
                    <button
                      type="button"
                      disabled={isLast}
                      onClick={() => handleProviderOrderChange(idx, 'down')}
                      className="p-1 rounded-sm text-slate-400 hover:text-white disabled:opacity-30 cursor-pointer"
                      title="Descendre d'un rang"
                    >
                      <ArrowUpDown size={13} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Section 2 : Matrice des permissions par role */}
      <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 space-y-4">
        <div>
          <h4 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <Lock size={16} className="text-indigo-400" />
            Matrice des Permissions de Modèles par Rôle
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Définissez quels groupes d'utilisateurs ont le droit d'interroger quels modèles LLM.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400">
                <th className="py-2 px-3 font-semibold">Modèle IA</th>
                <th className="py-2 px-3 font-semibold">Fournisseur</th>
                <th className="py-2 px-3 font-semibold">Niveau</th>
                {roles.map((r) => (
                  <th key={r.key} className="py-2 px-2 text-center font-semibold">
                    {r.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-white/5">
              {AVAILABLE_MODELS.map((model) => (
                <tr key={model.id} className="hover:bg-slate-100/50 dark:hover:bg-white/5">
                  <td className="py-2 px-3 font-medium text-slate-800 dark:text-slate-200">
                    {model.name}
                  </td>
                  <td className="py-2 px-3 text-slate-500 dark:text-slate-400">{model.provider}</td>
                  <td className="py-2 px-3">
                    <span
                      className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${
                        model.tier === 'premium'
                          ? 'bg-purple-500/10 text-purple-400'
                          : model.tier === 'local'
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : 'bg-blue-500/10 text-blue-400'
                      }`}
                    >
                      {model.tier}
                    </span>
                  </td>
                  {roles.map((r) => {
                    const isChecked = config.rolePermissions[r.key]?.includes(model.id) ?? false;
                    return (
                      <td key={r.key} className="py-2 px-2 text-center">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleRoleModel(r.key, model.id)}
                          className="rounded-sm accent-blue-600 cursor-pointer"
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 3 : Guardrails & Moderation */}
      <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 space-y-4">
        <div>
          <h4 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldAlert size={16} className="text-emerald-400" />
            Filtres de Guardrails & Modération en Temps Réel
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Protégez vos modèles contre les attaques et empêchez les fuites de secrets d'entreprise.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div
            onClick={() => handleToggleGuardrail('promptInjectionBlocker')}
            className={`p-3 rounded-lg border transition-all cursor-pointer flex items-start gap-3 ${
              config.guardrails.promptInjectionBlocker
                ? 'bg-emerald-500/5 border-emerald-500/30'
                : 'bg-white dark:bg-black/20 border-slate-200 dark:border-white/10'
            }`}
          >
            <ShieldCheck
              size={18}
              className={config.guardrails.promptInjectionBlocker ? 'text-emerald-400' : 'text-slate-400'}
            />
            <div>
              <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                Bloqueur d'injections de prompt
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Neutralise les tentatives de « jailbreak », les dérogations système et les attaques inverses.
              </p>
            </div>
          </div>

          <div
            onClick={() => handleToggleGuardrail('piiAndSecretMasking')}
            className={`p-3 rounded-lg border transition-all cursor-pointer flex items-start gap-3 ${
              config.guardrails.piiAndSecretMasking
                ? 'bg-blue-500/5 border-blue-500/30'
                : 'bg-white dark:bg-black/20 border-slate-200 dark:border-white/10'
            }`}
          >
            <ShieldCheck
              size={18}
              className={config.guardrails.piiAndSecretMasking ? 'text-blue-400' : 'text-slate-400'}
            />
            <div>
              <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                Masquage automatique PII & Clés d'API
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Remplacement à la volée des tokens sensibles (sk-*, Bearer, numéros CB, emails) par des placeholders.
              </p>
            </div>
          </div>
        </div>

        {/* Termes bloques personnalises */}
        <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-white/5">
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Termes & Motifs Interdits (Custom Blocklist) :
          </span>

          <form onSubmit={handleAddBlockedTerm} className="flex gap-2">
            <input
              type="text"
              placeholder="Ex: DROP TABLE, secret_key, eval(..."
              value={newBlockedTerm}
              onChange={(e) => setNewBlockedTerm(e.target.value)}
              className="flex-1 px-3 py-1.5 text-xs rounded-lg bg-white dark:bg-black/30 border border-slate-300 dark:border-white/15 text-slate-900 dark:text-white"
            />
            <button
              type="submit"
              className="px-3 py-1.5 rounded-lg bg-slate-800 dark:bg-white/10 hover:bg-slate-700 text-white text-xs font-semibold flex items-center gap-1 cursor-pointer"
            >
              <Plus size={13} /> Ajouter
            </button>
          </form>

          <div className="flex flex-wrap gap-1.5 mt-2">
            {config.guardrails.customBlockedTerms.map((term) => (
              <span
                key={term}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-500/10 border border-red-500/20 text-red-400 text-[11px] font-mono"
              >
                {term}
                <button
                  type="button"
                  onClick={() => handleRemoveBlockedTerm(term)}
                  className="hover:text-red-200 cursor-pointer ml-1"
                >
                  <Trash2 size={11} />
                </button>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
