import { memo, useMemo } from 'react';
import { Code2, ArrowUpRight, Sparkles, Bug, Zap, FileText } from 'lucide-react';
import { cn } from '@/utils/cn';
import { useTranslation } from '@/hooks/useTranslation';
import { useAuth } from '@/hooks/useAuth';
import { generateUserGreeting, getFriendlyUserName } from '@/utils/greetingUtils';
import type { Agent } from '@/types';

interface QuickAction {
  id: string;
  labelFr: string;
  labelEn: string;
  descFr: string;
  descEn: string;
  promptFr: string;
  promptEn: string;
  icon: typeof Code2;
  iconColor: string;
  badgeBg: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    id: 'analyze-code',
    labelFr: 'Analyser ce code',
    labelEn: 'Analyze this code',
    descFr: 'Audit Clean Code, détection de bugs & typage strict',
    descEn: 'Clean Code audit, bug hunt & strict typing',
    promptFr: 'Analyse ce code en détail : identifie les bugs potentiels, la complexité algorithmique et propose une refactorisation Clean Code complète et sans omission.',
    promptEn: 'Analyze this code in detail: find potential bugs, evaluate algorithmic complexity and provide complete Clean Code refactoring.',
    icon: Code2,
    iconColor: 'text-cyan-600 dark:text-cyan-400',
    badgeBg: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-600 dark:text-cyan-300',
  },
  {
    id: 'explain-error',
    labelFr: 'Expliquer cette erreur',
    labelEn: 'Explain this error',
    descFr: 'Cause racine (RCA), débogage & résolution pas à pas',
    descEn: 'Root cause analysis, debugging & step-by-step fix',
    promptFr: "Voici l'erreur rencontrée dans mon application. Explique la cause racine (Root Cause Analysis) et donne la solution exacte corrigée et testée :",
    promptEn: 'Here is the error encountered in my application. Explain the root cause and provide the exact tested solution step by step:',
    icon: Bug,
    iconColor: 'text-rose-600 dark:text-rose-400',
    badgeBg: 'bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-300',
  },
  {
    id: 'summarize-doc',
    labelFr: 'Résumer ce document',
    labelEn: 'Summarize document',
    descFr: 'Synthèse structurée, points clés & extraction de données',
    descEn: 'Structured summary, key takeaways & data extraction',
    promptFr: 'Fais une synthèse exhaustive et structurée de ce document (points clés, décisions, architecture et recommandations techniques) :',
    promptEn: 'Provide a comprehensive, structured summary of this document (key takeaways, decisions, architecture and recommendations):',
    icon: FileText,
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    badgeBg: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-300',
  },
  {
    id: 'optimize',
    labelFr: 'Optimiser les performances',
    labelEn: 'Optimize performance',
    descFr: 'Réduction Big-O, optimisation SQL, parallélisme & cache',
    descEn: 'Big-O reduction, SQL tuning, concurrency & caching',
    promptFr: 'Optimise les performances de ce traitement : réduis la complexité temporelle/mémoire, améliore les requêtes ou algorithmes et propose des mécanismes de cache :',
    promptEn: 'Optimize the performance of this logic: reduce time/memory complexity, tune queries or algorithms and propose caching mechanisms:',
    icon: Zap,
    iconColor: 'text-amber-600 dark:text-amber-400',
    badgeBg: 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-300',
  },
];

interface WelcomeScreenProps {
  agent: Agent;
  onSuggestionClick: (text: string) => void;
  children?: React.ReactNode;
}

function WelcomeScreenComponent({ onSuggestionClick, children }: WelcomeScreenProps) {
  const { language } = useTranslation();
  const { user, isAuthenticated } = useAuth();
  const fr = language === 'fr';

  const userGreeting = useMemo(() => {
    if (!isAuthenticated || !user) return null;
    const name = getFriendlyUserName(user.fullName, user.email);
    return generateUserGreeting(name);
  }, [isAuthenticated, user]);

  return (
    <div className="w-full flex flex-col items-center text-center select-none max-w-4xl mx-auto px-2.5 sm:px-6 animate-nexus-fade-up">
      {/* Badge supérieur technologique Liquid Glass */}
      <div className="inline-flex items-center gap-2 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full liquid-glass-pill mb-2.5 sm:mb-4 shimmer-sweep hover:scale-105 transition-transform duration-200 cursor-default">
        <Sparkles size={12} className="text-blue-600 dark:text-sky-400 animate-pulse sm:w-[13px] sm:h-[13px]" />
        <span className="text-[11px] sm:text-[11.5px] font-semibold tracking-wide text-slate-800 dark:text-slate-200">
          NEXUS AI <span className="text-blue-600 dark:text-sky-400 font-mono text-[10px] sm:text-[10.5px]">• v0.3.0</span>
        </span>
        <span className="h-2.5 w-px bg-slate-200 dark:bg-slate-800" aria-hidden="true" />
        <span className="text-[10px] sm:text-[10.5px] text-slate-500 dark:text-slate-400 font-medium">
          {fr ? 'Génie Logiciel & Vibe Coding' : 'Software Engineering & Vibe Coding'}
        </span>
      </div>

      {/* Salutation personnalisée pour l'utilisateur connecté */}
      {userGreeting && (
        <div className="flex items-center gap-2 mb-2 px-3.5 py-1 rounded-full bg-blue-500/10 dark:bg-sky-500/10 border border-blue-500/20 text-blue-600 dark:text-sky-300 text-xs sm:text-[13px] font-semibold animate-in fade-in duration-200">
          <Sparkles size={13} className="text-amber-500 dark:text-amber-400 shrink-0" />
          <span>{userGreeting.title} !</span>
          <span className="text-[11px] font-normal text-slate-500 dark:text-slate-400 hidden sm:inline">• {userGreeting.message}</span>
        </div>
      )}

      {/* Titre Principal percutant */}
      <h1 className="text-xl sm:text-3xl md:text-4xl lg:text-[44px] font-extrabold tracking-tight text-slate-900 dark:text-white mb-1.5 sm:mb-3 leading-[1.2]">
        {userGreeting ? (
          <>
            <span className="text-slate-900 dark:text-white">{userGreeting.title}, </span>
            <span className="text-slate-700 dark:text-slate-200 block sm:inline">que concevons-nous avec </span>
          </>
        ) : (
          <>{fr ? 'Que voulez-vous concevoir avec ' : 'What will you architect with '}</>
        )}
        <span className="bg-gradient-to-r from-blue-600 via-sky-500 to-blue-500 bg-clip-text text-transparent">
          NEXUS AI
        </span>
        {fr ? ' ?' : ' ?'}
      </h1>

      {/* Sous-titre élégant */}
      <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm md:text-base max-w-xl mx-auto mb-3.5 sm:mb-5 leading-relaxed font-normal">
        {fr ? (
          <>
            Architecture logicielle, clean code TypeScript/Python,
            <br className="hidden sm:inline" />
            spécifications d’API et conversion directe de maquettes.
          </>
        ) : (
          <>
            Software architecture, clean TypeScript/Python code,
            <br className="hidden sm:inline" />
            API specifications, and live UI mockup conversion.
          </>
        )}
      </p>

      {/* Zone de saisie centrale intégrée */}
      {children && (
        <div className="w-full max-w-3xl mb-3.5 sm:mb-6 cursor-default select-text">
          {children}
        </div>
      )}

      {/* 4 Cartes d'actions rapides : Ligne horizontale sur mobile, Cartes 2x2/4x1 sur grand écran */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3.5 w-full max-w-4xl px-1 sm:px-2">
        {QUICK_ACTIONS.map((action, index) => {
          const IconComponent = action.icon;
          const label = fr ? action.labelFr : action.labelEn;
          const desc = fr ? action.descFr : action.descEn;
          const prompt = fr ? action.promptFr : action.promptEn;

          return (
            <button
              key={action.id}
              type="button"
              id={`suggestion-${action.id}`}
              onClick={() => onSuggestionClick(prompt)}
              style={{ animationDelay: `${index * 80 + 100}ms` }}
              className={cn(
                'group relative flex items-center sm:flex-col sm:items-start p-2.5 sm:p-4 rounded-xl sm:rounded-2xl text-left cursor-pointer card-interactive animate-nexus-fade-up gap-2.5 sm:gap-2',
                'liquid-glass liquid-glass-card',
                'text-slate-800 dark:text-white',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
              )}
            >
              <div className="flex items-center justify-between w-auto sm:w-full shrink-0">
                <div className={cn('w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center border shadow-xs transition-all duration-300 group-hover:scale-110 shrink-0', action.badgeBg)}>
                  <IconComponent size={15} className={action.iconColor} />
                </div>
                <ArrowUpRight size={14} className="hidden sm:block text-slate-400 group-hover:text-sky-400 dark:text-slate-500 dark:group-hover:text-sky-300 transition-all duration-300 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 shrink-0" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between sm:block">
                  <span className="text-[12.5px] sm:text-[13.5px] font-semibold text-slate-900 dark:text-white tracking-tight line-clamp-1">
                    {label}
                  </span>
                  <ArrowUpRight size={14} className="sm:hidden text-slate-400 group-hover:text-sky-400 shrink-0 ml-1 opacity-70" />
                </div>
                <span className="text-[10.5px] sm:text-[11.5px] text-slate-500 dark:text-slate-400 leading-snug line-clamp-1 sm:line-clamp-2 mt-0.5">
                  {desc}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export const WelcomeScreen = memo(WelcomeScreenComponent);
