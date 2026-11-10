/**
 * src/i18n/I18nContext.tsx
 *
 * Contexte React pour la gestion de l'internationalisation (i18n) de NEXUS AI.
 * Fournit la fonction de traduction typée `t()`, la sélection de langue réactive,
 * la persistance locale et le formatage régional (Intl).
 */

import { useState, useEffect, useMemo, type ReactNode } from 'react';
import type { SupportedLanguage, TranslationSchema } from './types.ts';
import {
  SUPPORTED_LANGUAGES,
  DEFAULT_LANGUAGE,
  LANGUAGE_STORAGE_KEY,
} from './types.ts';
import { I18nContext, type I18nContextValue } from './i18nContextDef.ts';
import { fr } from './locales/fr.ts';
import { en } from './locales/en.ts';

const dictionaries: Record<SupportedLanguage, TranslationSchema> = {
  fr,
  en,
};

function getInitialLanguage(): SupportedLanguage {
  try {
    const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (saved === 'fr' || saved === 'en') {
      return saved;
    }

    // Détection via les paramètres de langue du navigateur
    if (typeof navigator !== 'undefined' && navigator.language) {
      const browserLang = navigator.language.slice(0, 2).toLowerCase();
      if (browserLang === 'en') return 'en';
      if (browserLang === 'fr') return 'fr';
    }
  } catch {
    // Environnements sans accès au localStorage
  }
  return DEFAULT_LANGUAGE;
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<SupportedLanguage>(getInitialLanguage);

  const setLanguage = (newLang: SupportedLanguage) => {
    setLanguageState(newLang);
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, newLang);
      document.documentElement.lang = newLang;
    } catch (err) {
      console.warn('[NEXUS i18n] Impossible de persister la langue:', err);
    }
  };

  useEffect(() => {
    try {
      document.documentElement.lang = language;
    } catch {
      // Ignoré
    }
  }, [language]);

  // Fonction de recherche de clé avec fallback sur le français
  const t = useMemo(() => {
    return (keyPath: string, params?: Record<string, string | number>): string => {
      const keys = keyPath.split('.');
      const currentDict = dictionaries[language];
      const fallbackDict = dictionaries[DEFAULT_LANGUAGE];

      let value: any = currentDict;
      for (const k of keys) {
        if (value && typeof value === 'object' && k in value) {
          value = value[k];
        } else {
          value = undefined;
          break;
        }
      }

      // Si non trouvé dans la langue active, tenter le fallback français
      if (value === undefined || typeof value !== 'string') {
        let fallbackVal: any = fallbackDict;
        for (const k of keys) {
          if (fallbackVal && typeof fallbackVal === 'object' && k in fallbackVal) {
            fallbackVal = fallbackVal[k];
          } else {
            fallbackVal = undefined;
            break;
          }
        }
        value = fallbackVal;
      }

      // Si toujours introuvable, afficher la clé brute
      if (typeof value !== 'string') {
        return keyPath;
      }

      // Substitution des variables d'interpolation {param}
      if (params) {
        return Object.entries(params).reduce((acc, [paramKey, paramVal]) => {
          return acc.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(paramVal));
        }, value);
      }

      return value;
    };
  }, [language]);

  // Formatage régional des dates
  const formatDate = useMemo(() => {
    return (date: Date | string | number, options?: Intl.DateTimeFormatOptions): string => {
      const d = date instanceof Date ? date : new Date(date);
      if (isNaN(d.getTime())) return '';
      try {
        const locale = language === 'fr' ? 'fr-FR' : 'en-US';
        return new Intl.DateTimeFormat(locale, options || { dateStyle: 'medium', timeStyle: 'short' }).format(d);
      } catch {
        return d.toLocaleDateString();
      }
    };
  }, [language]);

  // Formatage des nombres
  const formatNumber = useMemo(() => {
    return (value: number, options?: Intl.NumberFormatOptions): string => {
      if (typeof value !== 'number' || isNaN(value)) return '0';
      try {
        const locale = language === 'fr' ? 'fr-FR' : 'en-US';
        return new Intl.NumberFormat(locale, options).format(value);
      } catch {
        return value.toString();
      }
    };
  }, [language]);

  // Formatage de devise (USD par défaut pour les LLM)
  const formatCurrency = useMemo(() => {
    return (value: number, currency = 'USD'): string => {
      if (typeof value !== 'number' || isNaN(value)) return '$0.00';
      try {
        const locale = language === 'fr' ? 'fr-FR' : 'en-US';
        return new Intl.NumberFormat(locale, {
          style: 'currency',
          currency,
          minimumFractionDigits: 2,
          maximumFractionDigits: 4,
        }).format(value);
      } catch {
        return `$${value.toFixed(4)}`;
      }
    };
  }, [language]);

  const value: I18nContextValue = {
    language,
    setLanguage,
    supportedLanguages: SUPPORTED_LANGUAGES,
    t,
    formatDate,
    formatNumber,
    formatCurrency,
  };

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}
