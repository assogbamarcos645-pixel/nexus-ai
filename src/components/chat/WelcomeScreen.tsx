import { memo } from 'react';
import { Code2, ArrowUpRight, Sparkles, Bug, Zap, FileText } from 'lucide-react';
import { cn } from '@/utils/cn';
import { useTranslation } from '@/hooks/useTranslation';
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
  const fr = language === 'fr';

  return (
    <div className="w-full flex flex-col items-center text-center select-none max-w-4xl mx-auto px-2.5 sm:px-6 animate-nexus-fade-up">
      {/* Badge supérieur technologique en Liquid Glass avec micro-shimmer et pulsation */}
      <div className="inline-flex items-center gap-2 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full liquid-glass-pill mb-2.5 sm:mb-4 shimmer-sweep hover:scale-105 transition-transform duration-200 cursor-default">
        <Sparkles size={12} className="text-blue-600 dark:text-sky-400 animate-pulse sm:w-[13px] sm:h-[13px]" />
        <span className="text-[11px] sm:text-[11.5px] font-semibold tracking-wide text-slate-800 dark:text-slate-200">
          NEXUS AI <span className="text-blue-600 dark:text-sky-400 font-mono text-[10px] sm:text-[10.5px]">• v0.3.0</span>
        </span>
        <span className="h-2.5 w-px bg-slate-200 dark:bg-slate-800" aria-hidden="true" />
        <span className="text-[10px] sm:text-[10.5px] text-slate-500 dark:text-slate-400 font-medium">
          {fr ? 'Studio de Génie Logiciel' : 'Software Engineering Studio'}
        </span>
      </div>

      {/* Titre Principal percutant avec dégradé Cobalt & Sky */}
      <h1 className="text-xl sm:text-3xl md:text-4xl lg:text-[44px] font-extrabold tracking-tight text-slate-900 dark:text-white mb-1.5 sm:mb-3 leading-[1.2]">
        {fr ? 'Que voulez-vous concevoir avec ' : 'What will you architect with '}
        <span className="bg-gradient-to-r from-blue-600 via-sky-500 to-blue-500 bg-clip-text text-transparent">
          NEXUS AI
        </span>
        {fr ? ' ?' : ' ?'}
      </h1>

      {/* Sous-titre élégant */}
      <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm md:text-base max-w-xl mx-auto mb-3.5 sm:mb-6 leading-relaxed font-normal">
        {fr ? (
          <>
            Architecture logicielle, clean code TypeScript/Python,
            <br className="hidden sm:inline" />
            spécifications d’API et audits de sécurité orientés production.
          </>
        ) : (
          <>
            Software architecture, clean TypeScript/Python code,
            <br className="hidden sm:inline" />
            API specifications, and production-grade security audits.
          </>
        )}
      </p>

      {/* Zone de saisie centrale intégrée (ChatGPT & Claude signature style) */}
      {children && (
        <div className="w-full max-w-3xl mb-3.5 sm:mb-6 cursor-default select-text">
          {children}
        </div>
      )}

      {/* 4 Cartes d'actions rapides professionnelles (Grille 2x2 compacte sur mobile, 4 cols sur desktop) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3.5 w-full max-w-4xl px-1 sm:px-2">
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
              style={{ animationDelay: `${index * 90 + 150}ms` }}
              className={cn(
                'group relative flex flex-col items-start p-2.5 sm:p-4 rounded-xl sm:rounded-2xl text-left cursor-pointer card-interactive animate-nexus-fade-up',
                'liquid-glass liquid-glass-card',
                'text-slate-800 dark:text-white',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
              )}
            >
              <div className="flex items-center justify-between w-full mb-1 sm:mb-2.5">
                <div className={cn('w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl flex items-center justify-center border shadow-xs transition-all duration-300 group-hover:scale-125 group-hover:-rotate-12 shrink-0', action.badgeBg)}>
                  <IconComponent size={14} className={cn(action.iconColor, 'sm:w-[15px] sm:h-[15px]')} />
                </div>
                <ArrowUpRight size={13} className="text-slate-400 group-hover:text-sky-400 dark:text-slate-500 dark:group-hover:text-sky-300 transition-all duration-300 opacity-60 group-hover:opacity-100 group-hover:translate-x-1 group-hover:-translate-y-1 group-hover:scale-125 shrink-0" />
              </div>
              <span className="text-[11.5px] sm:text-[13.5px] font-semibold text-slate-900 dark:text-white tracking-tight mb-0.5 sm:mb-1 line-clamp-1">
                {label}
              </span>
              <span className="text-[9.5px] sm:text-[11.5px] text-slate-500 dark:text-slate-400 leading-snug line-clamp-2">
                {desc}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export const WelcomeScreen = memo(WelcomeScreenComponent);
