/**
 * src/components/navigation/AppHeader.tsx
 *
 * En-tête de la zone principale NEXUS AI.
 *  - Gauche : bouton menu (mobile) + titre contextuel de la vue active.
 *  - Droite : bascule clair/sombre et menu profil (compte, langue, bibliothèque).
 */

import { useEffect, useRef, useState } from 'react';
import { Sun, Moon, ChevronDown, Menu, LogIn, UserRound, BookOpen, Languages, Check } from 'lucide-react';
import { cn } from '@/utils/cn';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/hooks/useTranslation';
import { AuthModal } from '@/components/auth/AuthModal';
import { UserProfileModal } from '@/components/auth/UserProfileModal';
import { MemoriesModal } from '@/components/memories/MemoriesModal';
import { TokenQuotaBadge } from '@/components/ui';
import { getAIConfig } from '@/services/ai/aiConfigService';
import { getProviderById, getModelById } from '@/config/aiProviders';

export type ActiveAppView = 'chat' | 'lab' | 'control-center';

interface AppHeaderProps {
  activeView: ActiveAppView;
  onViewChange: (view: ActiveAppView) => void;
  unreadCount?: number;
  isAuthOpen?: boolean;
  onOpenAuth?: () => void;
  onCloseAuth?: () => void;
  isMemoriesOpen?: boolean;
  onOpenMemories?: () => void;
  onCloseMemories?: () => void;
  onToggleMobileSidebar?: () => void;
}

export function AppHeader({
  activeView,
  onViewChange,
  isAuthOpen: externalAuthOpen,
  onOpenAuth,
  onCloseAuth,
  isMemoriesOpen: externalMemoriesOpen,
  onOpenMemories,
  onCloseMemories,
  onToggleMobileSidebar,
}: AppHeaderProps) {
  const { user, isAuthenticated, isPasswordRecovery } = useAuth();
  const { resolvedTheme, toggleTheme } = useTheme();
  const { t, language, setLanguage, supportedLanguages } = useTranslation();
  const fr = language === 'fr';

  const [internalAuthOpen, setInternalAuthOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [internalMemoriesOpen, setInternalMemoriesOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [aiConfig, setAiConfig] = useState(getAIConfig);
  const menuRef = useRef<HTMLDivElement>(null);

  // Synchronisation réactive immédiate du modèle actif
  useEffect(() => {
    const handleConfigChange = () => {
      setAiConfig(getAIConfig());
    };
    window.addEventListener('nexus:ai-config-changed', handleConfigChange);
    window.addEventListener('storage', handleConfigChange);
    return () => {
      window.removeEventListener('nexus:ai-config-changed', handleConfigChange);
      window.removeEventListener('storage', handleConfigChange);
    };
  }, []);

  const activeProvider = getProviderById(aiConfig.activeProviderId);
  const activeModel = getModelById(aiConfig.activeProviderId, aiConfig.activeModelId);
  const providerDisplayName = activeProvider?.name || 'Moteur IA';
  const modelDisplayName = activeModel?.name || aiConfig.activeModelId;

  const isAuthOpen =
    externalAuthOpen !== undefined
      ? externalAuthOpen || isPasswordRecovery
      : internalAuthOpen || isPasswordRecovery;
  const handleOpenAuth = onOpenAuth ?? (() => setInternalAuthOpen(true));
  const handleCloseAuth = onCloseAuth ?? (() => setInternalAuthOpen(false));

  const isMemoriesModalOpen = externalMemoriesOpen ?? internalMemoriesOpen;
  const handleOpenMemories = onOpenMemories ?? (() => setInternalMemoriesOpen(true));
  const handleCloseMemories = onCloseMemories ?? (() => setInternalMemoriesOpen(false));

  // Fermeture du menu profil (clic extérieur / Échap)
  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  const isDark = resolvedTheme === 'dark';
  const themeLabel = isDark ? t('theme.switchToLight') : t('theme.switchToDark');
  const displayName = isAuthenticated
    ? user?.fullName || user?.email?.split('@')[0] || (fr ? 'Utilisateur' : 'User')
    : fr ? 'Invité' : 'Guest';
  const initial = displayName.slice(0, 1).toUpperCase();

  const viewTitle =
    activeView === 'lab'
      ? fr ? 'Projets (NEXUS LAB)' : 'Projects (NEXUS LAB)'
      : activeView === 'control-center'
        ? fr ? 'Explorateur IA' : 'AI Explorer'
        : 'NEXUS AI';

  const viewTag =
    activeView === 'lab'
      ? fr ? 'Studio Code' : 'Code Studio'
      : activeView === 'control-center'
        ? fr ? 'Moteurs & Métriques' : 'Engines & Metrics'
        : fr ? 'Génie Logiciel' : 'Software Engineering';

  return (
    <>
      <header className="h-16 px-4 sm:px-8 flex items-center justify-between z-20 shrink-0 select-none border-b border-slate-200/60 dark:border-white/10 liquid-glass shadow-[0_4px_24px_rgba(0,0,0,0.04)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.35)] transition-colors">
        <div className="flex items-center gap-2.5 min-w-0">
          {onToggleMobileSidebar && (
            <button
              type="button"
              onClick={onToggleMobileSidebar}
              className="md:hidden p-2 -ml-1 rounded-xl text-slate-600 hover:bg-slate-200/60 dark:text-slate-400 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
              aria-label={fr ? 'Ouvrir le menu' : 'Open menu'}
            >
              <Menu size={20} />
            </button>
          )}
          <div className="flex items-center gap-2 min-w-0">
            <h1 className="text-[15px] font-semibold tracking-tight text-slate-900 dark:text-white truncate">
              {viewTitle}
            </h1>
            <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium tracking-wide bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-sky-300 border border-blue-200/70 dark:border-blue-800/50">
              {viewTag}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-3">
          {/* Badge indicateur du modèle IA actif (Dynamique & Réactif) */}
          <button
            type="button"
            id="btn-active-model-pill"
            onClick={() => onViewChange('control-center')}
            title={
              fr
                ? `Modèle actif : ${providerDisplayName} (${modelDisplayName}) — Cliquez pour configurer`
                : `Active model: ${providerDisplayName} (${modelDisplayName}) — Click to configure`
            }
            className="btn-tactile hidden sm:inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-white/90 hover:bg-slate-100 text-slate-700 dark:bg-slate-900/90 dark:hover:bg-slate-800/90 dark:text-slate-300 border border-slate-200/80 dark:border-slate-800/80 transition-all cursor-pointer shadow-2xs hover:shadow-xs"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="tracking-tight font-mono text-[11px]">
              {providerDisplayName} • {modelDisplayName}
            </span>
          </button>

          {/* Jauge visuelle de quotas et jetons restants */}
          <TokenQuotaBadge onOpenAuth={handleOpenAuth} />

          <button
            type="button"
            id="btn-theme-toggle"
            onClick={toggleTheme}
            aria-label={themeLabel}
            title={themeLabel}
            className="btn-tactile relative w-10 h-10 grid place-items-center rounded-full text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800/60 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 active:scale-90"
          >
            <Sun
              size={18}
              className={cn('absolute transition-all duration-500', isDark ? 'opacity-0 rotate-90 scale-50' : 'opacity-100 rotate-0 scale-100')}
            />
            <Moon
              size={17}
              className={cn('absolute transition-all duration-500 text-sky-400', isDark ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-50')}
            />
          </button>

          <div className="hidden sm:block h-5 w-px bg-slate-200 dark:bg-slate-800" aria-hidden="true" />

          {/* Menu profil */}
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              id="btn-user-profile"
              onClick={() => setMenuOpen((o) => !o)}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              className="btn-tactile flex items-center gap-2 pl-1 pr-2 py-1 rounded-full hover:bg-slate-200/60 dark:hover:bg-slate-800/60 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              <span className="w-8 h-8 rounded-full overflow-hidden grid place-items-center text-white text-xs font-bold bg-gradient-to-tr from-slate-800 via-slate-700 to-blue-600 ring-2 ring-white dark:ring-slate-800 shadow-sm">
                {user?.avatarUrl ? (
                  <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  initial
                )}
              </span>
              <span className="hidden sm:block text-xs font-medium text-slate-700 dark:text-slate-300 max-w-[120px] truncate">
                {displayName}
              </span>
              <ChevronDown size={13} className={cn('text-slate-400 dark:text-slate-500 transition-transform duration-200', menuOpen && 'rotate-180')} />
            </button>

            {menuOpen && (
              <div
                role="menu"
                className="absolute right-0 top-full mt-2 w-64 rounded-2xl p-1.5 z-50 bg-white/95 dark:bg-[#12121f]/95 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 shadow-[0_20px_50px_rgba(15,23,42,0.15)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.6)] animate-nexus-pop"
              >
                <div className="px-3 py-2.5 border-b border-slate-100 dark:border-white/[0.06] mb-1">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{displayName}</p>
                  <p className="text-xs text-slate-500 dark:text-white/45 truncate">
                    {isAuthenticated ? user?.email : fr ? 'Données stockées localement' : 'Data stored locally'}
                  </p>
                </div>

                <MenuItem
                  icon={isAuthenticated ? <UserRound size={16} /> : <LogIn size={16} />}
                  label={isAuthenticated ? (fr ? 'Mon profil' : 'My profile') : t('nav.login')}
                  onClick={() => {
                    setMenuOpen(false);
                    if (isAuthenticated) setIsProfileModalOpen(true);
                    else handleOpenAuth();
                  }}
                />
                <MenuItem
                  icon={<BookOpen size={16} />}
                  label={fr ? 'Bibliothèque' : 'Library'}
                  onClick={() => {
                    setMenuOpen(false);
                    handleOpenMemories();
                  }}
                />

                <div className="px-3 pt-3 pb-1.5 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-white/35">
                  <Languages size={13} /> {t('nav.language')}
                </div>
                <div className="grid grid-cols-2 gap-1 px-1.5 pb-1.5" role="group" aria-label={t('nav.language')}>
                  {supportedLanguages.map((lang) => {
                    const selected = lang.code === language;
                    return (
                      <button
                        key={lang.code}
                        type="button"
                        onClick={() => setLanguage(lang.code)}
                        aria-pressed={selected}
                        className={cn(
                          'flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer',
                          selected
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-white/[0.06] dark:text-white/70 dark:hover:bg-white/10',
                        )}
                      >
                        {selected && <Check size={12} />}
                        {lang.nativeName}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Les modales historiques héritent de la compatibilité clair/sombre */}
      <div className="legacy-theme">
        <AuthModal isOpen={isAuthOpen} onClose={handleCloseAuth} />
        <UserProfileModal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} />
        <MemoriesModal
          isOpen={isMemoriesModalOpen}
          onClose={handleCloseMemories}
          onOpenAuth={() => {
            handleCloseMemories();
            handleOpenAuth();
          }}
        />
      </div>
    </>
  );
}

function MenuItem({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-700 hover:bg-slate-100 dark:text-white/80 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
    >
      <span className="text-slate-500 dark:text-white/50">{icon}</span>
      {label}
    </button>
  );
}
