/**
 * src/context/ThemeContext.tsx
 *
 * Fournisseur de thème (Dark Mode & Light Mode) pour NEXUS AI.
 * Persiste la préférence utilisateur dans localStorage et synchronise
 * la classe sur l'élément racine <html> ainsi que les métadonnées de thème.
 */

import { useState, useEffect, useCallback, useMemo, type ReactNode } from 'react';
import { ThemeContext, type Theme, type ResolvedTheme } from './themeContextDef';

const THEME_STORAGE_KEY = 'nexus_theme_preference_v1';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEY);
      if (stored === 'dark' || stored === 'light' || stored === 'system') {
        return stored;
      }
    } catch {
      // Ignorer les erreurs d'accès à localStorage (ex: sandbox)
    }
    return 'light'; // Thème lumineux par défaut fidèle à la nouvelle interface
  });

  // Calcul du thème effectif ('dark' ou 'light')
  const getSystemTheme = (): ResolvedTheme => {
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: light)').matches) {
      return 'light';
    }
    return 'dark';
  };

  const resolvedTheme: ResolvedTheme = useMemo(() => {
    if (theme === 'system') {
      return getSystemTheme();
    }
    return theme;
  }, [theme]);

  // Applique la classe sur <html> et les méta-balises
  const applyThemeToDOM = useCallback((resolved: ResolvedTheme) => {
    if (typeof document === 'undefined') return;

    const root = document.documentElement;
    if (resolved === 'dark') {
      root.classList.remove('light');
      root.classList.add('dark');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
      root.style.colorScheme = 'light';
    }

    // Mise à jour de la balise theme-color pour mobile et navigateurs
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', resolved === 'dark' ? '#070712' : '#f8f9fc');
    }

    const metaColorScheme = document.querySelector('meta[name="color-scheme"]');
    if (metaColorScheme) {
      metaColorScheme.setAttribute('content', resolved);
    }
  }, []);

  useEffect(() => {
    applyThemeToDOM(resolvedTheme);
  }, [resolvedTheme, applyThemeToDOM]);

  // Écoute des changements de préférences système
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemChange = () => {
      if (theme === 'system') {
        applyThemeToDOM(getSystemTheme());
      }
    };

    mediaQuery.addEventListener('change', handleSystemChange);
    return () => mediaQuery.removeEventListener('change', handleSystemChange);
  }, [theme, applyThemeToDOM]);

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    } catch {
      // Ignorer
    }
  }, []);

  const toggleTheme = useCallback(() => {
    const nextTheme: Theme = resolvedTheme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
  }, [resolvedTheme, setTheme]);

  const contextValue = useMemo(
    () => ({
      theme,
      resolvedTheme,
      setTheme,
      toggleTheme,
    }),
    [theme, resolvedTheme, setTheme, toggleTheme],
  );

  return <ThemeContext.Provider value={contextValue}>{children}</ThemeContext.Provider>;
}

