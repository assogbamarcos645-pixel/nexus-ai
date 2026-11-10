/**
 * src/i18n/i18nContextDef.ts
 *
 * Définition du contexte d'internationalisation pour le support React Fast Refresh.
 */

import { createContext } from 'react';
import type { SupportedLanguage, LanguageOption } from './types.ts';

export interface I18nContextValue {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  supportedLanguages: LanguageOption[];
  t: (keyPath: string, params?: Record<string, string | number>) => string;
  formatDate: (date: Date | string | number, options?: Intl.DateTimeFormatOptions) => string;
  formatNumber: (value: number, options?: Intl.NumberFormatOptions) => string;
  formatCurrency: (value: number, currency?: string) => string;
}

export const I18nContext = createContext<I18nContextValue | null>(null);

