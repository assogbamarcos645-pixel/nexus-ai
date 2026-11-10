/**
 * src/components/ui/TokenQuotaBadge.tsx
 *
 * Jauge visuelle élégante du quota quotidien de jetons IA (Token Allowance).
 * Affiche la consommation en temps réel et permet de consulter les détails au clic.
 */

import { useState, useEffect, useRef } from 'react';
import { Zap, Sparkles, ShieldCheck, ChevronDown, RefreshCw } from 'lucide-react';
import { getDailyQuotaStatus, formatTokenCount, type QuotaStatus } from '@/services/ai/quotaService';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/utils/cn';

interface TokenQuotaBadgeProps {
  className?: string;
  onOpenAuth?: () => void;
  compact?: boolean;
}

export function TokenQuotaBadge({ className, onOpenAuth, compact = false }: TokenQuotaBadgeProps) {
  const { isAuthenticated } = useAuth();
  const [quota, setQuota] = useState<QuotaStatus>(() => getDailyQuotaStatus(isAuthenticated));
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Mettre à jour au montage et écouter les changements d'auth
  useEffect(() => {
    setQuota(getDailyQuotaStatus(isAuthenticated));

    // Rafraîchir périodiquement toutes les 15 secondes
    const interval = setInterval(() => {
      setQuota(getDailyQuotaStatus(isAuthenticated));
    }, 15000);

    return () => clearInterval(interval);
  }, [isAuthenticated]);

  // Fermer le popover au clic à l'extérieur
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const isWarning = quota.percentUsed >= 80 && !quota.isExceeded;
  const isDanger = quota.isExceeded;

  const badgeColorClasses = isDanger
    ? 'border-rose-500/50 bg-rose-500/10 text-rose-600 dark:text-rose-400'
    : isWarning
    ? 'border-amber-500/50 bg-amber-500/10 text-amber-600 dark:text-amber-400'
    : 'border-cyan-500/30 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300';

  return (
    <div className={cn('relative inline-flex items-center select-none', className)} ref={containerRef}>
      {/* Bouton de la jauge */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold border transition-all cursor-pointer shadow-xs',
          'hover:scale-105 active:scale-95',
          badgeColorClasses,
        )}
        title={`Quota IA : ${formatTokenCount(quota.usedTokens)} / ${formatTokenCount(quota.maxTokens)} jetons consommés aujourd'hui`}
        aria-label="Statut du quota de jetons IA"
      >
        <Zap size={13} className={cn(isDanger ? 'text-rose-500 animate-bounce' : 'text-cyan-400')} />
        <span className="font-mono font-bold tracking-tight">
          {formatTokenCount(quota.remainingTokens)}
        </span>
        {!compact && (
          <span className="text-[10px] opacity-70 hidden sm:inline">
            / {formatTokenCount(quota.maxTokens)}
          </span>
        )}
        <ChevronDown size={11} className={cn('opacity-60 transition-transform', isOpen && 'rotate-180')} />
      </button>

      {/* Popover détaillé */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 z-50 w-72 rounded-2xl p-4 liquid-glass border border-slate-200/90 dark:border-white/15 shadow-2xl backdrop-blur-2xl text-slate-800 dark:text-white space-y-3 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-white/10 pb-2.5">
            <div className="flex items-center gap-2">
              <Sparkles size={15} className="text-cyan-400" />
              <span className="text-xs font-bold uppercase tracking-wider">Quota IA Quotidien</span>
            </div>
            <span
              className={cn(
                'text-[10px] font-bold px-2 py-0.5 rounded-full border',
                quota.tier === 'cloud-pro'
                  ? 'bg-purple-500/15 text-purple-600 dark:text-purple-300 border-purple-500/30'
                  : 'bg-slate-200/60 dark:bg-white/10 text-slate-600 dark:text-white/60 border-slate-300 dark:border-white/15',
              )}
            >
              {quota.tier === 'cloud-pro' ? 'Compte Cloud Pro' : 'Plan Gratuit'}
            </span>
          </div>

          {/* Jauge de progression */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-medium">
              <span className="text-slate-500 dark:text-white/50">Consommation :</span>
              <span className="font-mono font-bold">{quota.percentUsed}%</span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-white/10 rounded-full h-2 overflow-hidden">
              <div
                className={cn(
                  'h-2 transition-all duration-300 rounded-full',
                  isDanger
                    ? 'bg-rose-500'
                    : isWarning
                    ? 'bg-amber-500'
                    : 'bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-500',
                )}
                style={{ width: `${quota.percentUsed}%` }}
              />
            </div>
          </div>

          {/* Statistiques en grille */}
          <div className="grid grid-cols-2 gap-2 text-xs pt-1">
            <div className="p-2 rounded-xl bg-slate-100/80 dark:bg-white/5 border border-slate-200/60 dark:border-white/5">
              <span className="text-[10px] text-slate-400 dark:text-white/40 block">Jetons restants</span>
              <span className="font-mono font-bold text-cyan-600 dark:text-cyan-300">
                {formatTokenCount(quota.remainingTokens)}
              </span>
            </div>
            <div className="p-2 rounded-xl bg-slate-100/80 dark:bg-white/5 border border-slate-200/60 dark:border-white/5">
              <span className="text-[10px] text-slate-400 dark:text-white/40 block">Requêtes aujourd'hui</span>
              <span className="font-mono font-bold text-slate-800 dark:text-white">
                {quota.requestsCount}
              </span>
            </div>
          </div>

          {/* Avertissement dépassement ou invitation à se connecter */}
          {quota.tier === 'free' && onOpenAuth && (
            <div className="pt-2 border-t border-slate-200/60 dark:border-white/10">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onOpenAuth();
                }}
                className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
              >
                <ShieldCheck size={13} />
                <span>Débloquer 500k jetons (Connexion)</span>
              </button>
            </div>
          )}

          <div className="text-[10px] text-slate-400 dark:text-white/40 font-mono text-center flex items-center justify-center gap-1">
            <RefreshCw size={10} />
            <span>Réinitialisation automatique à minuit</span>
          </div>
        </div>
      )}
    </div>
  );
}
