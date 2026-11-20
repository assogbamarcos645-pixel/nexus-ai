/**
 * src/types/swarm.ts
 *
 * Types et interfaces pour le module Multi-Agents « Swarm »
 * (Équipe Autonome de Développement & Intelligence Collective).
 */

export type SwarmSpecialistRole =
  | 'architect'
  | 'frontend'
  | 'qa'
  | 'database'
  | 'security'
  | 'devops'
  | (string & {});

export interface SwarmSpecialist {
  id: SwarmSpecialistRole;
  name: string;
  tagline: string;
  focus: string;
  icon: string;
  color: string;
  accentBg: string;
  badgeBorder: string;
  badgeText: string;
  isCustom?: boolean;
}

export type SwarmPhase =
  | 'conception'
  | 'development'
  | 'audit'
  | 'convergence'
  | 'healing'
  | 'verification';

export interface SwarmCodeArtifact {
  filename: string;
  language: string;
  code: string;
  description: string;
}

export interface SwarmMessage {
  id: string;
  specialistRole: SwarmSpecialistRole;
  phase: SwarmPhase;
  title: string;
  content: string;
  timestamp: number;
  codeArtifact?: SwarmCodeArtifact;
  status: 'draft' | 'reviewed' | 'approved';
  checkpoints: string[];
}

export interface SwarmFinalSynthesis {
  summary: string;
  architectureContract: string;
  productionCode: string;
  targetFilename: string;
  testsCode: string;
  a11yCompliance: {
    wcagLevel: 'AA' | 'AAA';
    passedChecks: string[];
    ariaAttributes: string[];
  };
  securityAudit?: {
    owaspChecked: boolean;
    sanitized: boolean;
    notes: string;
  };
  databaseSchema?: {
    sqlSnippet?: string;
    rlsPolicies?: string[];
  };
}

export interface SwarmSessionState {
  id: string;
  taskPrompt: string;
  status: 'idle' | 'running' | 'converged' | 'stopped' | 'error';
  currentPhase: SwarmPhase;
  activeSpecialist: SwarmSpecialistRole | null;
  convergencePercent: number; // 0 à 100
  messages: SwarmMessage[];
  finalSynthesis: SwarmFinalSynthesis | null;
  error?: string | null;
}

export interface AutoHealIssue {
  fileId?: string;
  filePath: string;
  line?: number;
  message: string;
  severity: 'error' | 'warning';
  source?: 'lint' | 'compiler' | 'test' | 'runtime';
}

export interface AutoHealResult {
  success: boolean;
  fixedFilePath: string;
  originalCode: string;
  repairedCode: string;
  explanation: string;
  resolvedIssues: AutoHealIssue[];
}
