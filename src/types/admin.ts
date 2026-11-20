/**
 * src/types/admin.ts
 *
 * Definitions de types pour l'Espace Super-Admin et la gouvernance complete de NEXUS AI :
 * 1. Securite biometrique multi-facteurs (WebAuthn, PIN SHA-256, Email whitelist)
 * 2. Gestion exhaustive et observabilite de tous les utilisateurs
 * 3. Telemetrie systeme globale (tokens, couts, sante des moteurs, projets du Lab)
 * 4. Audit et journalisation des acces
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
  | 'export_data';

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
