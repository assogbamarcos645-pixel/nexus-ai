/**
 * src/hooks/useSync.ts
 *
 * Hook pratique d'accès au contexte de synchronisation NEXUS AI.
 */

import { useContext } from 'react';
import { SyncContext } from '@/context/syncContextDef';
import type { SyncContextType } from '@/types/sync';

export function useSync(): SyncContextType {
  const context = useContext(SyncContext);
  if (!context) {
    throw new Error('useSync doit être utilisé à l’intérieur d’un <SyncProvider>');
  }
  return context;
}
