/**
 * src/components/lab/terminal/LabBottomPanel.tsx
 *
 * Panneau escamotable sous Monaco Editor comprenant 3 onglets intégrés :
 * 1. Terminal interactif (WebContainers & Shell avec npm, node, vite, fs)
 * 2. Console logs (flux des logs de la prévisualisation et erreurs runtime)
 * 3. Lint & Diagnostics (analyse statique in-browser en temps réel avec navigation directe)
 */

import { useState, useRef, useEffect } from 'react';
import {
  Terminal,
  Activity,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  X,
  Trash2,
  Send,
  Play,
  Package,
  Layers,
  Sparkles,
  ExternalLink,
  Search,
} from 'lucide-react';
import type { LabProject, LabFile, LabBottomTab, TerminalEntry, ConsoleMessage, LintDiagnostic } from '@/types/lab';
import { executeTerminalCommand, isWebContainerSupported } from '@/services/lab/runtimeService';
import { cn } from '@/utils/cn';

interface LabBottomPanelProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: LabBottomTab;
  onChangeTab: (tab: LabBottomTab) => void;
  project: LabProject | null;
  logs: ConsoleMessage[];
  onClearLogs: () => void;
  lintDiagnostics: LintDiagnostic[];
  onSelectFile?: (fileId: string) => void;
  onUpdateProjectFiles?: (files: LabFile[]) => void;
  onTriggerPreviewReload?: () => void;
}

export function LabBottomPanel({
  isOpen,
  onClose,
  activeTab,
  onChangeTab,
  project,
  logs,
  onClearLogs,
  lintDiagnostics,
  onSelectFile,
  onUpdateProjectFiles,
  onTriggerPreviewReload,
}: LabBottomPanelProps) {
  const [isMaximized, setIsMaximized] = useState(false);
  const [inputVal, setInputVal] = useState('');
  const [historyIndex, setHistoryIndex] = useState<number | null>(null);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [consoleFilter, setConsoleFilter] = useState<'all' | 'log' | 'warn' | 'error' | 'info'>('all');
  const [consoleSearch, setConsoleSearch] = useState('');

  const [terminalEntries, setTerminalEntries] = useState<TerminalEntry[]>(() => [
    {
      id: 'init-1',
      type: 'system',
      text: 'NEXUS LAB Runtime v2.0 • WebContainers & Node.js/Vite in-browser',
      timestamp: new Date().toLocaleTimeString('fr-FR'),
    },
    {
      id: 'init-2',
      type: 'system',
      text: 'Tapez "help" pour voir la liste des commandes ou cliquez sur les actions rapides ci-dessous.',
      timestamp: new Date().toLocaleTimeString('fr-FR'),
    },
  ]);

  const terminalEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll du terminal lorsqu'une nouvelle ligne arrive
  useEffect(() => {
    if (activeTab === 'terminal' && isOpen) {
      terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [terminalEntries, activeTab, isOpen]);

  // Focus sur l'input du terminal
  useEffect(() => {
    if (activeTab === 'terminal' && isOpen) {
      inputRef.current?.focus();
    }
  }, [activeTab, isOpen]);

  const runCommand = async (commandToRun: string) => {
    const trimmed = commandToRun.trim();
    if (!trimmed || !project) return;

    const time = new Date().toLocaleTimeString('fr-FR');
    const userEntry: TerminalEntry = {
      id: `cmd-${Date.now()}`,
      type: 'command',
      text: trimmed,
      timestamp: time,
    };

    setTerminalEntries((prev) => [...prev, userEntry]);
    setCommandHistory((prev) => [...prev, trimmed]);
    setHistoryIndex(null);
    setInputVal('');

    // Effacement de l'écran si commande 'clear'
    if (trimmed.toLowerCase() === 'clear') {
      setTerminalEntries([]);
      return;
    }

    try {
      const res = await executeTerminalCommand(trimmed, project);
      const resEntry: TerminalEntry = {
        id: `res-${Date.now()}`,
        type: res.type,
        text: res.output,
        timestamp: new Date().toLocaleTimeString('fr-FR'),
      };

      setTerminalEntries((prev) => [...prev, resEntry]);

      // Si la commande a mis à jour les fichiers (ex: npm install)
      if (res.updatedFiles && onUpdateProjectFiles) {
        onUpdateProjectFiles(res.updatedFiles);
      }

      // Si commande de dev, actualiser l'aperçu
      if (trimmed.startsWith('npm run dev') || trimmed === 'npm start') {
        onTriggerPreviewReload?.();
      }
    } catch (err: any) {
      setTerminalEntries((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          type: 'error',
          text: `Erreur d'exécution: ${err?.message || err}`,
          timestamp: new Date().toLocaleTimeString('fr-FR'),
        },
      ]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      runCommand(inputVal);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length === 0) return;
      const nextIdx = historyIndex === null ? commandHistory.length - 1 : Math.max(0, historyIndex - 1);
      setHistoryIndex(nextIdx);
      setInputVal(commandHistory[nextIdx]);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex === null) return;
      if (historyIndex < commandHistory.length - 1) {
        const nextIdx = historyIndex + 1;
        setHistoryIndex(nextIdx);
        setInputVal(commandHistory[nextIdx]);
      } else {
        setHistoryIndex(null);
        setInputVal('');
      }
    }
  };

  const errorsCount = lintDiagnostics.filter((d) => d.severity === 'error').length;
  const warningsCount = lintDiagnostics.filter((d) => d.severity === 'warning').length;
  const consoleErrors = logs.filter((l) => l.type === 'error').length;

  const filteredLogs = logs.filter((log) => {
    if (consoleFilter !== 'all' && log.type !== consoleFilter) return false;
    if (consoleSearch && !log.message.toLowerCase().includes(consoleSearch.toLowerCase())) return false;
    return true;
  });

  if (!isOpen) return null;

  return (
    <div
      id="nexus-lab-bottom-panel"
      className={cn(
        'w-full border-t border-slate-200/90 dark:border-white/10 bg-white dark:bg-[#070712] flex flex-col shrink-0 transition-all duration-200 z-30 select-none shadow-[0_-8px_30px_rgba(0,0,0,0.25)]',
        isMaximized ? 'h-[60vh] max-h-[500px] min-h-[260px]' : 'h-[230px] max-h-[45vh] min-h-[160px]',
      )}
    >
      {/* Barre d'en-tête du panneau avec onglets et commandes */}
      <div className="h-9 px-3 border-b border-slate-200/80 dark:border-white/8 bg-slate-100/90 dark:bg-[#06060f] flex items-center justify-between shrink-0">
        {/* Onglets */}
        <div className="flex items-center gap-1">
          {/* Onglet 1 : Terminal */}
          <button
            type="button"
            onClick={() => onChangeTab('terminal')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-mono font-medium transition-all cursor-pointer',
              activeTab === 'terminal'
                ? 'bg-white dark:bg-white/10 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 dark:text-white/50 hover:text-slate-800 dark:hover:text-white',
            )}
          >
            <Terminal size={13} className="text-cyan-400" />
            <span>Terminal</span>
          </button>

          {/* Onglet 2 : Console Logs */}
          <button
            type="button"
            onClick={() => onChangeTab('console')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-mono font-medium transition-all cursor-pointer',
              activeTab === 'console'
                ? 'bg-white dark:bg-white/10 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 dark:text-white/50 hover:text-slate-800 dark:hover:text-white',
            )}
          >
            <Activity size={13} className="text-purple-400 shrink-0" />
            <span className="hidden sm:inline">Console logs</span>
            <span className="sm:hidden">Console</span>
            {consoleErrors > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                {consoleErrors}
              </span>
            )}
          </button>

          {/* Onglet 3 : Lint */}
          <button
            type="button"
            onClick={() => onChangeTab('lint')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-mono font-medium transition-all cursor-pointer',
              activeTab === 'lint'
                ? 'bg-white dark:bg-white/10 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 dark:text-white/50 hover:text-slate-800 dark:hover:text-white',
            )}
          >
            <AlertTriangle
              size={13}
              className={errorsCount > 0 ? 'text-red-400' : warningsCount > 0 ? 'text-amber-400' : 'text-emerald-400'}
            />
            <span>Lint</span>
            {errorsCount + warningsCount > 0 && (
              <span
                className={cn(
                  'px-1.5 py-0.2 rounded-full text-[10px] font-bold',
                  errorsCount > 0
                    ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                    : 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
                )}
              >
                {errorsCount + warningsCount}
              </span>
            )}
          </button>
        </div>

        {/* Contrôles du runtime et du volet */}
        <div className="flex items-center gap-2">
          {/* Badge de statut du runtime */}
          <div className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_#34d399]" />
            <span>{isWebContainerSupported() ? 'WebContainers Engine' : 'Vite HMR Sub-seconde (Port 5173)'}</span>
          </div>

          {/* Vider les logs / console */}
          {activeTab === 'console' && (
            <button
              type="button"
              onClick={onClearLogs}
              className="p-1 rounded text-slate-400 hover:text-slate-700 dark:text-white/40 dark:hover:text-white transition-colors cursor-pointer"
              title="Vider la console"
            >
              <Trash2 size={13} />
            </button>
          )}

          {/* Vider le terminal */}
          {activeTab === 'terminal' && (
            <button
              type="button"
              onClick={() => setTerminalEntries([])}
              className="p-1 rounded text-slate-400 hover:text-slate-700 dark:text-white/40 dark:hover:text-white transition-colors cursor-pointer"
              title="Effacer le terminal (clear)"
            >
              <Trash2 size={13} />
            </button>
          )}

          {/* Agrandir / Réduire */}
          <button
            type="button"
            onClick={() => setIsMaximized((prev) => !prev)}
            className="p-1 rounded text-slate-400 hover:text-slate-700 dark:text-white/40 dark:hover:text-white transition-colors cursor-pointer"
            title={isMaximized ? 'Réduire la hauteur' : 'Agrandir le panneau'}
          >
            {isMaximized ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          </button>

          {/* Fermer */}
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-red-500 dark:text-white/40 dark:hover:text-red-400 transition-colors cursor-pointer"
            title="Fermer le panneau inférieur"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Contenu principal du panneau selon l'onglet actif */}
      <div className="flex-1 overflow-hidden flex flex-col font-mono text-xs select-text">
        {/* ONGLET 1 : TERMINAL INTERACTIF */}
        {activeTab === 'terminal' && (
          <div className="flex-1 flex flex-col bg-[#070712] text-slate-200 overflow-hidden">
            {/* Puces d'actions rapides (Quick Chips) */}
            <div className="px-3 py-1.5 border-b border-white/5 bg-[#090916] flex items-center gap-2 overflow-x-auto scrollbar-none shrink-0">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mr-1">Actions :</span>
              <button
                type="button"
                onClick={() => runCommand('npm run dev')}
                className="flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/25 transition-all cursor-pointer text-[11px]"
              >
                <Play size={10} />
                <span>npm run dev</span>
              </button>
              <button
                type="button"
                onClick={() => runCommand('npm install lucide-react')}
                className="flex items-center gap-1 px-2 py-0.5 rounded bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/25 transition-all cursor-pointer text-[11px]"
              >
                <Package size={10} />
                <span>npm i lucide-react</span>
              </button>
              <button
                type="button"
                onClick={() => runCommand('npm run build')}
                className="flex items-center gap-1 px-2 py-0.5 rounded bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/25 transition-all cursor-pointer text-[11px]"
              >
                <Layers size={10} />
                <span>npm run build</span>
              </button>
              <button
                type="button"
                onClick={() => runCommand('npm test')}
                className="flex items-center gap-1 px-2 py-0.5 rounded bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/25 transition-all cursor-pointer text-[11px]"
              >
                <Sparkles size={10} />
                <span>npm test</span>
              </button>
              <button
                type="button"
                onClick={() => runCommand('ls')}
                className="flex items-center gap-1 px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 transition-all cursor-pointer text-[11px]"
              >
                <span>ls</span>
              </button>
            </div>

            {/* Zone de défilement des sorties terminal */}
            <div className="flex-1 overflow-y-auto p-3 space-y-1.5 scrollbar-thin">
              {terminalEntries.map((entry) => {
                if (entry.type === 'command') {
                  return (
                    <div key={entry.id} className="flex items-start gap-2 text-cyan-400">
                      <span className="text-nexus-400 select-none">nexus@lab:~$</span>
                      <span className="font-semibold text-white">{entry.text}</span>
                    </div>
                  );
                }
                if (entry.type === 'error') {
                  return (
                    <pre key={entry.id} className="text-red-400 font-mono whitespace-pre-wrap leading-relaxed">
                      {entry.text}
                    </pre>
                  );
                }
                if (entry.type === 'success') {
                  return (
                    <pre key={entry.id} className="text-emerald-400 font-mono whitespace-pre-wrap leading-relaxed">
                      {entry.text}
                    </pre>
                  );
                }
                if (entry.type === 'info') {
                  return (
                    <pre key={entry.id} className="text-cyan-300 font-mono whitespace-pre-wrap leading-relaxed">
                      {entry.text}
                    </pre>
                  );
                }
                if (entry.type === 'system') {
                  return (
                    <div key={entry.id} className="text-slate-400 font-mono text-[11px]">
                      {entry.text}
                    </div>
                  );
                }
                return (
                  <pre key={entry.id} className="text-slate-300 font-mono whitespace-pre-wrap leading-relaxed">
                    {entry.text}
                  </pre>
                );
              })}
              <div ref={terminalEndRef} />
            </div>

            {/* Ligne d'invite interactive */}
            <div className="h-10 px-3 border-t border-white/8 bg-[#090916] flex items-center gap-2 shrink-0">
              <span className="text-nexus-400 font-bold select-none text-xs hidden sm:inline">nexus@lab:~$</span>
              <span className="text-nexus-400 font-bold select-none text-xs sm:hidden">$</span>
              <input
                ref={inputRef}
                type="text"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Tapez une commande (npm install, npm run dev, node, ls...)"
                className="flex-1 bg-transparent text-white outline-none font-mono text-xs placeholder:text-white/20"
                spellCheck={false}
              />
              <button
                type="button"
                onClick={() => runCommand(inputVal)}
                disabled={!inputVal.trim()}
                className="p-1.5 rounded-lg bg-nexus-600 hover:bg-nexus-500 disabled:opacity-30 text-white transition-all cursor-pointer"
                title="Exécuter la commande (Entrée)"
              >
                <Send size={12} />
              </button>
            </div>
          </div>
        )}

        {/* ONGLET 2 : CONSOLE LOGS */}
        {activeTab === 'console' && (
          <div className="flex-1 flex flex-col bg-[#070712] text-slate-200 overflow-hidden">
            {/* Barre de filtre et de recherche */}
            <div className="px-3 py-1.5 border-b border-white/5 bg-[#090916] flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-1.5">
                {(['all', 'log', 'info', 'warn', 'error'] as const).map((filter) => (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setConsoleFilter(filter)}
                    className={cn(
                      'px-2 py-0.5 rounded text-[11px] font-mono capitalize transition-all cursor-pointer',
                      consoleFilter === filter
                        ? 'bg-nexus-600 text-white font-semibold'
                        : 'text-slate-400 hover:text-white hover:bg-white/5',
                    )}
                  >
                    {filter === 'all' ? 'Tous' : filter}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-white/5 border border-white/10 text-xs">
                <Search size={11} className="text-slate-400" />
                <input
                  type="text"
                  value={consoleSearch}
                  onChange={(e) => setConsoleSearch(e.target.value)}
                  placeholder="Filtrer les messages..."
                  className="bg-transparent text-white outline-none text-[11px] w-36"
                />
              </div>
            </div>

            {/* Flux des logs */}
            <div className="flex-1 overflow-y-auto p-3 space-y-1 scrollbar-thin">
              {filteredLogs.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 text-center py-8">
                  <Activity size={24} className="opacity-30 mb-2" />
                  <p>Aucun log de console pour le moment.</p>
                  <p className="text-[11px] text-slate-600 mt-0.5">Les sorties console.log() et les erreurs de la prévisualisation apparaîtront ici.</p>
                </div>
              ) : (
                filteredLogs.map((log) => (
                  <div
                    key={log.id}
                    className={cn(
                      'flex items-start gap-2.5 px-2 py-1 rounded border font-mono text-[11px] leading-relaxed',
                      log.type === 'error'
                        ? 'bg-red-500/10 border-red-500/25 text-red-300'
                        : log.type === 'warn'
                        ? 'bg-amber-500/10 border-amber-500/25 text-amber-300'
                        : log.type === 'info'
                        ? 'bg-cyan-500/10 border-cyan-500/25 text-cyan-300'
                        : 'bg-white/5 border-transparent text-slate-300',
                    )}
                  >
                    <span className="text-slate-500 select-none text-[10px] shrink-0">{log.time}</span>
                    <span className="uppercase font-bold text-[10px] select-none shrink-0 opacity-80">[{log.type}]</span>
                    <span className="flex-1 whitespace-pre-wrap break-all">{log.message}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ONGLET 3 : LINT & DIAGNOSTICS */}
        {activeTab === 'lint' && (
          <div className="flex-1 flex flex-col bg-[#070712] text-slate-200 overflow-hidden">
            <div className="px-3 py-1.5 border-b border-white/5 bg-[#090916] flex items-center justify-between shrink-0">
              <span className="text-xs text-slate-400">
                {lintDiagnostics.length === 0
                  ? 'Aucun problème détecté dans le projet'
                  : `${lintDiagnostics.length} problème(s) détecté(s)`}
              </span>
              <div className="flex items-center gap-2 text-[11px]">
                <span className="text-red-400 font-semibold">{errorsCount} Erreur(s)</span>
                <span className="text-slate-500">•</span>
                <span className="text-amber-400 font-semibold">{warningsCount} Avertissement(s)</span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-1.5 scrollbar-thin">
              {lintDiagnostics.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 text-center py-8">
                  <Sparkles size={24} className="text-emerald-400/50 mb-2" />
                  <p className="text-emerald-400 font-medium">Code impeccable !</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Aucune erreur de syntaxe ou avertissement d'import dans vos fichiers.</p>
                </div>
              ) : (
                lintDiagnostics.map((diag) => (
                  <div
                    key={diag.id}
                    onClick={() => onSelectFile?.(diag.fileId)}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/5 hover:border-nexus-500/40 hover:bg-white/10 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <AlertTriangle
                        size={14}
                        className={diag.severity === 'error' ? 'text-red-400 shrink-0' : 'text-amber-400 shrink-0'}
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white text-xs">{diag.fileName}</span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            Ln {diag.line}, Col {diag.column}
                          </span>
                          {diag.rule && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-white/5 text-slate-400 font-mono">
                              {diag.rule}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-300 mt-0.5 truncate">{diag.message}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 text-[11px] text-cyan-400 group-hover:text-cyan-300 opacity-80 group-hover:opacity-100 shrink-0 ml-3">
                      <span>Aller au fichier</span>
                      <ExternalLink size={11} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
