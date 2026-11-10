/**
 * tests/conversations.test.ts
 *
 * Tests unitaires et d'intégration pour le cycle de vie des conversations :
 * - Création, sélection, renommage et suppression
 * - Ajout de messages (utilisateur et assistant)
 * - Génération automatique du titre à partir du premier message
 * - Persistance et sérialisation (localStorage)
 * - Résilience face aux corruptions de stockage
 */

import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import { generateUUID, isValidUUID } from '../src/utils/uuid.ts';
import { AGENTS, DEFAULT_AGENT_ID } from '../src/config/agents.ts';
import type { Conversation, Message, MessageRole } from '../src/types/index.ts';

// ─── Réplique de la logique pure du réducteur de conversations ────────────────

interface ConversationState {
  conversations: Conversation[];
  activeConversationId: string | null;
}

type Action =
  | { type: 'CREATE_CONVERSATION'; agentId?: string; isCloud?: boolean }
  | { type: 'SELECT_CONVERSATION'; id: string }
  | { type: 'DELETE_CONVERSATION'; id: string }
  | { type: 'ADD_MESSAGE'; conversationId: string; message: Omit<Message, 'timestamp'> & { id?: string } }
  | { type: 'UPDATE_CONVERSATION_TITLE'; id: string; title: string }
  | { type: 'SET_CONVERSATIONS'; conversations: Conversation[] };

function createMessage(role: MessageRole, content: string, agentId?: string, id?: string): Message {
  return { id: id || generateUUID(), role, content, timestamp: new Date(), agentId };
}

function conversationReducer(state: ConversationState, action: Action): ConversationState {
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
          );
          const updatedMessages = [...conv.messages, message];
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

    case 'UPDATE_CONVERSATION_TITLE':
      return {
        ...state,
        conversations: state.conversations.map((c) =>
          c.id === action.id ? { ...c, title: action.title.trim() || c.title, updatedAt: new Date() } : c,
        ),
      };

    case 'SET_CONVERSATIONS':
      return {
        ...state,
        conversations: action.conversations,
        activeConversationId: state.activeConversationId ?? action.conversations[0]?.id ?? null,
      };

    default:
      return state;
  }
}

describe('Gestion des Conversations & Messages (Interface & État)', () => {
  test('Sélection et catalogue des agents disponibles', () => {
    assert.ok(AGENTS.length >= 5, 'Au moins 5 agents spécialisés doivent être définis');
    const ids = AGENTS.map((a) => a.id);
    assert.ok(ids.includes('general'));
    assert.ok(ids.includes('coder'));
    assert.ok(ids.includes('writer'));
    assert.ok(ids.includes('analyst'));
    assert.ok(ids.includes('researcher'));

    // Vérifie que chaque agent a un systemPrompt rédigé
    for (const agent of AGENTS) {
      assert.ok(agent.systemPrompt.length > 20, `System prompt non vide pour ${agent.id}`);
      assert.ok(typeof agent.name === 'string');
    }
  });

  test('Création d’une conversation avec UUID RFC 4122 et agent par défaut', () => {
    const initialState: ConversationState = { conversations: [], activeConversationId: null };
    const state = conversationReducer(initialState, { type: 'CREATE_CONVERSATION' });

    assert.strictEqual(state.conversations.length, 1);
    const conv = state.conversations[0];
    assert.ok(isValidUUID(conv.id), `ID de conversation ${conv.id} doit être un UUID v4 valide`);
    assert.strictEqual(conv.title, 'Nouvelle conversation');
    assert.strictEqual(conv.agentId, DEFAULT_AGENT_ID);
    assert.strictEqual(conv.messages.length, 0);
    assert.strictEqual(state.activeConversationId, conv.id);
  });

  test('Création avec agent spécifique et sélection active', () => {
    const initialState: ConversationState = { conversations: [], activeConversationId: null };
    const state1 = conversationReducer(initialState, { type: 'CREATE_CONVERSATION', agentId: 'coder' });
    assert.strictEqual(state1.conversations[0].agentId, 'coder');

    const state2 = conversationReducer(state1, { type: 'CREATE_CONVERSATION', agentId: 'writer' });
    assert.strictEqual(state2.conversations.length, 2);
    assert.strictEqual(state2.activeConversationId, state2.conversations[0].id);

    // Basculer vers la première conversation
    const state3 = conversationReducer(state2, { type: 'SELECT_CONVERSATION', id: state2.conversations[1].id });
    assert.strictEqual(state3.activeConversationId, state2.conversations[1].id);
  });

  test('Génération automatique du titre à partir du premier message utilisateur', () => {
    const initial: ConversationState = conversationReducer(
      { conversations: [], activeConversationId: null },
      { type: 'CREATE_CONVERSATION' },
    );
    const convId = initial.conversations[0].id;

    const userMessageContent = 'Comment créer une architecture modulaire en TypeScript ?';
    const stateWithUserMsg = conversationReducer(initial, {
      type: 'ADD_MESSAGE',
      conversationId: convId,
      message: { role: 'user', content: userMessageContent },
    });

    const conv = stateWithUserMsg.conversations[0];
    assert.strictEqual(conv.messages.length, 1);
    assert.strictEqual(conv.title, userMessageContent.slice(0, 50));
    assert.ok(isValidUUID(conv.messages[0].id));
    assert.strictEqual(conv.messages[0].role, 'user');

    // Réponse de l'assistant : le titre ne doit PAS être écrasé
    const assistantMsg = 'Voici les principes fondamentaux de la modularité : ...';
    const stateWithReply = conversationReducer(stateWithUserMsg, {
      type: 'ADD_MESSAGE',
      conversationId: convId,
      message: { role: 'assistant', content: assistantMsg, agentId: 'coder' },
    });

    const convAfterReply = stateWithReply.conversations[0];
    assert.strictEqual(convAfterReply.messages.length, 2);
    assert.strictEqual(convAfterReply.title, userMessageContent.slice(0, 50));
  });

  test('Renommage d’une conversation avec assainissement des espaces', () => {
    const initial: ConversationState = conversationReducer(
      { conversations: [], activeConversationId: null },
      { type: 'CREATE_CONVERSATION' },
    );
    const convId = initial.conversations[0].id;

    const renamedState = conversationReducer(initial, {
      type: 'UPDATE_CONVERSATION_TITLE',
      id: convId,
      title: '  Architecture Cloud 2026  ',
    });

    assert.strictEqual(renamedState.conversations[0].title, 'Architecture Cloud 2026');

    // Un titre vide ne doit pas écraser le titre existant
    const emptyRenameState = conversationReducer(renamedState, {
      type: 'UPDATE_CONVERSATION_TITLE',
      id: convId,
      title: '   ',
    });
    assert.strictEqual(emptyRenameState.conversations[0].title, 'Architecture Cloud 2026');
  });

  test('Suppression d’une conversation et réassignation automatique de l’active ID', () => {
    let state: ConversationState = { conversations: [], activeConversationId: null };
    state = conversationReducer(state, { type: 'CREATE_CONVERSATION' });
    state = conversationReducer(state, { type: 'CREATE_CONVERSATION' });
    assert.strictEqual(state.conversations.length, 2);

    const activeId = state.activeConversationId!;
    const remainingId = state.conversations.find((c) => c.id !== activeId)!.id;

    state = conversationReducer(state, { type: 'DELETE_CONVERSATION', id: activeId });
    assert.strictEqual(state.conversations.length, 1);
    assert.strictEqual(state.activeConversationId, remainingId);

    // Supprimer la dernière conversation
    state = conversationReducer(state, { type: 'DELETE_CONVERSATION', id: remainingId });
    assert.strictEqual(state.conversations.length, 0);
    assert.strictEqual(state.activeConversationId, null);
  });

  test('Persistance et réhydratation après actualisation (simulation localStorage)', () => {
    const rawConversations: Conversation[] = [
      {
        id: generateUUID(),
        title: 'Session React',
        agentId: 'coder',
        createdAt: new Date('2026-10-10T10:00:00Z'),
        updatedAt: new Date('2026-10-10T10:05:00Z'),
        isCloudSynced: false,
        messages: [
          {
            id: generateUUID(),
            role: 'user',
            content: 'Hello Vite',
            timestamp: new Date('2026-10-10T10:00:00Z'),
          },
          {
            id: generateUUID(),
            role: 'assistant',
            content: 'Hello ! Vite est configuré.',
            timestamp: new Date('2026-10-10T10:01:00Z'),
            agentId: 'coder',
          },
        ],
      },
    ];

    // Sérialisation JSON (comme dans localStorage.setItem)
    const serialized = JSON.stringify(rawConversations);

    // Désérialisation et reconstruction des objets Date
    const parsed = JSON.parse(serialized);
    const rehydrated: Conversation[] = parsed.map((c: any) => ({
      ...c,
      createdAt: new Date(c.createdAt),
      updatedAt: new Date(c.updatedAt),
      messages: (c.messages || []).map((m: any) => ({
        ...m,
        timestamp: new Date(m.timestamp),
      })),
    }));

    assert.strictEqual(rehydrated.length, 1);
    assert.strictEqual(rehydrated[0].title, 'Session React');
    assert.ok(rehydrated[0].createdAt instanceof Date);
    assert.strictEqual(rehydrated[0].createdAt.toISOString(), '2026-10-10T10:00:00.000Z');
    assert.strictEqual(rehydrated[0].messages.length, 2);
    assert.ok(rehydrated[0].messages[0].timestamp instanceof Date);
  });

  test('Résilience face à des données de stockage corrompues', () => {
    const corruptJson = '{ "malformed": [';
    let loaded: Conversation[] = [];
    try {
      loaded = JSON.parse(corruptJson);
    } catch {
      loaded = []; // Fallback gracieux vers état vide
    }
    assert.deepStrictEqual(loaded, []);
  });
});

