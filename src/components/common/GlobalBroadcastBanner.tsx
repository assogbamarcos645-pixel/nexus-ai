/**
 * src/components/common/GlobalBroadcastBanner.tsx
 *
 * Banniere d'annonce globale diffusee en temps reel a tous les utilisateurs.
 */

import React, { useState, useEffect } from 'react';
import { AlertTriangle, AlertOctagon, X, Sparkles } from 'lucide-react';
import { getBroadcastBanner } from '../../services/admin/adminBroadcastService.ts';
import type { BroadcastBanner } from '../../types/admin.ts';

export const GlobalBroadcastBanner: React.FC = () => {
  const [banner, setBanner] = useState<BroadcastBanner | null>(null);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const loadBanner = () => {
      const b = getBroadcastBanner();
      if (!b || !b.enabled) {
        setBanner(null);
        return;
      }
      const dismissedId = sessionStorage.getItem('nexus_dismissed_broadcast_id');
      if (dismissedId === b.id) {
        setIsDismissed(true);
      } else {
        setIsDismissed(false);
      }
      setBanner(b);
    };

    loadBanner();

    const handleUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<BroadcastBanner>;
      if (customEvent.detail) {
        setBanner(customEvent.detail);
        setIsDismissed(false);
      } else {
        loadBanner();
      }
    };

    window.addEventListener('nexus:broadcast-updated', handleUpdate);
    return () => window.removeEventListener('nexus:broadcast-updated', handleUpdate);
  }, []);

  if (!banner || !banner.enabled || isDismissed) {
    return null;
  }

  const handleDismiss = () => {
    setIsDismissed(true);
    if (banner.id) {
      sessionStorage.setItem('nexus_dismissed_broadcast_id', banner.id);
    }
  };

  const getTheme = () => {
    switch (banner.type) {
      case 'urgent':
        return {
          wrapper: 'bg-red-600/90 text-white border-b border-red-700/60 shadow-md backdrop-blur-md',
          badge: 'bg-white/20 text-white font-bold',
          icon: <AlertOctagon size={16} className="text-white shrink-0 animate-pulse" />,
        };
      case 'warning':
        return {
          wrapper: 'bg-amber-500/90 text-slate-950 border-b border-amber-600/60 shadow-md backdrop-blur-md',
          badge: 'bg-slate-950/15 text-slate-950 font-bold',
          icon: <AlertTriangle size={16} className="text-slate-950 shrink-0" />,
        };
      case 'info':
      default:
        return {
          wrapper: 'bg-linear-to-r from-indigo-900/90 via-purple-900/90 to-blue-900/90 text-white border-b border-indigo-700/50 shadow-md backdrop-blur-md',
          badge: 'bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 font-semibold',
          icon: <Sparkles size={16} className="text-indigo-300 shrink-0" />,
        };
    }
  };

  const theme = getTheme();

  return (
    <div
      role="alert"
      className={`relative z-50 w-full px-4 py-2 transition-all duration-300 flex items-center justify-between gap-3 text-xs md:text-sm ${theme.wrapper}`}
    >
      <div className="flex items-center gap-2.5 mx-auto max-w-6xl overflow-hidden">
        {theme.icon}
        <span className={`px-2 py-0.5 rounded-full text-[11px] uppercase tracking-wider ${theme.badge}`}>
          {banner.type}
        </span>
        <strong className="font-semibold truncate">{banner.title} :</strong>
        <span className="text-white/90 truncate hidden sm:inline">{banner.message}</span>
        <span className="text-white/90 truncate sm:hidden">{banner.message}</span>
      </div>

      {banner.allowDismiss && (
        <button
          type="button"
          onClick={handleDismiss}
          className="p-1 rounded-md text-white/80 hover:text-white hover:bg-white/10 transition-colors shrink-0 cursor-pointer"
          title="Fermer cette annonce"
          aria-label="Fermer"
        >
          <X size={15} />
        </button>
      )}
    </div>
  );
};
