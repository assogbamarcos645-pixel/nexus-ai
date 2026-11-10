/**
 * src/types/swarm.ts
 *
 * Types et interfaces pour le module Multi-Agents « Swarm »
 * (Équipe Autonome de Développement & Intelligence Collective).
 */

export type SwarmSpecialistRole = 'architect' | 'frontend' | 'qa';

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
}

export type SwarmPhase = 'conception' | 'development' | 'audit' | 'convergence';

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
