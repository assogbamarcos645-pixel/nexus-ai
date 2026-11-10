/**
 * src/components/lab/CodeEditor.tsx
 *
 * Éditeur de code intégré pour NEXUS LAB.
 * Utilise Monaco Editor avec thème sombre Cosmic, détection de langage,
 * gestion de l'état non-enregistré (Ctrl+S), barre d'état et repli fluide
 * (textarea avec numérotation de lignes) pour les écrans tactiles ou mobiles.
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Editor, { type OnMount } from '@monaco-editor/react';
import {
  Save,
  Sparkles,
  Check,
  AlertCircle,
  FileCode,
  Zap,
  Plus,
  FileText,
  Terminal,
  Activity,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { useTheme } from '@/hooks/useTheme';
import type {
  LabFile,
  CodeSelectionRange,
  InlineCopilotProposal,
  LabBottomTab,
  ConsoleMessage,
  LabProject,
} from '@/types/lab';
import {
  registerNexusCompletions,
  registerInlineGhostTextProvider,
  generateAICompletion,
  isGhostTextEnabled,
  setGhostTextEnabled,
} from '@/services/lab/codeCompletionService';
import { lintProjectFiles } from '@/services/lab/linterService';
import { InlineCopilotWidget } from './InlineCopilotWidget';
import { LabBottomPanel } from './terminal/LabBottomPanel';

interface CodeEditorProps {
  file: LabFile | null;
  content: string;
  hasUnsavedChanges: boolean;
  isSaving: boolean;
  onChange: (value: string) => void;
  onSave: () => void;
  onAskDev: () => void;
  showPreview?: boolean;
  onTogglePreview?: () => void;
  allFiles?: LabFile[];
  onSelectFile?: (fileId: string) => void;
  onNewFileClick?: () => void;
  project?: LabProject | null;
  onUpdateProjectFiles?: (files: LabFile[]) => void;
  onTriggerPreviewReload?: () => void;
}

function getTabFileIcon(path: string) {
  const ext = path.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'html':
      return <FileCode size={13} className="text-orange-400 shrink-0" />;
    case 'css':
      return <FileCode size={13} className="text-cyan-400 shrink-0" />;
    case 'js':
    case 'jsx':
      return <FileCode size={13} className="text-amber-300 shrink-0" />;
    case 'ts':
    case 'tsx':
      return <FileCode size={13} className="text-sky-400 shrink-0" />;
    case 'json':
      return <FileCode size={13} className="text-emerald-400 shrink-0" />;
    case 'py':
      return <FileCode size={13} className="text-blue-400 shrink-0" />;
    case 'php':
      return <FileCode size={13} className="text-indigo-400 shrink-0" />;
    case 'md':
      return <FileText size={13} className="text-purple-300 shrink-0" />;
    default:
      return <FileText size={13} className="text-slate-400 shrink-0" />;
  }
}

export function CodeEditor({
  file,
  content,
  hasUnsavedChanges,
  isSaving,
  onChange,
  onSave,
  onAskDev: _onAskDev,
  showPreview: _showPreview,
  onTogglePreview: _onTogglePreview,
  allFiles,
  onSelectFile,
  onNewFileClick,
  project,
  onUpdateProjectFiles,
  onTriggerPreviewReload,
}: CodeEditorProps) {
  const { resolvedTheme } = useTheme();
  const [monacoFailed, setMonacoFailed] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [cursorPos, setCursorPos] = useState({ lineNumber: 1, column: 1 });
  const [isGhostActive, setIsGhostActive] = useState(isGhostTextEnabled());
  const [isBottomPanelOpen, setIsBottomPanelOpen] = useState(false);
  const [bottomPanelTab, setBottomPanelTab] = useState<LabBottomTab>('terminal');
  const [logs, setLogs] = useState<ConsoleMessage[]>([]);

  // Écoute des logs émis par la prévisualisation runtime
  useEffect(() => {
    const handleRuntimeLog = (e: Event) => {
      const customEvt = e as CustomEvent<ConsoleMessage>;
      if (customEvt.detail) {
        setLogs((prev) => [...prev.slice(-99), customEvt.detail]);
      }
    };
    window.addEventListener('nexus-runtime-log', handleRuntimeLog);
    return () => window.removeEventListener('nexus-runtime-log', handleRuntimeLog);
  }, []);

  // Analyse statique & Linting in-browser en temps réel
  const lintDiagnostics = useMemo(() => {
    const filesToLint = allFiles && allFiles.length > 0 ? allFiles : file ? [file] : [];
    return lintProjectFiles(filesToLint);
  }, [allFiles, file]);

  const lintErrors = lintDiagnostics.filter((d) => d.severity === 'error').length;
  const lintWarnings = lintDiagnostics.filter((d) => d.severity === 'warning').length;

  const [copilotContext, setCopilotContext] = useState<{
    selectedCode: string;
    selectionRange: CodeSelectionRange | null;
    cursorPosition: { lineNumber: number; column: number } | null;
    topOffset: number;
  }>({
    selectedCode: '',
    selectionRange: null,
    cursorPosition: null,
    topOffset: 24,
  });
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);

  // Ouverture du widget Copilot Inline avec capture de la sélection et du curseur
  const openInlineCopilot = useCallback(() => {
    if (!file) return;

    let selectedCode = '';
    let selectionRange: CodeSelectionRange | null = null;
    let cursorPosition: { lineNumber: number; column: number } | null = null;
    let topOffset = 24;

    if (editorRef.current && monacoRef.current) {
      const editor = editorRef.current;
      const model = editor.getModel();
      const selection = editor.getSelection();
      const position = editor.getPosition();

      if (position) {
        cursorPosition = { lineNumber: position.lineNumber, column: position.column };
        const scrolledPos = editor.getScrolledVisiblePosition(position);
        if (scrolledPos) {
          topOffset = Math.max(16, scrolledPos.top + (scrolledPos.height || 20) + 8);
        }
      }

      if (selection && !selection.isEmpty() && model) {
        selectedCode = model.getValueInRange(selection);
        selectionRange = {
          startLineNumber: selection.startLineNumber,
          startColumn: selection.startColumn,
          endLineNumber: selection.endLineNumber,
          endColumn: selection.endColumn,
        };
      }
    }

    setCopilotContext({
      selectedCode,
      selectionRange,
      cursorPosition,
      topOffset,
    });
    setIsCopilotOpen(true);
  }, [file]);

  // Application de la proposition de code validée dans le widget
  const handleAcceptCopilot = useCallback(
    (proposal: InlineCopilotProposal) => {
      if (editorRef.current && monacoRef.current) {
        const editor = editorRef.current;
        const monaco = monacoRef.current;

        if (proposal.range) {
          editor.executeEdits('nexus-inline-copilot', [
            {
              range: new monaco.Range(
                proposal.range.startLineNumber,
                proposal.range.startColumn,
                proposal.range.endLineNumber,
                proposal.range.endColumn,
              ),
              text: proposal.suggestedSnippet,
              forceMoveMarkers: true,
            },
          ]);
          onChange(editor.getValue());
        } else {
          if (proposal.isWholeFile) {
            editor.setValue(proposal.suggestedSnippet);
            onChange(proposal.suggestedSnippet);
          } else {
            const pos = editor.getPosition();
            if (pos) {
              editor.executeEdits('nexus-inline-copilot', [
                {
                  range: new monaco.Range(pos.lineNumber, pos.column, pos.lineNumber, pos.column),
                  text: '\n' + proposal.suggestedSnippet + '\n',
                  forceMoveMarkers: true,
                },
              ]);
              onChange(editor.getValue());
            } else {
              editor.setValue(proposal.suggestedSnippet);
              onChange(proposal.suggestedSnippet);
            }
          }
        }
        editor.focus();
      } else {
        // Fallback sans Monaco
        if (proposal.isWholeFile || !proposal.range) {
          onChange(proposal.suggestedSnippet);
        } else {
          const newContent = content.replace(proposal.originalSnippet, proposal.suggestedSnippet);
          onChange(newContent);
        }
      }

      setIsCopilotOpen(false);
      setToastMessage('Modifications appliquées avec succès.');
      setTimeout(() => setToastMessage(null), 3000);
    },
    [content, onChange],
  );

  // Déclenchement de l'autocomplétion prédictive assistée par l'IA à la position du curseur
  const triggerAICompletion = useCallback(async () => {
    if (!editorRef.current || !monacoRef.current || !file || isCompleting) return;

    const editor = editorRef.current;
    const monaco = monacoRef.current;
    const model = editor.getModel();
    const position = editor.getPosition();
    if (!model || !position) return;

    const offset = model.getOffsetAt(position);
    const fullText = model.getValue();
    const codeBeforeCursor = fullText.slice(0, offset);
    const codeAfterCursor = fullText.slice(offset);

    setIsCompleting(true);
    try {
      const completionText = await generateAICompletion({
        file,
        codeBeforeCursor,
        codeAfterCursor,
      });

      if (completionText) {
        editor.executeEdits('nexus-ai-complete', [
          {
            range: new monaco.Range(
              position.lineNumber,
              position.column,
              position.lineNumber,
              position.column,
            ),
            text: completionText,
            forceMoveMarkers: true,
          },
        ]);
        onChange(editor.getValue());
        editor.focus();
      }
    } catch (err) {
      console.warn('[NEXUS AUTOCOMPLETE] Erreur:', err);
    } finally {
      setIsCompleting(false);
    }
  }, [file, isCompleting, onChange]);

  // Raccourci clavier global Ctrl+S / Cmd+S pour sauvegarde, Ctrl+K pour Copilot Inline et Alt+K pour autocomplétion IA
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        onSave();
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        openInlineCopilot();
      }
      if (e.altKey && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        triggerAICompletion();
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === '`' || e.key === 'Backquote')) {
        e.preventDefault();
        setIsBottomPanelOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onSave, openInlineCopilot, triggerAICompletion]);

  const handleEditorDidMount: OnMount = useCallback(
    (editor, monaco) => {
      editorRef.current = editor;
      monacoRef.current = monaco;

      // Enregistre les snippets et fournisseurs d'autocomplétion intelligents & Ghost Text
      registerNexusCompletions(monaco);
      registerInlineGhostTextProvider(monaco);

      // Définition d'un thème Cosmic sombre
      monaco.editor.defineTheme('nexus-cosmic', {
        base: 'vs-dark',
        inherit: true,
        rules: [
          { token: 'comment', foreground: '64748b', fontStyle: 'italic' },
          { token: 'keyword', foreground: 'c084fc' },
          { token: 'string', foreground: '22d3ee' },
          { token: 'number', foreground: '38bdf8' },
          { token: 'identifier', foreground: 'e2e8f0' },
          { token: 'type', foreground: 'a855f7' },
        ],
        colors: {
          'editor.background': '#070712',
          'editor.foreground': '#e2e8f0',
          'editorLineNumber.foreground': '#334155',
          'editorLineNumber.activeForeground': '#a855f7',
          'editorCursor.foreground': '#06b6d4',
          'editor.selectionBackground': '#7c0df440',
          'editor.lineHighlightBackground': '#1e143825',
          'editorGhostText.foreground': '#64748b',
          'editorGhostText.border': 'transparent',
        },
      });

      // Définition d'un thème Lumineux haute précision pour le mode clair
      monaco.editor.defineTheme('nexus-light', {
        base: 'vs',
        inherit: true,
        rules: [
          { token: 'comment', foreground: '64748b', fontStyle: 'italic' },
          { token: 'keyword', foreground: '7c3aed', fontStyle: 'bold' },
          { token: 'string', foreground: '0284c7' },
          { token: 'number', foreground: '0891b2' },
          { token: 'identifier', foreground: '0f172a' },
          { token: 'type', foreground: '9333ea' },
        ],
        colors: {
          'editor.background': '#ffffff',
          'editor.foreground': '#0f172a',
          'editorLineNumber.foreground': '#94a3b8',
          'editorLineNumber.activeForeground': '#7c3aed',
          'editorCursor.foreground': '#0284c7',
          'editor.selectionBackground': '#e0e7ff',
          'editor.lineHighlightBackground': '#f1f5f950',
          'editorGhostText.foreground': '#94a3b8',
          'editorGhostText.border': 'transparent',
        },
      });

      monaco.editor.setTheme(resolvedTheme === 'dark' ? 'nexus-cosmic' : 'nexus-light');

      // Commande de sauvegarde dans Monaco
      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
        onSave();
      });

      // Raccourci Ctrl+K / Cmd+K pour déclencher Copilot Inline
      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyK, () => {
        openInlineCopilot();
      });

      // Raccourci Alt+K pour complétion IA directement dans Monaco
      editor.addCommand(monaco.KeyMod.Alt | monaco.KeyCode.KeyK, () => {
        triggerAICompletion();
      });

      // Écoute en temps réel de la position du curseur pour la barre d'état
      editor.onDidChangeCursorPosition((e: any) => {
        if (e && e.position) {
          setCursorPos({ lineNumber: e.position.lineNumber, column: e.position.column });
        }
      });
    },
    [onSave, openInlineCopilot, resolvedTheme, triggerAICompletion],
  );

  // Synchronisation dynamique lors du basculement sombre/clair
  useEffect(() => {
    if (monacoRef.current) {
      monacoRef.current.editor.setTheme(
        resolvedTheme === 'dark' ? 'nexus-cosmic' : 'nexus-light',
      );
    }
  }, [resolvedTheme]);

  if (!file) {
    return (
      <div className="flex-1 h-full flex flex-col items-center justify-center bg-slate-50/70 dark:bg-surface-950 p-8 text-center text-slate-500 dark:text-white/40">
        <FileCode size={36} className="text-slate-400 dark:text-white/20 mb-3" />
        <p className="text-sm font-medium">Aucun fichier ouvert</p>
        <p className="text-xs text-slate-400 dark:text-white/30 mt-1">Sélectionnez un fichier dans l'explorateur à gauche pour commencer à coder.</p>
      </div>
    );
  }

  const linesCount = content.split('\n').length;
  const charsCount = content.length;

  return (
    <div id="nexus-lab-editor-container" className="flex-1 min-w-0 h-full flex flex-col bg-white dark:bg-[#070712] overflow-hidden">
      {/* Barre supérieure d'onglets de fichiers (Tabs Bar style VS Code / WebContainers) */}
      <div className="h-10 px-2 border-b border-slate-200/80 dark:border-white/10 bg-slate-100/75 dark:bg-[#06060f] flex items-center justify-between shrink-0 select-none overflow-x-auto scrollbar-none gap-2">
        {/* Onglets de fichiers */}
        <div className="flex items-center gap-1 min-w-0 overflow-x-auto scrollbar-none py-1">
          {allFiles && allFiles.length > 0 ? (
            allFiles.map((f) => {
              const isActive = f.id === file.id;
              const hasDraft = (isActive && hasUnsavedChanges) || Boolean(f.isModified);
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => onSelectFile?.(f.id)}
                  className={cn(
                    'group/tab relative flex items-center gap-2 px-3 py-1.5 rounded-t-lg text-xs font-mono font-medium transition-all cursor-pointer shrink-0 border-t-2',
                    isActive
                      ? 'bg-white dark:bg-[#070712] text-slate-900 dark:text-white border-nexus-500 shadow-xs'
                      : 'border-transparent text-slate-500 dark:text-white/50 hover:text-slate-800 dark:hover:text-white/80 hover:bg-slate-200/60 dark:hover:bg-white/5',
                  )}
                  title={`${f.path} (${f.language})`}
                >
                  {getTabFileIcon(f.path)}
                  <span className="truncate max-w-[140px]">{f.name}</span>
                  {hasDraft && (
                    <span
                      className="w-2 h-2 rounded-full bg-cyan-400 shrink-0 shadow-[0_0_6px_#22d3ee] animate-pulse"
                      title="Modifications non enregistrées"
                    />
                  )}
                </button>
              );
            })
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-t-lg bg-white dark:bg-[#070712] text-xs font-mono font-semibold border-t-2 border-nexus-500 text-slate-900 dark:text-white">
              {getTabFileIcon(file.path)}
              <span>{file.name}</span>
              {hasUnsavedChanges && (
                <span className="w-2 h-2 rounded-full bg-cyan-400 shrink-0 shadow-[0_0_6px_#22d3ee]" />
              )}
            </div>
          )}

          {/* Bouton rapide nouveau fichier */}
          {onNewFileClick && (
            <button
              type="button"
              onClick={onNewFileClick}
              className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:text-white/40 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-white/10 transition-colors cursor-pointer shrink-0 ml-0.5"
              title="Ajouter un nouveau fichier (Alt+N)"
              aria-label="Nouveau fichier"
            >
              <Plus size={14} />
            </button>
          )}
        </div>

        {/* Actions rapides de l'éditeur */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Action Copilot Inline (Ctrl+K) */}
          <button
            type="button"
            id="btn-inline-copilot"
            onClick={openInlineCopilot}
            disabled={!file}
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold text-white bg-gradient-to-r from-cyan-500 via-indigo-600 to-nexus-600 hover:from-cyan-400 hover:to-indigo-500 shadow-[0_0_12px_rgba(6,182,212,0.3)] transition-all cursor-pointer border border-cyan-400/30 disabled:opacity-40 shrink-0"
            title="Assistant IA Copilot Inline (Ctrl+K)"
          >
            <Sparkles size={12} className="text-cyan-200" />
            <span className="hidden 2xl:inline">Copilot</span>
            <kbd className="hidden 2xl:inline text-[9px] px-1 py-0.2 rounded bg-black/30 text-cyan-200 border border-white/20 font-mono">
              Ctrl+K
            </kbd>
          </button>

          {/* Action Autocomplétion IA */}
          <button
            type="button"
            id="btn-ai-autocomplete"
            onClick={triggerAICompletion}
            disabled={isCompleting || !file}
            className="hidden 2xl:flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-cyan-700 dark:text-cyan-300 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/25 transition-all cursor-pointer disabled:opacity-40 shrink-0"
            title="Autocomplétion intelligente par l'IA au curseur (Alt+K)"
          >
            <Zap size={12} className={isCompleting ? 'animate-spin text-cyan-500' : 'text-cyan-500 dark:text-cyan-400'} />
            <span>Compléter</span>
          </button>

          {/* Bouton Terminal Interactif (Ctrl+`) */}
          <button
            type="button"
            id="btn-toggle-terminal-top"
            onClick={() => {
              setIsBottomPanelOpen((prev) => !prev);
              setBottomPanelTab('terminal');
            }}
            className={cn(
              'flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer border shrink-0',
              isBottomPanelOpen
                ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30'
                : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-white/70 border-slate-200 dark:border-white/10 hover:text-white',
            )}
            title="Ouvrir le terminal interactif & console (Ctrl+`)"
          >
            <Terminal size={12} className="text-cyan-400" />
            <span className="hidden 2xl:inline">Terminal</span>
          </button>

          {/* Bouton Enregistrer */}
          <button
            type="button"
            id="btn-save-code"
            onClick={onSave}
            disabled={isSaving || !hasUnsavedChanges}
            className={cn(
              'flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer shrink-0',
              hasUnsavedChanges
                ? 'bg-nexus-600 text-white hover:bg-nexus-500 shadow-[0_0_10px_rgba(124,13,244,0.4)]'
                : 'bg-slate-200/50 dark:bg-white/5 text-slate-400 dark:text-white/30 cursor-not-allowed border border-slate-200 dark:border-transparent',
            )}
            title="Enregistrer les modifications (Ctrl+S)"
          >
            <Save size={12} />
            <span className="hidden 2xl:inline">{isSaving ? '...' : 'Enregistrer'}</span>
          </button>
        </div>
      </div>

      {/* Zone d'édition (Monaco ou Fallback Textarea) */}
      <div className="flex-1 relative overflow-hidden bg-white dark:bg-[#070712]">
        {/* Toast de confirmation de remplacement */}
        {toastMessage && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-semibold shadow-[0_0_20px_rgba(16,185,129,0.3)] backdrop-blur-md animate-in fade-in slide-in-from-top-2 duration-200 flex items-center gap-2">
            <Check size={14} className="text-emerald-400" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Assistant IA Copilot Inline (Ctrl+K) */}
        <InlineCopilotWidget
          isOpen={isCopilotOpen}
          file={file}
          fullContent={content}
          selectedCode={copilotContext.selectedCode}
          selectionRange={copilotContext.selectionRange}
          cursorPosition={copilotContext.cursorPosition}
          topOffset={copilotContext.topOffset}
          onClose={() => setIsCopilotOpen(false)}
          onAccept={handleAcceptCopilot}
        />

        {!monacoFailed ? (
          <Editor
            height="100%"
            path={file.path}
            language={file.language === 'plaintext' ? 'text' : file.language}
            value={content}
            theme={resolvedTheme === 'dark' ? 'nexus-cosmic' : 'nexus-light'}
            onChange={(val) => onChange(val ?? '')}
            onMount={handleEditorDidMount}
            loading={
              <div className="h-full flex items-center justify-center text-xs text-slate-400 dark:text-white/40 font-mono">
                Chargement de l'éditeur Monaco...
              </div>
            }
            options={{
              minimap: { enabled: false },
              fontSize: 13,
              fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
              tabSize: 2,
              automaticLayout: true,
              scrollBeyondLastLine: false,
              wordWrap: 'on',
              smoothScrolling: true,
              cursorBlinking: 'smooth',
              inlineSuggest: {
                enabled: isGhostActive,
                mode: 'subwordSmart',
                showToolbar: 'always',
              },
              quickSuggestions: { other: true, comments: false, strings: true },
              suggestOnTriggerCharacters: true,
              wordBasedSuggestions: 'currentDocument',
              acceptSuggestionOnEnter: 'on',
              tabCompletion: 'on',
              snippetSuggestions: 'top',
              suggest: {
                preview: true,
                showWords: true,
                showSnippets: true,
                showClasses: true,
                showFunctions: true,
                showVariables: true,
                showKeywords: true,
                showConstants: true,
              },
            }}
          />
        ) : (
          /* Repli sécurisé pour mobile / défaillance Monaco */
          <div className="h-full flex flex-col p-2 bg-slate-100 dark:bg-[#070712]">
            <div className="flex items-center gap-2 p-2 mb-2 bg-amber-500/10 border border-amber-500/20 rounded text-amber-700 dark:text-amber-300 text-xs">
              <AlertCircle size={14} />
              <span>Mode éditeur de repli (compatible mobile & tactile).</span>
            </div>
            <textarea
              value={content}
              onChange={(e) => onChange(e.target.value)}
              className="flex-1 w-full bg-white dark:bg-black/40 text-slate-900 dark:text-white font-mono text-xs p-3 rounded-lg border border-slate-300 dark:border-white/10 outline-none resize-none leading-relaxed"
              spellCheck={false}
            />
          </div>
        )}
      </div>

      {/* Panneau escamotable sous Monaco : Terminal / Console / Lint */}
      <LabBottomPanel
        isOpen={isBottomPanelOpen}
        onClose={() => setIsBottomPanelOpen(false)}
        activeTab={bottomPanelTab}
        onChangeTab={setBottomPanelTab}
        project={project || null}
        logs={logs}
        onClearLogs={() => setLogs([])}
        lintDiagnostics={lintDiagnostics}
        onSelectFile={onSelectFile}
        onUpdateProjectFiles={onUpdateProjectFiles}
        onTriggerPreviewReload={onTriggerPreviewReload}
      />

      {/* Barre d'état inférieure style VS Code */}
      <footer className="h-6 px-2.5 border-t border-slate-200/80 dark:border-white/6 bg-slate-100/90 dark:bg-[#06060f] flex items-center justify-between text-[11px] text-slate-500 dark:text-white/45 font-mono shrink-0 select-none overflow-hidden gap-2">
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 overflow-hidden">
          <span className="text-slate-800 dark:text-white/70 font-semibold shrink-0">
            Ln {cursorPos.lineNumber}, Col {cursorPos.column}
          </span>
          <span className="hidden xl:inline truncate">
            {linesCount} lignes • {charsCount} car.
          </span>
          <span className="hidden 2xl:inline shrink-0">Espaces: 2</span>
          <span className="hidden 2xl:inline shrink-0">UTF-8</span>
          <span className="text-cyan-700 dark:text-cyan-300 uppercase font-semibold shrink-0">
            {file.language}
          </span>
          {hasUnsavedChanges ? (
            <span className="inline-flex items-center gap-1 text-[10px] text-cyan-600 dark:text-cyan-300 font-medium shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse shadow-[0_0_6px_#22d3ee]" />
              <span className="hidden sm:inline">Non enregistré</span>
            </span>
          ) : (
            <span className="hidden sm:inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-medium shrink-0">
              <Check size={11} />
              <span>Enregistré</span>
            </span>
          )}

          {/* Déclencheurs rapides du panneau escamotable */}
          <span className="text-slate-300 dark:text-white/10 hidden sm:inline shrink-0">|</span>

          <button
            type="button"
            onClick={() => {
              setIsBottomPanelOpen(true);
              setBottomPanelTab('terminal');
            }}
            className="flex items-center gap-1 text-[10px] text-cyan-600 dark:text-cyan-400 hover:text-cyan-300 cursor-pointer transition-colors shrink-0"
            title="Ouvrir le terminal interactif (Ctrl+`)"
          >
            <Terminal size={11} />
            <span className="hidden md:inline">Terminal</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setIsBottomPanelOpen(true);
              setBottomPanelTab('console');
            }}
            className="flex items-center gap-1 text-[10px] text-purple-600 dark:text-purple-400 hover:text-purple-300 cursor-pointer transition-colors shrink-0"
            title="Ouvrir la console d'exécution"
          >
            <Activity size={11} />
            <span className="hidden md:inline">Console</span>
            {logs.length > 0 && <span className="font-bold">({logs.length})</span>}
          </button>

          <button
            type="button"
            onClick={() => {
              setIsBottomPanelOpen(true);
              setBottomPanelTab('lint');
            }}
            className={cn(
              'flex items-center gap-1 text-[10px] cursor-pointer transition-colors shrink-0',
              lintErrors > 0
                ? 'text-red-500 dark:text-red-400 font-bold'
                : lintWarnings > 0
                ? 'text-amber-500 dark:text-amber-400'
                : 'text-emerald-500 dark:text-emerald-400',
            )}
            title="Ouvrir les diagnostics Lint"
          >
            <AlertTriangle size={11} />
            <span className="hidden lg:inline">Lint</span>
            <span>{lintErrors + lintWarnings > 0 ? `(${lintErrors + lintWarnings})` : '0'}</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* Indicateur et sélecteur Ghost Text Copilot (< 200 ms) */}
          <button
            type="button"
            id="btn-toggle-ghost-text"
            onClick={() => {
              const nextState = !isGhostActive;
              setIsGhostActive(nextState);
              setGhostTextEnabled(nextState);
              setToastMessage(nextState ? 'Ghost Text activé : Tab pour accepter, Échap pour rejeter.' : 'Ghost Text désactivé.');
              setTimeout(() => setToastMessage(null), 2500);
            }}
            className={cn(
              'flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono transition-all cursor-pointer border shrink-0',
              isGhostActive
                ? 'text-cyan-700 dark:text-cyan-300 bg-cyan-500/10 border-cyan-500/25 hover:bg-cyan-500/20'
                : 'text-slate-400 dark:text-white/30 bg-slate-100 dark:bg-white/5 border-transparent hover:text-slate-600 dark:hover:text-white',
            )}
            title="Auto-complétion en direct Ghost Text (< 200 ms). Tab pour accepter, Échap pour rejeter. Cliquez pour activer/désactiver."
          >
            <span
              className={cn(
                'w-1.5 h-1.5 rounded-full shrink-0',
                isGhostActive
                  ? 'bg-cyan-400 animate-pulse shadow-[0_0_6px_#22d3ee]'
                  : 'bg-slate-400 dark:bg-white/20',
              )}
            />
            <span className="font-semibold">Ghost Text</span>
            <span className="text-[9px] text-cyan-600 dark:text-cyan-400 hidden xl:inline font-sans">&lt; 200 ms</span>
            <span className="hidden 2xl:inline text-[9px] text-slate-500 dark:text-white/40 border border-slate-300 dark:border-white/10 rounded px-1">Tab ⇥</span>
          </button>

          <span className="text-slate-300 dark:text-white/10 hidden sm:inline">|</span>

          <button
            type="button"
            onClick={openInlineCopilot}
            className="flex items-center gap-1 text-[10px] text-nexus-600 dark:text-cyan-300 hover:underline cursor-pointer"
            title="Ouvrir Copilot Inline (Ctrl+K)"
          >
            <Sparkles size={11} />
            <span className="hidden sm:inline">Copilot (Ctrl+K)</span>
          </button>

          <span className="text-slate-300 dark:text-white/10 hidden sm:inline">|</span>

          <button
            type="button"
            onClick={() => setMonacoFailed((prev) => !prev)}
            className="text-[10px] text-slate-500 dark:text-white/40 hover:text-slate-800 dark:hover:text-white cursor-pointer"
            title="Basculer entre Monaco et le mode texte léger"
          >
            {monacoFailed ? 'Activer Monaco' : 'Mode léger'}
          </button>
        </div>
      </footer>
    </div>
  );
}
