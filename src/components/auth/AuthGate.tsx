/**
 * src/components/auth/AuthGate.tsx
 *
 * Composant de protection d'accès pour les fonctionnalités nécessitant une connexion.
 * Affiche une interface élégante « Cosmic Intelligence » invitant l'utilisateur
 * à s'authentifier sans simuler une fausse session.
 */

import { Lock, ShieldCheck, Sparkles, LogIn, Database, Cloud } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

interface AuthGateProps {
  title?: string;
  description?: string;
  onOpenAuth: () => void;
}

export function AuthGate({
  title,
  description,
  onOpenAuth,
}: AuthGateProps) {
  const { t, language } = useTranslation();
  const activeTitle = title || t('auth.authGateTitle');
  const activeDescription = description || t('auth.authGateDesc');

  return (
    <div className="flex flex-col items-center justify-center p-8 text-center max-w-lg mx-auto animate-in fade-in duration-200">
      <div className="relative mb-5">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-nexus-600 via-nexus-500 to-cyan-500 flex items-center justify-center text-white shadow-[0_0_30px_rgba(124,13,244,0.5)]">
          <Lock size={28} />
        </div>
        <div className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-full bg-surface-950 border-2 border-cyan-400 flex items-center justify-center text-cyan-300 shadow-sm">
          <Sparkles size={14} />
        </div>
      </div>

      <h3 className="text-base font-bold text-white mb-2 tracking-wide">
        {activeTitle}
      </h3>

      <p className="text-xs text-white/70 leading-relaxed mb-6">
        {activeDescription}
      </p>

      {/* Avantages de sécurité */}
      <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-6 text-left">
        <div className="p-3 rounded-xl bg-surface-900 border border-white/6 space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-cyan-300">
            <ShieldCheck size={14} />
            <span>{language === 'fr' ? 'Sécurité RLS' : 'RLS Security'}</span>
          </div>
          <p className="text-[10px] text-white/50 leading-tight">
            {language === 'fr'
              ? 'Seul votre compte a accès à vos données privées au niveau de la base.'
              : 'Row Level Security ensures only your account accesses your private data.'}
          </p>
        </div>

        <div className="p-3 rounded-xl bg-surface-900 border border-white/6 space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-nexus-300">
            <Cloud size={14} />
            <span>{language === 'fr' ? 'Multi-Appareils' : 'Cross-Device'}</span>
          </div>
          <p className="text-[10px] text-white/50 leading-tight">
            {language === 'fr'
              ? 'Retrouvez vos conversations, projets et souvenirs sur tous vos écrans.'
              : 'Synchronize your conversations, projects, and memories across screens.'}
          </p>
        </div>

        <div className="p-3 rounded-xl bg-surface-900 border border-white/6 space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-300">
            <Database size={14} />
            <span>{language === 'fr' ? 'Sauvegarde' : 'Cloud Backup'}</span>
          </div>
          <p className="text-[10px] text-white/50 leading-tight">
            {language === 'fr'
              ? 'Protection contre la perte de données en cas de nettoyage du navigateur.'
              : 'Resilient storage preventing data loss when browser cache is cleared.'}
          </p>
        </div>
      </div>

      <button
        type="button"
        id="btn-gate-open-auth"
        onClick={onOpenAuth}
        className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-nexus-600 to-cyan-600 hover:from-nexus-500 hover:to-cyan-500 shadow-[0_0_25px_rgba(124,13,244,0.4)] transition-all cursor-pointer"
      >
        <LogIn size={15} />
        <span>{language === 'fr' ? 'Se connecter ou créer un compte' : 'Sign in or create account'}</span>
      </button>
    </div>
  );
}
