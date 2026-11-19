/**
 * src/components/auth/UserWelcomeToast.tsx
 *
 * Notification flottante de bienvenue personnalisée lors de la connexion
 * d'un utilisateur à son compte NEXUS AI.
 * Affiche des messages adaptés comme :
 *  - "Bonjour 'utilisateur'" ou "Bonsoir 'utilisateur'"
 *  - "Soyez la bienvenue 'utilisateur'"
 *  - "Bon retour 'utilisateur'"
 */

import { useState, useEffect } from 'react';
import { Sparkles, X, UserCheck } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { generateUserGreeting, getFriendlyUserName, type UserGreeting } from '@/utils/greetingUtils';

export function UserWelcomeToast() {
  const { user, isAuthenticated } = useAuth();
  const [greeting, setGreeting] = useState<UserGreeting | null>(null);
  const [visible, setVisible] = useState(false);

  const triggerWelcome = (userName: string, userId: string, forceShow = false) => {
    const sessionKey = `nexus_welcome_toast_${userId}`;
    if (!forceShow && typeof window !== 'undefined' && sessionStorage.getItem(sessionKey)) {
      return;
    }

    const newGreeting = generateUserGreeting(userName);
    setGreeting(newGreeting);
    setVisible(true);

    if (typeof window !== 'undefined') {
      sessionStorage.setItem(sessionKey, 'true');
    }

    const timer = setTimeout(() => {
      setVisible(false);
    }, 7000);

    return () => clearTimeout(timer);
  };

  // Détection lors de la connexion initiale ou réhydratation de session
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      const name = getFriendlyUserName(user.fullName, user.email);
      triggerWelcome(name, user.id, false);
    }
  }, [isAuthenticated, user?.id, user?.fullName, user?.email]);

  // Écoute de l'événement explicite de connexion réussie (ex: depuis AuthModal)
  useEffect(() => {
    const handleAuthSuccess = (e: Event) => {
      const customEvent = e as CustomEvent<{ user?: { fullName?: string; email?: string; id?: string } }>;
      const targetUser = customEvent.detail?.user || user;
      if (targetUser) {
        const name = getFriendlyUserName(targetUser.fullName, targetUser.email);
        triggerWelcome(name, targetUser.id || 'default', true);
      }
    };

    window.addEventListener('nexus-auth-success', handleAuthSuccess);
    return () => window.removeEventListener('nexus-auth-success', handleAuthSuccess);
  }, [user]);

  if (!visible || !greeting) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-4 right-4 z-50 max-w-sm sm:max-w-md p-3.5 sm:p-4 rounded-2xl bg-slate-900/95 dark:bg-[#0f172a]/95 border border-blue-500/40 shadow-[0_10px_35px_rgba(37,99,235,0.25)] backdrop-blur-xl flex items-start gap-3 animate-in slide-in-from-top-3 fade-in duration-300"
    >
      <div className="p-2 sm:p-2.5 rounded-xl bg-blue-500/20 text-blue-400 shrink-0 mt-0.5 border border-blue-500/30">
        <UserCheck size={18} className="text-cyan-400" />
      </div>

      <div className="space-y-1 flex-1 text-xs min-w-0 pr-1">
        <div className="flex items-center gap-1.5 font-bold text-white text-sm sm:text-[15px] truncate">
          <span>{greeting.title}</span>
          <Sparkles size={14} className="text-amber-400 shrink-0 animate-pulse" />
        </div>
        <p className="text-slate-300 text-[11.5px] sm:text-xs leading-relaxed">
          {greeting.message}
        </p>
      </div>

      <button
        type="button"
        onClick={() => setVisible(false)}
        className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer shrink-0"
        aria-label="Fermer la salutation"
      >
        <X size={15} />
      </button>
    </div>
  );
}
