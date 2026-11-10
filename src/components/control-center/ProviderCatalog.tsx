/**
 * src/components/control-center/ProviderCatalog.tsx
 *
 * Catalogue des fournisseurs d'IA pour NEXUS AI :
 * Présentation des capacités officielles, sélection du fournisseur et du modèle,
 * déclenchement des tests de connexion côté serveur et gestion sécurisée des clés API.
 */

import { useState } from 'react';
import {
  Check,
  RefreshCw,
  ExternalLink,
  ShieldAlert,
  Sliders,
  CheckCircle2,
  XCircle,
  Terminal,
  Server,
  Zap,
  Code2,
  Eye,
  Cpu,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { AI_PROVIDERS } from '@/config/aiProviders';
import type {
  AIProvider,
  AIProviderId,
  AIModel,
  AIControlCenterConfig,
  ConnectionTestResult,
  AIProviderCapability,
} from '@/types/ai';
import { ConfirmActionModal } from './ConfirmActionModal';

interface ProviderCatalogProps {
  config: AIControlCenterConfig;
  onSelectProvider: (providerId: AIProviderId, modelId: string) => void;
  onTestConnection: (providerId: AIProviderId, modelId: string) => Promise<ConnectionTestResult>;
  isTesting: boolean;
  testResult?: ConnectionTestResult;
}

export function ProviderCatalog({
  config,
  onSelectProvider,
  onTestConnection,
  isTesting,
  testResult,
}: ProviderCatalogProps) {
  const [selectedProviderId, setSelectedProviderId] = useState<AIProviderId>(
    config.activeProviderId,
  );
  const [selectedModelId, setSelectedModelId] = useState<string>(config.activeModelId);
  const [pendingSelection, setPendingSelection] = useState<{
    providerId: AIProviderId;
    modelId: string;
  } | null>(null);
  const [showUnavailable, setShowUnavailable] = useState(false);

  const operationalProviders = AI_PROVIDERS.filter((p) => p.isAvailable !== false);
  const unavailableProviders = AI_PROVIDERS.filter((p) => p.isAvailable === false);

  const currentProvider =
    AI_PROVIDERS.find((p) => p.id === selectedProviderId) || AI_PROVIDERS[0];

  const handleProviderClick = (provider: AIProvider) => {
    setSelectedProviderId(provider.id);
    setSelectedModelId(provider.defaultModelId);
  };

  const handleApplySelection = () => {
    if (selectedProviderId !== config.activeProviderId) {
      setPendingSelection({
        providerId: selectedProviderId,
        modelId: selectedModelId,
      });
    } else {
      onSelectProvider(selectedProviderId, selectedModelId);
    }
  };

  const confirmChange = () => {
    if (pendingSelection) {
      onSelectProvider(pendingSelection.providerId, pendingSelection.modelId);
      setPendingSelection(null);
    }
  };

  const renderCapabilityBadge = (cap: AIProviderCapability) => {
    switch (cap) {
      case 'code':
        return (
          <span
            key={cap}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 text-[10px] font-medium"
          >
            <Code2 size={11} /> Code
          </span>
        );
      case 'vision':
        return (
          <span
            key={cap}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-300 border border-purple-500/20 text-[10px] font-medium"
          >
            <Eye size={11} /> Vision
          </span>
        );
      case 'streaming':
        return (
          <span
            key={cap}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/20 text-[10px] font-medium"
          >
            <Zap size={11} /> Streaming
          </span>
        );
      case 'reasoning':
        return (
          <span
            key={cap}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-[10px] font-medium"
          >
            <Cpu size={11} /> Raisonnement
          </span>
        );
      case 'local_offline':
        return (
          <span
            key={cap}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-300 border border-blue-500/20 text-[10px] font-medium"
          >
            <Server size={11} /> Local / Hors-ligne
          </span>
        );
      case 'long_context':
        return (
          <span
            key={cap}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-[10px] font-medium"
          >
            Contexte Étendu
          </span>
        );
      default:
        return (
          <span
            key={cap}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/5 text-white/70 border border-white/10 text-[10px]"
          >
            {cap}
          </span>
        );
    }
  };

  const isCurrentActive =
    config.activeProviderId === selectedProviderId &&
    config.activeModelId === selectedModelId;

  return (
    <div className="space-y-6">
      {/* ── Avis de Sécurité sur les Clés API ───────────────────────────────── */}
      <div className="p-4 rounded-2xl liquid-glass liquid-glass-card border border-slate-200/80 dark:border-nexus-500/30 shadow-[0_0_20px_rgba(124,13,244,0.15)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-nexus-500/15 dark:bg-nexus-500/20 text-nexus-600 dark:text-nexus-400 border border-nexus-500/30 flex items-center justify-center shrink-0">
            <ShieldAlert size={18} />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white tracking-wide">
              Sécurité stricte des Clés API et Gestion des Secrets
            </h4>
            <p className="text-[11px] text-slate-600 dark:text-white/70 leading-relaxed mt-0.5">
              NEXUS AI ne stocke <strong>jamais</strong> de clé API dans le navigateur (pas de localStorage ni de code frontend).
              Les clés secrètes sont configurées côté serveur via des variables d'environnement (ex: <code>OPENAI_API_KEY</code>, <code>GEMINI_API_KEY</code>) ou dans votre gestionnaire de secrets cloud.
            </p>
          </div>
        </div>

        <div className="shrink-0 text-right">
          <span className="text-[10px] px-2 py-1 rounded-md bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-white/50 border border-slate-200 dark:border-white/10 font-mono">
            Conformité ISO 27001 & OWASP
          </span>
        </div>
      </div>

      {/* ── Grille des Fournisseurs Opérationnels ──────────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-white/80">
              Moteurs IA 100% Opérationnels & Validés ({operationalProviders.length})
            </h3>
          </div>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
            Testés et prêts pour la production
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {operationalProviders.map((provider) => {
            const isSelected = provider.id === selectedProviderId;
            const isActive = provider.id === config.activeProviderId;

            return (
              <div
                key={provider.id}
                onClick={() => handleProviderClick(provider)}
                className={`relative rounded-2xl p-4 sm:p-5 liquid-glass liquid-glass-card border transition-all cursor-pointer text-left flex flex-col justify-between ${
                  isSelected
                    ? 'border-cyan-500/70 dark:border-cyan-400/60 shadow-[0_0_25px_rgba(6,182,212,0.25)] ring-2 ring-cyan-500/40'
                    : 'border-slate-200/80 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: provider.badgeColor }}
                      />
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-wide">
                        {provider.name}
                      </h3>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {isActive && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 font-semibold">
                          Actif
                        </span>
                      )}
                      {provider.requiresApiKey ? (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-white/50 border border-slate-200 dark:border-white/10">
                          Clé Serveur
                        </span>
                      ) : (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border border-cyan-500/20 font-medium">
                          Sans Clé
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-white/70 leading-relaxed line-clamp-2">
                    {provider.description}
                  </p>

                  {/* Capacités documentées */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {provider.supportedCapabilities.map(renderCapabilityBadge)}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200/80 dark:border-white/6 flex items-center justify-between text-[11px] text-slate-500 dark:text-white/50">
                  <span>{provider.models.length} modèle{provider.models.length > 1 ? 's' : ''} disponible{provider.models.length > 1 ? 's' : ''}</span>
                  <a
                    href={provider.docsUrl}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1 text-cyan-600 dark:text-cyan-400 hover:text-cyan-500 dark:hover:text-cyan-300 transition-colors"
                  >
                    <span>Doc officielle</span>
                    <ExternalLink size={11} />
                  </a>
                </div>
              </div>
            );
          })}
        </div>

        {/* Fournisseurs avec crédits épuisés ou inactifs */}
        {unavailableProviders.length > 0 && (
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setShowUnavailable((prev) => !prev)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-xs font-medium text-slate-600 dark:text-white/60 border border-slate-200/80 dark:border-white/10 transition-colors cursor-pointer"
            >
              {showUnavailable ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              <span>
                {showUnavailable
                  ? 'Masquer les fournisseurs avec crédits épuisés ou non démarrés'
                  : `Afficher les fournisseurs indisponibles (${unavailableProviders.length} : OpenAI, Anthropic, Ollama)`}
              </span>
            </button>

            {showUnavailable && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-3">
                {unavailableProviders.map((provider) => {
                  const isSelected = provider.id === selectedProviderId;

                  return (
                    <div
                      key={provider.id}
                      onClick={() => handleProviderClick(provider)}
                      className={`relative rounded-2xl p-5 liquid-glass liquid-glass-card border transition-all cursor-pointer text-left flex flex-col justify-between opacity-80 hover:opacity-100 ${
                        isSelected
                          ? 'border-amber-500/70 dark:border-amber-400/60 shadow-[0_0_20px_rgba(245,158,11,0.2)] ring-2 ring-amber-500/40'
                          : 'border-slate-200/80 dark:border-white/10'
                      }`}
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <div
                              className="w-3 h-3 rounded-full shrink-0"
                              style={{ backgroundColor: provider.badgeColor }}
                            />
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-wide">
                              {provider.name}
                            </h3>
                          </div>

                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 font-semibold">
                            Crédits épuisés
                          </span>
                        </div>

                        <p className="text-xs text-amber-700 dark:text-amber-300/90 leading-relaxed font-medium">
                          {provider.unavailableReason}
                        </p>

                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {provider.supportedCapabilities.map(renderCapabilityBadge)}
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-200/80 dark:border-white/6 flex items-center justify-between text-[11px] text-slate-500 dark:text-white/50">
                        <span>{provider.models.length} modèle{provider.models.length > 1 ? 's' : ''}</span>
                        <a
                          href={provider.docsUrl}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 text-cyan-600 dark:text-cyan-400 hover:text-cyan-500 dark:hover:text-cyan-300 transition-colors"
                        >
                          <span>Recharger</span>
                          <ExternalLink size={11} />
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Fiche Détaillée & Sélection de Modèle ────────────────────────────── */}
      <div className="rounded-2xl liquid-glass liquid-glass-card border border-slate-200/80 dark:border-white/10 p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-white/8">
          <div>
            <div className="flex items-center gap-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-wide">
                Configuration : {currentProvider.name}
              </h3>
              <span className="text-xs text-slate-500 dark:text-white/60">
                {currentProvider.tagline}
              </span>
            </div>
            {currentProvider.keyEnvironmentVariable && (
              <p className="text-[11px] text-slate-500 dark:text-white/50 mt-1 flex items-center gap-1 font-mono">
                <Terminal size={12} className="text-cyan-500 dark:text-cyan-400" />
                <span>Variable d'environnement requise côté serveur : </span>
                <span className="text-cyan-600 dark:text-cyan-300 font-bold bg-slate-100 dark:bg-surface-950 px-1.5 py-0.5 rounded border border-slate-200 dark:border-white/10">
                  {currentProvider.keyEnvironmentVariable}
                </span>
              </p>
            )}
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              disabled={isTesting}
              onClick={() => onTestConnection(currentProvider.id, selectedModelId)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-white bg-slate-100/90 hover:bg-slate-200/90 dark:bg-white/10 dark:hover:bg-white/15 border border-slate-200 dark:border-white/15 hover:border-cyan-500/50 shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw size={13} className={isTesting ? 'animate-spin text-cyan-500 dark:text-cyan-300' : ''} />
              <span>Tester la connexion serveur</span>
            </button>

            <button
              type="button"
              disabled={isCurrentActive || currentProvider.isAvailable === false}
              onClick={handleApplySelection}
              className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-semibold text-white transition-all ${
                isCurrentActive
                  ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 cursor-default'
                  : currentProvider.isAvailable === false
                  ? 'bg-slate-300 dark:bg-white/5 text-slate-500 dark:text-white/40 cursor-not-allowed border border-slate-300 dark:border-white/10'
                  : 'bg-gradient-to-r from-nexus-600 to-cyan-600 hover:from-nexus-500 hover:to-cyan-500 shadow-[0_0_15px_rgba(124,13,244,0.4)] cursor-pointer'
              }`}
            >
              {isCurrentActive ? (
                <>
                  <Check size={14} />
                  <span>Actuellement sélectionné</span>
                </>
              ) : currentProvider.isAvailable === false ? (
                <>
                  <AlertCircle size={14} />
                  <span>Crédits épuisés</span>
                </>
              ) : (
                <>
                  <Sliders size={14} />
                  <span>Définir comme fournisseur actif</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Bannière d'avertissement si fournisseur indisponible */}
        {currentProvider.isAvailable === false && (
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs flex items-center gap-3">
            <AlertCircle size={18} className="text-amber-500 shrink-0" />
            <div>
              <span className="font-bold block">Fournisseur temporairement en pause</span>
              <p className="text-[11px] opacity-90 mt-0.5">{currentProvider.unavailableReason}</p>
            </div>
          </div>
        )}

        {/* Résultat du Test de Connexion Serveur */}
        {testResult && testResult.providerId === currentProvider.id && (
          <div
            className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs animate-in fade-in ${
              testResult.success
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
            }`}
          >
            <div className="flex items-start gap-2.5">
              {testResult.success ? (
                <CheckCircle2 size={18} className="text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <XCircle size={18} className="text-rose-400 shrink-0 mt-0.5" />
              )}
              <div>
                <span className="font-bold block">
                  {testResult.success ? 'Test Réussi (Vérifié côté serveur)' : 'Échec du test de connexion'}
                </span>
                <p className="text-[11px] text-white/80 mt-0.5">{testResult.message}</p>
                {testResult.maskedKeyHint && (
                  <p className="text-[10px] text-white/50 mt-1 font-mono">
                    Indice clé détectée : {testResult.maskedKeyHint}
                  </p>
                )}
              </div>
            </div>

            <div className="text-right shrink-0">
              <span className="font-mono text-[11px] font-semibold">
                {testResult.latencyMs} ms
              </span>
              <span className="block text-[10px] text-white/40">
                {new Date(testResult.timestamp).toLocaleTimeString('fr-FR')}
              </span>
            </div>
          </div>
        )}

        {/* Liste des Modèles Disponibles */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold text-white/80">
            <span>Sélectionnez un modèle autorisé :</span>
            <span className="text-[11px] text-white/50">
              {currentProvider.models.length} modèle{currentProvider.models.length > 1 ? 's' : ''} certifié{currentProvider.models.length > 1 ? 's' : ''}
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
            {currentProvider.models.map((model: AIModel) => {
              const isSelected = model.id === selectedModelId;
              const hasPricing = model.pricing !== undefined;

              return (
                <div
                  key={model.id}
                  onClick={() => setSelectedModelId(model.id)}
                  className={`p-3 sm:p-4 rounded-xl liquid-glass-card border transition-all cursor-pointer text-left flex flex-col justify-between ${
                    isSelected
                      ? 'bg-nexus-500/10 dark:bg-surface-950/90 border-cyan-500 dark:border-cyan-400/60 shadow-md ring-1 ring-cyan-500/40'
                      : 'bg-white/60 dark:bg-surface-950/50 border-slate-200/80 dark:border-white/8 hover:border-slate-300 dark:hover:border-white/20'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white tracking-wide">
                          {model.name}
                        </h4>
                        <span className="text-[10px] font-mono text-cyan-600 dark:text-cyan-400/80">
                          {model.id}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {isSelected && (
                          <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-600 dark:text-cyan-300 flex items-center justify-center">
                            <Check size={12} />
                          </span>
                        )}
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-600 dark:text-white/70 leading-relaxed">
                      {model.description}
                    </p>

                    <p className="text-[10px] text-nexus-600 dark:text-nexus-300 font-medium">
                      Recommandé : {model.recommendedFor}
                    </p>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-200/80 dark:border-white/6 flex items-center justify-between text-[10px] text-slate-500 dark:text-white/50">
                    <div>
                      <span>Contexte : </span>
                      <span className="font-mono text-slate-800 dark:text-white/80 font-medium">
                        {(model.contextWindow / 1000).toLocaleString('fr-FR')}k tokens
                      </span>
                    </div>

                    {hasPricing && model.pricing ? (
                      <div>
                        {model.pricing.inputPerMillionTokens === 0 ? (
                          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Gratuit / Inclus</span>
                        ) : (
                          <span className="font-mono text-slate-700 dark:text-white/70">
                            ${model.pricing.inputPerMillionTokens} / ${model.pricing.outputPerMillionTokens} par M
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-400 dark:text-white/40 italic">Tarif selon déploiement</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Modale de Confirmation de Changement de Fournisseur */}
      <ConfirmActionModal
        isOpen={Boolean(pendingSelection)}
        title="Changer de fournisseur actif"
        message={`Êtes-vous sûr de vouloir basculer vers ${pendingSelection?.providerId} (${pendingSelection?.modelId}) pour les requêtes de l'application ?`}
        confirmLabel="Bascule vers ce fournisseur"
        onConfirm={confirmChange}
        onCancel={() => setPendingSelection(null)}
      />
    </div>
  );
}
