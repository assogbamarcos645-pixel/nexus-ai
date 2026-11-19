/**
 * src/types/collaboration.ts
 *
 * Types pour le Mode Équipe & Collaboration Multijoueur (#7) dans NEXUS LAB.
 */

export interface TeamPeer {
  id: string;
  name: string;
  avatarColor: string;
  role: 'lead' | 'editor' | 'viewer';
  activeFilePath?: string;
  cursor?: {
    line: number;
    column: number;
  };
  isAiAgent?: boolean;
  lastActive: number;
}

export interface TeamChatMessage {
  id: string;
  peerId: string;
  peerName: string;
  avatarColor: string;
  text: string;
  timestamp: string;
  isAi?: boolean;
}

export interface TeamRoomState {
  roomId: string;
  roomName: string;
  isConnected: boolean;
  isHost: boolean;
  currentUserId: string;
  currentUserName: string;
  currentUserColor: string;
  peers: TeamPeer[];
  messages: TeamChatMessage[];
}
