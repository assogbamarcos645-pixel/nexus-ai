/**
 * src/components/lab/TeamCollaborationDrawer.tsx
 *
 * Volet latéral de collaboration temps réel multijoueur (#7) pour NEXUS LAB.
 * Affiche la liste des collaborateurs connectés, leurs curseurs en direct,
 * le chat d'équipe instantané et permet d'inviter un copilote IA en pair-programming.
 */

import { useState, useEffect, useRef } from 'react';
import {
  Users,
  X,
  Copy,
  Check,
  Send,
  Sparkles,
  Bot,
  LogOut,
  Radio,
  FileCode,
} from 'lucide-react';
import { collaborationService } from '@/services/lab/collaborationService';
import type { TeamRoomState } from '@/types/collaboration';

interface TeamCollaborationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeFilePath?: string;
}

export function TeamCollaborationDrawer({
  isOpen,
  onClose,
  activeFilePath,
}: TeamCollaborationDrawerProps) {
  const [roomState, setRoomState] = useState<TeamRoomState>(() => collaborationService.getState());
  const [activeTab, setActiveTab] = useState<'peers' | 'chat'>('peers');
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = collaborationService.subscribe((state) => {
      setRoomState(state);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [roomState.messages, activeTab]);

  if (!isOpen) return null;

  const handleCreateRoom = () => {
    collaborationService.createOrJoinRoom();
  };

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCodeInput.trim()) return;
    collaborationService.createOrJoinRoom(joinCodeInput.trim());
    setJoinCodeInput('');
  };

  const handleCopyCode = async () => {
    if (!roomState.roomId) return;
    try {
      await navigator.clipboard.writeText(roomState.roomId);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {
      // Ignorer
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    collaborationService.sendMessage(chatInput);
    setChatInput('');
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex justify-end bg-black/65 backdrop-blur-sm animate-in fade-in duration-200 cursor-pointer"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <aside
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:w-[440px] max-w-full bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col h-full text-slate-100 animate-in slide-in-from-right duration-200 cursor-default"
      >
        {/* En-tête */}
        <header className="px-5 py-4 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30 shadow-sm shadow-purple-500/20">
              <Users size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-white">Mode Équipe Multijoueur</h3>
                <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-purple-500/20 text-purple-300 font-mono font-bold">
                  MULTI
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
                <span
                  className={`w-2 h-2 rounded-full ${
                    roomState.isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
                  }`}
                />
                <span>{roomState.isConnected ? 'Session Active en direct' : 'Hors ligne'}</span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Fermer le volet Équipe (Échap)"
          >
            <X size={18} />
          </button>
        </header>

        {/* Si aucune salle active */}
        {!roomState.isConnected ? (
          <div className="flex-1 p-6 flex flex-col justify-center space-y-6 text-center">
            <div className="relative mx-auto">
              <div className="w-20 h-20 rounded-3xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center shadow-xl shadow-purple-500/10">
                <Users size={36} />
              </div>
              <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 flex items-center justify-center text-xs">
                ⚡
              </span>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold text-base text-white">Codez en direct avec votre équipe</h4>
              <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
                Créez une salle partagée ou rejoignez une session pour visualiser les curseurs,
                partager le code et discuter en temps réel.
              </p>
            </div>

            <div className="space-y-3 pt-2 max-w-xs mx-auto w-full">
              <button
                onClick={handleCreateRoom}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white font-bold text-xs shadow-lg shadow-purple-500/25 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Sparkles size={14} />
                <span>Créer une Nouvelle Salle</span>
              </button>

              <div className="relative flex items-center justify-center py-2">
                <div className="border-t border-slate-800 w-full" />
                <span className="bg-slate-900 px-3 text-[10px] text-slate-500 uppercase tracking-wider font-mono">
                  Ou rejoindre avec un code
                </span>
              </div>

              <form onSubmit={handleJoinRoom} className="space-y-2.5">
                <input
                  type="text"
                  placeholder="Ex: NEXUS-TEAM-4820"
                  value={joinCodeInput}
                  onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-center text-cyan-300 placeholder:text-slate-600 focus:outline-none focus:border-purple-500 shadow-inner"
                />
                <button
                  type="submit"
                  disabled={!joinCodeInput.trim()}
                  className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 text-xs font-semibold transition-all cursor-pointer"
                >
                  Rejoindre la Session
                </button>
              </form>
            </div>
          </div>
        ) : (
          /* Salle active */
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Bannière de session & code */}
            <div className="p-4 border-b border-slate-800 bg-slate-950/40 flex items-center justify-between shrink-0">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Code de Salle Partagée
                </span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="font-mono text-sm font-bold text-purple-300">
                    {roomState.roomId}
                  </span>
                  <button
                    onClick={handleCopyCode}
                    className="p-1 rounded text-slate-400 hover:text-white transition-colors cursor-pointer"
                    title="Copier le code"
                  >
                    {copiedCode ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                  </button>
                </div>
              </div>

              <button
                onClick={() => collaborationService.leaveRoom()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-medium transition-colors cursor-pointer"
              >
                <LogOut size={13} />
                <span>Quitter</span>
              </button>
            </div>

            {/* Onglets Pairs / Chat */}
            <div className="flex border-b border-slate-800 shrink-0 text-xs font-semibold">
              <button
                onClick={() => setActiveTab('peers')}
                className={`flex-1 py-2.5 text-center border-b-2 transition-all cursor-pointer ${
                  activeTab === 'peers'
                    ? 'border-purple-500 text-purple-300 bg-purple-500/5'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                Collaborateurs ({1 + roomState.peers.length})
              </button>
              <button
                onClick={() => setActiveTab('chat')}
                className={`flex-1 py-2.5 text-center border-b-2 transition-all cursor-pointer ${
                  activeTab === 'chat'
                    ? 'border-purple-500 text-purple-300 bg-purple-500/5'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                Discussion ({roomState.messages.length})
              </button>
            </div>

            {/* Vue Pairs */}
            {activeTab === 'peers' && (
              <div className="flex-1 p-5 overflow-y-auto space-y-4 scrollbar-thin">
                {/* Utilisateur actuel */}
                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-white text-[11px]"
                        style={{ backgroundColor: roomState.currentUserColor }}
                      >
                        {roomState.currentUserName.charAt(0)}
                      </div>
                      <div>
                        <span className="font-bold text-white">{roomState.currentUserName}</span>
                        <span className="text-[10px] text-purple-400 ml-1.5 font-mono">(Vous)</span>
                      </div>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                      Hôte
                    </span>
                  </div>
                  {activeFilePath && (
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono pl-9">
                      <FileCode size={12} className="text-cyan-400" />
                      <span className="truncate">{activeFilePath}</span>
                    </div>
                  )}
                </div>

                {/* Pairs connectés */}
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Membres en ligne
                  </span>
                  {roomState.peers.length === 0 ? (
                    <div className="text-center py-6 text-slate-500 text-xs space-y-2">
                      <p>Aucun autre membre connecté pour le moment.</p>
                      <p className="text-[11px] text-slate-600">
                        Partagez le code de salle ci-dessus pour inviter vos collègues.
                      </p>
                    </div>
                  ) : (
                    roomState.peers.map((peer) => (
                      <div
                        key={peer.id}
                        className="p-3 rounded-xl bg-slate-950/40 border border-slate-800 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-white text-[11px]"
                            style={{ backgroundColor: peer.avatarColor }}
                          >
                            {peer.isAiAgent ? <Bot size={14} /> : peer.name.charAt(0)}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-white">{peer.name}</span>
                              {peer.isAiAgent && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-pink-500/20 text-pink-300 font-bold border border-pink-500/30">
                                  IA
                                </span>
                              )}
                            </div>
                            {peer.activeFilePath && (
                              <span className="text-[10px] text-cyan-400 font-mono block truncate max-w-[180px]">
                                {peer.activeFilePath}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-mono">
                          <Radio size={11} className="animate-pulse" />
                          <span>En direct</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Bouton inviter IA Co-développeur */}
                <div className="pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => collaborationService.inviteAiPairProgrammer('Atlas (IA Pair)')}
                    className="w-full py-2.5 px-4 rounded-xl border border-dashed border-purple-500/40 hover:border-purple-400 text-purple-300 hover:text-white bg-purple-500/5 hover:bg-purple-500/10 text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <Sparkles size={14} className="text-purple-400" />
                    <span>Inviter un co-développeur IA Atlas en direct</span>
                  </button>
                </div>
              </div>
            )}

            {/* Vue Discussion Chat */}
            {activeTab === 'chat' && (
              <div className="flex-1 flex flex-col overflow-hidden">
                <div ref={chatScrollRef} className="flex-1 p-4 overflow-y-auto space-y-3 scrollbar-thin">
                  {roomState.messages.map((m) => {
                    const isMe = m.peerId === roomState.currentUserId;
                    return (
                      <div
                        key={m.id}
                        className={`flex flex-col text-xs space-y-1 ${isMe ? 'items-end' : 'items-start'}`}
                      >
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                          <span style={{ color: m.avatarColor }} className="font-bold">
                            {m.peerName}
                          </span>
                          <span>{m.timestamp}</span>
                        </div>
                        <div
                          className={`p-3 rounded-2xl max-w-[85%] leading-relaxed ${
                            isMe
                              ? 'bg-purple-600 text-white rounded-br-none'
                              : 'bg-slate-950 border border-slate-800 text-slate-200 rounded-bl-none'
                          }`}
                        >
                          {m.text}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-800 flex gap-2">
                  <input
                    type="text"
                    placeholder="Écrire un message à l'équipe..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500"
                  />
                  <button
                    type="submit"
                    className="p-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white transition-colors cursor-pointer"
                  >
                    <Send size={15} />
                  </button>
                </form>
              </div>
            )}
          </div>
        )}
      </aside>
    </div>
  );
}
