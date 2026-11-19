/**
 * src/types/admin.ts
 *
 * Definitions de types pour l'Espace Super-Admin et la securite biometrique multi-facteurs de NEXUS AI.
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
  | 'killswitch_triggered';

export interface AdminAuditEntry {
  id: string;
  timestamp: string;
  action: AdminAuditAction;
  success: boolean;
  details: string;
  ipOrDevice?: string;
}

export interface ManagedUser {
  id: string;
  email: string;
  fullName: string;
  role: 'super_admin' | 'admin' | 'user' | 'restricted';
  status: 'active' | 'suspended' | 'pending';
  lastSeen?: string;
  createdAt: string;
}
