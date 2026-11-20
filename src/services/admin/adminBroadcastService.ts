/**
 * src/services/admin/adminBroadcastService.ts
 *
 * Annonces Globales (Broadcast) & Maintenance Programmee :
 * - Diffusion instantanee de bannières d'information, d'alerte ou de maintenance
 * - Planificateur de maintenance avec compte a rebours et verrouillage automatique
 */

import type { BroadcastBanner, ScheduledMaintenance } from '../../types/admin.ts';
import { generateUUID } from '../../utils/uuid.ts';
import { logAdminAudit } from './adminSecurityService.ts';

const BROADCAST_STORAGE_KEY = 'nexus_admin_broadcast_v1';
const MAINTENANCE_STORAGE_KEY = 'nexus_admin_sched_maintenance_v1';

export function getDefaultBroadcastBanner(): BroadcastBanner {
  return {
    id: 'broadcast-v040-release',
    enabled: true,
    type: 'info',
    title: '🚀 NEXUS AI v0.4.0 est disponible !',
    message: 'Nouveautés majeures : Swarm 2.0 avec Auto-Heal en temps réel, exécution in-browser WebContainers & recherche sémantique de codebase.',
    createdAt: new Date().toISOString(),
    allowDismiss: true,
  };
}

export function getDefaultScheduledMaintenance(): ScheduledMaintenance {
  const tomorrow = new Date(Date.now() + 24 * 3600 * 1000);
  tomorrow.setHours(3, 0, 0, 0);

  return {
    enabled: false,
    scheduledStart: tomorrow.toISOString(),
    estimatedDurationMinutes: 30,
    warningNotice: 'Opération de maintenance de routine de la base vectorielle prévue cette nuit.',
    autoLockWhenReached: true,
  };
}

export function getBroadcastBanner(): BroadcastBanner {
  if (typeof window === 'undefined') return getDefaultBroadcastBanner();
  try {
    const raw = localStorage.getItem(BROADCAST_STORAGE_KEY);
    if (!raw) return getDefaultBroadcastBanner();
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.id === 'broadcast-default-1') {
      return getDefaultBroadcastBanner();
    }
    return parsed;
  } catch {
    return getDefaultBroadcastBanner();
  }
}

export function saveBroadcastBanner(banner: BroadcastBanner): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(BROADCAST_STORAGE_KEY, JSON.stringify(banner));
    window.dispatchEvent(new CustomEvent('nexus:broadcast-updated', { detail: banner }));
    logAdminAudit('broadcast_update', true, `Mise a jour de l annonce globale (${banner.type}) : ${banner.title}`);
  } catch (err) {
    console.error('[AdminBroadcastService] Erreur sauvegarde broadcast:', err);
  }
}

export function updateBroadcastBanner(data: Partial<BroadcastBanner>): BroadcastBanner {
  const current = getBroadcastBanner();
  const updated: BroadcastBanner = {
    ...current,
    ...data,
    id: data.id || current.id || generateUUID(),
    createdAt: new Date().toISOString(),
  };
  saveBroadcastBanner(updated);
  return updated;
}

export function getScheduledMaintenance(): ScheduledMaintenance {
  if (typeof window === 'undefined') return getDefaultScheduledMaintenance();
  try {
    const raw = localStorage.getItem(MAINTENANCE_STORAGE_KEY);
    if (!raw) return getDefaultScheduledMaintenance();
    return JSON.parse(raw) || getDefaultScheduledMaintenance();
  } catch {
    return getDefaultScheduledMaintenance();
  }
}

export function saveScheduledMaintenance(maintenance: ScheduledMaintenance): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(MAINTENANCE_STORAGE_KEY, JSON.stringify(maintenance));
    window.dispatchEvent(new CustomEvent('nexus:maintenance-scheduled', { detail: maintenance }));
    logAdminAudit(
      'maintenance_scheduled',
      true,
      maintenance.enabled
        ? `Maintenance programmee pour le ${new Date(maintenance.scheduledStart).toLocaleString()} (${maintenance.estimatedDurationMinutes} min)`
        : 'Desactivation de la maintenance programmee',
    );
  } catch (err) {
    console.error('[AdminBroadcastService] Erreur sauvegarde maintenance:', err);
  }
}
