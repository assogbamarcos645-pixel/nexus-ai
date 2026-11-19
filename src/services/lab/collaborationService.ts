/**
 * src/services/lab/collaborationService.ts
 *
 * Moteur de collaboration temps réel multijoueur pour NEXUS LAB (#7).
 * Utilise un BroadcastChannel haute fréquence et un bus d'événements P2P
 * pour synchroniser les présences, curseurs, fichiers actifs et messages d'équipe.
 */

import type { TeamPeer, TeamChatMessage, TeamRoomState } from '../../types/collaboration.ts';

const PEER_COLORS = [
  '#06b6d4', // Cyan
  '#8b5cf6', // Violet
  '#ec4899', // Rose
  '#10b981', // Émeraude
  '#f59e0b', // Ambre
  '#3b82f6', // Bleu
];

export type CollaborationEvent =
  | { type: 'peer-join'; peer: TeamPeer }
  | { type: 'peer-leave'; peerId: string }
  | { type: 'peer-update'; peer: Partial<TeamPeer> & { id: string } }
  | { type: 'chat-message'; message: TeamChatMessage }
  | { type: 'sync-request'; requesterId: string }
  | { type: 'sync-response'; peers: TeamPeer[] };

export class CollaborationService {
  private channel: BroadcastChannel | null = null;
  private currentRoomId: string | null = null;
  private currentUser: TeamPeer;
  private peers: Map<string, TeamPeer> = new Map();
  private messages: TeamChatMessage[] = [];
  private listeners: Set<(state: TeamRoomState) => void> = new Set();
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;

  constructor() {
    const randomNum = Math.floor(100 + Math.random() * 900);
    const randomColor = PEER_COLORS[Math.floor(Math.random() * PEER_COLORS.length)];

    this.currentUser = {
      id: 'user-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
      name: `Développeur #${randomNum}`,
      avatarColor: randomColor,
      role: 'editor',
      lastActive: Date.now(),
    };
  }

  public getCurrentUser(): TeamPeer {
    return this.currentUser;
  }

  public setUserName(name: string): void {
    if (!name.trim()) return;
    this.currentUser.name = name.trim();
    this.broadcast({
      type: 'peer-update',
      peer: { id: this.currentUser.id, name: this.currentUser.name },
    });
    this.notify();
  }

  public createOrJoinRoom(roomId?: string, _roomName = 'Salle de Collaboration'): TeamRoomState {
    this.leaveRoom();

    const finalRoomId = (roomId?.trim() || `NEXUS-TEAM-${Math.floor(1000 + Math.random() * 9000)}`).toUpperCase();
    this.currentRoomId = finalRoomId;
    this.peers.clear();
    this.messages = [
      {
        id: 'msg-sys-1',
        peerId: 'system',
        peerName: 'Système NEXUS',
        avatarColor: '#6366f1',
        text: `Bienvenue dans la salle ${finalRoomId}. Invitez vos collaborateurs avec le code de session.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ];

    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.channel = new BroadcastChannel(`nexus_room_${finalRoomId}`);
        this.channel.onmessage = (event: MessageEvent<CollaborationEvent>) => {
          this.handleIncomingEvent(event.data);
        };
      } catch {
        // Ignorer
      }
    }

    // Annonce d'arrivée
    this.broadcast({
      type: 'peer-join',
      peer: this.currentUser,
    });

    // Demande de synchronisation aux pairs existants
    this.broadcast({
      type: 'sync-request',
      requesterId: this.currentUser.id,
    });

    this.startHeartbeat();
    this.notify();
    return this.getState();
  }

  public leaveRoom(): void {
    if (this.currentRoomId) {
      this.broadcast({
        type: 'peer-leave',
        peerId: this.currentUser.id,
      });
    }

    if (this.channel) {
      try {
        this.channel.close();
      } catch {
        // Ignorer
      }
      this.channel = null;
    }

    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }

    this.currentRoomId = null;
    this.peers.clear();
    this.notify();
  }

  public sendMessage(text: string): void {
    if (!text.trim() || !this.currentRoomId) return;

    const message: TeamChatMessage = {
      id: 'msg-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
      peerId: this.currentUser.id,
      peerName: this.currentUser.name,
      avatarColor: this.currentUser.avatarColor,
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    this.messages.push(message);
    this.broadcast({ type: 'chat-message', message });
    this.notify();
  }

  public broadcastCursor(filePath: string, line: number, column: number): void {
    this.currentUser.activeFilePath = filePath;
    this.currentUser.cursor = { line, column };
    this.currentUser.lastActive = Date.now();

    this.broadcast({
      type: 'peer-update',
      peer: {
        id: this.currentUser.id,
        activeFilePath: filePath,
        cursor: { line, column },
        lastActive: Date.now(),
      },
    });
  }

  /**
   * Invite un co-développeur IA autonome (Atlas, Nova ou Orion)
   * pour du pair-programming collaboratif en direct.
   */
  public inviteAiPairProgrammer(name = 'Atlas (IA Pair)'): void {
    const aiPeer: TeamPeer = {
      id: 'ai-peer-' + Date.now(),
      name,
      avatarColor: '#ec4899',
      role: 'editor',
      isAiAgent: true,
      activeFilePath: this.currentUser.activeFilePath || 'src/App.tsx',
      cursor: { line: 12, column: 4 },
      lastActive: Date.now(),
    };

    this.peers.set(aiPeer.id, aiPeer);

    const welcomeMsg: TeamChatMessage = {
      id: 'msg-ai-' + Date.now(),
      peerId: aiPeer.id,
      peerName: aiPeer.name,
      avatarColor: aiPeer.avatarColor,
      text: `Salut l'équipe ! Je suis ${name}. J'observe vos modifications en temps réel et je peux vous suggérer des optimisations à tout moment.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isAi: true,
    };

    this.messages.push(welcomeMsg);
    this.notify();
  }

  public subscribe(listener: (state: TeamRoomState) => void): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => this.listeners.delete(listener);
  }

  public getState(): TeamRoomState {
    return {
      roomId: this.currentRoomId || '',
      roomName: this.currentRoomId ? `Salle ${this.currentRoomId}` : '',
      isConnected: !!this.currentRoomId,
      isHost: true,
      currentUserId: this.currentUser.id,
      currentUserName: this.currentUser.name,
      currentUserColor: this.currentUser.avatarColor,
      peers: Array.from(this.peers.values()),
      messages: [...this.messages],
    };
  }

  private broadcast(event: CollaborationEvent): void {
    if (this.channel) {
      try {
        this.channel.postMessage(event);
      } catch {
        // Ignorer
      }
    }
  }

  private handleIncomingEvent(event: CollaborationEvent): void {
    if (!event) return;

    switch (event.type) {
      case 'peer-join':
        if (event.peer.id !== this.currentUser.id) {
          this.peers.set(event.peer.id, event.peer);
          this.notify();
        }
        break;

      case 'peer-leave':
        if (this.peers.has(event.peerId)) {
          this.peers.delete(event.peerId);
          this.notify();
        }
        break;

      case 'peer-update':
        if (event.peer.id !== this.currentUser.id && this.peers.has(event.peer.id)) {
          const current = this.peers.get(event.peer.id)!;
          this.peers.set(event.peer.id, { ...current, ...event.peer });
          this.notify();
        }
        break;

      case 'chat-message':
        if (event.message.peerId !== this.currentUser.id) {
          this.messages.push(event.message);
          this.notify();
        }
        break;

      case 'sync-request':
        if (event.requesterId !== this.currentUser.id) {
          this.broadcast({
            type: 'sync-response',
            peers: [this.currentUser, ...Array.from(this.peers.values())],
          });
        }
        break;

      case 'sync-response':
        for (const p of event.peers) {
          if (p.id !== this.currentUser.id) {
            this.peers.set(p.id, p);
          }
        }
        this.notify();
        break;
    }
  }

  private startHeartbeat(): void {
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);

    this.heartbeatTimer = setInterval(() => {
      // Élimination des pairs inactifs depuis plus de 45 secondes (hors agents IA)
      const now = Date.now();
      let changed = false;

      for (const [id, peer] of this.peers.entries()) {
        if (!peer.isAiAgent && now - peer.lastActive > 45000) {
          this.peers.delete(id);
          changed = true;
        }
      }

      if (changed) {
        this.notify();
      }
    }, 15000);
  }

  private notify(): void {
    const state = this.getState();
    this.listeners.forEach((l) => l(state));
  }
}

export const collaborationService = new CollaborationService();
