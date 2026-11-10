/**
 * Application-wide type definitions for NEXUS AI
 */

// ─── AI & Conversations ───────────────────────────────────────────────────────

export type MessageRole = 'user' | 'assistant' | 'system';

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
  agentId?: string;
  images?: string[]; // URLs ou Data-URIs base64 d'images attachées (Vision Multimodale)
  isStreaming?: boolean;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  agentId: string;
  createdAt: Date;
  updatedAt: Date;
  projectId?: string;
  isCloudSynced?: boolean;
}

// ─── Agents ───────────────────────────────────────────────────────────────────

export type AgentType =
  | 'general'
  | 'coder'
  | 'writer'
  | 'analyst'
  | 'researcher';

export interface Agent {
  id: string;
  name: string;
  description: string;
  type: AgentType;
  icon: string;
  systemPrompt: string;
  capabilities: string[];
  color: string;
}

// ─── Projects ─────────────────────────────────────────────────────────────────

export type ProjectStatus = 'active' | 'archived' | 'draft';

export interface Project {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  conversationIds: string[];
  documentIds: string[];
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
}

// ─── Documents ────────────────────────────────────────────────────────────────

export type DocumentType = 'markdown' | 'code' | 'note';

export interface Document {
  id: string;
  title: string;
  content: string;
  type: DocumentType;
  language?: string;
  projectId?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  createdAt: Date;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// ─── UI ───────────────────────────────────────────────────────────────────────

export type Theme = 'dark' | 'light' | 'system';

export type SidebarView = 'conversations' | 'projects' | 'agents' | 'settings';

// ─── NEXUS LAB ────────────────────────────────────────────────────────────────
export * from './lab';

// ─── AUTH & CLOUD SYNC ────────────────────────────────────────────────────────
export * from './auth';
export * from './sync';

// ─── AI ENGINE & CONTROL CENTER ───────────────────────────────────────────────
export * from './ai';
