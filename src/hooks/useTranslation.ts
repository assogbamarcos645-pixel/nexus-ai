/**
 * src/hooks/useTranslation.ts
 *
 * Hook de commodité pour accéder au contexte i18n de NEXUS AI.
 */

import { useContext } from 'react';
import { I18nContext, type I18nContextValue } from '@/i18n/i18nContextDef';

export function useTranslation(): I18nContextValue {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useTranslation doit être utilisé à l\'intérieur d\'un I18nProvider');
  }
  return context;
}

export type { SupportedLanguage, LanguageOption } from '@/i18n/types';
