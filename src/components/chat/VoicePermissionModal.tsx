import { Mic, ShieldCheck, Lock, RefreshCw, X, AlertTriangle } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

interface VoicePermissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRequestPermission: () => Promise<void>;
  status: 'request' | 'blocked';
}

export function VoicePermissionModal({
  isOpen,
  onClose,
  onRequestPermission,
  status,
}: VoicePermissionModalProps) {
  const { language } = useTranslation();

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-2xl bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 shadow-2xl p-6 overflow-hidden animate-nexus-pop"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Bouton de fermeture en haut à droite */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          aria-label={language === 'fr' ? 'Fermer' : 'Close'}
        >
          <X size={16} />
        </button>

        {status === 'request' ? (
          <div>
            {/* En-tête demande d'accès */}
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-sky-400">
                <Mic size={24} />
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                  {language === 'fr'
                    ? 'Autoriser l’accès au microphone'
                    : 'Allow microphone access'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {language === 'fr'
                    ? 'Reconnaissance vocale NEXUS AI'
                    : 'NEXUS AI Speech-to-Text'}
                </p>
              </div>
            </div>

            {/* Description */}
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mb-4 leading-relaxed">
              {language === 'fr'
                ? 'Pour vous permettre de dicter vos questions, vos analyses et vos prompts de code à la voix, NEXUS AI a besoin de votre permission pour utiliser le microphone de votre appareil.'
                : 'To allow you to dictate your questions, analysis and code prompts by voice, NEXUS AI needs your permission to use your device microphone.'}
            </p>

            {/* Garantie de confidentialité */}
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 mb-5">
              <ShieldCheck size={18} className="text-emerald-500 shrink-0 mt-0.5" />
              <div className="text-xs text-slate-600 dark:text-slate-300">
                <span className="font-semibold text-slate-900 dark:text-white">
                  {language === 'fr' ? 'Respect de votre vie privée' : 'Privacy guarantee'}
                </span>
                <p className="mt-0.5 text-[11.5px] text-slate-500 dark:text-slate-400 leading-normal">
                  {language === 'fr'
                    ? 'Votre voix est retranscrite en direct par le navigateur et n’est jamais enregistrée sans votre action explicite.'
                    : 'Your voice is transcribed live by your browser and is never stored without your explicit action.'}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                {language === 'fr' ? 'Pas maintenant' : 'Not now'}
              </button>
              <button
                type="button"
                onClick={async () => {
                  await onRequestPermission();
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 active:bg-blue-700 shadow-md shadow-blue-500/20 transition-all cursor-pointer"
              >
                <Mic size={14} />
                <span>{language === 'fr' ? 'Autoriser le microphone' : 'Allow microphone'}</span>
              </button>
            </div>
          </div>
        ) : (
          <div>
            {/* En-tête micro bloqué */}
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400">
                <AlertTriangle size={24} />
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                  {language === 'fr'
                    ? 'Microphone actuellement bloqué'
                    : 'Microphone currently blocked'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {language === 'fr'
                    ? 'Autorisation requise dans le navigateur'
                    : 'Browser permission required'}
                </p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mb-3 leading-relaxed">
              {language === 'fr'
                ? 'Le navigateur a mémorisé un refus pour ce site. Pour réactiver le microphone :'
                : 'The browser has saved a blocked permission for this site. To re-enable the microphone:'}
            </p>

            {/* Étapes illustrées */}
            <div className="space-y-2 mb-5">
              <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 text-xs">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-500/15 text-blue-600 dark:text-sky-400 font-bold shrink-0 text-[11px]">
                  1
                </span>
                <span className="text-slate-700 dark:text-slate-300">
                  {language === 'fr' ? (
                    <>
                      Cliquez sur l'icône de <Lock size={12} className="inline mx-0.5 text-slate-400" />{' '}
                      <strong>cadenas</strong> ou réglages tout à gauche de votre barre d'adresse URL.
                    </>
                  ) : (
                    <>
                      Click the <Lock size={12} className="inline mx-0.5 text-slate-400" />{' '}
                      <strong>lock icon</strong> to the left of the address bar.
                    </>
                  )}
                </span>
              </div>

              <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 text-xs">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-500/15 text-blue-600 dark:text-sky-400 font-bold shrink-0 text-[11px]">
                  2
                </span>
                <span className="text-slate-700 dark:text-slate-300">
                  {language === 'fr' ? (
                    <>
                      Basculez <strong>« Microphone »</strong> sur <strong>Autoriser</strong>.
                    </>
                  ) : (
                    <>
                      Toggle <strong>"Microphone"</strong> to <strong>Allow</strong>.
                    </>
                  )}
                </span>
              </div>

              <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 text-xs">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-500/15 text-blue-600 dark:text-sky-400 font-bold shrink-0 text-[11px]">
                  3
                </span>
                <span className="text-slate-700 dark:text-slate-300">
                  {language === 'fr' ? (
                    <>Rechargez la page avec le bouton ci-dessous pour appliquer le changement.</>
                  ) : (
                    <>Reload the page with the button below to apply changes.</>
                  )}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                {language === 'fr' ? 'Fermer' : 'Close'}
              </button>
              <button
                type="button"
                onClick={() => {
                  try {
                    localStorage.removeItem('nexus_mic_permission');
                  } catch {}
                  window.location.reload();
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              >
                <RefreshCw size={13} />
                <span>{language === 'fr' ? 'Recharger' : 'Reload'}</span>
              </button>
              <button
                type="button"
                onClick={async () => {
                  try {
                    localStorage.removeItem('nexus_mic_permission');
                  } catch {}
                  await onRequestPermission();
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 active:bg-blue-700 shadow-md shadow-blue-500/20 transition-all cursor-pointer"
              >
                <Mic size={13} />
                <span>{language === 'fr' ? 'Réessayer le micro' : 'Retry microphone'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
