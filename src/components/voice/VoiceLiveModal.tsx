/**
 * src/components/voice/VoiceLiveModal.tsx
 *
 * Interface plein écran / modale de conversation vocale bidirectionnelle en direct (Voice-to-Voice).
 * Présente un orbe cosmique animé dynamique réagissant aux états :
 *  - Écoute active (Cyan réactif)
 *  - Réflexion & Génération (Vortex Indigo)
 *  - Synthèse vocale & Parole (Pulsation Énergétique Violette / Magenta)
 */

import { useEffect } from 'react';
import {
  Mic,
  MicOff,
  X,
  Volume2,
  Sparkles,
  PhoneOff,
  RotateCcw,
} from 'lucide-react';
import { useVoiceConversation, type VoiceState } from '@/hooks/useVoiceConversation';

interface VoiceLiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  contextPrompt?: string;
  agentName?: string;
}

export function VoiceLiveModal({
  isOpen,
  onClose,
  contextPrompt,
  agentName = 'NEXUS CodeX',
}: VoiceLiveModalProps) {
  const {
    state,
    transcript,
    lastAiResponse,
    isMuted,
    start,
    stop,
    toggleMute,
    interrupt,
    error,
  } = useVoiceConversation({
    agentId: 'codex',
    contextPrompt,
  });

  useEffect(() => {
    if (isOpen) {
      start().catch(() => {});
    } else {
      stop();
    }
    return () => {
      stop();
    };
  }, [isOpen, start, stop]);

  if (!isOpen) return null;

  const handleClose = () => {
    stop();
    onClose();
  };

  const getStatusText = (s: VoiceState) => {
    switch (s) {
      case 'listening':
        return 'À votre écoute... Parlez naturellement';
      case 'thinking':
        return `${agentName} réfléchit...`;
      case 'speaking':
        return `${agentName} vous répond... (Touchez pour interrompre)`;
      default:
        return 'Connexion au flux vocal...';
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-2xl animate-in fade-in duration-300"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-xl h-[82vh] max-h-[680px] rounded-3xl bg-gradient-to-b from-slate-900/90 via-[#070714] to-[#04040a] border border-white/10 shadow-[0_0_80px_rgba(6,182,212,0.15)] flex flex-col justify-between items-center p-8 overflow-hidden">
        {/* Lueur d'ambiance en arrière-plan */}
        <div
          className={`absolute inset-0 pointer-events-none transition-opacity duration-700 blur-3xl opacity-30 ${
            state === 'listening'
              ? 'bg-gradient-to-b from-cyan-500/20 via-transparent to-transparent'
              : state === 'thinking'
              ? 'bg-gradient-to-b from-indigo-500/20 via-transparent to-transparent'
              : 'bg-gradient-to-b from-purple-500/20 via-transparent to-transparent'
          }`}
        />

        {/* Header */}
        <header className="w-full flex items-center justify-between z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/30">
              <Sparkles size={16} />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">{agentName} Voice Live</h3>
              <p className="text-[11px] text-cyan-400 font-mono">Conversation mains libres</p>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Quitter le mode vocal"
          >
            <X size={18} />
          </button>
        </header>

        {/* Centre : Orbe Cosmique Animé Interactif */}
        <div
          className="relative flex flex-col items-center justify-center my-auto cursor-pointer group"
          onClick={() => {
            if (state === 'speaking') interrupt();
          }}
        >
          {/* Ondes concentriques extérieures */}
          <div
            className={`absolute w-64 h-64 rounded-full transition-all duration-700 ${
              state === 'listening'
                ? 'border border-cyan-500/30 animate-ping opacity-25'
                : state === 'speaking'
                ? 'border-2 border-purple-500/40 animate-pulse opacity-40'
                : 'opacity-0'
            }`}
          />
          <div
            className={`absolute w-52 h-52 rounded-full transition-all duration-500 ${
              state === 'listening'
                ? 'bg-cyan-500/10 blur-xl animate-pulse'
                : state === 'speaking'
                ? 'bg-purple-500/20 blur-xl animate-pulse'
                : 'bg-indigo-500/10 blur-xl'
            }`}
          />

          {/* Sphère Centrale */}
          <div
            className={`relative w-36 h-36 rounded-full flex items-center justify-center shadow-2xl transition-all duration-500 transform ${
              state === 'listening'
                ? 'scale-105 bg-gradient-to-tr from-cyan-500 via-teal-400 to-indigo-600 shadow-[0_0_50px_rgba(6,182,212,0.5)]'
                : state === 'thinking'
                ? 'scale-95 bg-gradient-to-tr from-indigo-600 via-purple-600 to-cyan-500 animate-spin shadow-[0_0_40px_rgba(99,102,241,0.5)]'
                : state === 'speaking'
                ? 'scale-110 bg-gradient-to-tr from-purple-500 via-pink-500 to-cyan-400 shadow-[0_0_60px_rgba(168,85,247,0.6)] animate-pulse'
                : 'scale-90 bg-slate-800'
            }`}
          >
            <div className="w-28 h-28 rounded-full bg-slate-950/70 backdrop-blur-sm flex items-center justify-center text-white">
              {state === 'speaking' ? (
                <Volume2 size={32} className="text-purple-300 animate-bounce" />
              ) : state === 'listening' ? (
                <Mic size={32} className="text-cyan-300 animate-pulse" />
              ) : (
                <Sparkles size={32} className="text-indigo-300 animate-spin" />
              )}
            </div>
          </div>

          {/* État Texte */}
          <div className="mt-8 text-center space-y-1 z-10">
            <span className="text-xs font-semibold text-slate-300 tracking-wide">
              {getStatusText(state)}
            </span>
            {error && <p className="text-[11px] text-red-400">{error}</p>}
          </div>
        </div>

        {/* Transcriptions en direct */}
        <div className="w-full max-h-36 overflow-y-auto space-y-2 px-4 py-3 rounded-2xl bg-white/5 border border-white/5 text-xs z-10 scrollbar-thin">
          {transcript && (
            <div className="flex gap-2 text-slate-300">
              <span className="text-cyan-400 font-bold font-mono shrink-0">Vous :</span>
              <p className="italic">« {transcript} »</p>
            </div>
          )}
          {lastAiResponse && (
            <div className="flex gap-2 text-slate-200">
              <span className="text-purple-400 font-bold font-mono shrink-0">IA :</span>
              <p className="line-clamp-3">{lastAiResponse}</p>
            </div>
          )}
          {!transcript && !lastAiResponse && (
            <div className="text-center text-slate-500 text-[11px] py-2">
              Posez votre question à voix haute : architecture, bogue, optimisation ou création de code.
            </div>
          )}
        </div>

        {/* Barre de Contrôles */}
        <footer className="w-full flex items-center justify-center gap-6 pt-4 border-t border-white/10 z-10">
          <button
            onClick={toggleMute}
            className={`p-3.5 rounded-2xl transition-all cursor-pointer ${
              isMuted
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10'
            }`}
            title={isMuted ? 'Activer le micro' : 'Couper le micro'}
          >
            {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
          </button>

          <button
            onClick={handleClose}
            className="p-4 rounded-full bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/30 transition-all cursor-pointer"
            title="Terminer la session vocale"
          >
            <PhoneOff size={22} />
          </button>

          <button
            onClick={() => {
              if (state === 'speaking') {
                interrupt();
              } else {
                start().catch(() => {});
              }
            }}
            className="p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition-all cursor-pointer"
            title="Relancer / Interrompre"
          >
            <RotateCcw size={20} />
          </button>
        </footer>
      </div>
    </div>
  );
}
