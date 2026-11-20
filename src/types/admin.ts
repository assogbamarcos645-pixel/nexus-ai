/**
 * src/types/admin.ts
 *
 * Definitions de types pour l'Espace Super-Admin et la gouvernance complete de NEXUS AI :
 * 1. Securite biometrique multi-facteurs (WebAuthn, PIN SHA-256, Email whitelist)
 * 2. Gestion exhaustive et observabilite de tous les utilisateurs
 * 3. Telemetrie systeme globale (tokens, couts, sante des moteurs, projets du Lab)
 * 4. Audit et journalisation des acces
 * 5. Passerelle IA & Routage Dynamique (AI Gateway)
 * 6. FinOps & Plafonds Budgetaires
 * 7. Gestionnaire d'Agents Specialises & System Prompts
 * 8. Base de Connaissances RAG Globale
 * 9. Sessions Actives, Anti-Abus & Outils RGPD
 * 10. Communication Systeme (Broadcast) & Maintenance Programmee
 */

export interface AdminSecurityConfig {
  primaryAdminEmail: string;
  allowedAdminEmails: string[];
  masterPinHash: string;
  isPinConfigured: boolean;
  biometricCredentialId?: string;
  biometricEnabled: boolean;
  biometricRegisteredAt?: string;
  maintenanceMode: boolean;
  maintenanceNotice?: string;
  autoLockMinutes: number;
}

export type AdminAuditAction =
  | 'unlock_pin'
  | 'unlock_biometric'
  | 'unlock_email'
  | 'failed_attempt'
  | 'settings_update'
  | 'maintenance_toggle'
  | 'user_update'
  | 'user_deleted'
  | 'user_quota_update'
  | 'killswitch_triggered'
  | 'export_data'
  | 'gateway_update'
  | 'finops_update'
  | 'agent_toggle'
  | 'prompt_published'
  | 'prompt_rollback'
  | 'rag_doc_added'
  | 'rag_doc_deleted'
  | 'session_revoked'
  | 'session_revoke_all'
  | 'ip_blocked'
  | 'ip_unblocked'
  | 'broadcast_update'
  | 'broadcast_email'
  | 'maintenance_scheduled';

export interface AdminAuditEntry {
  id: string;
  timestamp: string;
  action: AdminAuditAction;
  success: boolean;
  details: string;
  ipOrDevice?: string;
}

export interface UserMetrics {
  totalRequests: number;
  tokensConsumed: number;
  promptTokens: number;
  completionTokens: number;
  estimatedCostUsd: number;
  preferredModel: string;
  projectsCount: number;
  conversationsCount: number;
  storageUsedKb: number;
  deviceInfo?: string;
  lastActiveIp?: string;
}

export interface ManagedUserProjectSummary {
  id: string;
  name: string;
  fileCount: number;
  template: string;
  updatedAt: string;
}

export interface ManagedUser {
  id: string;
  email: string;
  fullName: string;
  role: 'super_admin' | 'admin' | 'pro_dev' | 'user' | 'restricted';
  status: 'active' | 'suspended' | 'pending';
  lastSeen?: string;
  createdAt: string;
  avatarUrl?: string;
  tokenQuotaLimit?: number;
  metrics: UserMetrics;
  recentProjects?: ManagedUserProjectSummary[];
}

export interface SystemFullMetrics {
  totalUsersCount: number;
  activeUsersCount: number;
  totalTokensConsumed: number;
  totalEstimatedCostUsd: number;
  totalProjectsCount: number;
  totalSnapshotsCount: number;
  activeAiProvider: string;
  activeAiModel: string;
  systemUptimeHours: number;
  maintenanceActive: boolean;
  biometricSecured: boolean;
  providersHealth: Array<{
    id: string;
    name: string;
    status: 'operational' | 'degraded' | 'unavailable';
    latencyMs: number;
  }>;
}

// ─── Module 1 : Passerelle IA & Routage Dynamique (AI Gateway) ─────────────

export interface GuardrailConfig {
  promptInjectionBlocker: boolean;
  piiAndSecretMasking: boolean;
  customBlockedTerms: string[];
}

export interface RoleModelPermissions {
  super_admin: string[];
  admin: string[];
  pro_dev: string[];
  user: string[];
  restricted: string[];
}

export interface GatewayConfig {
  primaryProvider: string;
  fallbackEnabled: boolean;
  latencyThresholdMs: number;
  providerOrder: string[];
  rolePermissions: RoleModelPermissions;
  guardrails: GuardrailConfig;
}

// ─── Module 2 : FinOps & Plafonds Budgetaires ──────────────────────────────

export interface CostBreakdownItem {
  id: 'chat' | 'lab' | 'agents';
  label: string;
  amountUsd: number;
  percentage: number;
  tokens: number;
  color: string;
}

export interface FinOpsConfig {
  monthlyBudgetUsd: number;
  onLimitExceeded: 'hard_stop' | 'fallback_free';
  alertThresholds: number[];
  currentSpendUsd: number;
  breakdown: CostBreakdownItem[];
}

// ─── Module 3 : Gestionnaire d'Agents Specialises & System Prompts ──────────

export interface ManagedAgent {
  id: string;
  name: string;
  description: string;
  roleTitle: string;
  avatarIcon: string;
  status: 'active' | 'hidden' | 'disabled';
  modelId: string;
  temperature: number;
  systemPromptSnippet: string;
  updatedAt: string;
}

export interface SystemPromptVersion {
  id: string;
  version: string;
  title: string;
  prompt: string;
  author: string;
  createdAt: string;
  isActive: boolean;
}

// ─── Module 4 : Base de Connaissances RAG Globale ──────────────────────────

export interface RagDocument {
  id: string;
  title: string;
  category: string;
  fileType: 'pdf' | 'markdown' | 'txt' | 'doc';
  sizeKb: number;
  chunksCount: number;
  vectorsCount: number;
  status: 'indexed' | 'processing' | 'error';
  indexedAt: string;
}

export interface RagMetrics {
  totalDocuments: number;
  totalChunks: number;
  totalVectors: number;
  totalQueries: number;
  averageLatencyMs: number;
}

// ─── Module 5 : Sessions Actives & Securite Avancee ─────────────────────────

export interface ActiveSession {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  role: ManagedUser['role'];
  ip: string;
  location: string;
  device: string;
  browser: string;
  startedAt: string;
  lastActiveAt: string;
  isCurrent: boolean;
}

export interface BlockedIp {
  ip: string;
  reason: string;
  blockedAt: string;
  blockedBy: string;
  hitCount: number;
}

export interface AntiAbusConfig {
  maxRequestsPerMinute: number;
  maxFailedPinsBeforeBlock: number;
  autoBlockIpOnBruteforce: boolean;
  blockedIps: BlockedIp[];
}

// ─── Module 6 : Annonces Globales (Broadcast) & Maintenance Programmee ─────

export interface BroadcastBanner {
  id: string;
  enabled: boolean;
  type: 'info' | 'warning' | 'urgent';
  title: string;
  message: string;
  createdAt: string;
  expiresAt?: string;
  allowDismiss: boolean;
}

export interface ScheduledMaintenance {
  enabled: boolean;
  scheduledStart: string;
  estimatedDurationMinutes: number;
  warningNotice: string;
  autoLockWhenReached: boolean;
}
