/**
 * src/services/lab/snapshotService.ts
 *
 * Service de gestion des instantanés (Snapshots) et d'historique de versions pour NEXUS LAB.
 * Permet de sauvegarder l'état complet des fichiers d'un projet avant toute modification
 * (par l'utilisateur ou par une IA : NEXUS DEV, Swarm, Inline Copilot) et de restaurer
 * immédiatement un état antérieur en toute sécurité.
 */

import type { LabFile } from '../../types/lab.ts';
import type { ProjectSnapshot } from '../../types/snapshot.ts';
import { generateUUID } from '../../utils/uuid.ts';

const SNAPSHOT_KEY_PREFIX = 'nexus_lab_snapshots_';
const MAX_SNAPSHOTS_PER_PROJECT = 30;

function getStorageKey(projectId: string): string {
  return `${SNAPSHOT_KEY_PREFIX}${projectId}`;
}

/**
 * Charge tous les instantanés associés à un projet.
 */
export function loadSnapshots(projectId: string): ProjectSnapshot[] {
  if (!projectId || typeof window === 'undefined') return [];

  try {
    const raw = localStorage.getItem(getStorageKey(projectId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch (err) {
    console.warn(`[SnapshotService] Erreur lecture snapshots pour ${projectId}:`, err);
    return [];
  }
}

/**
 * Enregistre la liste d'instantanés dans le stockage local.
 */
export function saveSnapshots(projectId: string, snapshots: ProjectSnapshot[]): void {
  if (!projectId || typeof window === 'undefined') return;

  try {
    // Plafonnement des snapshots pour préserver la mémoire
    const bounded = snapshots.slice(0, MAX_SNAPSHOTS_PER_PROJECT);
    localStorage.setItem(getStorageKey(projectId), JSON.stringify(bounded));
  } catch (err) {
    console.error(`[SnapshotService] Erreur sauvegarde snapshots pour ${projectId}:`, err);
  }
}

/**
 * Crée un instantané de l'état actuel des fichiers du projet.
 */
export function createSnapshot(
  projectId: string,
  files: LabFile[],
  label: string,
  author: ProjectSnapshot['author'] = 'auto',
  description?: string,
): ProjectSnapshot {
  const existing = loadSnapshots(projectId);

  // Cloner profondément les fichiers pour isoler l'instantané des futures mutations
  const clonedFiles: LabFile[] = files.map((f) => ({
    id: f.id,
    name: f.name,
    path: f.path,
    content: f.content,
    language: f.language,
    isModified: false,
  }));

  const newSnapshot: ProjectSnapshot = {
    id: generateUUID(),
    projectId,
    label: label.trim() || 'Instantané sans nom',
    description: description?.trim(),
    timestamp: new Date().toISOString(),
    files: clonedFiles,
    author,
    fileCount: clonedFiles.length,
  };

  const updated = [newSnapshot, ...existing];
  saveSnapshots(projectId, updated);

  return newSnapshot;
}

/**
 * Supprime un instantané spécifique d'un projet.
 */
export function deleteSnapshot(projectId: string, snapshotId: string): ProjectSnapshot[] {
  const existing = loadSnapshots(projectId);
  const filtered = existing.filter((s) => s.id !== snapshotId);
  saveSnapshots(projectId, filtered);
  return filtered;
}

/**
 * Efface l'ensemble des instantanés d'un projet.
 */
export function clearAllSnapshots(projectId: string): void {
  if (!projectId || typeof window === 'undefined') return;
  try {
    localStorage.removeItem(getStorageKey(projectId));
  } catch (err) {
    console.warn(`[SnapshotService] Erreur purge snapshots pour ${projectId}:`, err);
  }
}
