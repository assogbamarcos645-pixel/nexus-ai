/**
 * src/hooks/useAuth.ts
 *
 * Hook pratique d'accès au contexte d'authentification NEXUS AI.
 */

import { useContext } from 'react';
import { AuthContext } from '@/context/authContextDef';
import type { AuthContextType } from '@/types/auth';

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth doit être utilisé à l’intérieur d’un <AuthProvider>');
  }
  return context;
}
