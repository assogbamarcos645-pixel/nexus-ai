/**
 * src/context/syncContextDef.ts
 *
 * Définition du contexte de synchronisation cloud pour Fast Refresh.
 */

import { createContext } from 'react';
import type { SyncContextType } from '@/types/sync';

export const SyncContext = createContext<SyncContextType | undefined>(undefined);
