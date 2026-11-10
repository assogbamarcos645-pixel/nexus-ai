import { memo } from 'react';
import { Layers, Code2, FileCode, ShieldCheck, ArrowUpRight, Sparkles } from 'lucide-react';
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
    id: 'architecture',
    labelFr: 'Architecture Système',
    labelEn: 'System Architecture',
    descFr: 'Clean Architecture, DDD & patterns GoF',
    descEn: 'Clean Architecture, DDD & GoF patterns',
    promptFr: 'Conçois une architecture propre et scalable (Clean Architecture / DDD) pour une application moderne avec découplage des couches.',
    promptEn: 'Design a clean, scalable architecture (Clean Architecture / DDD) for a modern application with decoupled layers.',
    icon: Layers,
    iconColor: 'text-purple-600 dark:text-purple-400',
    badgeBg: 'bg-purple-500/10 border-purple-500/20 text-purple-600 dark:text-purple-300',
  },
  {
    id: 'code',
    labelFr: 'Code de Production',
    labelEn: 'Production Code',
    descFr: 'TypeScript strict, validation Zod & zéro code tronqué',
    descEn: 'Strict TypeScript, Zod validation & full modules',
    promptFr: 'Écris un module TypeScript complet de production (sans code tronqué, typage strict, gestion d’erreurs et validation Zod).',
    promptEn: 'Write a complete production TypeScript module (no truncated code, strict typing, error handling, and Zod validation).',
    icon: Code2,
    iconColor: 'text-cyan-600 dark:text-cyan-400',
    badgeBg: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-600 dark:text-cyan-300',
  },
  {
    id: 'api',
    labelFr: 'Spécifications d’API',
    labelEn: 'API Specifications',
    descFr: 'OpenAPI 3.1, contrats JSON & Architecture RFC',
    descEn: 'OpenAPI 3.1, JSON contracts & RFC documents',
    promptFr: 'Rédige une spécification d’API REST OpenAPI 3.1 complète avec schémas JSON, codes HTTP et contrats de requêtes.',
    promptEn: 'Draft a comprehensive OpenAPI 3.1 REST API specification with JSON schemas, HTTP codes, and request contracts.',
    icon: FileCode,
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    badgeBg: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-300',
  },
  {
    id: 'security',
    labelFr: 'Audit Sécurité & QA',
    labelEn: 'Security Audit & QA',
    descFr: 'OWASP Top 10, tests Vitest & traque des failles',
    descEn: 'OWASP Top 10, Vitest test suites & edge cases',
    promptFr: 'Audite ce composant contre les failles OWASP Top 10 et génère une suite de tests unitaires Vitest avec edge cases critiques.',
    promptEn: 'Audit this component against OWASP Top 10 vulnerabilities and generate a Vitest unit test suite covering critical edge cases.',
    icon: ShieldCheck,
    iconColor: 'text-rose-600 dark:text-rose-400',
    badgeBg: 'bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-300',
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
    <div className="w-full flex flex-col items-center text-center select-none max-w-4xl mx-auto px-4 sm:px-6 animate-nexus-fade-up">
      {/* Badge supérieur technologique en Liquid Glass avec micro-shimmer et pulsation */}
      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full liquid-glass-pill mb-3.5 sm:mb-4 shimmer-sweep hover:scale-105 transition-transform duration-200 cursor-default">
        <Sparkles size={13} className="text-blue-600 dark:text-sky-400 animate-pulse" />
        <span className="text-[11.5px] font-semibold tracking-wide text-slate-800 dark:text-slate-200">
          NEXUS AI <span className="text-blue-600 dark:text-sky-400 font-mono text-[10.5px]">• v0.3.0</span>
        </span>
        <span className="h-2.5 w-px bg-slate-200 dark:bg-slate-800" aria-hidden="true" />
        <span className="text-[10.5px] text-slate-500 dark:text-slate-400 font-medium">
          {fr ? 'Studio de Génie Logiciel' : 'Software Engineering Studio'}
        </span>
      </div>

      {/* Titre Principal percutant avec dégradé Cobalt & Sky */}
      <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-[44px] font-extrabold tracking-tight text-slate-900 dark:text-white mb-2.5 sm:mb-3 leading-[1.18]">
        {fr ? 'Que voulez-vous concevoir avec ' : 'What will you architect with '}
        <span className="bg-gradient-to-r from-blue-600 via-sky-500 to-blue-500 bg-clip-text text-transparent">
          NEXUS AI
        </span>
        {fr ? ' ?' : ' ?'}
      </h1>

      {/* Sous-titre élégant */}
      <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm md:text-base max-w-xl mx-auto mb-5 sm:mb-6 leading-relaxed font-normal">
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
        <div className="w-full max-w-3xl mb-5 sm:mb-6 cursor-default select-text">
          {children}
        </div>
      )}

      {/* 4 Cartes d'actions rapides professionnelles (Grille 2x2 ou 4 colonnes avec cascade animée) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5 w-full max-w-4xl px-1 sm:px-2">
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
                'group relative flex flex-col items-start p-3 sm:p-4 rounded-2xl text-left cursor-pointer card-interactive animate-nexus-fade-up',
                'liquid-glass liquid-glass-card',
                'text-slate-800 dark:text-white',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
              )}
            >
              <div className="flex items-center justify-between w-full mb-2 sm:mb-2.5">
                <div className={cn('w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center border shadow-xs transition-all duration-300 group-hover:scale-125 group-hover:-rotate-12', action.badgeBg)}>
                  <IconComponent size={16} className={action.iconColor} />
                </div>
                <ArrowUpRight size={15} className="text-slate-400 group-hover:text-sky-400 dark:text-slate-500 dark:group-hover:text-sky-300 transition-all duration-300 opacity-60 group-hover:opacity-100 group-hover:translate-x-1.5 group-hover:-translate-y-1.5 group-hover:scale-125" />
              </div>
              <span className="text-[13px] sm:text-[13.5px] font-semibold text-slate-900 dark:text-white tracking-tight mb-0.5 sm:mb-1">
                {label}
              </span>
              <span className="text-[11px] sm:text-[11.5px] text-slate-500 dark:text-slate-400 leading-snug line-clamp-2">
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
