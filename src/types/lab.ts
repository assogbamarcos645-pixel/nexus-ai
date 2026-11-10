/**
 * src/types/lab.ts
 *
 * Types et interfaces pour l'espace de travail intégré « NEXUS LAB ».
 */

export type ProjectTemplateId =
  | 'blank'
  | 'html-css-js'
  | 'react-vite'
  | 'node-api'
  | 'php-app'
  | 'python-app';

export type FileLanguage =
  | 'html'
  | 'css'
  | 'javascript'
  | 'typescript'
  | 'json'
  | 'python'
  | 'php'
  | 'markdown'
  | 'plaintext';

export interface LabFile {
  id: string;
  name: string;
  path: string; // e.g. "index.html", "src/App.tsx"
  content: string;
  language: FileLanguage;
  isModified?: boolean;
}

export interface LabProject {
  id: string;
  name: string;
  description: string;
  templateId: ProjectTemplateId;
  files: LabFile[];
  createdAt: string;
  updatedAt: string;
  isDemo?: boolean;
  isCloudSynced?: boolean;
  mockupImage?: string; // Capture ou maquette d'origine (Gemini 2.5) pour la comparaison visuelle
}

export interface InspectedElementInfo {
  tagName: string;
  id?: string;
  className?: string;
  textContent?: string;
  outerHTML?: string;
  selector?: string;
  computedStyles?: {
    color?: string;
    backgroundColor?: string;
    fontSize?: string;
    padding?: string;
    borderRadius?: string;
    display?: string;
  };
}

export type MockupComparisonMode = 'split' | 'fade' | 'side-by-side';

export interface ProjectTemplate {
  id: ProjectTemplateId;
  name: string;
  description: string;
  category: 'frontend' | 'fullstack' | 'backend';
  icon: string;
  badge: string;
  defaultFiles: Omit<LabFile, 'id'>[];
  executionType: 'browser-iframe' | 'server-required';
  serverRequirements?: {
    runtime: string;
    dependencies: string[];
    installCommand: string;
    runCommand: string;
    port?: number;
    notes?: string;
  };
}

export interface DevProposal {
  id: string;
  filePath: string;
  explanation: string;
  originalCode: string;
  suggestedCode: string;
  timestamp: Date;
  isMock: boolean;
}

export interface CodeSelectionRange {
  startLineNumber: number;
  startColumn: number;
  endLineNumber: number;
  endColumn: number;
}

export interface InlineCopilotProposal {
  id: string;
  filePath: string;
  prompt: string;
  explanation: string;
  originalSnippet: string;
  suggestedSnippet: string;
  range: CodeSelectionRange | null;
  isWholeFile: boolean;
  timestamp: Date;
  isMock?: boolean;
}

export type LabTab = 'explorer' | 'editor' | 'preview' | 'assistant';

export type LabLayoutMode = 'split' | 'code-only' | 'preview-only';

export type LabBottomTab = 'terminal' | 'console' | 'lint';

export interface TerminalEntry {
  id: string;
  type: 'command' | 'output' | 'error' | 'system' | 'success' | 'info';
  text: string;
  timestamp: string;
}

export interface ConsoleMessage {
  id: string;
  type: 'log' | 'warn' | 'error' | 'info';
  message: string;
  time: string;
}

export interface LintDiagnostic {
  id: string;
  fileId: string;
  filePath: string;
  fileName: string;
  line: number;
  column: number;
  message: string;
  severity: 'error' | 'warning' | 'info';
  source?: string;
  rule?: string;
}

export type RuntimeEngineType = 'in-browser-vite' | 'webcontainer';

export interface RuntimeStatus {
  engine: RuntimeEngineType;
  isReady: boolean;
  isRunningDev: boolean;
  port: number;
  url: string;
  lastHmrTime?: number;
  errorCount: number;
  warningCount: number;
}


