/**
 * src/components/control-center/UsageTracker.tsx
 *
 * Suivi d'utilisation et métriques pour le moteur IA de NEXUS AI :
 * Comptabilisation des requêtes réussies/échouées, latence, consommation de jetons,
 * estimation rigoureuse des coûts (uniquement si tarifs connus) et journal d'activité assaini.
 */

import { useState } from 'react';
import {
  Activity,
  CheckCircle2,
  XCircle,
  Clock,
  Coins,
  Trash2,
  PieChart,
  Layers,
} from 'lucide-react';
import type { AIUsageSummary, AITelemetryLog } from '@/types/ai';
import { ConfirmActionModal } from './ConfirmActionModal';

interface UsageTrackerProps {
  summary: AIUsageSummary;
  logs: AITelemetryLog[];
  onClearLogs: () => void;
}

export function UsageTracker({
  summary,
  logs,
  onClearLogs,
}: UsageTrackerProps) {
  const [isConfirmClearOpen, setIsConfirmClearOpen] = useState(false);
  const [filterSuccess, setFilterSuccess] = useState<'all' | 'success' | 'failed'>('all');

  const filteredLogs = logs.filter((log) => {
    if (filterSuccess === 'success') return log.success;
    if (filterSuccess === 'failed') return !log.success;
    return true;
  });

  const successRate =
    summary.totalRequests > 0
      ? Math.round((summary.successfulRequests / summary.totalRequests) * 100)
      : 100;

  return (
    <div className="space-y-6">
      {/* ── Bannière de Distinction Réel vs Simulation ──────────────────────── */}
      <div className="p-4 rounded-2xl liquid-glass liquid-glass-card border border-slate-200/80 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 flex items-center justify-center shrink-0">
            <Activity size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white tracking-wide">
                Provenance des données d'utilisation
              </h4>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${
                  summary.hasRealData
                    ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                    : 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30'
                }`}
              >
                {summary.hasRealData ? 'Inférence Réelle Détectée' : 'Mode Simulation / Local'}
              </span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-white/60 leading-relaxed mt-0.5">
              {summary.hasRealData
                ? 'Ces statistiques reflètent fidèlement les appels réels traités par le proxy d’inférence côté serveur.'
                : 'Les requêtes actuelles proviennent du simulateur local de NEXUS AI (coût nul, latence émulée).'}
            </p>
          </div>
        </div>

        {logs.length > 0 && (
          <button
            type="button"
            onClick={() => setIsConfirmClearOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-rose-600 dark:text-rose-300 hover:text-white bg-rose-500/10 hover:bg-rose-500 border border-rose-500/20 transition-all cursor-pointer shrink-0"
          >
            <Trash2 size={13} />
            <span>Effacer le journal</span>
          </button>
        )}
      </div>

      {/* ── Cartes KPIs Principales ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Requêtes Totales */}
        <div className="rounded-2xl liquid-glass liquid-glass-card border border-slate-200/80 dark:border-white/10 p-4 space-y-1">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-white/50 uppercase tracking-wider block">
            Volume de Requêtes
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {summary.totalRequests}
            </span>
            <span className="text-[11px] text-slate-500 dark:text-white/40">appels</span>
          </div>
          <div className="text-[10px] text-slate-600 dark:text-white/60 flex items-center gap-1.5 pt-1">
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{summary.successfulRequests} réussis</span>
            <span>•</span>
            <span className="text-rose-600 dark:text-rose-400 font-semibold">{summary.failedRequests} échecs</span>
          </div>
        </div>

        {/* Taux de Succès */}
        <div className="rounded-2xl liquid-glass liquid-glass-card border border-slate-200/80 dark:border-white/10 p-4 space-y-1">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-white/50 uppercase tracking-wider block">
            Taux de Succès
          </span>
          <div className="flex items-baseline gap-2">
            <span
              className={`text-2xl font-extrabold ${
                successRate >= 95
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : successRate >= 80
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {summary.totalRequests > 0 ? `${successRate}%` : 'N/A'}
            </span>
          </div>
          <div className="text-[10px] text-slate-500 dark:text-white/50 pt-1">
            {summary.totalRequests > 0 ? 'Fiabilité du moteur mesurée' : 'En attente de requêtes'}
          </div>
        </div>

        {/* Latence Moyenne */}
        <div className="rounded-2xl liquid-glass liquid-glass-card border border-slate-200/80 dark:border-white/10 p-4 space-y-1">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-white/50 uppercase tracking-wider block">
            Latence Moyenne
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-cyan-600 dark:text-cyan-300 font-mono">
              {summary.averageLatencyMs}
            </span>
            <span className="text-[11px] text-slate-500 dark:text-white/40">ms</span>
          </div>
          <div className="text-[10px] text-slate-500 dark:text-white/50 pt-1 flex items-center gap-1">
            <Clock size={11} className="text-cyan-500 dark:text-cyan-400" />
            <span>Temps de réponse moyen</span>
          </div>
        </div>

        {/* Coût Estimé Réel */}
        <div className="rounded-2xl liquid-glass liquid-glass-card border border-slate-200/80 dark:border-white/10 p-4 space-y-1">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-white/50 uppercase tracking-wider block">
            Coût Estimé (USD)
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono">
              {summary.estimatedTotalCostUsd !== null
                ? `$${summary.estimatedTotalCostUsd.toFixed(4)}`
                : '0,00 $'}
            </span>
          </div>
          <div className="text-[10px] text-slate-500 dark:text-white/50 pt-1 flex items-center gap-1">
            <Coins size={11} className="text-amber-500 dark:text-amber-400" />
            <span>
              {summary.estimatedTotalCostUsd !== null
                ? 'Tarifs officiels'
                : 'Mode Gratuit / Local'}
            </span>
          </div>
        </div>
      </div>

      {/* ── Consommation de Jetons (Tokens) ─────────────────────────────────── */}
      <div className="rounded-2xl liquid-glass liquid-glass-card border border-slate-200/80 dark:border-white/10 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-900 dark:text-white tracking-wide">
            <Coins size={16} className="text-amber-500 dark:text-amber-400" />
            <span>Consommation de Jetons (Tokens)</span>
          </div>
          <span className="text-xs font-mono text-cyan-600 dark:text-cyan-300 font-bold">
            Total : {summary.totalTokens.toLocaleString('fr-FR')} tokens
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-3.5 rounded-xl bg-slate-100/80 dark:bg-surface-950/70 border border-slate-200/80 dark:border-white/6 space-y-1">
            <span className="text-[11px] text-slate-600 dark:text-white/60">Tokens d'entrée (Prompt) :</span>
            <span className="text-lg font-bold text-slate-900 dark:text-white block font-mono">
              {summary.promptTokens.toLocaleString('fr-FR')}
            </span>
            <p className="text-[10px] text-slate-500 dark:text-white/40">Instructions, historique et contexte système</p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-100/80 dark:bg-surface-950/70 border border-slate-200/80 dark:border-white/6 space-y-1">
            <span className="text-[11px] text-slate-600 dark:text-white/60">Tokens de sortie (Complétion) :</span>
            <span className="text-lg font-bold text-emerald-600 dark:text-emerald-300 block font-mono">
              {summary.completionTokens.toLocaleString('fr-FR')}
            </span>
            <p className="text-[10px] text-slate-500 dark:text-white/40">Réponses générées par l'agent IA</p>
          </div>
        </div>
      </div>

      {/* ── Répartition par Fournisseur & Modèle ────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Par Fournisseur */}
        <div className="rounded-2xl bg-surface-900/70 border border-white/10 p-5 backdrop-blur-xl space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-white tracking-wide">
            <Layers size={15} className="text-nexus-400" />
            <span>Répartition par Fournisseur</span>
          </div>

          {Object.keys(summary.byProvider).length > 0 ? (
            <div className="space-y-2">
              {Object.entries(summary.byProvider).map(([providerId, count]) => {
                const pct = Math.round((count / summary.totalRequests) * 100);
                return (
                  <div key={providerId} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-white capitalize font-medium">{providerId}</span>
                      <span className="text-white/60 font-mono">{count} ({pct}%)</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-surface-950 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-nexus-500 to-cyan-500 rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-white/40 italic py-2">Aucune donnée disponible</p>
          )}
        </div>

        {/* Par Modèle */}
        <div className="rounded-2xl bg-surface-900/70 border border-white/10 p-5 backdrop-blur-xl space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-white tracking-wide">
            <PieChart size={15} className="text-cyan-400" />
            <span>Répartition par Modèle</span>
          </div>

          {Object.keys(summary.byModel).length > 0 ? (
            <div className="space-y-2">
              {Object.entries(summary.byModel).map(([modelId, count]) => {
                const pct = Math.round((count / summary.totalRequests) * 100);
                return (
                  <div key={modelId} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-white font-mono text-[11px] truncate max-w-[200px]">{modelId}</span>
                      <span className="text-white/60 font-mono">{count} ({pct}%)</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-surface-950 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-white/40 italic py-2">Aucune donnée disponible</p>
          )}
        </div>
      </div>

      {/* ── Journal d'Activité Détaillé ─────────────────────────────────────── */}
      <div className="rounded-2xl bg-surface-900/70 border border-white/10 p-5 backdrop-blur-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Activity size={16} className="text-nexus-400" />
            <h3 className="text-sm font-bold text-white tracking-wide">
              Journal d'Activité Récent
            </h3>
          </div>

          {/* Filtres */}
          <div className="flex items-center gap-1.5 bg-surface-950 p-1 rounded-xl border border-white/6">
            <button
              type="button"
              onClick={() => setFilterSuccess('all')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all cursor-pointer ${
                filterSuccess === 'all'
                  ? 'bg-white/10 text-white'
                  : 'text-white/50 hover:text-white'
              }`}
            >
              Tous ({logs.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterSuccess('success')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all cursor-pointer ${
                filterSuccess === 'success'
                  ? 'bg-emerald-500/20 text-emerald-300'
                  : 'text-white/50 hover:text-white'
              }`}
            >
              Succès ({summary.successfulRequests})
            </button>
            <button
              type="button"
              onClick={() => setFilterSuccess('failed')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all cursor-pointer ${
                filterSuccess === 'failed'
                  ? 'bg-rose-500/20 text-rose-300'
                  : 'text-white/50 hover:text-white'
              }`}
            >
              Échecs ({summary.failedRequests})
            </button>
          </div>
        </div>

        {filteredLogs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/8 text-white/50 font-semibold text-[11px]">
                  <th className="py-2.5 px-3">Date & Heure</th>
                  <th className="py-2.5 px-3">Fournisseur & Modèle</th>
                  <th className="py-2.5 px-3">Agent</th>
                  <th className="py-2.5 px-3 text-right">Durée</th>
                  <th className="py-2.5 px-3 text-right">Tokens</th>
                  <th className="py-2.5 px-3 text-center">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-2.5 px-3 text-white/70 font-mono text-[11px] whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString('fr-FR')}
                    </td>
                    <td className="py-2.5 px-3 font-medium text-white whitespace-nowrap">
                      <span className="capitalize">{log.providerId}</span>
                      <span className="text-white/40 mx-1.5">•</span>
                      <span className="font-mono text-cyan-300 text-[11px]">{log.modelId}</span>
                    </td>
                    <td className="py-2.5 px-3 text-white/70 capitalize">
                      {log.agentId}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-white/80 whitespace-nowrap">
                      {log.durationMs} ms
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-white/80 whitespace-nowrap">
                      {log.tokens?.totalTokens ?? 0}
                    </td>
                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      {log.success ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-semibold border border-emerald-500/30">
                          <CheckCircle2 size={11} /> Succès
                        </span>
                      ) : (
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-[10px] font-semibold border border-rose-500/30"
                          title={log.error}
                        >
                          <XCircle size={11} /> Échec
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center space-y-2">
            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/40 mx-auto">
              <Activity size={20} />
            </div>
            <h4 className="text-xs font-bold text-white">
              Aucune requête enregistrée dans le journal
            </h4>
            <p className="text-[11px] text-white/50 max-w-sm mx-auto">
              Envoyez un message dans NEXUS CHAT ou effectuez une demande de code dans NEXUS LAB pour commencer à collecter des métriques réelles.
            </p>
          </div>
        )}
      </div>

      {/* Confirmation de suppression du journal */}
      <ConfirmActionModal
        isOpen={isConfirmClearOpen}
        title="Effacer le journal d'activité"
        message="Cette action supprimera définitivement l'ensemble des statistiques et métriques locales enregistrées. Cette opération est irréversible."
        confirmLabel="Effacer définitivement"
        isDestructive={true}
        onConfirm={() => {
          onClearLogs();
          setIsConfirmClearOpen(false);
        }}
        onCancel={() => setIsConfirmClearOpen(false)}
      />
    </div>
  );
}
