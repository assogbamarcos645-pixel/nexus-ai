/**
 * src/components/ui/ModalCloseButton.tsx
 *
 * Bouton de fermeture standardisé, ultra-visible et accessible pour l'ensemble
 * des modales, volets coulissants (drawers) et fenêtres contextuelles de NEXUS AI.
 */

import React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface ModalCloseButtonProps {
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  label?: string;
  title?: string;
  className?: string;
  id?: string;
  compact?: boolean;
}

export function ModalCloseButton({
  onClick,
  label = 'Fermer',
  title = 'Fermer (Échap)',
  className,
  id,
  compact = false,
}: ModalCloseButtonProps) {
  return (
    <button
      type="button"
      id={id}
      onClick={onClick}
      aria-label={label}
      title={title}
      className={cn(
        // Disposition & Cible tactile
        'group relative inline-flex items-center justify-center gap-1.5 shrink-0 select-none cursor-pointer',
        'rounded-xl text-xs font-semibold transition-all duration-200',
        'border shadow-sm hover:scale-105 active:scale-95',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-1',
        // Couleurs & Visibilité forte (Dark & Light)
        'text-slate-800 dark:text-white',
        'bg-slate-100/90 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20',
        'border-slate-300/80 dark:border-white/20 hover:border-slate-400 dark:hover:border-cyan-400/50',
        'hover:shadow-[0_0_15px_rgba(6,182,212,0.25)] dark:hover:shadow-[0_0_15px_rgba(124,13,244,0.35)]',
        compact ? 'px-2.5 py-1.5' : 'px-3 py-1.5',
        className,
      )}
    >
      <X
        size={15}
        className="text-slate-500 dark:text-white/70 group-hover:text-rose-500 dark:group-hover:text-rose-400 transition-colors shrink-0"
      />
      <span className={cn('text-[11px] font-bold tracking-wide', compact && 'hidden sm:inline')}>
        {label}
      </span>
    </button>
  );
}
