/**
 * src/components/auth/EmailConfirmationToast.tsx
 *
 * Notification flottante confirmant l'activation réussie du compte
 * lorsque l'utilisateur clique sur le lien reçu dans sa boîte e-mail.
 */

import { useState, useEffect } from 'react';
import { CheckCircle2, X, Sparkles } from 'lucide-react';

export function EmailConfirmationToast() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const hash = window.location.hash || '';
    const search = window.location.search || '';

    // Détection de la confirmation d'inscription Supabase (type=signup ou email_confirmation)
    if (
      hash.includes('type=signup') ||
      hash.includes('type=email_change') ||
      search.includes('type=signup')
    ) {
      setShow(true);
      // Nettoyer l'URL sans recharger la page pour masquer les tokens bruts
      window.history.replaceState(null, '', window.location.pathname);
      const timer = setTimeout(() => setShow(false), 8000);
      return () => clearTimeout(timer);
    }
  }, []);

  if (!show) return null;

  return (
    <div
      role="status"
      className="fixed top-4 right-4 z-50 max-w-md p-4 rounded-2xl bg-surface-950/95 border border-emerald-500/40 shadow-[0_0_40px_rgba(16,185,129,0.35)] backdrop-blur-xl flex items-start gap-3 animate-in slide-in-from-top-4 duration-300"
    >
      <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 shrink-0 mt-0.5">
        <CheckCircle2 size={18} />
      </div>
      <div className="space-y-1 flex-1 text-xs">
        <div className="flex items-center gap-1.5 font-bold text-white text-sm">
          <span>Compte activé avec succès</span>
          <Sparkles size={14} className="text-cyan-400" />
        </div>
        <p className="text-white/70 leading-relaxed">
          Votre adresse e-mail a été validée. Bienvenue sur NEXUS AI ! Votre compte bénéficie désormais de la synchronisation cloud complète et du quota étendu de 500k jetons.
        </p>
      </div>
      <button
        type="button"
        onClick={() => setShow(false)}
        className="text-white/40 hover:text-white p-1 rounded-lg transition-colors cursor-pointer shrink-0"
        aria-label="Fermer la notification"
      >
        <X size={15} />
      </button>
    </div>
  );
}
