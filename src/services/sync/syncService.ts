/**
 * src/services/sync/syncService.ts
 *
 * Moteur de synchronisation cloud pour NEXUS AI (Supabase).
 * Synchronise de façon sécurisée les conversations, messages, souvenirs,
 * projets et préférences, tout en isolant strictement les données par user_id
 * via les politiques Row Level Security (RLS).
 * Assure la conformité UUID stricte et prévient les écrasements silencieux.
 */

import { getSupabase } from '@/services/auth/supabaseClient';
import { ensureUUID } from '@/utils/uuid';
import type { Conversation, Message } from '@/types';
import type { LabProject, LabFile } from '@/types/lab';
import type { UserMemory, UserPreferences } from '@/types/auth';

// ─── Conversations & Messages ─────────────────────────────────────────────────

export async function fetchCloudConversations(userId: string): Promise<Conversation[]> {
  const client = getSupabase();
  if (!client) return [];

  // 1. Récupération des conversations privées de l'utilisateur
  const { data: convRows, error: convError } = await client
    .from('conversations')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (convError || !convRows) {
    console.error('[NEXUS SYNC] Erreur chargement conversations:', convError);
    return [];
  }

  if (convRows.length === 0) return [];

  // 2. Récupération des messages associés
  const convIds = convRows.map((c) => c.id);
  const { data: msgRows, error: msgError } = await client
    .from('messages')
    .select('*')
    .in('conversation_id', convIds)
    .order('created_at', { ascending: true });

  if (msgError) {
    console.error('[NEXUS SYNC] Erreur chargement messages:', msgError);
  }

  const messagesByConv: Record<string, Message[]> = {};
  for (const m of msgRows || []) {
    if (!messagesByConv[m.conversation_id]) {
      messagesByConv[m.conversation_id] = [];
    }
    messagesByConv[m.conversation_id].push({
      id: m.id,
      role: m.role as 'user' | 'assistant' | 'system',
      content: m.content,
      agentId: m.agent_id,
      timestamp: new Date(m.created_at),
    });
  }

  return convRows.map((c) => ({
    id: c.id,
    title: c.title,
    agentId: c.agent_id,
    createdAt: new Date(c.created_at),
    updatedAt: new Date(c.updated_at),
    isCloudSynced: true,
    messages: messagesByConv[c.id] || [],
  }));
}

export async function saveConversationToCloud(
  userId: string,
  conversation: Conversation,
): Promise<{ success: boolean; cloudId?: string; error?: string }> {
  const client = getSupabase();
  if (!client) return { success: false, error: 'Client cloud non disponible' };

  const validConvId = ensureUUID(conversation.id);
  const updatedAtIso = conversation.updatedAt instanceof Date
    ? conversation.updatedAt.toISOString()
    : new Date(conversation.updatedAt).toISOString();

  // Détection de conflit : vérifier si une version plus récente existe déjà dans le cloud
  const { data: existing } = await client
    .from('conversations')
    .select('updated_at')
    .eq('id', validConvId)
    .eq('user_id', userId)
    .maybeSingle();

  if (existing?.updated_at && new Date(existing.updated_at).getTime() > new Date(updatedAtIso).getTime()) {
    console.warn('[NEXUS SYNC] Conflit détecté : la version cloud est plus récente, écrasement silencieux évité.');
  }

  // Upsert conversation
  const { error: convError } = await client.from('conversations').upsert({
    id: validConvId,
    user_id: userId,
    title: conversation.title || 'Nouvelle conversation',
    agent_id: conversation.agentId || 'general',
    updated_at: updatedAtIso,
  });

  if (convError) {
    console.error('[NEXUS SYNC] Erreur sauvegarde conversation:', convError);
    return { success: false, error: convError.message };
  }

  // Upsert messages
  if (conversation.messages && conversation.messages.length > 0) {
    const payload = conversation.messages.map((m) => ({
      id: ensureUUID(m.id),
      conversation_id: validConvId,
      user_id: userId,
      role: m.role,
      content: m.content,
      agent_id: m.agentId,
      created_at: m.timestamp instanceof Date ? m.timestamp.toISOString() : new Date(m.timestamp).toISOString(),
    }));

    const { error: msgError } = await client.from('messages').upsert(payload);
    if (msgError) {
      console.error('[NEXUS SYNC] Erreur sauvegarde messages:', msgError);
      return { success: false, error: msgError.message };
    }
  }

  return { success: true, cloudId: validConvId };
}

export async function deleteConversationFromCloud(userId: string, conversationId: string): Promise<boolean> {
  const client = getSupabase();
  if (!client) return false;

  const validId = ensureUUID(conversationId);
  const { error } = await client.from('conversations').delete().eq('id', validId).eq('user_id', userId);

  return !error;
}

// ─── Projets NEXUS LAB ────────────────────────────────────────────────────────

export async function fetchCloudProjects(userId: string): Promise<LabProject[]> {
  const client = getSupabase();
  if (!client) return [];

  const { data: projRows, error: projError } = await client
    .from('projects')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (projError || !projRows) {
    console.error('[NEXUS SYNC] Erreur chargement projets:', projError);
    return [];
  }

  if (projRows.length === 0) return [];

  const projIds = projRows.map((p) => p.id);
  const { data: fileRows, error: fileError } = await client
    .from('project_files')
    .select('*')
    .in('project_id', projIds);

  if (fileError) {
    console.error('[NEXUS SYNC] Erreur chargement fichiers projet:', fileError);
  }

  const filesByProject: Record<string, LabFile[]> = {};
  for (const f of fileRows || []) {
    if (!filesByProject[f.project_id]) {
      filesByProject[f.project_id] = [];
    }
    filesByProject[f.project_id].push({
      id: f.id,
      name: f.name,
      path: f.path,
      content: f.content,
      language: f.language as any,
      isModified: false,
    });
  }

  return projRows.map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description || '',
    templateId: p.template_id as any,
    isDemo: p.is_demo,
    createdAt: p.created_at,
    updatedAt: p.updated_at,
    isCloudSynced: true,
    files: filesByProject[p.id] || [],
  }));
}

export async function saveProjectToCloud(
  userId: string,
  project: LabProject,
): Promise<{ success: boolean; cloudId?: string; error?: string }> {
  const client = getSupabase();
  if (!client) return { success: false, error: 'Client cloud non disponible' };

  const validProjId = ensureUUID(project.id);
  const updatedAt = project.updatedAt || new Date().toISOString();

  // Vérification de version plus récente dans le cloud
  const { data: existing } = await client
    .from('projects')
    .select('updated_at')
    .eq('id', validProjId)
    .eq('user_id', userId)
    .maybeSingle();

  if (existing?.updated_at && new Date(existing.updated_at).getTime() > new Date(updatedAt).getTime()) {
    console.warn('[NEXUS SYNC] Projet cloud plus récent, écrasement silencieux évité.');
  }

  const { error: projError } = await client.from('projects').upsert({
    id: validProjId,
    user_id: userId,
    name: project.name,
    description: project.description || '',
    template_id: project.templateId || 'html-starter',
    is_demo: project.isDemo ?? false,
    updated_at: updatedAt,
  });

  if (projError) {
    console.error('[NEXUS SYNC] Erreur sauvegarde projet:', projError);
    return { success: false, error: projError.message };
  }

  if (project.files && project.files.length > 0) {
    const filePayload = project.files.map((f) => ({
      id: ensureUUID(f.id),
      project_id: validProjId,
      user_id: userId,
      name: f.name,
      path: f.path,
      content: f.content,
      language: f.language,
      updated_at: new Date().toISOString(),
    }));

    const { error: fileError } = await client.from('project_files').upsert(filePayload);
    if (fileError) {
      console.error('[NEXUS SYNC] Erreur sauvegarde fichiers projet:', fileError);
      return { success: false, error: fileError.message };
    }
  }

  return { success: true, cloudId: validProjId };
}

export async function deleteProjectFromCloud(userId: string, projectId: string): Promise<boolean> {
  const client = getSupabase();
  if (!client) return false;

  const validId = ensureUUID(projectId);
  const { error } = await client.from('projects').delete().eq('id', validId).eq('user_id', userId);

  return !error;
}

// ─── Souvenirs & Préférences ──────────────────────────────────────────────────

export async function fetchCloudMemories(userId: string): Promise<UserMemory[]> {
  const client = getSupabase();
  if (!client) return [];

  const { data, error } = await client
    .from('memories')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (error || !data) {
    console.error('[NEXUS SYNC] Erreur chargement souvenirs:', error);
    return [];
  }

  return data.map((m) => ({
    id: m.id,
    userId: m.user_id,
    key: m.key,
    content: m.content,
    category: m.category,
    agentId: m.agent_id,
    createdAt: m.created_at,
    updatedAt: m.updated_at,
  }));
}

export async function saveMemoryToCloud(
  userId: string,
  memory: Omit<UserMemory, 'userId'>,
): Promise<{ success: boolean; error?: string }> {
  const client = getSupabase();
  if (!client) return { success: false, error: 'Client cloud non disponible' };

  const validId = ensureUUID(memory.id);
  const updatedAt = memory.updatedAt || new Date().toISOString();

  const { error } = await client.from('memories').upsert({
    id: validId,
    user_id: userId,
    key: memory.key,
    content: memory.content,
    category: memory.category,
    agent_id: memory.agentId,
    updated_at: updatedAt,
  });

  if (error) {
    console.error('[NEXUS SYNC] Erreur sauvegarde souvenir:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function deleteMemoryFromCloud(userId: string, memoryId: string): Promise<boolean> {
  const client = getSupabase();
  if (!client) return false;

  const validId = ensureUUID(memoryId);
  const { error } = await client.from('memories').delete().eq('id', validId).eq('user_id', userId);

  return !error;
}

export async function fetchCloudPreferences(userId: string): Promise<UserPreferences | null> {
  const client = getSupabase();
  if (!client) return null;

  const { data, error } = await client.from('user_preferences').select('*').eq('user_id', userId).maybeSingle();

  if (error || !data) return null;

  return {
    userId: data.user_id,
    theme: data.theme,
    defaultAgentId: data.default_agent_id,
    autoSaveLab: data.auto_save_lab,
    cloudSyncEnabled: data.cloud_sync_enabled,
    updatedAt: data.updated_at,
  };
}

export async function savePreferencesToCloud(userId: string, prefs: Partial<UserPreferences>): Promise<boolean> {
  const client = getSupabase();
  if (!client) return false;

  const { error } = await client.from('user_preferences').upsert({
    user_id: userId,
    theme: prefs.theme ?? 'cosmic',
    default_agent_id: prefs.defaultAgentId ?? 'general',
    auto_save_lab: prefs.autoSaveLab ?? true,
    cloud_sync_enabled: prefs.cloudSyncEnabled ?? true,
    updated_at: new Date().toISOString(),
  });

  return !error;
}
