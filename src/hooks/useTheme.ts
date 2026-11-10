/**
 * src/hooks/useTheme.ts
 *
 * Hook pour interagir avec le mode de thème (Dark Mode / Light Mode).
 */

import { useContext } from 'react';
import { ThemeContext, type ThemeContextValue } from '@/context/themeContextDef';

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme doit être utilisé à l\'intérieur d\'un ThemeProvider');
  }
  return context;
}

export type { Theme, ResolvedTheme } from '@/context/themeContextDef';

