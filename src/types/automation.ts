/**
 * src/types/automation.ts
 *
 * Definitions de types pour l'automatisation externe de NEXUS AI :
 *  1. Taches programmees (Cron / Timers)
 *  2. Declencheurs Webhooks entrants et sortants (Slack, Discord, Supabase, GitHub Actions)
 *  3. Journal d'execution et metriques de flux
 */

export type CronFrequency =
  | 'every_15m'
  | 'every_1h'
  | 'every_6h'
  | 'daily_02h'
  | 'daily_08h'
  | 'weekly';

export type ScheduledTaskAction =
  | 'tech_watch_report'
  | 'database_backup'
  | 'system_health_audit'
  | 'cleanup_snapshots'
  | 'custom_webhook_ping';

export interface ScheduledTask {
  id: string;
  name: string;
  description: string;
  action: ScheduledTaskAction;
  frequency: CronFrequency;
  cronExpression?: string;
  enabled: boolean;
  lastRun?: string;
  nextRun?: string;
  lastStatus?: 'success' | 'failure' | 'running' | 'idle';
  lastLog?: string;
  createdAt: string;
}

export type WebhookTriggerEvent =
  | 'on_build_complete'
  | 'on_error_detected'
  | 'on_snapshot_created'
  | 'on_cron_finished'
  | 'on_git_push'
  | 'on_server_alert';

export type OutgoingWebhookService =
  | 'slack'
  | 'discord'
  | 'supabase'
  | 'github_actions'
  | 'custom';

export interface OutgoingWebhook {
  id: string;
  name: string;
  service: OutgoingWebhookService;
  url: string;
  secretToken?: string;
  enabled: boolean;
  events: WebhookTriggerEvent[];
  lastTriggered?: string;
  lastStatusCode?: number;
  lastStatus?: 'success' | 'failure' | 'idle';
  createdAt: string;
}

export type IncomingWebhookSource =
  | 'github'
  | 'supabase'
  | 'uptime_monitor'
  | 'custom';

export type IncomingWebhookTargetAction =
  | 'trigger_cicd'
  | 'trigger_auto_heal'
  | 'create_snapshot'
  | 'notify';

export interface IncomingWebhookEndpoint {
  id: string;
  name: string;
  secretKey: string;
  source: IncomingWebhookSource;
  enabled: boolean;
  targetAction: IncomingWebhookTargetAction;
  lastReceived?: string;
  callCount: number;
}

export interface AutomationExecutionLog {
  id: string;
  timestamp: string;
  type: 'cron' | 'incoming_webhook' | 'outgoing_webhook';
  sourceName: string;
  status: 'success' | 'failure';
  message: string;
  durationMs: number;
  payloadSummary?: string;
}

export interface ExternalAutomationConfig {
  tasks: ScheduledTask[];
  outgoingWebhooks: OutgoingWebhook[];
  incomingEndpoints: IncomingWebhookEndpoint[];
  logs: AutomationExecutionLog[];
}
