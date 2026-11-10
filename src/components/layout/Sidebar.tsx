/**
 * src/components/layout/Sidebar.tsx
 *
 * Barre latérale principale de NEXUS AI.
 *  - Marque (monogramme + NEXUS AI) et repli en rail d'icônes sur ordinateur.
 *  - Navigation : Nouveau chat, Bibliothèque, Projets, Explorer.
 *  - Recherche et historique groupé par période (Aujourd'hui, Hier, 7 jours, Plus ancien).
 *  - Tiroir accessible sur mobile (Échap pour fermer).
 */

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  MessageSquareMore,
  BookOpen,
  Folder,
  Compass,
  Trash2,
  Search,
  PanelLeftClose,
  PanelLeftOpen,
  Cloud,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { useTranslation } from '@/hooks/useTranslation';
import type { Conversation } from '@/types';
import type { ActiveAppView } from '@/components/navigation/AppHeader';
import { ModalCloseButton } from '@/components/ui/ModalCloseButton';

const COLLAPSE_KEY = 'nexus_sidebar_collapsed_v1';

interface SidebarProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  activeView?: ActiveAppView;
  isOpenOnMobile?: boolean;
  onCloseMobile?: () => void;
  onNewConversation: () => void;
  onSelectConversation: (id: string) => void;
  onDeleteConversation: (id: string) => void;
  onNavigateView?: (view: ActiveAppView) => void;
  onOpenMemories?: () => void;
}

type GroupKey = 'today' | 'yesterday' | 'week' | 'older';

function groupOf(date: Date): GroupKey {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const t = date.getTime();
  if (t >= startOfToday) return 'today';
  if (t >= startOfToday - 86_400_000) return 'yesterday';
  if (t >= startOfToday - 7 * 86_400_000) return 'week';
  return 'older';
}

export function Sidebar({
  conversations,
  activeConversationId,
  activeView = 'chat',
  isOpenOnMobile = false,
  onCloseMobile,
  onNewConversation,
  onSelectConversation,
  onDeleteConversation,
  onNavigateView,
  onOpenMemories,
}: SidebarProps) {
  const { t, language } = useTranslation();
  const fr = language === 'fr';
  const [query, setQuery] = useState('');
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(COLLAPSE_KEY) === '1';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(COLLAPSE_KEY, collapsed ? '1' : '0');
    } catch {
      /* stockage indisponible */
    }
  }, [collapsed]);

  // Fermeture du tiroir mobile avec Échap
  useEffect(() => {
    if (!isOpenOnMobile) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCloseMobile?.();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpenOnMobile, onCloseMobile]);

  // Sur mobile, le tiroir est toujours déplié
  const isRail = collapsed && !isOpenOnMobile;

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = conversations
      .filter((c) => c.messages.length > 0)
      .filter((c) => !q || c.title.toLowerCase().includes(q))
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

    const map: Record<GroupKey, Conversation[]> = { today: [], yesterday: [], week: [], older: [] };
    list.forEach((c) => map[groupOf(c.updatedAt)].push(c));
    return map;
  }, [conversations, query]);

  const groupLabels: Record<GroupKey, string> = fr
    ? { today: "Aujourd'hui", yesterday: 'Hier', week: '7 derniers jours', older: 'Plus ancien' }
    : { today: 'Today', yesterday: 'Yesterday', week: 'Previous 7 days', older: 'Older' };

  const hasHistory = Object.values(groups).some((g) => g.length > 0);

  const go = (view: ActiveAppView) => {
    onNavigateView?.(view);
    onCloseMobile?.();
  };

  const handleSelectConv = (id: string) => {
    onSelectConversation(id);
    go('chat');
  };

  return (
    <>
      {isOpenOnMobile && (
        <div
          className="fixed inset-0 bg-slate-900/30 dark:bg-black/60 backdrop-blur-sm z-30 lg:hidden"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      <aside
        id="sidebar"
        aria-label={fr ? 'Navigation principale' : 'Main navigation'}
        className={cn(
          'flex flex-col shrink-0 h-full select-none z-40 transition-[width,transform] duration-300 ease-out',
          'liquid-glass border-r border-slate-200/60 dark:border-white/10',
          'fixed inset-y-0 left-0 lg:static',
          isRail ? 'lg:w-[76px]' : 'w-[272px]',
          isOpenOnMobile ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0',
        )}
      >
        {/* En-tête : marque + repli */}
        <div className={cn('flex items-center h-16 shrink-0', isRail ? 'justify-center px-2' : 'justify-between px-5')}>
          <button
            type="button"
            onClick={() => go('chat')}
            className="flex items-center gap-2 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 cursor-pointer"
            aria-label="NEXUS AI"
          >
            {isRail ? (
              <span className="text-[15px] font-extrabold tracking-tight">
                <span className="text-slate-900 dark:text-white">N</span>
                <span className="nexus-gradient-text">X</span>
              </span>
            ) : (
              <span className="text-[17px] font-extrabold tracking-tight">
                <span className="text-slate-900 dark:text-white">NEXUS </span>
                <span className="nexus-gradient-text">AI</span>
              </span>
            )}
          </button>

          {!isRail && (
            <>
              <button
                type="button"
                onClick={() => setCollapsed(true)}
                className="hidden lg:inline-flex p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
                aria-label={fr ? 'Réduire la barre latérale' : 'Collapse sidebar'}
                title={fr ? 'Réduire' : 'Collapse'}
              >
                <PanelLeftClose size={18} />
              </button>
              <ModalCloseButton
                onClick={onCloseMobile}
                label={fr ? 'Fermer' : 'Close'}
                title={fr ? 'Fermer le menu (Échap)' : 'Close menu (Esc)'}
                className="lg:hidden"
              />
            </>
          )}
        </div>

        {isRail && (
          <div className="hidden lg:flex justify-center pb-2">
            <button
              type="button"
              onClick={() => setCollapsed(false)}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:text-white/40 dark:hover:text-white dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
              aria-label={fr ? 'Déplier la barre latérale' : 'Expand sidebar'}
              title={fr ? 'Déplier' : 'Expand'}
            >
              <PanelLeftOpen size={18} />
            </button>
          </div>
        )}

        {/* Navigation principale */}
        <nav className={cn('space-y-1 shrink-0', isRail ? 'px-3' : 'px-3')}>
          <NavItem
            id="btn-new-conversation"
            icon={<MessageSquareMore size={18} />}
            label={fr ? 'Nouveau chat' : 'New chat'}
            rail={isRail}
            highlighted
            onClick={() => {
              onNewConversation();
              go('chat');
            }}
            shortcut="Ctrl K"
          />
          <NavItem
            id="btn-sidebar-library"
            icon={<BookOpen size={18} />}
            label={fr ? 'Bibliothèque' : 'Library'}
            rail={isRail}
            onClick={() => {
              onOpenMemories?.();
              onCloseMobile?.();
            }}
          />
          <NavItem
            id="btn-sidebar-projects"
            icon={<Folder size={18} />}
            label={fr ? 'Projets' : 'Projects'}
            rail={isRail}
            active={activeView === 'lab'}
            onClick={() => go('lab')}
          />
          <NavItem
            id="btn-sidebar-explore"
            icon={<Compass size={18} />}
            label={fr ? 'Explorer' : 'Explore'}
            rail={isRail}
            active={activeView === 'control-center'}
            onClick={() => go('control-center')}
          />
        </nav>

        {/* Historique */}
        {!isRail ? (
          <div className="flex-1 flex flex-col min-h-0 mt-5">
            <div className="px-4 pb-2">
              <label className="relative block">
                <span className="sr-only">{fr ? 'Rechercher une conversation' : 'Search conversations'}</span>
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-white/35" />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={fr ? 'Rechercher…' : 'Search…'}
                  className="w-full pl-8 pr-3 py-2 rounded-xl text-xs bg-slate-100/80 dark:bg-white/[0.05] border border-transparent focus:border-indigo-300 dark:focus:border-indigo-500/50 text-slate-700 dark:text-white/85 placeholder:text-slate-400 dark:placeholder:text-white/35 outline-none transition-colors"
                />
              </label>
            </div>

            <div className="flex-1 overflow-y-auto scrollbar-thin px-3 pb-3">
              {!hasHistory ? (
                <p className="px-3 py-6 text-xs text-center text-slate-400 dark:text-white/35 leading-relaxed">
                  {query
                    ? fr ? 'Aucun résultat.' : 'No results.'
                    : fr ? 'Vos conversations apparaîtront ici.' : 'Your conversations will appear here.'}
                </p>
              ) : (
                (Object.keys(groups) as GroupKey[]).map((key) =>
                  groups[key].length === 0 ? null : (
                    <div key={key} className="mb-3">
                      <div className="px-3 pt-2 pb-1.5 text-[11px] font-semibold tracking-wide text-slate-400 dark:text-white/35">
                        {groupLabels[key]}
                      </div>
                      {groups[key].map((conv) => {
                        const isActive = conv.id === activeConversationId && activeView === 'chat';
                        return (
                          <div
                            key={conv.id}
                            className={cn(
                              'group relative flex items-center rounded-xl transition-all duration-150 hover:translate-x-0.5',
                              isActive
                                ? 'bg-blue-50/90 dark:bg-slate-800/90'
                                : 'hover:bg-slate-100/80 dark:hover:bg-slate-800/40',
                            )}
                          >
                            <button
                              type="button"
                              onClick={() => handleSelectConv(conv.id)}
                              aria-current={isActive ? 'true' : undefined}
                              className={cn(
                                'flex-1 min-w-0 flex items-center gap-2 pl-3 pr-9 py-2 text-left text-[13px] cursor-pointer rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
                                isActive
                                  ? 'text-blue-950 font-semibold dark:text-white'
                                  : 'text-slate-600 dark:text-slate-300',
                              )}
                            >
                              <span className="truncate">{conv.title}</span>
                              {conv.isCloudSynced && (
                                <Cloud size={11} className="shrink-0 text-sky-400/80" aria-label="Cloud" />
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm(fr ? 'Supprimer cette conversation ?' : 'Delete this conversation?')) {
                                  onDeleteConversation(conv.id);
                                }
                              }}
                              aria-label={`${t('common.delete')} — ${conv.title}`}
                              className="absolute right-1.5 p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:text-white/40 dark:hover:bg-red-500/10 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity cursor-pointer"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  ),
                )
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1" />
        )}

        {/* Signature & Statut Moteur Pro (Style Slate / Cobalt) */}
        {!isRail && (
          <div className="p-3 m-3 rounded-2xl bg-white/70 dark:bg-[#0f1526]/80 border border-slate-200/80 dark:border-slate-800/80 shrink-0">
            <div className="flex items-center justify-between text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1">
              <span className="flex items-center gap-1.5 font-mono text-[10px]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Mistral SDLC v0.3
              </span>
              <span className="text-[10px] text-blue-600 dark:text-sky-400 font-mono font-semibold">100% OK</span>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-snug">
              {fr ? 'Conception logicielle & vibe coding assisté' : 'Software design & assisted vibe coding'}
            </p>
          </div>
        )}
      </aside>
    </>
  );
}

interface NavItemProps {
  id: string;
  icon: ReactNode;
  label: string;
  rail: boolean;
  active?: boolean;
  highlighted?: boolean;
  shortcut?: string;
  onClick: () => void;
}

function NavItem({ id, icon, label, rail, active, highlighted, shortcut, onClick }: NavItemProps) {
  return (
    <button
      type="button"
      id={id}
      onClick={onClick}
      title={rail ? label : undefined}
      aria-label={rail ? label : undefined}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'group btn-tactile w-full flex items-center gap-3 rounded-xl text-sm font-medium cursor-pointer',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
        rail ? 'justify-center h-11' : 'px-3.5 h-10',
        highlighted
          ? 'bg-blue-600 text-white shadow-[0_2px_12px_rgba(37,99,235,0.35)] hover:bg-blue-500 hover:shadow-[0_4px_16px_rgba(37,99,235,0.45)] shimmer-sweep'
          : active
            ? 'liquid-glass-pill text-slate-900 dark:text-white font-semibold shadow-xs border-blue-500/30'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800/50 hover:translate-x-1.5',
      )}
    >
      <span
        className={cn(
          'shrink-0 transition-colors',
          highlighted ? 'text-white' : active ? 'text-blue-600 dark:text-sky-400' : 'text-slate-500 group-hover:text-slate-700 dark:text-slate-400 dark:group-hover:text-white',
        )}
      >
        {icon}
      </span>
      {!rail && (
        <>
          <span className="flex-1 text-left truncate">{label}</span>
          {shortcut && (
            <kbd className={cn(
              'hidden lg:inline-block px-1.5 py-0.5 rounded text-[10px] font-medium font-mono',
              highlighted
                ? 'bg-blue-700/60 text-blue-100 border border-blue-500/40'
                : 'text-slate-400 dark:text-slate-400 bg-white/70 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80'
            )}>
              {shortcut}
            </kbd>
          )}
        </>
      )}
    </button>
  );
}
