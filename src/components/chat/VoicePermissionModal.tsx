import { Mic, ShieldCheck, Lock, RefreshCw, X, AlertTriangle, Settings, ShieldAlert } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

interface VoicePermissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRequestPermission: () => Promise<void> | void;
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
        className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 shadow-2xl p-6 overflow-hidden animate-nexus-pop"
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

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mb-4 leading-relaxed">
              {language === 'fr'
                ? 'Pour vous permettre de dicter vos questions et vos prompts de code à la voix, NEXUS AI utilise le microphone de votre appareil.'
                : 'To dictate questions and prompts by voice, NEXUS AI uses your device microphone.'}
            </p>

            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 mb-5">
              <ShieldCheck size={18} className="text-emerald-500 shrink-0 mt-0.5" />
              <div className="text-xs text-slate-600 dark:text-slate-300">
                <span className="font-semibold text-slate-900 dark:text-white">
                  {language === 'fr' ? 'Respect de votre vie privée' : 'Privacy guarantee'}
                </span>
                <p className="mt-0.5 text-[11.5px] text-slate-500 dark:text-slate-400 leading-normal">
                  {language === 'fr'
                    ? 'Votre voix est retranscrite en direct par votre navigateur et n’est jamais enregistrée sans votre action explicite.'
                    : 'Your voice is transcribed live by your browser and is never stored without your explicit action.'}
                </p>
              </div>
            </div>

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
                <span>{language === 'fr' ? 'Démarrer le microphone' : 'Start microphone'}</span>
              </button>
            </div>
          </div>
        ) : (
          <div>
            {/* En-tête diagnostic micro */}
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 shrink-0">
                <AlertTriangle size={24} />
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                  {language === 'fr'
                    ? 'Microphone non détecté ou bloqué'
                    : 'Microphone not detected or blocked'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {language === 'fr'
                    ? 'Guide de vérification des autorisations'
                    : 'Permissions & troubleshooting guide'}
                </p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mb-3 leading-relaxed">
              {language === 'fr'
                ? 'Si votre microphone est déjà activé dans le navigateur, vérifiez ces 3 points pour débloquer l’écoute :'
                : 'If your microphone is already enabled in browser, please check these 3 points:'}
            </p>

            {/* Étapes détaillées */}
            <div className="space-y-2.5 mb-5 max-h-[320px] overflow-y-auto scrollbar-thin pr-1">
              {/* Étape 1 : Navigateur */}
              <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 text-xs">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-500/15 text-blue-600 dark:text-sky-400 font-bold shrink-0 text-[11px] mt-0.5">
                  1
                </span>
                <div className="text-slate-700 dark:text-slate-300 leading-relaxed">
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {language === 'fr' ? 'Barre d’adresse (Navigateur) :' : 'Address bar (Browser):'}
                  </span>
                  <p className="mt-0.5">
                    {language === 'fr' ? (
                      <>
                        Cliquez sur l'icône de <Lock size={11} className="inline mx-0.5 text-slate-400" />{' '}
                        <strong>cadenas ou réglages</strong> tout à gauche de votre barre d'URL et assurez-vous que <strong>Microphone</strong> est sur <strong>Autoriser</strong>.
                      </>
                    ) : (
                      <>
                        Click the <Lock size={11} className="inline mx-0.5 text-slate-400" />{' '}
                        <strong>lock icon</strong> to the left of the URL bar and make sure <strong>Microphone</strong> is set to <strong>Allow</strong>.
                      </>
                    )}
                  </p>
                </div>
              </div>

              {/* Étape 2 : Confidentialité Windows / macOS */}
              <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 text-xs">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-500/15 text-blue-600 dark:text-sky-400 font-bold shrink-0 text-[11px] mt-0.5">
                  2
                </span>
                <div className="text-slate-700 dark:text-slate-300 leading-relaxed">
                  <span className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Settings size={12} className="text-blue-500" />
                    {language === 'fr' ? 'Paramètres Windows 10/11 (Cause fréquente) :' : 'Windows 10/11 Settings:'}
                  </span>
                  <p className="mt-0.5">
                    {language === 'fr' ? (
                      <>
                        Ouvrez les <strong>Paramètres Windows &gt; Confidentialité &gt; Microphone</strong> et vérifiez que l’option <strong>« Autoriser les applications de bureau à accéder à votre microphone »</strong> est bien <strong>Activée</strong> pour Chrome/Edge.
                      </>
                    ) : (
                      <>
                        Open <strong>Windows Settings &gt; Privacy &gt; Microphone</strong> and ensure <strong>"Let desktop apps access your microphone"</strong> is toggled <strong>ON</strong>.
                      </>
                    )}
                  </p>
                </div>
              </div>

              {/* Étape 3 : Boucliers Brave / Extensions */}
              <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 text-xs">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-500/15 text-blue-600 dark:text-sky-400 font-bold shrink-0 text-[11px] mt-0.5">
                  3
                </span>
                <div className="text-slate-700 dark:text-slate-300 leading-relaxed">
                  <span className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <ShieldAlert size={12} className="text-amber-500" />
                    {language === 'fr' ? 'Navigateur Brave ou bloqueurs stricts :' : 'Brave shields or strict blockers:'}
                  </span>
                  <p className="mt-0.5">
                    {language === 'fr' ? (
                      <>
                        Si vous utilisez <strong>Brave</strong>, désactivez les <strong>Boucliers Brave</strong> pour ce site (icône de lion) car ils bloquent par défaut le service de reconnaissance vocale.
                      </>
                    ) : (
                      <>
                        If using <strong>Brave</strong>, turn down <strong>Brave Shields</strong> (lion icon) as they block the speech service by default.
                      </>
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
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
                  window.location.reload();
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              >
                <RefreshCw size={13} />
                <span>{language === 'fr' ? 'Recharger la page' : 'Reload page'}</span>
              </button>
              <button
                type="button"
                onClick={async () => {
                  onClose();
                  await onRequestPermission();
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 active:bg-blue-700 shadow-md shadow-blue-500/20 transition-all cursor-pointer"
              >
                <Mic size={13} />
                <span>{language === 'fr' ? 'Réessayer le microphone' : 'Retry microphone'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
