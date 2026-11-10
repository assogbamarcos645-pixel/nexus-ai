/**
 * src/components/auth/SyncStatusIndicator.tsx
 *
 * Indicateur visuel d'état de synchronisation cloud.
 * Affiche l'icône nuage avec états explicites (non configuré, local, synchronisation,
 * synchronisé, hors ligne, erreur) et infobulle d'information.
 */

import { Cloud, CloudOff, RefreshCw, WifiOff, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useSync } from '@/hooks/useSync';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/utils/cn';

interface SyncStatusIndicatorProps {
  onClick: () => void;
}

export function SyncStatusIndicator({ onClick }: SyncStatusIndicatorProps) {
  const { status, isOnline, lastSyncedAt } = useSync();
  const { isAuthenticated, isConfigured } = useAuth();

  const getStatusConfig = () => {
    if (!isConfigured) {
      return {
        icon: <CloudOff size={13} className="text-white/40" />,
        text: 'Local',
        title: 'Cloud non configuré (données conservées localement)',
        badgeClass: 'bg-white/5 text-white/50 border-white/8',
      };
    }

    if (!isOnline) {
      return {
        icon: <WifiOff size={13} className="text-amber-400" />,
        text: 'Hors ligne',
        title: 'Connexion réseau interrompue',
        badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
      };
    }

    if (!isAuthenticated) {
      return {
        icon: <Cloud size={13} className="text-white/50" />,
        text: 'Local',
        title: 'Non connecté : données stockées localement dans le navigateur',
        badgeClass: 'bg-white/5 text-white/60 border-white/10 hover:border-nexus-500/40',
      };
    }

    switch (status) {
      case 'syncing':
        return {
          icon: <RefreshCw size={13} className="text-cyan-400 animate-spin" />,
          text: 'Sync...',
          title: 'Synchronisation cloud en cours avec Supabase',
          badgeClass: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
        };
      case 'synced':
        return {
          icon: <CheckCircle2 size={13} className="text-emerald-400" />,
          text: 'Synchronisé',
          title: `Données cloud à jour (${lastSyncedAt ? lastSyncedAt.toLocaleTimeString('fr-FR') : 'à l’instant'})`,
          badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
        };
      case 'error':
        return {
          icon: <AlertTriangle size={13} className="text-red-400" />,
          text: 'Erreur sync',
          title: 'Erreur lors de la synchronisation cloud',
          badgeClass: 'bg-red-500/15 text-red-300 border-red-500/30',
        };
      default:
        return {
          icon: <Cloud size={13} className="text-white/40" />,
          text: 'Local',
          title: 'Mode local',
          badgeClass: 'bg-white/5 text-white/50 border-white/8',
        };
    }
  };

  const config = getStatusConfig();

  return (
    <button
      type="button"
      id="btn-sync-status"
      onClick={onClick}
      title={config.title}
      className={cn(
        'flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono border transition-all cursor-pointer',
        config.badgeClass,
      )}
    >
      {config.icon}
      <span className="hidden sm:inline text-[11px] font-medium">{config.text}</span>
    </button>
  );
}
