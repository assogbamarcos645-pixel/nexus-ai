/**
 * src/components/control-center/DashboardOverview.tsx
 *
 * Tableau de bord du Centre de Contrôle :
 * Vue d'ensemble de l'état du moteur IA, du fournisseur et du modèle actifs,
 * des statistiques fiables réelles, des erreurs récentes sanitisées et de la santé des services.
 */

import {
  Cpu,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Activity,
  Layers,
  Database,
  ShieldCheck,
  HardDrive,
  RefreshCw,
  ArrowRight,
  Sparkles,
  Zap,
} from 'lucide-react';
import type {
  AIControlCenterConfig,
  AIUsageSummary,
  AITelemetryLog,
  AIServiceHealth,
} from '@/types/ai';
import { getProviderById, getModelById } from '@/config/aiProviders';
import { computeEngineStatus } from '@/services/ai/aiConfigService';

interface DashboardOverviewProps {
  config: AIControlCenterConfig;
  usageSummary: AIUsageSummary;
  recentLogs: AITelemetryLog[];
  servicesHealth: AIServiceHealth[];
  isTesting: boolean;
  onRunTest: () => void;
  onNavigateTab: (tabId: 'providers' | 'usage' | 'settings') => void;
}

export function DashboardOverview({
  config,
  usageSummary,
  recentLogs,
  servicesHealth,
  isTesting,
  onRunTest,
  onNavigateTab,
}: DashboardOverviewProps) {
  const engineStatus = computeEngineStatus(config, isTesting);
  const activeProvider = getProviderById(config.activeProviderId);
  const activeModel = getModelById(config.activeProviderId, config.activeModelId);

  // Filtrer les erreurs récentes sans informations sensibles
  const recentErrors = recentLogs
    .filter((log) => !log.success && log.error)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* ── 1. État Principal du Moteur IA ──────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl liquid-glass liquid-glass-card border border-white/12 p-6 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-nexus-600/10 via-cyan-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${
                engineStatus.status === 'operational'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.25)]'
                  : engineStatus.status === 'unavailable'
                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30 shadow-[0_0_20px_rgba(244,63,94,0.25)]'
                    : 'bg-amber-500/20 text-amber-400 border border-amber-500/30 shadow-[0_0_20px_rgba(245,158,11,0.25)]'
              }`}
            >
              {engineStatus.status === 'operational' ? (
                <CheckCircle2 size={28} />
              ) : engineStatus.status === 'unavailable' ? (
                <XCircle size={28} />
              ) : isTesting ? (
                <RefreshCw size={28} className="animate-spin text-cyan-400" />
              ) : (
                <AlertTriangle size={28} />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-lg font-bold text-white tracking-wide">
                  État du Moteur IA
                </h2>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider border ${
                    engineStatus.status === 'operational'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : engineStatus.status === 'unavailable'
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                        : isTesting
                          ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 animate-pulse'
                          : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  }`}
                >
                  {engineStatus.status === 'operational'
                    ? 'Opérationnel'
                    : engineStatus.status === 'unavailable'
                      ? 'Indisponible'
                      : isTesting
                        ? 'Vérification...'
                        : 'Non configuré'}
                </span>
              </div>
              <p className="text-xs text-white/70 mt-1 max-w-2xl leading-relaxed">
                {engineStatus.description}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={onRunTest}
              disabled={isTesting}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-white/10 hover:bg-white/15 border border-white/15 hover:border-cyan-400/50 shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw size={14} className={isTesting ? 'animate-spin text-cyan-300' : ''} />
              <span>Tester la connectivité</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigateTab('providers')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-nexus-600 to-cyan-600 hover:from-nexus-500 hover:to-cyan-500 shadow-[0_0_15px_rgba(124,13,244,0.35)] transition-all cursor-pointer"
            >
              <span>Gérer les fournisseurs</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* ── 2. Grille Fournisseur Actif & Métriques Fiables ──────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        {/* Fournisseur et Modèle Actifs */}
        <div className="rounded-2xl liquid-glass liquid-glass-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-nexus-300 uppercase tracking-wider">
              <Cpu size={15} />
              <span>Fournisseur & Modèle</span>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('providers')}
              className="text-[11px] text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer"
            >
              Modifier
            </button>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-white">
                {activeProvider?.name || 'Non défini'}
              </span>
              {activeProvider?.id === 'demo' && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 font-medium">
                  Simulation
                </span>
              )}
            </div>
            <p className="text-xs text-white/60 mt-0.5">
              {activeProvider?.tagline || 'Aucun fournisseur configuré.'}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-surface-950/70 border border-white/6 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-white/50">Modèle actif :</span>
              <span className="text-white font-mono font-medium text-[11px]">
                {activeModel?.name || config.activeModelId}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-white/50">Contexte max :</span>
              <span className="text-cyan-300 font-mono text-[11px]">
                {activeModel
                  ? `${(activeModel.contextWindow / 1000).toLocaleString('fr-FR')}k tokens`
                  : 'N/A'}
              </span>
            </div>
          </div>
        </div>

        {/* Compteur de Requêtes Réelles */}
        <div className="rounded-2xl liquid-glass liquid-glass-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-cyan-300 uppercase tracking-wider">
              <Activity size={15} />
              <span>Requêtes Effectuées</span>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('usage')}
              className="text-[11px] text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer"
            >
              Détails
            </button>
          </div>

          {usageSummary.totalRequests > 0 ? (
            <div className="space-y-3">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-white">
                  {usageSummary.totalRequests}
                </span>
                <span className="text-xs text-white/50">requêtes enregistrées</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                  <span className="text-emerald-400 block font-bold text-sm">
                    {usageSummary.successfulRequests}
                  </span>
                  <span className="text-white/60 text-[10px]">Succès</span>
                </div>
                <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20">
                  <span className="text-rose-400 block font-bold text-sm">
                    {usageSummary.failedRequests}
                  </span>
                  <span className="text-white/60 text-[10px]">Échecs</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-white/60 pt-1">
                <span>Latence moyenne :</span>
                <span className="font-mono text-cyan-300 font-semibold">
                  {usageSummary.averageLatencyMs} ms
                </span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-4 text-center space-y-2">
              <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/40">
                <Activity size={16} />
              </div>
              <p className="text-xs font-medium text-white/70">
                Aucune requête enregistrée
              </p>
              <p className="text-[10px] text-white/40 max-w-[200px]">
                Les statistiques fiables apparaîtront dès votre première conversation avec un agent.
              </p>
            </div>
          )}
        </div>

        {/* Paramètres Clés Actifs */}
        <div className="rounded-2xl liquid-glass liquid-glass-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-purple-300 uppercase tracking-wider">
              <Zap size={15} />
              <span>Paramètres Moteur</span>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('settings')}
              className="text-[11px] text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer"
            >
              Ajuster
            </button>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between p-2 rounded-lg bg-surface-950/50">
              <span className="text-white/60">Longueur max réponse :</span>
              <span className="font-mono text-white font-medium">
                {config.settings.maxTokens} tokens
              </span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-lg bg-surface-950/50">
              <span className="text-white/60">Température créative :</span>
              <span className="font-mono text-white font-medium">
                {config.settings.temperature}
              </span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-lg bg-surface-950/50">
              <span className="text-white/60">Délai d'attente max :</span>
              <span className="font-mono text-white font-medium">
                {config.settings.timeoutSeconds} s
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── 3. Santé des Services Associés à NEXUS AI ───────────────────────── */}
      <div className="rounded-2xl bg-surface-900/70 border border-white/10 p-5 backdrop-blur-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers size={16} className="text-cyan-400" />
            <h3 className="text-sm font-bold text-white tracking-wide">
              Services Associés à NEXUS AI
            </h3>
          </div>
          <span className="text-[11px] text-white/50">Surveillance temps réel</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {servicesHealth.map((service) => {
            let icon = <Cpu size={16} />;
            if (service.category === 'cloud_database') icon = <Database size={16} />;
            if (service.category === 'cloud_auth') icon = <ShieldCheck size={16} />;
            if (service.category === 'local_storage') icon = <HardDrive size={16} />;

            const isOperational = service.status === 'operational';
            const isUnavailable = service.status === 'unavailable';

            return (
              <div
                key={service.id}
                className="p-3.5 rounded-xl bg-surface-950/70 border border-white/8 space-y-2 flex flex-col justify-between"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 text-white/80">
                    <span className="text-nexus-400">{icon}</span>
                    <span className="text-xs font-semibold line-clamp-1">{service.name}</span>
                  </div>
                  <span
                    className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                      isOperational
                        ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]'
                        : isUnavailable
                          ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]'
                          : 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]'
                    }`}
                  />
                </div>

                <p className="text-[11px] text-white/60 leading-tight">
                  {service.detail}
                </p>

                <div className="flex items-center justify-between text-[10px] text-white/40 pt-1 border-t border-white/5">
                  <span className="capitalize">{service.status.replace('_', ' ')}</span>
                  <span>{new Date(service.lastChecked).toLocaleTimeString('fr-FR')}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── 4. Erreurs Récentes du Moteur IA (Sanitisées) ────────────────────── */}
      <div className="rounded-2xl bg-surface-900/70 border border-white/10 p-5 backdrop-blur-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} className="text-amber-400" />
            <h3 className="text-sm font-bold text-white tracking-wide">
              Journal des Erreurs Récentes (Assaini)
            </h3>
          </div>
          <span className="text-[11px] text-white/50">
            {recentErrors.length} anomalie{recentErrors.length > 1 ? 's' : ''} répertoriée{recentErrors.length > 1 ? 's' : ''}
          </span>
        </div>

        {recentErrors.length > 0 ? (
          <div className="space-y-2">
            {recentErrors.map((errLog) => (
              <div
                key={errLog.id}
                className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-rose-300">
                      {errLog.providerId} • {errLog.modelId}
                    </span>
                    {errLog.statusCode && (
                      <span className="px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 font-mono text-[10px]">
                        HTTP {errLog.statusCode}
                      </span>
                    )}
                  </div>
                  <p className="text-white/80 font-mono text-[11px]">
                    {errLog.error}
                  </p>
                </div>
                <span className="text-white/40 text-[10px] shrink-0">
                  {new Date(errLog.timestamp).toLocaleString('fr-FR')}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 rounded-xl bg-surface-950/50 border border-white/5 flex items-center justify-center gap-2 text-center text-xs text-white/50">
            <Sparkles size={16} className="text-emerald-400" />
            <span>Aucune erreur récente. Le moteur IA fonctionne de manière stable et fiable.</span>
          </div>
        )}
      </div>
    </div>
  );
}

