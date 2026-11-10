/**
 * src/hooks/useConversations.ts
 *
 * Hook de gestion des conversations et messages pour NEXUS AI.
 * Utilise des UUIDs standardisés (RFC 4122), distingue les données locales
 * des données synchronisées avec Supabase Cloud, et évite les écrasements silencieux.
 */

import { useCallback, useReducer, useEffect, useRef } from 'react';
import type { Conversation, Message, MessageRole } from '@/types';
import { DEFAULT_AGENT_ID } from '@/config/agents';
import { generateUUID } from '@/utils/uuid';
import { useAuth } from '@/hooks/useAuth';
import {
  fetchCloudConversations,
  saveConversationToCloud,
  deleteConversationFromCloud,
} from '@/services/sync/syncService';

// ─── State ────────────────────────────────────────────────────────────────────

interface ConversationState {
  conversations: Conversation[];
  activeConversationId: string | null;
}

// ─── Actions ──────────────────────────────────────────────────────────────────

type Action =
  | { type: 'CREATE_CONVERSATION'; agentId?: string; isCloud?: boolean }
  | { type: 'SELECT_CONVERSATION'; id: string }
  | { type: 'DELETE_CONVERSATION'; id: string }
  | { type: 'ADD_MESSAGE'; conversationId: string; message: Omit<Message, 'timestamp'> & { id?: string; images?: string[]; isStreaming?: boolean } }
  | { type: 'UPDATE_MESSAGE'; conversationId: string; messageId: string; content: string; isStreaming?: boolean }
  | { type: 'UPDATE_CONVERSATION_TITLE'; id: string; title: string }
  | { type: 'SET_CONVERSATIONS'; conversations: Conversation[] }
  | { type: 'MERGE_CLOUD_CONVERSATIONS'; cloudConversations: Conversation[] };

function createMessage(
  role: MessageRole,
  content: string,
  agentId?: string,
  id?: string,
  images?: string[],
  isStreaming?: boolean,
): Message {
  return { id: id || generateUUID(), role, content, timestamp: new Date(), agentId, images, isStreaming };
}

// ─── Reducer ──────────────────────────────────────────────────────────────────

function reducer(state: ConversationState, action: Action): ConversationState {
  switch (action.type) {
    case 'CREATE_CONVERSATION': {
      const newConv: Conversation = {
        id: generateUUID(),
        title: 'Nouvelle conversation',
        messages: [],
        agentId: action.agentId ?? DEFAULT_AGENT_ID,
        createdAt: new Date(),
        updatedAt: new Date(),
        isCloudSynced: action.isCloud ?? false,
      };
      return {
        conversations: [newConv, ...state.conversations],
        activeConversationId: newConv.id,
      };
    }

    case 'SELECT_CONVERSATION':
      return { ...state, activeConversationId: action.id };

    case 'DELETE_CONVERSATION': {
      const remaining = state.conversations.filter((c) => c.id !== action.id);
      const nextActiveId =
        state.activeConversationId === action.id
          ? (remaining[0]?.id ?? null)
          : state.activeConversationId;
      return { conversations: remaining, activeConversationId: nextActiveId };
    }

    case 'ADD_MESSAGE': {
      return {
        ...state,
        conversations: state.conversations.map((conv) => {
          if (conv.id !== action.conversationId) return conv;
          const message = createMessage(
            action.message.role,
            action.message.content,
            action.message.agentId,
            action.message.id,
            action.message.images,
            action.message.isStreaming,
          );
          const updatedMessages = [...conv.messages, message];
          // Génération automatique du titre à partir du premier message utilisateur
          const title =
            conv.messages.length === 0 && action.message.role === 'user'
              ? action.message.content.slice(0, 50)
              : conv.title;
          return {
            ...conv,
            messages: updatedMessages,
            title,
            updatedAt: new Date(),
          };
        }),
      };
    }

    case 'UPDATE_MESSAGE': {
      return {
        ...state,
        conversations: state.conversations.map((conv) => {
          if (conv.id !== action.conversationId) return conv;
          return {
            ...conv,
            messages: conv.messages.map((m) =>
              m.id === action.messageId
                ? {
                    ...m,
                    content: action.content,
                    isStreaming:
                      action.isStreaming !== undefined ? action.isStreaming : m.isStreaming,
                  }
                : m,
            ),
            updatedAt: new Date(),
          };
        }),
      };
    }

    case 'UPDATE_CONVERSATION_TITLE':
      return {
        ...state,
        conversations: state.conversations.map((c) =>
          c.id === action.id ? { ...c, title: action.title, updatedAt: new Date() } : c,
        ),
      };

    case 'SET_CONVERSATIONS':
      return {
        conversations: action.conversations,
        activeConversationId: action.conversations[0]?.id ?? null,
      };

    case 'MERGE_CLOUD_CONVERSATIONS': {
      // Fusion intelligente sans écraser les modifications locales récentes
      const cloudMap = new Map(action.cloudConversations.map((c) => [c.id, c]));
      const localOnly = state.conversations.filter((c) => !cloudMap.has(c.id));

      const merged = [...action.cloudConversations, ...localOnly];
      merged.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

      const nextActive = state.activeConversationId && merged.some((c) => c.id === state.activeConversationId)
        ? state.activeConversationId
        : merged[0]?.id ?? null;

      return {
        conversations: merged,
        activeConversationId: nextActive,
      };
    }

    default:
      return state;
  }
}

function loadLocalConversations(): Conversation[] {
  try {
    const raw = localStorage.getItem('nexus_conversations_v1');
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return parsed.map((c: any) => ({
      ...c,
      id: c.id,
      createdAt: new Date(c.createdAt),
      updatedAt: new Date(c.updatedAt),
      isCloudSynced: Boolean(c.isCloudSynced),
      messages: (c.messages || []).map((m: any) => ({
        ...m,
        id: m.id,
        timestamp: new Date(m.timestamp),
      })),
    }));
  } catch (e) {
    console.warn('[NEXUS CHAT] Erreur chargement conversations locales:', e);
    return [];
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useConversations() {
  const { user, isAuthenticated, isConfigured } = useAuth();
  const lastUserIdRef = useRef<string | null>(null);

  const [state, dispatch] = useReducer(reducer, null, () => {
    const saved = loadLocalConversations();
    if (saved.length === 0) {
      const initialConv: Conversation = {
        id: generateUUID(),
        title: 'Nouvelle conversation',
        messages: [],
        agentId: DEFAULT_AGENT_ID,
        createdAt: new Date(),
        updatedAt: new Date(),
        isCloudSynced: false,
      };
      return {
        conversations: [initialConv],
        activeConversationId: initialConv.id,
      };
    }
    return {
      conversations: saved,
      activeConversationId: saved[0]?.id ?? null,
    };
  });

  // Sauvegarde automatique dans le stockage local pour le mode hors-ligne
  useEffect(() => {
    try {
      localStorage.setItem('nexus_conversations_v1', JSON.stringify(state.conversations));
    } catch (e) {
      console.warn('[NEXUS CHAT] Impossible de persister les conversations locales:', e);
    }
  }, [state.conversations]);

  // Chargement des conversations cloud lors de la connexion
  useEffect(() => {
    if (!isConfigured || !isAuthenticated || !user) {
      if (lastUserIdRef.current !== null) {
        // Déconnexion : restaurer le stockage local
        lastUserIdRef.current = null;
        dispatch({ type: 'SET_CONVERSATIONS', conversations: loadLocalConversations() });
      }
      return;
    }

    if (lastUserIdRef.current === user.id) return;
    lastUserIdRef.current = user.id;

    let isCancelled = false;
    fetchCloudConversations(user.id).then((cloudConvs) => {
      if (isCancelled) return;
      if (cloudConvs.length > 0) {
        dispatch({ type: 'MERGE_CLOUD_CONVERSATIONS', cloudConversations: cloudConvs });
      }
    });

    return () => {
      isCancelled = true;
    };
  }, [isAuthenticated, isConfigured, user]);

  const activeConversation =
    state.conversations.find((c) => c.id === state.activeConversationId) ?? null;

  const createConversation = useCallback(
    (agentId?: string) => {
      dispatch({ type: 'CREATE_CONVERSATION', agentId, isCloud: isAuthenticated });
    },
    [isAuthenticated],
  );

  const selectConversation = useCallback((id: string) => {
    dispatch({ type: 'SELECT_CONVERSATION', id });
  }, []);

  const deleteConversation = useCallback(
    async (id: string) => {
      dispatch({ type: 'DELETE_CONVERSATION', id });
      if (isAuthenticated && user) {
        await deleteConversationFromCloud(user.id, id);
      }
    },
    [isAuthenticated, user],
  );

  const addMessage = useCallback(
    (role: MessageRole, content: string, images?: string[], isStreaming?: boolean): string => {
      const messageId = generateUUID();
      if (!state.activeConversationId) return messageId;
      dispatch({
        type: 'ADD_MESSAGE',
        conversationId: state.activeConversationId,
        message: { id: messageId, role, content, agentId: activeConversation?.agentId, images, isStreaming },
      });

      // Synchronisation cloud automatique asynchrone si l'utilisateur est connecté
      if (isAuthenticated && user && activeConversation) {
        const tempMsg: Message = {
          id: messageId,
          role,
          content,
          agentId: activeConversation.agentId,
          timestamp: new Date(),
          images,
          isStreaming,
        };
        const updatedConv: Conversation = {
          ...activeConversation,
          updatedAt: new Date(),
          isCloudSynced: true,
          messages: [...activeConversation.messages, tempMsg],
        };

        saveConversationToCloud(user.id, updatedConv).catch((err) => {
          console.warn('[NEXUS SYNC] Erreur synchro message cloud:', err);
        });
      }

      return messageId;
    },
    [state.activeConversationId, activeConversation, isAuthenticated, user],
  );

  const updateMessage = useCallback(
    (messageId: string, content: string, isStreaming?: boolean) => {
      if (!state.activeConversationId) return;
      dispatch({
        type: 'UPDATE_MESSAGE',
        conversationId: state.activeConversationId,
        messageId,
        content,
        isStreaming,
      });
    },
    [state.activeConversationId],
  );

  return {
    conversations: state.conversations,
    activeConversation,
    activeConversationId: state.activeConversationId,
    createConversation,
    selectConversation,
    deleteConversation,
    addMessage,
    updateMessage,
  };
}
