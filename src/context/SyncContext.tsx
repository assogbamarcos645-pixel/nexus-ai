/**
 * src/context/SyncContext.tsx
 *
 * Fournisseur d'état de synchronisation cloud pour NEXUS AI.
 * Surveille la connectivité, synchronise de manière asynchrone sécurisée
 * et permet l'import contrôlé des données locales sur validation explicite de l'utilisateur.
 */

import { useState, useEffect, useCallback, useMemo, type ReactNode } from 'react';
import { SyncContext } from './syncContextDef';
import { useAuth } from '@/hooks/useAuth';
import {
  fetchCloudConversations,
  fetchCloudProjects,
  fetchCloudMemories,
  saveConversationToCloud,
  saveProjectToCloud,
} from '@/services/sync/syncService';
import { loadProjectsFromStorage } from '@/services/lab/projectService';
import type { SyncStatus, SyncStats } from '@/types/sync';

export function SyncProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated, isConfigured } = useAuth();

  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [isDismissedPendingImport, setIsDismissedPendingImport] = useState<boolean>(false);
  const [syncProcess, setSyncProcess] = useState<{
    isSyncing: boolean;
    hasSyncedOnce: boolean;
    errorMessage: string | null;
  }>({
    isSyncing: false,
    hasSyncedOnce: false,
    errorMessage: null,
  });

  const [stats, setStats] = useState<SyncStats>({
    conversationsCount: 0,
    projectsCount: 0,
    memoriesCount: 0,
    lastSyncedAt: null,
  });

  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);

  // Écoute des changements de connectivité réseau
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Dérivation propre du statut sans effet de cascade
  const status: SyncStatus = useMemo(() => {
    if (!isConfigured) return 'unconfigured';
    if (!isOnline) return 'offline';
    if (!isAuthenticated) return 'local';
    if (syncProcess.isSyncing) return 'syncing';
    if (syncProcess.errorMessage) return 'error';
    if (syncProcess.hasSyncedOnce) return 'synced';
    return 'local';
  }, [isConfigured, isOnline, isAuthenticated, syncProcess]);

  // Synchronisation avec le cloud
  const syncNow = useCallback(async () => {
    if (!isConfigured || !isAuthenticated || !user || !navigator.onLine) {
      return;
    }

    setSyncProcess((prev) => ({ ...prev, isSyncing: true, errorMessage: null }));

    try {
      const [cloudConvs, cloudProjs, cloudMems] = await Promise.all([
        fetchCloudConversations(user.id),
        fetchCloudProjects(user.id),
        fetchCloudMemories(user.id),
      ]);

      const now = new Date();
      setLastSyncedAt(now);
      setStats({
        conversationsCount: cloudConvs.length,
        projectsCount: cloudProjs.length,
        memoriesCount: cloudMems.length,
        lastSyncedAt: now.toISOString(),
      });

      setSyncProcess({ isSyncing: false, hasSyncedOnce: true, errorMessage: null });
    } catch (err: any) {
      console.error('[NEXUS SYNC] Erreur de synchronisation:', err);
      setSyncProcess({
        isSyncing: false,
        hasSyncedOnce: false,
        errorMessage: err?.message || 'Erreur lors de la synchronisation cloud.',
      });
    }
  }, [isConfigured, isAuthenticated, user]);

  // Déclenchement automatique de la synchronisation lors de la connexion
  useEffect(() => {
    let isMounted = true;
    if (isConfigured && isAuthenticated && isOnline && user) {
      Promise.all([
        fetchCloudConversations(user.id),
        fetchCloudProjects(user.id),
        fetchCloudMemories(user.id),
      ])
        .then(([cloudConvs, cloudProjs, cloudMems]) => {
          if (!isMounted) return;
          const now = new Date();
          setLastSyncedAt(now);
          setStats({
            conversationsCount: cloudConvs.length,
            projectsCount: cloudProjs.length,
            memoriesCount: cloudMems.length,
            lastSyncedAt: now.toISOString(),
          });
          setSyncProcess({ isSyncing: false, hasSyncedOnce: true, errorMessage: null });
        })
        .catch((err: any) => {
          if (!isMounted) return;
          setSyncProcess({
            isSyncing: false,
            hasSyncedOnce: false,
            errorMessage: err?.message || 'Erreur lors de la synchronisation cloud.',
          });
        });
    }

    return () => {
      isMounted = false;
    };
  }, [isConfigured, isAuthenticated, isOnline, user]);

  // Vérification de la présence de données locales créées hors connexion
  const getLocalSummary = useCallback(() => {
    const rawConvs = localStorage.getItem('nexus_conversations_v1');
    let localConvsCount = 0;
    if (rawConvs) {
      try {
        const parsed = JSON.parse(rawConvs);
        localConvsCount = Array.isArray(parsed) ? parsed.filter((c: any) => !c.isCloudSynced).length : 0;
      } catch {
        localConvsCount = 0;
      }
    }
    const localProjectsCount = loadProjectsFromStorage().filter((p) => !p.isDemo && !p.isCloudSynced).length;
    return { conversations: localConvsCount, projects: localProjectsCount };
  }, []);

  const localSummary = getLocalSummary();
  const hasLocalDataPendingImport =
    isAuthenticated &&
    !isDismissedPendingImport &&
    (localSummary.conversations > 0 || localSummary.projects > 0);

  const dismissPendingImport = useCallback(() => {
    setIsDismissedPendingImport(true);
  }, []);

  // Import explicite des données locales vers le cloud après validation utilisateur
  const importLocalDataToCloud = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    if (!isAuthenticated || !user) {
      return { success: false, error: 'Vous devez être connecté pour synchroniser vos données locales.' };
    }

    setSyncProcess((prev) => ({ ...prev, isSyncing: true, errorMessage: null }));
    try {
      // 1. Import des projets locaux
      const localProjects = loadProjectsFromStorage();
      for (const proj of localProjects) {
        if (!proj.isDemo && !proj.isCloudSynced) {
          await saveProjectToCloud(user.id, { ...proj, isCloudSynced: true });
        }
      }

      // 2. Import des conversations locales si présentes
      const rawConvs = localStorage.getItem('nexus_conversations_v1');
      if (rawConvs) {
        try {
          const parsedConvs = JSON.parse(rawConvs);
          for (const conv of parsedConvs) {
            if (!conv.isCloudSynced) {
              await saveConversationToCloud(user.id, {
                ...conv,
                isCloudSynced: true,
                createdAt: new Date(conv.createdAt),
                updatedAt: new Date(conv.updatedAt),
                messages: (conv.messages || []).map((m: any) => ({
                  ...m,
                  timestamp: new Date(m.timestamp),
                })),
              });
            }
          }
        } catch (e) {
          console.warn('[NEXUS SYNC] Impossible de parser les conversations locales:', e);
        }
      }

      setIsDismissedPendingImport(true);
      await syncNow();
      return { success: true };
    } catch (err: any) {
      const msg = err?.message || 'Échec de l’importation vers le cloud.';
      setSyncProcess((prev) => ({ ...prev, isSyncing: false, errorMessage: msg }));
      return { success: false, error: msg };
    }
  }, [isAuthenticated, user, syncNow]);

  const clearCloudData = useCallback(async () => {
    setStats({
      conversationsCount: 0,
      projectsCount: 0,
      memoriesCount: 0,
      lastSyncedAt: null,
    });
    setLastSyncedAt(null);
    setSyncProcess({ isSyncing: false, hasSyncedOnce: false, errorMessage: null });
  }, []);

  return (
    <SyncContext.Provider
      value={{
        status,
        stats,
        isOnline,
        lastSyncedAt,
        errorMessage: syncProcess.errorMessage,
        hasLocalDataPendingImport,
        localDataSummary: localSummary,
        syncNow,
        importLocalDataToCloud,
        dismissPendingImport,
        clearCloudData,
      }}
    >
      {children}
    </SyncContext.Provider>
  );
}
