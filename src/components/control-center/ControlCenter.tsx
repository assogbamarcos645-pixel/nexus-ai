/**
 * src/components/control-center/ControlCenter.tsx
 *
 * Page principale du « Centre de Contrôle » de NEXUS AI.
 * Permet de piloter le moteur IA, de gérer le catalogue de fournisseurs,
 * de consulter les métriques réelles d'utilisation et d'ajuster les paramètres avancés.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Sliders,
  Cpu,
  Activity,
  Layers,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import type {
  AIControlCenterConfig,
  AIProviderId,
  AIAdvancedSettings,
  ConnectionTestResult,
  AIServiceHealth,
  AITelemetryLog,
  AIUsageSummary,
} from '@/types/ai';
import {
  getAIConfig,
  saveAIConfig,
  testProviderConnection,
  getServicesHealth,
  computeEngineStatus,
} from '@/services/ai/aiConfigService';
import {
  getTelemetryLogs,
  getUsageSummary,
  clearTelemetryLogs,
} from '@/services/ai/aiTelemetryService';
import { useAuth } from '@/hooks/useAuth';
import { AuthGate } from '@/components/auth/AuthGate';
import { DashboardOverview } from './DashboardOverview';
import { ProviderCatalog } from './ProviderCatalog';
import { UsageTracker } from './UsageTracker';
import { AdvancedSettings } from './AdvancedSettings';

export type ControlCenterTab = 'dashboard' | 'providers' | 'usage' | 'settings';

interface ControlCenterProps {
  onOpenAuth?: () => void;
}

export function ControlCenter({ onOpenAuth }: ControlCenterProps) {
  const { isAuthenticated, isConfigured } = useAuth();
  const [activeTab, setActiveTab] = useState<ControlCenterTab>('dashboard');
  const [config, setConfig] = useState<AIControlCenterConfig>(getAIConfig());
  const [logs, setLogs] = useState<AITelemetryLog[]>(getTelemetryLogs());
  const [usageSummary, setUsageSummary] = useState<AIUsageSummary>(
    getUsageSummary(getTelemetryLogs()),
  );
  const [servicesHealth, setServicesHealth] = useState<AIServiceHealth[]>([]);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<ConnectionTestResult | undefined>(
    config.lastTestResult,
  );

  // Rafraîchir les services et les métriques
  const refreshData = useCallback(async () => {
    const currentConfig = getAIConfig();
    const currentLogs = getTelemetryLogs();
    setConfig(currentConfig);
    setLogs(currentLogs);
    setUsageSummary(getUsageSummary(currentLogs));
    const health = await getServicesHealth(currentConfig);
    setServicesHealth(health);
  }, []);

  useEffect(() => {
    let isMounted = true;
    getServicesHealth(config).then((health) => {
      if (isMounted) {
        setServicesHealth(health);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [config]);

  // Exécution du test de connectivité
  const handleTestConnection = async (
    providerId: AIProviderId,
    modelId: string,
  ): Promise<ConnectionTestResult> => {
    setIsTesting(true);
    try {
      const result = await testProviderConnection(providerId, modelId);
      setTestResult(result);
      setConfig(getAIConfig());
      await refreshData();
      return result;
    } finally {
      setIsTesting(false);
    }
  };

  // Sélection d'un fournisseur et modèle
  const handleSelectProvider = (providerId: AIProviderId, modelId: string) => {
    const updated = saveAIConfig({
      activeProviderId: providerId,
      activeModelId: modelId,
    });
    setConfig(updated);
    refreshData();
  };

  // Sauvegarde des paramètres avancés
  const handleSaveSettings = (settings: AIAdvancedSettings) => {
    const updated = saveAIConfig({ settings });
    setConfig(updated);
    refreshData();
  };

  // Effacer les journaux
  const handleClearLogs = () => {
    clearTelemetryLogs();
    setLogs([]);
    setUsageSummary(getUsageSummary([]));
  };

  const engineStatus = computeEngineStatus(config, isTesting);

  return (
    <div className="flex-1 flex flex-col overflow-y-auto bg-transparent text-slate-900 dark:text-white select-none legacy-theme">
      {/* ── En-tête du Centre de Contrôle ────────────────────────────────────── */}
      <div className="border-b border-slate-200/80 dark:border-white/10 liquid-glass px-3.5 sm:px-6 py-3.5 sm:py-5 shrink-0">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-nexus-600 via-purple-600 to-cyan-500 flex items-center justify-center text-white shadow-[0_0_25px_rgba(124,13,244,0.45)]">
              <Sliders size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-extrabold text-slate-900 dark:text-white tracking-wide">
                  Centre de Contrôle IA
                </h1>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-300 border border-cyan-500/20 font-mono">
                  Système
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-white/60 mt-0.5">
                Configuration des fournisseurs d'IA, gouvernance des modèles et télémétrie d'utilisation.
              </p>
            </div>
          </div>

          {/* Badge État du Moteur en direct */}
          <div className="flex items-center gap-3">
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold backdrop-blur-md ${
                engineStatus.status === 'operational'
                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border-emerald-500/30'
                  : engineStatus.status === 'unavailable'
                    ? 'bg-rose-500/15 text-rose-600 dark:text-rose-300 border-rose-500/30'
                    : isTesting
                      ? 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-300 border-cyan-500/30 animate-pulse'
                      : 'bg-amber-500/15 text-amber-600 dark:text-amber-300 border-amber-500/30'
              }`}
            >
              {engineStatus.status === 'operational' ? (
                <CheckCircle2 size={14} className="text-emerald-500 dark:text-emerald-400" />
              ) : engineStatus.status === 'unavailable' ? (
                <XCircle size={14} className="text-rose-500 dark:text-rose-400" />
              ) : isTesting ? (
                <RefreshCw size={14} className="animate-spin text-cyan-500 dark:text-cyan-300" />
              ) : (
                <AlertTriangle size={14} className="text-amber-500 dark:text-amber-400" />
              )}
              <span>
                Moteur IA :{' '}
                {engineStatus.status === 'operational'
                  ? 'Opérationnel'
                  : engineStatus.status === 'unavailable'
                    ? 'Indisponible'
                    : isTesting
                      ? 'Test en cours...'
                      : 'Non configuré'}
              </span>
            </div>

            <button
              type="button"
              onClick={refreshData}
              title="Actualiser les métriques et l'état des services"
              className="p-2 rounded-xl bg-slate-100/80 dark:bg-white/5 hover:bg-slate-200/80 dark:hover:bg-white/10 text-slate-600 dark:text-white/70 hover:text-slate-900 dark:hover:text-white border border-slate-200/80 dark:border-white/10 transition-colors cursor-pointer"
            >
              <RefreshCw size={15} />
            </button>
          </div>
        </div>

        {/* ── Navigation par Onglets en Liquid Glass Capsule ───────────────── */}
        <div className="max-w-7xl mx-auto mt-4 sm:mt-6 flex items-center gap-1.5 p-1 liquid-glass-pill overflow-x-auto no-scrollbar w-full sm:w-fit">
          <button
            type="button"
            onClick={() => setActiveTab('dashboard')}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap',
              activeTab === 'dashboard'
                ? 'bg-gradient-to-r from-nexus-600 to-cyan-600 text-white shadow-[0_0_15px_rgba(124,13,244,0.35)]'
                : 'text-slate-600 dark:text-white/60 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-white/5',
            )}
          >
            <Cpu size={14} />
            <span>Vue d'ensemble</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('providers')}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap',
              activeTab === 'providers'
                ? 'bg-gradient-to-r from-nexus-600 to-cyan-600 text-white shadow-[0_0_15px_rgba(124,13,244,0.35)]'
                : 'text-slate-600 dark:text-white/60 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-white/5',
            )}
          >
            <Layers size={14} />
            <span>Fournisseurs & Modèles</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('usage')}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap',
              activeTab === 'usage'
                ? 'bg-gradient-to-r from-nexus-600 to-cyan-600 text-white shadow-[0_0_15px_rgba(124,13,244,0.35)]'
                : 'text-slate-600 dark:text-white/60 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-white/5',
            )}
          >
            <Activity size={14} />
            <span>Suivi d'utilisation</span>
            {usageSummary.totalRequests > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-white/20 text-slate-800 dark:text-white font-mono">
                {usageSummary.totalRequests}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap',
              activeTab === 'settings'
                ? 'bg-gradient-to-r from-nexus-600 to-cyan-600 text-white shadow-[0_0_15px_rgba(124,13,244,0.35)]'
                : 'text-slate-600 dark:text-white/60 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-white/5',
            )}
          >
            <Sliders size={14} />
            <span>Paramètres avancés</span>
          </button>
        </div>
      </div>

      {/* ── Contenu Principal de l'Onglet Actif ─────────────────────────────── */}
      <div className="flex-1 p-3 sm:p-6">
        <div className="max-w-7xl mx-auto">
          {isConfigured && !isAuthenticated ? (
            <div className="py-12">
              <AuthGate
                title="Accès au Centre de Contrôle réservé aux administrateurs"
                description="La gouvernance des modèles IA, la configuration des fournisseurs et la télémétrie de production sont protégées. Veuillez vous authentifier pour accéder à ce tableau de bord."
                onOpenAuth={onOpenAuth ?? (() => {})}
              />
            </div>
          ) : (
            <>
              {!isConfigured && (
                <div className="mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-3 text-amber-200">
                  <AlertTriangle size={18} className="text-amber-400 shrink-0 mt-0.5" />
                  <div className="text-xs leading-relaxed">
                    <span className="font-semibold text-amber-300">Mode Local & Démonstration :</span>{' '}
                    Aucun service cloud Supabase n'est connecté. Les réglages et métriques sont stockés localement dans votre navigateur. Pour un déploiement public sécurisé, configurez les variables d'environnement Supabase afin de restreindre ce panneau administratif.
                  </div>
                </div>
              )}

              {activeTab === 'dashboard' && (
                <DashboardOverview
                  config={config}
                  usageSummary={usageSummary}
                  recentLogs={logs}
                  servicesHealth={servicesHealth}
                  isTesting={isTesting}
                  onRunTest={() =>
                    handleTestConnection(config.activeProviderId, config.activeModelId)
                  }
                  onNavigateTab={(tab) => setActiveTab(tab)}
                />
              )}

              {activeTab === 'providers' && (
                <ProviderCatalog
                  config={config}
                  onSelectProvider={handleSelectProvider}
                  onTestConnection={handleTestConnection}
                  isTesting={isTesting}
                  testResult={testResult}
                />
              )}

              {activeTab === 'usage' && (
                <UsageTracker
                  summary={usageSummary}
                  logs={logs}
                  onClearLogs={handleClearLogs}
                />
              )}

              {activeTab === 'settings' && (
                <AdvancedSettings
                  settings={config.settings}
                  onSaveSettings={handleSaveSettings}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
