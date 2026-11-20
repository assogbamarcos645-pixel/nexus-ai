/**
 * src/services/admin/adminAgentsService.ts
 *
 * Gestionnaire d'Agents Specialises & System Prompts :
 * - Catalogue des agents specialises (activer, masquer, desactiver)
 * - Editeur du System Prompt maitre
 * - Historique des versions et rollback en 1 clic
 */

import type { ManagedAgent, SystemPromptVersion } from '../../types/admin.ts';
import { generateUUID } from '../../utils/uuid.ts';
import { logAdminAudit } from './adminSecurityService.ts';

const AGENTS_STORAGE_KEY = 'nexus_admin_agents_v1';
const PROMPTS_STORAGE_KEY = 'nexus_admin_prompts_v1';

export function getDefaultAgents(): ManagedAgent[] {
  return [
    {
      id: 'agent-architect',
      name: 'Agent Architecte Logiciel',
      roleTitle: 'Architecture Cloud & Systèmes',
      description: 'Conçoit des architectures modulaires, scalables et résilientes.',
      avatarIcon: 'Cpu',
      status: 'active',
      modelId: 'claude-3-5-sonnet-20241022',
      temperature: 0.2,
      systemPromptSnippet: 'Tu es un architecte logiciel d exception. Tu concois des patterns propres...',
      updatedAt: '2026-02-18T10:00:00.000Z',
    },
    {
      id: 'agent-security',
      name: 'Agent Audit & Sécurité',
      roleTitle: 'Auditeur Cybersécurité & Pentest',
      description: 'Analyse les failles OWASP, injections, fuites de clés et conformité RGPD.',
      avatarIcon: 'ShieldAlert',
      status: 'active',
      modelId: 'gpt-4o',
      temperature: 0.1,
      systemPromptSnippet: 'Tu es un expert senior en cybersécurité offensive et défensive...',
      updatedAt: '2026-02-15T14:30:00.000Z',
    },
    {
      id: 'agent-fullstack',
      name: 'Agent Dev Fullstack React / Node',
      roleTitle: 'Ingénieur Fullstack',
      description: 'Génère, refactore et optimise du code TypeScript, React 19 et Vite.',
      avatarIcon: 'Code2',
      status: 'active',
      modelId: 'claude-3-5-sonnet-20241022',
      temperature: 0.3,
      systemPromptSnippet: 'Tu es un développeur senior expert en React, TypeScript et Node...',
      updatedAt: '2026-02-19T09:15:00.000Z',
    },
    {
      id: 'agent-writer',
      name: 'Agent Rédaction & Documentation',
      roleTitle: 'Rédacteur Technique',
      description: 'Rédige des documentations OpenAPI, des guides utilisateurs et des spécifications.',
      avatarIcon: 'FileText',
      status: 'hidden',
      modelId: 'gemini-1.5-pro',
      temperature: 0.5,
      systemPromptSnippet: 'Tu es un rédacteur technique chevronné...',
      updatedAt: '2026-02-10T16:00:00.000Z',
    },
    {
      id: 'agent-data',
      name: 'Agent Data & Analytics',
      roleTitle: 'Analyste Données & SQL',
      description: 'Crée des requêtes SQL performantes, des pipelines ETL et des visualisations.',
      avatarIcon: 'Database',
      status: 'active',
      modelId: 'gpt-4o',
      temperature: 0.2,
      systemPromptSnippet: 'Tu es un data engineer senior spécialisé en requêtes analytiques...',
      updatedAt: '2026-02-12T11:45:00.000Z',
    },
  ];
}

export function getDefaultSystemPromptVersions(): SystemPromptVersion[] {
  return [
    {
      id: 'prompt-v3-prod',
      version: 'v3.2.0',
      title: 'Prompt Maître NEXUS AI (Production)',
      prompt: `Tu es NEXUS AI, un assistant d'intelligence artificielle de pointe, autonome, précis et bienveillant.
Tu excelles en ingénierie logicielle, raisonnement scientifique et gestion de projets complexes.
Tes réponses sont toujours rigoureuses, structurées en markdown avec des liens de fichiers directs, et adaptées au niveau technique de l'interlocuteur.`,
      author: 'Super Administrateur',
      createdAt: '2026-02-18T14:00:00.000Z',
      isActive: true,
    },
    {
      id: 'prompt-v2-stable',
      version: 'v3.1.0',
      title: 'Version Stable Précédente (v3.1)',
      prompt: `Tu es NEXUS AI, assistant conversationnel avancé orienté développement web moderne et productivité.`,
      author: 'Super Administrateur',
      createdAt: '2026-01-20T10:00:00.000Z',
      isActive: false,
    },
    {
      id: 'prompt-v1-initial',
      version: 'v3.0.0',
      title: 'Version Initiale de Lancement',
      prompt: `Tu es un modèle d'IA conversationnelle utile et poli.`,
      author: 'Système',
      createdAt: '2026-01-01T08:00:00.000Z',
      isActive: false,
    },
  ];
}

export function getManagedAgents(): ManagedAgent[] {
  if (typeof window === 'undefined') return getDefaultAgents();
  try {
    const raw = localStorage.getItem(AGENTS_STORAGE_KEY);
    if (!raw) return getDefaultAgents();
    return JSON.parse(raw) || getDefaultAgents();
  } catch {
    return getDefaultAgents();
  }
}

export function saveManagedAgents(agents: ManagedAgent[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(AGENTS_STORAGE_KEY, JSON.stringify(agents));
    window.dispatchEvent(new CustomEvent('nexus:agents-updated', { detail: agents }));
  } catch (err) {
    console.error('[AdminAgentsService] Erreur sauvegarde agents:', err);
  }
}

export function toggleAgentStatus(agentId: string, newStatus: ManagedAgent['status']): void {
  const current = getManagedAgents();
  const updated = current.map((a) => (a.id === agentId ? { ...a, status: newStatus, updatedAt: new Date().toISOString() } : a));
  saveManagedAgents(updated);
  logAdminAudit('agent_toggle', true, `Statut de l agent ${agentId} passe a : ${newStatus}`);
}

export function getSystemPromptVersions(): SystemPromptVersion[] {
  if (typeof window === 'undefined') return getDefaultSystemPromptVersions();
  try {
    const raw = localStorage.getItem(PROMPTS_STORAGE_KEY);
    if (!raw) return getDefaultSystemPromptVersions();
    return JSON.parse(raw) || getDefaultSystemPromptVersions();
  } catch {
    return getDefaultSystemPromptVersions();
  }
}

export function saveSystemPromptVersions(versions: SystemPromptVersion[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(PROMPTS_STORAGE_KEY, JSON.stringify(versions));
    window.dispatchEvent(new CustomEvent('nexus:prompts-updated', { detail: versions }));
  } catch (err) {
    console.error('[AdminAgentsService] Erreur sauvegarde prompts:', err);
  }
}

export function publishNewPromptVersion(title: string, prompt: string, author = 'Super Administrateur'): SystemPromptVersion {
  const current = getSystemPromptVersions();
  const nextMinor = current.length + 1;
  const newVer: SystemPromptVersion = {
    id: generateUUID(),
    version: `v3.${nextMinor}.0`,
    title,
    prompt,
    author,
    createdAt: new Date().toISOString(),
    isActive: true,
  };

  const updated = [newVer, ...current.map((v) => ({ ...v, isActive: false }))];
  saveSystemPromptVersions(updated);
  logAdminAudit('prompt_published', true, `Publication du Prompt Maitre ${newVer.version} : ${title}`);
  return newVer;
}

export function rollbackPromptVersion(versionId: string): boolean {
  const current = getSystemPromptVersions();
  const target = current.find((v) => v.id === versionId);
  if (!target) return false;

  const updated = current.map((v) => ({
    ...v,
    isActive: v.id === versionId,
  }));
  saveSystemPromptVersions(updated);
  logAdminAudit('prompt_rollback', true, `Rollback du Prompt Maitre vers la version ${target.version}`);
  return true;
}
