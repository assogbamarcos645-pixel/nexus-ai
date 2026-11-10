/**
 * src/components/ui/ThemeToggle.tsx
 *
 * Sélecteur de thème ultra-intuitif et accessible (Dark Mode / Light Mode).
 * Utilise un design de capsule glissante à deux icônes (Soleil & Lune)
 * garantissant une lisibilité absolue de l'état actif et de l'action de bascule.
 */

import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/hooks/useTranslation';
import { cn } from '@/utils/cn';

export function ThemeToggle() {
  const { resolvedTheme, toggleTheme } = useTheme();
  const { t } = useTranslation();

  const isDark = resolvedTheme === 'dark';
  const label = isDark ? t('theme.switchToLight') : t('theme.switchToDark');

  return (
    <button
      type="button"
      id="btn-theme-toggle"
      onClick={toggleTheme}
      aria-label={label}
      title={label}
      className={cn(
        'relative inline-flex items-center h-8 w-15 rounded-full p-1 transition-colors duration-300 cursor-pointer select-none',
        'bg-surface-900 border border-white/10 hover:border-white/20',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400',
      )}
    >
      {/* Icônes statiques en arrière-plan */}
      <span className="flex items-center justify-between w-full px-1 text-white/40">
        <Sun
          size={13}
          className={cn(
            'transition-opacity duration-200',
            !isDark ? 'text-amber-500 opacity-100' : 'opacity-40 hover:opacity-75',
          )}
          aria-hidden="true"
        />
        <Moon
          size={13}
          className={cn(
            'transition-opacity duration-200',
            isDark ? 'text-cyan-300 opacity-100' : 'opacity-40 hover:opacity-75',
          )}
          aria-hidden="true"
        />
      </span>

      {/* Pastille coulissante active avec animation Cosmic */}
      <span
        className={cn(
          'absolute top-1 bottom-1 w-6 h-6 rounded-full flex items-center justify-center transition-transform duration-300 ease-out shadow-sm',
          isDark
            ? 'translate-x-7 bg-nexus-600/80 text-cyan-200 border border-cyan-400/30 shadow-[0_0_12px_rgba(6,182,212,0.45)]'
            : 'translate-x-0 bg-amber-500/20 text-amber-500 border border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.35)]',
        )}
      >
        {isDark ? (
          <Moon size={12} className="text-cyan-200" aria-hidden="true" />
        ) : (
          <Sun size={12} className="text-amber-500" aria-hidden="true" />
        )}
      </span>
    </button>
  );
}
