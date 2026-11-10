/**
 * src/components/control-center/AdvancedSettings.tsx
 *
 * Paramètres avancés pour le moteur IA de NEXUS AI :
 * Longueur max des réponses, température, délais d'attente, fonctionnalités expérimentales,
 * commutateur Mode Démonstration et validation sécurisée côté serveur.
 */

import { useState } from 'react';
import {
  ShieldCheck,
  Zap,
  Save,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import type { AIAdvancedSettings } from '@/types/ai';
import { DEFAULT_AI_SETTINGS } from '@/config/aiProviders';
import { sanitizeAdvancedSettings } from '@/services/ai/aiConfigService';
import { useAuth } from '@/hooks/useAuth';
import { ConfirmActionModal } from './ConfirmActionModal';

interface AdvancedSettingsProps {
  settings: AIAdvancedSettings;
  onSaveSettings: (settings: AIAdvancedSettings) => void;
}

export function AdvancedSettings({
  settings: initialSettings,
  onSaveSettings,
}: AdvancedSettingsProps) {
  const { user, isAuthenticated, isConfigured: isCloudConfigured } = useAuth();
  const [form, setForm] = useState<AIAdvancedSettings>({ ...initialSettings });
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  const handleMaxTokensChange = (val: number) => {
    setForm((prev) => ({
      ...prev,
      maxTokens: Math.min(8192, Math.max(128, val)),
    }));
  };

  const handleTemperatureChange = (val: number) => {
    setForm((prev) => ({
      ...prev,
      temperature: Math.min(2.0, Math.max(0.0, Number(val.toFixed(2)))),
    }));
  };

  const handleTimeoutChange = (val: number) => {
    setForm((prev) => ({
      ...prev,
      timeoutSeconds: Math.min(120, Math.max(5, val)),
    }));
  };

  const handleToggleExperimental = (
    key: keyof AIAdvancedSettings['experimentalFeatures'],
  ) => {
    setForm((prev) => ({
      ...prev,
      experimentalFeatures: {
        ...prev.experimentalFeatures,
        [key]: !prev.experimentalFeatures[key],
      },
    }));
  };

  const handleSave = () => {
    const validated = sanitizeAdvancedSettings(form);
    onSaveSettings(validated);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleResetDefaults = () => {
    setForm({ ...DEFAULT_AI_SETTINGS });
    onSaveSettings({ ...DEFAULT_AI_SETTINGS });
    setIsResetConfirmOpen(false);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* ── Contrôle des Autorisations Administrateur ───────────────────────── */}
      <div className="p-4 rounded-2xl liquid-glass liquid-glass-card border border-slate-200/80 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-nexus-500/10 text-nexus-600 dark:text-nexus-400 border border-nexus-500/20 flex items-center justify-center shrink-0">
            <ShieldCheck size={18} />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white tracking-wide">
              {isCloudConfigured && isAuthenticated
                ? `Connecté en tant qu'administrateur (${user?.fullName || user?.email})`
                : 'Mode Développeur Local & Démonstration'}
            </h4>
            <p className="text-[11px] text-slate-600 dark:text-white/60 leading-relaxed mt-0.5">
              {isCloudConfigured && isAuthenticated
                ? 'Vos modifications de configuration sont synchronisées avec vos préférences cloud sécurisées.'
                : 'Les paramètres sont persistés localement dans votre environnement de développement.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setIsResetConfirmOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-white/70 hover:text-slate-900 dark:hover:text-white bg-slate-100/90 dark:bg-white/5 hover:bg-slate-200/90 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 transition-all cursor-pointer"
          >
            <RotateCcw size={13} />
            <span>Valeurs par défaut</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-nexus-600 to-cyan-600 hover:from-nexus-500 hover:to-cyan-500 shadow-[0_0_15px_rgba(124,13,244,0.4)] transition-all cursor-pointer"
          >
            <Save size={13} />
            <span>Enregistrer</span>
          </button>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
          <Sparkles size={15} />
          <span>Paramètres avancés enregistrés et appliqués avec succès.</span>
        </div>
      )}

      {/* ── Commutateur Mode Démonstration vs Réel ──────────────────────────── */}
      <div className="rounded-2xl liquid-glass liquid-glass-card border border-slate-200/80 dark:border-white/10 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-wide">
              Mode Démonstration (Simulateur Embarqué)
            </h3>
            <p className="text-xs text-slate-600 dark:text-white/60 mt-0.5">
              Basculez entre le moteur de simulation local sans clé et l'inférence via proxy réel.
            </p>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={form.isDemoMode}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, isDemoMode: e.target.checked }))
              }
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 dark:bg-surface-950 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 dark:after:border-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-nexus-600 border border-slate-300 dark:border-white/20"></div>
          </label>
        </div>

        <div
          className={`p-3.5 rounded-xl border text-xs leading-relaxed ${
            form.isDemoMode
              ? 'bg-purple-500/10 border-purple-500/20 text-purple-700 dark:text-purple-200'
              : 'bg-cyan-500/10 border-cyan-500/20 text-cyan-700 dark:text-cyan-200'
          }`}
        >
          {form.isDemoMode
            ? 'Mode Démonstration actif : Réponses générées localement. Aucune clé API requise, latence émulée et coût nul.'
            : 'Moteur distant actif : Les requêtes sont transmises au modèle sélectionné via le proxy serveur.'}
        </div>
      </div>

      {/* ── Paramètres d'Inférence Numériques ───────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        {/* Longueur max des réponses (maxTokens) */}
        <div className="rounded-2xl liquid-glass liquid-glass-card border border-slate-200/80 dark:border-white/10 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900 dark:text-white tracking-wide">
              Longueur max (max_tokens)
            </span>
            <span className="font-mono text-cyan-600 dark:text-cyan-300 font-bold text-xs bg-slate-100 dark:bg-surface-950 px-2 py-0.5 rounded border border-slate-200 dark:border-white/10">
              {form.maxTokens}
            </span>
          </div>

          <p className="text-[11px] text-slate-600 dark:text-white/60 leading-relaxed">
            Plafond de tokens générés par réponse pour éviter les débordements de coût.
          </p>

          <input
            type="range"
            min={128}
            max={8192}
            step={128}
            value={form.maxTokens}
            onChange={(e) => handleMaxTokensChange(Number(e.target.value))}
            className="w-full accent-cyan-500 dark:accent-cyan-400 cursor-pointer"
          />

          <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-white/40 font-mono">
            <span>128 tokens</span>
            <span>2 048 (défaut)</span>
            <span>8 192 max</span>
          </div>
        </div>

        {/* Température (temperature) */}
        <div className="rounded-2xl liquid-glass liquid-glass-card border border-slate-200/80 dark:border-white/10 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900 dark:text-white tracking-wide">
              Température
            </span>
            <span className="font-mono text-purple-600 dark:text-purple-300 font-bold text-xs bg-slate-100 dark:bg-surface-950 px-2 py-0.5 rounded border border-slate-200 dark:border-white/10">
              {form.temperature}
            </span>
          </div>

          <p className="text-[11px] text-slate-600 dark:text-white/60 leading-relaxed">
            Contrôle la variabilité et l'inventivité (0 = déterministe et factuel, 1 = créatif).
          </p>

          <input
            type="range"
            min={0}
            max={2}
            step={0.05}
            value={form.temperature}
            onChange={(e) => handleTemperatureChange(Number(e.target.value))}
            className="w-full accent-purple-500 dark:accent-purple-400 cursor-pointer"
          />

          <div className="flex items-center justify-between text-[10px] text-white/40 font-mono">
            <span>0.0 (Précis)</span>
            <span>0.7 (Équilibré)</span>
            <span>2.0 (Créatif)</span>
          </div>
        </div>

        {/* Délai d'attente réseau (timeoutSeconds) */}
        <div className="rounded-2xl bg-surface-900/70 border border-white/10 p-5 backdrop-blur-xl space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white tracking-wide">
              Délai d'attente (timeout)
            </span>
            <span className="font-mono text-amber-300 font-bold text-xs bg-surface-950 px-2 py-0.5 rounded border border-white/10">
              {form.timeoutSeconds} s
            </span>
          </div>

          <p className="text-[11px] text-white/60 leading-relaxed">
            Temps maximum accordé au modèle avant interruption pour éviter les requêtes bloquées.
          </p>

          <input
            type="range"
            min={5}
            max={120}
            step={5}
            value={form.timeoutSeconds}
            onChange={(e) => handleTimeoutChange(Number(e.target.value))}
            className="w-full accent-amber-400 cursor-pointer"
          />

          <div className="flex items-center justify-between text-[10px] text-white/40 font-mono">
            <span>5 s</span>
            <span>30 s (standard)</span>
            <span>120 s</span>
          </div>
        </div>
      </div>

      {/* ── Fonctionnalités Expérimentales ───────────────────────────────────── */}
      <div className="rounded-2xl bg-surface-900/70 border border-white/10 p-5 backdrop-blur-xl space-y-4">
        <div className="flex items-center gap-2">
          <Zap size={16} className="text-cyan-400" />
          <h3 className="text-sm font-bold text-white tracking-wide">
            Fonctionnalités Expérimentales & Avancées
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {/* Streaming Direct */}
          <div
            onClick={() => handleToggleExperimental('streaming')}
            className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
              form.experimentalFeatures.streaming
                ? 'bg-surface-950/90 border-cyan-400/50'
                : 'bg-surface-950/40 border-white/8 hover:border-white/15'
            }`}
          >
            <input
              type="checkbox"
              checked={form.experimentalFeatures.streaming}
              onChange={() => {}} // géré par le parent
              className="mt-0.5 accent-cyan-400 cursor-pointer"
            />
            <div>
              <span className="text-xs font-semibold text-white block">
                Streaming Direct de Tokens
              </span>
              <p className="text-[11px] text-white/50 leading-relaxed mt-0.5">
                Affichage au fil de l’eau des mots dès leur génération par le moteur.
              </p>
            </div>
          </div>

          {/* Mode Raisonnement Délibéré */}
          <div
            onClick={() => handleToggleExperimental('reasoningEffort')}
            className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
              form.experimentalFeatures.reasoningEffort
                ? 'bg-surface-950/90 border-nexus-400/50'
                : 'bg-surface-950/40 border-white/8 hover:border-white/15'
            }`}
          >
            <input
              type="checkbox"
              checked={form.experimentalFeatures.reasoningEffort}
              onChange={() => {}}
              className="mt-0.5 accent-nexus-400 cursor-pointer"
            />
            <div>
              <span className="text-xs font-semibold text-white block">
                Raisonnement Étendu (Thinking Models)
              </span>
              <p className="text-[11px] text-white/50 leading-relaxed mt-0.5">
                Alloue un budget de réflexion interne pour les modèles supportés (o1, Claude 3.7).
              </p>
            </div>
          </div>

          {/* Vision Multimodale */}
          <div
            onClick={() => handleToggleExperimental('visionMultimodal')}
            className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
              form.experimentalFeatures.visionMultimodal
                ? 'bg-surface-950/90 border-purple-400/50'
                : 'bg-surface-950/40 border-white/8 hover:border-white/15'
            }`}
          >
            <input
              type="checkbox"
              checked={form.experimentalFeatures.visionMultimodal}
              onChange={() => {}}
              className="mt-0.5 accent-purple-400 cursor-pointer"
            />
            <div>
              <span className="text-xs font-semibold text-white block">
                Traitement Multimodal & Vision
              </span>
              <p className="text-[11px] text-white/50 leading-relaxed mt-0.5">
                Prise en charge de l’analyse d’images, maquettes et diagrammes d'architecture.
              </p>
            </div>
          </div>

          {/* Appel d'Outils (Tool Calling) */}
          <div
            onClick={() => handleToggleExperimental('toolCalling')}
            className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
              form.experimentalFeatures.toolCalling
                ? 'bg-surface-950/90 border-emerald-400/50'
                : 'bg-surface-950/40 border-white/8 hover:border-white/15'
            }`}
          >
            <input
              type="checkbox"
              checked={form.experimentalFeatures.toolCalling}
              onChange={() => {}}
              className="mt-0.5 accent-emerald-400 cursor-pointer"
            />
            <div>
              <span className="text-xs font-semibold text-white block">
                Appels d'Outils (Function Calling)
              </span>
              <p className="text-[11px] text-white/50 leading-relaxed mt-0.5">
                Permet aux agents d'invoquer des scripts et d'effectuer des calculs structurés.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation de Réinitialisation */}
      <ConfirmActionModal
        isOpen={isResetConfirmOpen}
        title="Réinitialiser aux valeurs d'usine"
        message="Voulez-vous restaurer tous les paramètres d'inférence (tokens, température, timeouts) à leurs valeurs initiales par défaut ?"
        confirmLabel="Restaurer les défauts"
        onConfirm={handleResetDefaults}
        onCancel={() => setIsResetConfirmOpen(false)}
      />
    </div>
  );
}
