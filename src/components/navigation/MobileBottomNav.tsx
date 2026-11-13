/**
 * src/components/navigation/MobileBottomNav.tsx
 *
 * Barre de navigation inférieure fixe pour smartphone (style iOS / Material Design 3).
 * Offre un accès direct à 1 pouce pour basculer entre Chat, Studio Lab, Explorateur IA
 * et ouvrir le menu/historique des conversations.
 */

import { memo } from 'react';
import { MessageSquare, Code2, Compass, Menu } from 'lucide-react';
import { cn } from '@/utils/cn';
import { useTranslation } from '@/hooks/useTranslation';
import type { ActiveAppView } from './AppHeader';

interface MobileBottomNavProps {
  activeView: ActiveAppView;
  onNavigateView: (view: ActiveAppView) => void;
  onToggleMobileSidebar: () => void;
}

function MobileBottomNavComponent({
  activeView,
  onNavigateView,
  onToggleMobileSidebar,
}: MobileBottomNavProps) {
  const { language } = useTranslation();
  const fr = language === 'fr';

  const navItems = [
    {
      id: 'chat' as const,
      label: 'Chat',
      icon: MessageSquare,
      isActive: activeView === 'chat',
      onClick: () => onNavigateView('chat'),
    },
    {
      id: 'lab' as const,
      label: fr ? 'Studio Lab' : 'Lab Studio',
      icon: Code2,
      isActive: activeView === 'lab',
      onClick: () => onNavigateView('lab'),
    },
    {
      id: 'control-center' as const,
      label: fr ? 'Moteur IA' : 'AI Engine',
      icon: Compass,
      isActive: activeView === 'control-center',
      onClick: () => onNavigateView('control-center'),
    },
    {
      id: 'menu' as const,
      label: 'Menu',
      icon: Menu,
      isActive: false,
      onClick: onToggleMobileSidebar,
    },
  ];

  return (
    <nav
      id="mobile-bottom-nav"
      aria-label={fr ? 'Navigation mobile' : 'Mobile navigation'}
      className={cn(
        'md:hidden fixed bottom-0 inset-x-0 z-30 shrink-0 select-none',
        'liquid-glass border-t border-slate-200/80 dark:border-white/10',
        'bg-[#f8fafc]/90 dark:bg-[#0b0f19]/90 backdrop-blur-xl',
        'shadow-[0_-4px_20px_rgba(0,0,0,0.06)] dark:shadow-[0_-8px_32px_rgba(0,0,0,0.5)]',
        'pb-[max(env(safe-area-inset-bottom,0px),10px)] pt-1.5 px-3',
      )}
    >
      <div className="flex items-center justify-around max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              onClick={item.onClick}
              aria-current={item.isActive ? 'page' : undefined}
              className={cn(
                'flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all duration-150 cursor-pointer min-w-[64px] select-none',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 active:scale-90',
                item.isActive
                  ? 'text-blue-600 dark:text-sky-400 font-semibold'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 font-medium',
              )}
            >
              <div
                className={cn(
                  'relative p-1 rounded-xl transition-all duration-200',
                  item.isActive && 'bg-blue-50 dark:bg-blue-950/60 ring-1 ring-blue-500/30 shadow-[0_0_12px_rgba(37,99,235,0.25)]',
                )}
              >
                <Icon size={20} className={cn('transition-transform duration-200', item.isActive && 'scale-110')} />
                {item.isActive && (
                  <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-blue-600 dark:bg-sky-400" />
                )}
              </div>
              <span className="text-[10.5px] tracking-tight mt-0.5 leading-none">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

export const MobileBottomNav = memo(MobileBottomNavComponent);
