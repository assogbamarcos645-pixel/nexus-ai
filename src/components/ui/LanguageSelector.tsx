/**
 * src/components/ui/LanguageSelector.tsx
 *
 * Sélecteur de langue accessible et responsive pour NEXUS AI.
 * Permet de basculer instantanément entre Français et Anglais.
 * N'utilise pas uniquement des drapeaux (conformité a11y) et respecte le thème Cosmic.
 */

import { useState, useRef, useEffect } from 'react';
import { Globe, Check, ChevronDown } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import type { SupportedLanguage } from '@/i18n/types';
import { cn } from '@/utils/cn';

interface LanguageSelectorProps {
  variant?: 'header' | 'compact' | 'dropdown';
  className?: string;
}

export function LanguageSelector({ variant = 'header', className }: LanguageSelectorProps) {
  const { language, setLanguage, supportedLanguages, t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fermer le menu lors d'un clic extérieur
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isOpen]);

  const activeLangOption = supportedLanguages.find((l) => l.code === language) || supportedLanguages[0];

  const handleSelectLanguage = (code: SupportedLanguage) => {
    setLanguage(code);
    setIsOpen(false);
  };

  // ─── Variante Segmented / Header ──────────────────────────────────────────
  if (variant === 'header') {
    return (
      <div
        ref={containerRef}
        className={cn('relative inline-flex items-center', className)}
        id="nexus-language-selector"
      >
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-label={t('nav.languageAria')}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-surface-900 hover:bg-white/10 border border-white/10 text-white/80 hover:text-white text-xs font-medium transition-all cursor-pointer shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
          title={`${t('nav.language')} : ${activeLangOption.nativeName}`}
        >
          <Globe size={13} className="text-cyan-400" />
          <span className="font-semibold tracking-wide uppercase text-[11px]">{activeLangOption.flagSymbol}</span>
          <ChevronDown size={11} className={cn('text-white/40 transition-transform duration-200', isOpen && 'rotate-180')} />
        </button>

        {isOpen && (
          <div
            role="listbox"
            aria-label={t('nav.language')}
            className="absolute right-0 top-full mt-1.5 w-36 rounded-xl bg-surface-900/95 border border-white/12 shadow-[0_10px_25px_rgba(0,0,0,0.5)] backdrop-blur-xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="px-3 py-1 text-[10px] uppercase font-semibold tracking-wider text-white/40 border-b border-white/6 mb-1">
              {t('nav.language')}
            </div>

            {supportedLanguages.map((lang) => {
              const isSelected = lang.code === language;
              return (
                <button
                  key={lang.code}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSelectLanguage(lang.code)}
                  className={cn(
                    'w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-left transition-colors cursor-pointer',
                    isSelected
                      ? 'bg-nexus-600/30 text-cyan-300 font-semibold'
                      : 'text-white/80 hover:text-white hover:bg-white/6',
                  )}
                >
                  <span className="flex items-center gap-2">
                    <span className="font-mono text-[10px] px-1 py-0.5 rounded bg-white/8 border border-white/10 uppercase">
                      {lang.flagSymbol}
                    </span>
                    <span>{lang.nativeName}</span>
                  </span>
                  {isSelected && <Check size={13} className="text-cyan-400" />}
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // ─── Variante Compacte / Direct Toggle ────────────────────────────────────
  return (
    <div
      className={cn('inline-flex items-center rounded-lg bg-surface-900 border border-white/8 p-0.5', className)}
      role="group"
      aria-label={t('nav.languageAria')}
    >
      {supportedLanguages.map((lang) => {
        const isSelected = lang.code === language;
        return (
          <button
            key={lang.code}
            type="button"
            onClick={() => setLanguage(lang.code)}
            aria-pressed={isSelected}
            className={cn(
              'px-2 py-1 rounded text-[11px] font-semibold transition-all cursor-pointer',
              isSelected
                ? 'bg-nexus-600 text-white shadow-sm'
                : 'text-white/50 hover:text-white hover:bg-white/5',
            )}
          >
            {lang.flagSymbol}
          </button>
        );
      })}
    </div>
  );
}

