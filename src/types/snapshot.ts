/**
 * src/types/snapshot.ts
 *
 * Types pour les instantanés (snapshots) et l'historique de versions dans NEXUS LAB.
 */

import type { LabFile } from './lab';

export interface ProjectSnapshot {
  id: string;
  projectId: string;
  label: string;
  description?: string;
  timestamp: string;
  files: LabFile[];
  author: 'user' | 'ai-dev' | 'ai-swarm' | 'copilot' | 'auto';
  fileCount: number;
}
