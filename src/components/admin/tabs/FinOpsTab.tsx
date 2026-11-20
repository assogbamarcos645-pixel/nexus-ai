/**
 * src/components/admin/tabs/FinOpsTab.tsx
 *
 * Onglet FinOps & Plafonds Budgetaires (Cost Control) :
 * - Jauge de budget mensuel et seuil strict
 * - Comportement en cas de depassement
 * - Alertes automatiques de seuil
 * - Ventilation des couts par fonctionnalite (Chat vs Lab vs Agents)
 */

import React, { useState } from 'react';
import {
  DollarSign,
  AlertTriangle,
  PieChart,
  ShieldAlert,
  ArrowRight,
  TrendingDown,
  CheckCircle2,
} from 'lucide-react';
import {
  getFinOpsConfig,
  saveFinOpsConfig,
  updateBudgetLimit,
  updateOnLimitAction,
  toggleAlertThreshold,
} from '../../../services/admin/adminFinOpsService.ts';
import type { FinOpsConfig } from '../../../types/admin.ts';

export const FinOpsTab: React.FC = () => {
  const [config, setConfig] = useState<FinOpsConfig>(getFinOpsConfig);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const percentageUsed = Math.min(
    100,
    Math.round((config.currentSpendUsd / config.monthlyBudgetUsd) * 100),
  );

  const handleBudgetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value) || 1;
    const updated = { ...config, monthlyBudgetUsd: val };
    setConfig(updated);
    updateBudgetLimit(val);
  };

  const handleSaveAll = () => {
    saveFinOpsConfig(config);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const getStatusColor = () => {
    if (percentageUsed >= 90) return 'text-red-500 bg-red-500';
    if (percentageUsed >= 75) return 'text-amber-500 bg-amber-500';
    return 'text-emerald-500 bg-emerald-500';
  };

  return (
    <div className="space-y-6">
      {/* En-tete */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-linear-to-r from-emerald-900/20 via-teal-900/10 to-transparent border border-emerald-500/20">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <DollarSign className="text-emerald-400" size={18} />
            FinOps & Plafonds Budgétaires
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Surveillez la consommation financière de vos API LLM et définissez des seuils de protection automatiques.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {saveSuccess && (
            <span className="text-xs text-emerald-400 flex items-center gap-1 font-medium animate-fade-in">
              <CheckCircle2 size={14} /> Enregistré
            </span>
          )}
          <button
            type="button"
            onClick={handleSaveAll}
            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            Enregistrer
          </button>
        </div>
      </div>

      {/* Jauge Principale de Budget */}
      <div className="p-5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Consommation Mensuelle en Cours (Février 2026) :
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
                ${config.currentSpendUsd.toFixed(2)}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                / ${config.monthlyBudgetUsd.toFixed(2)} USD plafond
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Plafond Mensuel ($) :
              </span>
              <div className="flex items-center gap-1 mt-1">
                <input
                  type="number"
                  min={5}
                  max={10000}
                  step={5}
                  value={config.monthlyBudgetUsd}
                  onChange={handleBudgetChange}
                  className="w-24 px-2.5 py-1 text-xs rounded-lg bg-white dark:bg-black/30 border border-slate-300 dark:border-white/15 text-slate-900 dark:text-white font-mono font-bold"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Barre de progression */}
        <div className="space-y-1.5">
          <div className="w-full h-3 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden relative">
            <div
              className={`h-full transition-all duration-500 rounded-full ${getStatusColor()}`}
              style={{ width: `${percentageUsed}%` }}
            />
          </div>
          <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400 font-mono">
            <span>0%</span>
            <span>{percentageUsed}% consommé</span>
            <span>Reste : ${(config.monthlyBudgetUsd - config.currentSpendUsd).toFixed(2)}</span>
          </div>
        </div>

        {/* Action en cas de depassement */}
        <div className="pt-3 border-t border-slate-200 dark:border-white/5 grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-slate-800 dark:text-slate-200 block mb-1.5">
              Action en cas d'atteinte du plafond (Hard Limit) :
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setConfig({ ...config, onLimitExceeded: 'fallback_free' });
                  updateOnLimitAction('fallback_free');
                }}
                className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                  config.onLimitExceeded === 'fallback_free'
                    ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400'
                    : 'bg-white dark:bg-black/20 border-slate-200 dark:border-white/10 text-slate-400'
                }`}
              >
                <div className="text-xs font-semibold flex items-center gap-1.5">
                  <TrendingDown size={14} /> Bascule Gratuite / Locale
                </div>
                <div className="text-[10px] opacity-80 mt-1">
                  Redirige automatiquement vers Ollama / Groq LPU sans interrompre le service.
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setConfig({ ...config, onLimitExceeded: 'hard_stop' });
                  updateOnLimitAction('hard_stop');
                }}
                className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                  config.onLimitExceeded === 'hard_stop'
                    ? 'bg-red-500/10 border-red-500/40 text-red-400'
                    : 'bg-white dark:bg-black/20 border-slate-200 dark:border-white/10 text-slate-400'
                }`}
              >
                <div className="text-xs font-semibold flex items-center gap-1.5">
                  <ShieldAlert size={14} /> Coupure Stricte
                </div>
                <div className="text-[10px] opacity-80 mt-1">
                  Bloque toutes les nouvelles requêtes payantes jusqu'au mois suivant.
                </div>
              </button>
            </div>
          </div>

          {/* Seuils d'alerte */}
          <div>
            <label className="text-xs font-semibold text-slate-800 dark:text-slate-200 block mb-1.5">
              Notifications de seuil de consommation :
            </label>
            <div className="flex items-center gap-2">
              {[50, 75, 90, 100].map((threshold) => {
                const isActive = config.alertThresholds.includes(threshold);
                return (
                  <button
                    key={threshold}
                    type="button"
                    onClick={() => {
                      toggleAlertThreshold(threshold);
                      const updated = isActive
                        ? config.alertThresholds.filter((t) => t !== threshold)
                        : [...config.alertThresholds, threshold].sort((a, b) => a - b);
                      setConfig({ ...config, alertThresholds: updated });
                    }}
                    className={`flex-1 py-2 rounded-lg border text-center text-xs font-bold font-mono transition-all cursor-pointer ${
                      isActive
                        ? 'bg-amber-500/15 border-amber-500/40 text-amber-400'
                        : 'bg-white dark:bg-black/20 border-slate-200 dark:border-white/10 text-slate-400'
                    }`}
                  >
                    {threshold}%
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-slate-400 mt-2 flex items-center gap-1">
              <AlertTriangle size={12} className="text-amber-400" />
              Une alerte sonore et un email d'urgence sont envoyés à chaque franchissement de seuil.
            </p>
          </div>
        </div>
      </div>

      {/* Ventilation des couts par fonctionnalite */}
      <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 space-y-4">
        <div>
          <h4 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <PieChart size={16} className="text-blue-400" />
            Répartition des Dépenses par Fonctionnalité
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Analysez la consommation exacte générée par chaque module de NEXUS AI.
          </p>
        </div>

        {/* Barre segmentee */}
        <div className="w-full h-4 rounded-full overflow-hidden flex bg-slate-200 dark:bg-white/10">
          {config.breakdown.map((item) => (
            <div
              key={item.id}
              style={{ width: `${item.percentage}%`, backgroundColor: item.color }}
              className="h-full transition-all"
              title={`${item.label} : ${item.percentage}% ($${item.amountUsd})`}
            />
          ))}
        </div>

        {/* Grille de cartes */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {config.breakdown.map((item) => (
            <div
              key={item.id}
              className="p-3 rounded-lg bg-white dark:bg-white/5 border border-slate-200 dark:border-white/5 space-y-1.5"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <span
                    className="w-2.5 h-2.5 rounded-full inline-block"
                    style={{ backgroundColor: item.color }}
                  />
                  {item.label}
                </span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  {item.percentage}%
                </span>
              </div>
              <div className="text-lg font-bold font-mono text-slate-900 dark:text-white">
                ${item.amountUsd.toFixed(2)}
              </div>
              <div className="text-[10px] text-slate-400 font-mono flex items-center justify-between">
                <span>{(item.tokens / 1000).toLocaleString()}k tokens</span>
                <span className="flex items-center gap-0.5 text-blue-400">
                  détails <ArrowRight size={10} />
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
