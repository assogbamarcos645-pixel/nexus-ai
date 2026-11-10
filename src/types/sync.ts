/**
 * src/types/sync.ts
 *
 * Types pour la synchronisation cloud des conversations, souvenirs et projets.
 */

export type SyncStatus = 'unconfigured' | 'local' | 'syncing' | 'synced' | 'offline' | 'error';

export interface SyncStats {
  conversationsCount: number;
  projectsCount: number;
  memoriesCount: number;
  lastSyncedAt: string | null;
}

export interface SyncContextType {
  status: SyncStatus;
  stats: SyncStats;
  isOnline: boolean;
  lastSyncedAt: Date | null;
  errorMessage: string | null;
  hasLocalDataPendingImport: boolean;
  localDataSummary: {
    conversations: number;
    projects: number;
  };
  syncNow: () => Promise<void>;
  importLocalDataToCloud: () => Promise<{ success: boolean; error?: string }>;
  dismissPendingImport: () => void;
  clearCloudData: () => Promise<void>;
}
