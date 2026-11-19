/**
 * src/components/control-center/AutomationCenter.tsx
 *
 * Panneau de controle de l'automatisation externe de NEXUS AI :
 *  - Taches programmees (Cron / Timers)
 *  - Webhooks sortants (Slack, Discord, Supabase, GitHub Actions)
 *  - Declencheurs Webhook entrants
 *  - Journal d'audit et historique des executions
 */

import { useState, useEffect } from 'react';
import {
  Clock,
  Radio,
  Play,
  CheckCircle2,
  RefreshCw,
  Send,
  Globe,
  Shield,
  Trash2,
  Plus,
  History,
  Check,
} from 'lucide-react';
import type {
  ExternalAutomationConfig,
  ScheduledTask,
  OutgoingWebhook,
  WebhookTriggerEvent,
  CronFrequency,
} from '@/types/automation';
import {
  getAutomationConfig,
  saveAutomationConfig,
  executeScheduledTask,
  sendOutgoingWebhook,
  handleIncomingWebhook,
  clearAutomationLogs,
} from '@/services/automation/externalAutomationService';
import { generateUUID } from '@/utils/uuid';

const EVENT_LABELS: Record<WebhookTriggerEvent, string> = {
  on_build_complete: 'Build / CI/CD termine',
  on_error_detected: 'Erreur detectee',
  on_snapshot_created: 'Instantane cree',
  on_cron_finished: 'Tache Cron achevee',
  on_git_push: 'Git Push distant',
  on_server_alert: 'Alerte serveur / uptime',
};

const FREQUENCY_LABELS: Record<CronFrequency, string> = {
  every_15m: 'Toutes les 15 minutes',
  every_1h: 'Toutes les heures',
  every_6h: 'Toutes les 6 heures',
  daily_02h: 'Chaque jour a 02:00 (Nuit)',
  daily_08h: 'Chaque jour a 08:00 (Matin)',
  weekly: 'Hebdomadaire',
};

export function AutomationCenter() {
  const [config, setConfig] = useState<ExternalAutomationConfig>(getAutomationConfig());
  const [runningTaskId, setRunningTaskId] = useState<string | null>(null);
  const [testingHookId, setTestingHookId] = useState<string | null>(null);
  const [simulatingEndpointId, setSimulatingEndpointId] = useState<string | null>(null);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  // Formulaire d'ajout rapide de tâche cron
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTaskName, setNewTaskName] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskFreq, setNewTaskFreq] = useState<CronFrequency>('every_1h');

  // Formulaire d'ajout rapide de webhook sortant
  const [isAddingHook, setIsAddingHook] = useState(false);
  const [newHookName, setNewHookName] = useState('');
  const [newHookService, setNewHookService] = useState<'slack' | 'discord' | 'supabase' | 'github_actions' | 'custom'>('slack');
  const [newHookUrl, setNewHookUrl] = useState('');

  useEffect(() => {
    const handleUpdate = () => {
      setConfig(getAutomationConfig());
    };
    window.addEventListener('nexus:automation-updated', handleUpdate);
    return () => {
      window.removeEventListener('nexus:automation-updated', handleUpdate);
    };
  }, []);

  const showNotification = (msg: string) => {
    setActionSuccessMsg(msg);
    setTimeout(() => setActionSuccessMsg(null), 3000);
  };

  const handleToggleTask = (taskId: string) => {
    const updated = {
      ...config,
      tasks: config.tasks.map((t) => (t.id === taskId ? { ...t, enabled: !t.enabled } : t)),
    };
    setConfig(updated);
    saveAutomationConfig(updated);
  };

  const handleRunTask = async (taskId: string) => {
    setRunningTaskId(taskId);
    try {
      const log = await executeScheduledTask(taskId);
      showNotification(`Tache executee : ${log.message}`);
      setConfig(getAutomationConfig());
    } catch (err) {
      showNotification(`Erreur execution : ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setRunningTaskId(null);
    }
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskName.trim()) return;

    const newTask: ScheduledTask = {
      id: `task-${generateUUID().slice(0, 8)}`,
      name: newTaskName.trim(),
      description: newTaskDesc.trim() || 'Tache programmee personnalisee.',
      action: 'system_health_audit',
      frequency: newTaskFreq,
      enabled: true,
      lastStatus: 'idle',
      createdAt: new Date().toISOString(),
    };

    const updated = {
      ...config,
      tasks: [...config.tasks, newTask],
    };
    setConfig(updated);
    saveAutomationConfig(updated);
    setIsAddingTask(false);
    setNewTaskName('');
    setNewTaskDesc('');
    showNotification(`Tache « ${newTask.name} » creee avec succes.`);
  };

  const handleDeleteTask = (taskId: string) => {
    const updated = {
      ...config,
      tasks: config.tasks.filter((t) => t.id !== taskId),
    };
    setConfig(updated);
    saveAutomationConfig(updated);
  };

  const handleToggleHook = (hookId: string) => {
    const updated = {
      ...config,
      outgoingWebhooks: config.outgoingWebhooks.map((h) =>
        h.id === hookId ? { ...h, enabled: !h.enabled } : h,
      ),
    };
    setConfig(updated);
    saveAutomationConfig(updated);
  };

  const handleUpdateHookUrl = (hookId: string, url: string) => {
    const updated = {
      ...config,
      outgoingWebhooks: config.outgoingWebhooks.map((h) =>
        h.id === hookId ? { ...h, url: url.trim() } : h,
      ),
    };
    setConfig(updated);
    saveAutomationConfig(updated);
  };

  const handleToggleHookEvent = (hookId: string, event: WebhookTriggerEvent) => {
    const updated = {
      ...config,
      outgoingWebhooks: config.outgoingWebhooks.map((h) => {
        if (h.id !== hookId) return h;
        const exists = h.events.includes(event);
        const newEvents = exists ? h.events.filter((e) => e !== event) : [...h.events, event];
        return { ...h, events: newEvents };
      }),
    };
    setConfig(updated);
    saveAutomationConfig(updated);
  };

  const handleTestHook = async (hook: OutgoingWebhook) => {
    setTestingHookId(hook.id);
    try {
      const logs = await sendOutgoingWebhook(hook.events[0] || 'on_cron_finished', {
        test: true,
        source: 'NEXUS AI Test Event',
        message: `Test de notification via webhook sortant ${hook.name}.`,
        timestamp: new Date().toISOString(),
      });
      const result = logs.find((l) => l.sourceName === hook.name);
      showNotification(result?.message || 'Test de webhook envoye.');
      setConfig(getAutomationConfig());
    } finally {
      setTestingHookId(null);
    }
  };

  const handleCreateHook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHookName.trim()) return;

    const newHook: OutgoingWebhook = {
      id: `hook-${generateUUID().slice(0, 8)}`,
      name: newHookName.trim(),
      service: newHookService,
      url: newHookUrl.trim(),
      enabled: true,
      events: ['on_build_complete', 'on_error_detected'],
      lastStatus: 'idle',
      createdAt: new Date().toISOString(),
    };

    const updated = {
      ...config,
      outgoingWebhooks: [...config.outgoingWebhooks, newHook],
    };
    setConfig(updated);
    saveAutomationConfig(updated);
    setIsAddingHook(false);
    setNewHookName('');
    setNewHookUrl('');
    showNotification(`Webhook sortant « ${newHook.name} » configure.`);
  };

  const handleDeleteHook = (hookId: string) => {
    const updated = {
      ...config,
      outgoingWebhooks: config.outgoingWebhooks.filter((h) => h.id !== hookId),
    };
    setConfig(updated);
    saveAutomationConfig(updated);
  };

  const handleSimulateIncoming = async (endpointId: string) => {
    setSimulatingEndpointId(endpointId);
    try {
      const res = await handleIncomingWebhook(endpointId, {
        simulated: true,
        source: 'external_ci_test',
        branch: 'main',
        commit: '1a2b3c4',
        author: 'NEXUS Automation Bot',
      });
      showNotification(`Evenement entrant recu : ${res.actionTaken}`);
      setConfig(getAutomationConfig());
    } finally {
      setSimulatingEndpointId(null);
    }
  };

  const handleClearLogs = () => {
    clearAutomationLogs();
    setConfig(getAutomationConfig());
    showNotification('Journal d audit reinitialise.');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Toast d'action */}
      {actionSuccessMsg && (
        <div className="fixed bottom-6 right-6 z-50 p-3.5 rounded-xl bg-emerald-600 text-white font-medium text-xs shadow-lg flex items-center gap-2 animate-in slide-in-from-bottom duration-200">
          <Check size={14} />
          <span>{actionSuccessMsg}</span>
        </div>
      )}

      {/* Hero Overview */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-indigo-500/10 via-cyan-500/10 to-purple-500/10 border border-indigo-500/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Radio size={18} className="text-cyan-500 animate-pulse" />
            <span>Moteur d'Automatisation Externe & Webhooks</span>
          </h2>
          <p className="text-xs text-slate-600 dark:text-white/70 mt-1 max-w-2xl leading-relaxed">
            Orchestrez les taches programmees a heures fixes (sauvegardes, rapports nocturnes) et reliez NEXUS AI a vos services externes (Slack, Discord, Supabase, GitHub Actions).
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 font-semibold text-xs flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span>Planificateur Actif</span>
          </div>
        </div>
      </div>

      {/* Cartes d'indicateurs de flux */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
        <div className="p-3.5 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-white/60 mb-1">
            <span>Routines Cron</span>
            <Clock size={14} className="text-cyan-500" />
          </div>
          <div className="text-lg font-bold text-slate-900 dark:text-white font-mono">
            {config.tasks.filter((t) => t.enabled).length} / {config.tasks.length} actives
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-white/60 mb-1">
            <span>Webhooks Sortants</span>
            <Send size={14} className="text-indigo-400" />
          </div>
          <div className="text-lg font-bold text-slate-900 dark:text-white font-mono">
            {config.outgoingWebhooks.filter((h) => h.enabled).length} relies
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-white/60 mb-1">
            <span>Points d'Entree Webhook</span>
            <Globe size={14} className="text-purple-400" />
          </div>
          <div className="text-lg font-bold text-slate-900 dark:text-white font-mono">
            {config.incomingEndpoints.length} configurables
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-white/60 mb-1">
            <span>Audit d'Execution</span>
            <History size={14} className="text-emerald-500" />
          </div>
          <div className="text-lg font-bold text-slate-900 dark:text-white font-mono">
            {config.logs.length} evenements
          </div>
        </div>
      </div>

      {/* SECTION 1 : Tâches Programmées (Cron / Timers) */}
      <div className="p-5 rounded-2xl bg-white dark:bg-[#0f1026] border border-slate-200 dark:border-white/10 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-cyan-500" />
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              Taches Programmees & Planificateurs (Cron / Timers)
            </h3>
          </div>
          <button
            type="button"
            id="btn-add-cron-task"
            onClick={() => setIsAddingTask(!isAddingTask)}
            className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/15 text-slate-700 dark:text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <Plus size={13} />
            <span>Nouvelle Tache</span>
          </button>
        </div>

        {/* Formulaire de création rapide */}
        {isAddingTask && (
          <form
            onSubmit={handleCreateTask}
            className="p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 space-y-3 animate-in fade-in duration-150 text-xs"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-white/80 mb-1">
                  Nom de la routine
                </label>
                <input
                  type="text"
                  value={newTaskName}
                  onChange={(e) => setNewTaskName(e.target.value)}
                  placeholder="Ex. Nettoyage hebdomadaire"
                  required
                  className="w-full px-3 py-2 bg-white dark:bg-surface-900 border border-slate-300 dark:border-white/10 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-white/80 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={newTaskDesc}
                  onChange={(e) => setNewTaskDesc(e.target.value)}
                  placeholder="Raison et perimetre de la routine"
                  className="w-full px-3 py-2 bg-white dark:bg-surface-900 border border-slate-300 dark:border-white/10 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-white/80 mb-1">
                  Frequence d'execution
                </label>
                <select
                  value={newTaskFreq}
                  onChange={(e) => setNewTaskFreq(e.target.value as CronFrequency)}
                  className="w-full px-3 py-2 bg-white dark:bg-surface-900 border border-slate-300 dark:border-white/10 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="every_15m">Toutes les 15 minutes</option>
                  <option value="every_1h">Toutes les heures</option>
                  <option value="every_6h">Toutes les 6 heures</option>
                  <option value="daily_02h">Chaque jour a 02:00 (Nuit)</option>
                  <option value="daily_08h">Chaque jour a 08:00 (Matin)</option>
                  <option value="weekly">Hebdomadaire</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsAddingTask(false)}
                className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-white/10 text-slate-700 dark:text-white/80 hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold cursor-pointer shadow-sm"
              >
                Enregistrer la tache
              </button>
            </div>
          </form>
        )}

        {/* Liste des tâches */}
        <div className="space-y-2.5">
          {config.tasks.map((task) => (
            <div
              key={task.id}
              className={`p-3.5 rounded-xl border transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-3 ${
                task.enabled
                  ? 'bg-slate-50/80 dark:bg-white/5 border-slate-200 dark:border-white/10'
                  : 'bg-slate-100/50 dark:bg-white/2 border-dashed border-slate-200 dark:border-white/5 opacity-60'
              }`}
            >
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-900 dark:text-white text-xs truncate">
                    {task.name}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-600 dark:text-cyan-300 font-mono text-[10px] font-medium shrink-0">
                    {FREQUENCY_LABELS[task.frequency]}
                  </span>
                  {task.cronExpression && (
                    <span className="font-mono text-[10px] text-slate-600 dark:text-white/60">
                      ({task.cronExpression})
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-white/60 leading-relaxed">
                  {task.description}
                </p>
                {task.lastLog && (
                  <p className="text-[10px] font-mono text-slate-600 dark:text-white/50 flex items-center gap-1">
                    <CheckCircle2 size={10} className="text-emerald-500 shrink-0" />
                    <span>Dernier retour : {task.lastLog}</span>
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                <button
                  type="button"
                  onClick={() => handleRunTask(task.id)}
                  disabled={runningTaskId === task.id || !task.enabled}
                  className="px-2.5 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 font-medium text-[11px] flex items-center gap-1.5 cursor-pointer disabled:opacity-40 transition-colors"
                  title="Executer manuellement maintenant"
                >
                  {runningTaskId === task.id ? (
                    <RefreshCw size={12} className="animate-spin" />
                  ) : (
                    <Play size={12} />
                  )}
                  <span>Lancer</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleToggleTask(task.id)}
                  className={`px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-colors cursor-pointer ${
                    task.enabled
                      ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/25'
                      : 'bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-white/60'
                  }`}
                >
                  {task.enabled ? 'Actif' : 'Desactive'}
                </button>

                <button
                  type="button"
                  onClick={() => handleDeleteTask(task.id)}
                  className="p-1.5 text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors cursor-pointer"
                  title="Supprimer la tache"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 2 : Webhooks Sortants (Slack, Discord, Supabase, GitHub Actions) */}
      <div className="p-5 rounded-2xl bg-white dark:bg-[#0f1026] border border-slate-200 dark:border-white/10 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Send size={16} className="text-indigo-400" />
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              Webhooks Sortants (Notifications & Decharges Tiers)
            </h3>
          </div>
          <button
            type="button"
            id="btn-add-outgoing-hook"
            onClick={() => setIsAddingHook(!isAddingHook)}
            className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/15 text-slate-700 dark:text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <Plus size={13} />
            <span>Nouveau Webhook</span>
          </button>
        </div>

        {/* Formulaire d'ajout rapide webhook sortant */}
        {isAddingHook && (
          <form
            onSubmit={handleCreateHook}
            className="p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 space-y-3 animate-in fade-in duration-150 text-xs"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-white/80 mb-1">
                  Nom du flux
                </label>
                <input
                  type="text"
                  value={newHookName}
                  onChange={(e) => setNewHookName(e.target.value)}
                  placeholder="Ex. Canal Slack Deploiements"
                  required
                  className="w-full px-3 py-2 bg-white dark:bg-surface-900 border border-slate-300 dark:border-white/10 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-white/80 mb-1">
                  Plateforme cible
                </label>
                <select
                  value={newHookService}
                  onChange={(e) => setNewHookService(e.target.value as any)}
                  className="w-full px-3 py-2 bg-white dark:bg-surface-900 border border-slate-300 dark:border-white/10 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="slack">Slack (Incoming Webhook)</option>
                  <option value="discord">Discord (Channel Webhook)</option>
                  <option value="supabase">Supabase Edge Function</option>
                  <option value="github_actions">GitHub Actions (Dispatch)</option>
                  <option value="custom">API REST Personnalisee</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-white/80 mb-1">
                  URL de notification (POST)
                </label>
                <input
                  type="url"
                  value={newHookUrl}
                  onChange={(e) => setNewHookUrl(e.target.value)}
                  placeholder="https://hooks.slack.com/services/..."
                  className="w-full px-3 py-2 bg-white dark:bg-surface-900 border border-slate-300 dark:border-white/10 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsAddingHook(false)}
                className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-white/10 text-slate-700 dark:text-white/80 hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold cursor-pointer shadow-sm"
              >
                Connecter le webhook
              </button>
            </div>
          </form>
        )}

        {/* Liste des webhooks sortants */}
        <div className="space-y-3">
          {config.outgoingWebhooks.map((hook) => (
            <div
              key={hook.id}
              className={`p-4 rounded-xl border space-y-3 transition-all ${
                hook.enabled
                  ? 'bg-slate-50/80 dark:bg-white/5 border-slate-200 dark:border-white/10'
                  : 'bg-slate-100/50 dark:bg-white/2 border-dashed border-slate-200 dark:border-white/5 opacity-60'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-900 dark:text-white text-xs">
                    {hook.name}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 font-mono text-[10px] uppercase font-bold shrink-0">
                    {hook.service}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleTestHook(hook)}
                    disabled={testingHookId === hook.id}
                    className="px-2.5 py-1 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 text-[11px] font-medium flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    {testingHookId === hook.id ? (
                      <RefreshCw size={11} className="animate-spin" />
                    ) : (
                      <Send size={11} />
                    )}
                    <span>Tester le webhook</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleToggleHook(hook.id)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors cursor-pointer ${
                      hook.enabled
                        ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/25'
                        : 'bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-white/60'
                    }`}
                  >
                    {hook.enabled ? 'Actif' : 'Desactive'}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteHook(hook.id)}
                    className="p-1 text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors cursor-pointer"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              {/* Champ d'URL */}
              <div className="relative">
                <input
                  type="url"
                  value={hook.url}
                  onChange={(e) => handleUpdateHookUrl(hook.id, e.target.value)}
                  placeholder={`Collez l'URL de webhook ${hook.service} ici...`}
                  className="w-full px-3 py-1.5 bg-white dark:bg-surface-900 border border-slate-300 dark:border-white/10 rounded-lg text-slate-900 dark:text-white font-mono text-[11px] focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Événements déclencheurs */}
              <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                <span className="text-slate-400 font-medium mr-1">Declencher sur :</span>
                {(
                  [
                    'on_build_complete',
                    'on_error_detected',
                    'on_snapshot_created',
                    'on_cron_finished',
                  ] as WebhookTriggerEvent[]
                ).map((ev) => {
                  const isChecked = hook.events.includes(ev);
                  return (
                    <button
                      key={ev}
                      type="button"
                      onClick={() => handleToggleHookEvent(hook.id, ev)}
                      className={`px-2 py-0.5 rounded-full border transition-all cursor-pointer ${
                        isChecked
                          ? 'bg-indigo-500/15 border-indigo-500/40 text-indigo-700 dark:text-indigo-300 font-semibold'
                          : 'bg-white/40 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-500 dark:text-white/40 hover:border-slate-300'
                      }`}
                    >
                      {EVENT_LABELS[ev]}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 3 : Webhooks Entrants (Déclencheurs Externes) */}
      <div className="p-5 rounded-2xl bg-white dark:bg-[#0f1026] border border-slate-200 dark:border-white/10 space-y-4">
        <div className="flex items-center gap-2">
          <Globe size={16} className="text-purple-400" />
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">
            Webhooks Entrants (Recepteurs d'Evenements Tiers)
          </h3>
        </div>
        <p className="text-xs text-slate-500 dark:text-white/60 leading-relaxed">
          Permet a vos pipelines externes (GitHub Actions, bases Supabase, moniteurs de statut) d'ordonner a NEXUS AI de declencher une action immediate.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {config.incomingEndpoints.map((ep) => (
            <div
              key={ep.id}
              className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-white/5 border border-slate-200 dark:border-white/10 space-y-2.5 text-xs"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-900 dark:text-white truncate">
                  {ep.name}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-600 dark:text-purple-300 font-mono text-[10px] font-bold">
                  {ep.callCount} appels
                </span>
              </div>

              <div className="p-2 rounded bg-white dark:bg-surface-900 border border-slate-200 dark:border-white/10 font-mono text-[10px] text-slate-500 dark:text-white/60 truncate flex items-center justify-between">
                <span className="truncate">Secret : {ep.secretKey}</span>
                <Shield size={11} className="text-emerald-500 shrink-0 ml-1" />
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[10px] text-slate-400">
                  Action : <strong className="text-cyan-500">{ep.targetAction}</strong>
                </span>

                <button
                  type="button"
                  onClick={() => handleSimulateIncoming(ep.id)}
                  disabled={simulatingEndpointId === ep.id}
                  className="px-2.5 py-1 rounded-lg bg-purple-500/15 hover:bg-purple-500/25 text-purple-700 dark:text-purple-300 text-[11px] font-medium flex items-center gap-1 cursor-pointer transition-colors"
                >
                  {simulatingEndpointId === ep.id ? (
                    <RefreshCw size={11} className="animate-spin" />
                  ) : (
                    <Play size={11} />
                  )}
                  <span>Simuler l'appel</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 4 : Journal d'Audit & Historique des Événements */}
      <div className="p-5 rounded-2xl bg-white dark:bg-[#0f1026] border border-slate-200 dark:border-white/10 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History size={16} className="text-emerald-500" />
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              Journal d'Audit des Automatisations & Webhooks
            </h3>
          </div>
          {config.logs.length > 0 && (
            <button
              type="button"
              onClick={handleClearLogs}
              className="text-xs text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 flex items-center gap-1 cursor-pointer"
            >
              <Trash2 size={12} />
              <span>Effacer le journal</span>
            </button>
          )}
        </div>

        {config.logs.length === 0 ? (
          <div className="p-8 text-center rounded-xl bg-slate-50 dark:bg-white/5 border border-dashed border-slate-200 dark:border-white/10 text-slate-400 text-xs">
            Aucun evenement d'automatisation enregistre pour l'instant. Les taches cron et webhooks apparaitront ici en temps reel.
          </div>
        ) : (
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {config.logs.map((log) => (
              <div
                key={log.id}
                className="p-2.5 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-start justify-between gap-2 text-[11px]"
              >
                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                        log.status === 'success' ? 'bg-emerald-500' : 'bg-red-500'
                      }`}
                    />
                    <span className="font-semibold text-slate-900 dark:text-white truncate">
                      {log.sourceName}
                    </span>
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-white/60">
                      {log.type}
                    </span>
                  </div>
                  <p className="text-slate-600 dark:text-white/70 truncate">{log.message}</p>
                </div>

                <div className="text-right shrink-0 font-mono text-[10px] text-slate-400">
                  <div>{new Date(log.timestamp).toLocaleTimeString('fr-FR')}</div>
                  <div>{log.durationMs}ms</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
