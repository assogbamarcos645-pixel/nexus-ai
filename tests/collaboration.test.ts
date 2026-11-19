/**
 * tests/collaboration.test.ts
 *
 * Tests unitaires pour le Mode Équipe & Collaboration Multijoueur (#7).
 */

import test, { describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { collaborationService } from '../src/services/lab/collaborationService.ts';

describe('NEXUS LAB — Mode Équipe & Collaboration Multijoueur (#7)', () => {
  afterEach(() => {
    collaborationService.leaveRoom();
  });

  test('Génère un utilisateur local par défaut avec identifiant et couleur', () => {
    const user = collaborationService.getCurrentUser();
    assert.ok(user.id);
    assert.ok(user.name);
    assert.ok(user.avatarColor);
    assert.strictEqual(user.role, 'editor');
  });

  test('Permet de modifier le nom de l’utilisateur local', () => {
    collaborationService.setUserName('Alexandre Développeur');
    assert.strictEqual(collaborationService.getCurrentUser().name, 'Alexandre Développeur');
  });

  test('Création et initialisation d’une salle avec code et message de bienvenue', () => {
    const state = collaborationService.createOrJoinRoom('NEXUS-TEST-99');
    assert.strictEqual(state.roomId, 'NEXUS-TEST-99');
    assert.strictEqual(state.isConnected, true);
    assert.ok(state.messages.length >= 1);
    assert.ok(state.messages[0].text.includes('Bienvenue dans la salle'));
  });

  test('Envoi et enregistrement d’un message de discussion d’équipe', () => {
    collaborationService.createOrJoinRoom('ROOM-CHAT-1');
    collaborationService.sendMessage('Bonjour tout le monde !');

    const state = collaborationService.getState();
    const lastMsg = state.messages[state.messages.length - 1];
    assert.strictEqual(lastMsg.text, 'Bonjour tout le monde !');
    assert.strictEqual(lastMsg.peerId, state.currentUserId);
  });

  test('Invitation d’un co-développeur IA pour le pair-programming', () => {
    collaborationService.createOrJoinRoom('ROOM-PAIR-1');
    collaborationService.inviteAiPairProgrammer('Atlas (IA Pair)');

    const state = collaborationService.getState();
    assert.strictEqual(state.peers.length, 1);
    assert.strictEqual(state.peers[0].name, 'Atlas (IA Pair)');
    assert.strictEqual(state.peers[0].isAiAgent, true);

    const aiMsg = state.messages.find((m) => m.peerName === 'Atlas (IA Pair)');
    assert.ok(aiMsg);
    assert.strictEqual(aiMsg.isAi, true);
  });

  test('Quitter la salle réinitialise l’état de connexion et vide les pairs', () => {
    collaborationService.createOrJoinRoom('ROOM-EXIT-1');
    assert.strictEqual(collaborationService.getState().isConnected, true);

    collaborationService.leaveRoom();
    assert.strictEqual(collaborationService.getState().isConnected, false);
    assert.strictEqual(collaborationService.getState().peers.length, 0);
  });
});
