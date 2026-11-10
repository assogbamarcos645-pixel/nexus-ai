/**
 * src/components/auth/LocalDataImportBanner.tsx
 *
 * Bannière de confirmation pour le transfert explicite des données locales vers le cloud.
 * Respecte strictement l'exigence de sécurité :
 * « Ne transfère aucune conversation ou aucun fichier vers un service externe sans action explicite de l'utilisateur ».
 */

import { useState } from 'react';
import { CloudUpload, Database, X, AlertCircle } from 'lucide-react';
import { useSync } from '@/hooks/useSync';
import { Spinner } from '@/components/ui/Spinner';

export function LocalDataImportBanner() {
  const {
    hasLocalDataPendingImport,
    localDataSummary,
    importLocalDataToCloud,
    dismissPendingImport,
  } = useSync();

  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!hasLocalDataPendingImport) return null;

  const handleImport = async () => {
    setIsImporting(true);
    setError(null);
    const res = await importLocalDataToCloud();
    setIsImporting(false);
    if (!res.success && res.error) {
      setError(res.error);
    }
  };

  return (
    <div
      role="region"
      aria-label="Proposition d'importation des données locales"
      className="bg-gradient-to-r from-nexus-950 via-surface-900 to-nexus-950 border-b border-cyan-500/30 px-4 py-2.5 text-xs text-white z-40 relative flex items-center justify-between gap-4 shadow-lg animate-in slide-in-from-top-2 duration-200"
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shrink-0">
          <Database size={15} />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-cyan-200 truncate">
              Données locales détectées sur cet appareil
            </span>
            <span className="hidden sm:inline text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-white/80 font-mono">
              {localDataSummary.conversations} conversation(s), {localDataSummary.projects} projet(s)
            </span>
          </div>
          <p className="text-[11px] text-white/70 truncate hidden md:block">
            Ces éléments ont été créés localement. Souhaitez-vous les transférer vers votre compte cloud sécurisé ?
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {error && (
          <span className="text-red-400 text-[11px] hidden lg:inline flex items-center gap-1">
            <AlertCircle size={12} /> {error}
          </span>
        )}

        <button
          type="button"
          id="btn-import-local-data"
          onClick={handleImport}
          disabled={isImporting}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-gradient-to-r from-nexus-600 to-cyan-600 hover:from-nexus-500 hover:to-cyan-500 shadow-[0_0_12px_rgba(6,182,212,0.35)] transition-all cursor-pointer disabled:opacity-50"
        >
          {isImporting ? (
            <Spinner size="sm" />
          ) : (
            <>
              <CloudUpload size={13} />
              <span>Transférer au Cloud</span>
            </>
          )}
        </button>

        <button
          type="button"
          id="btn-dismiss-local-import"
          onClick={dismissPendingImport}
          className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          title="Conserver uniquement en local sur cet appareil"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
