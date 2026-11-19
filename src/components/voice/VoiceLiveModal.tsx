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
  Radio,
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

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        stop();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, stop]);

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
        return `${agentName} vous répond... (Touchez l'orbe pour interrompre)`;
      default:
        return 'Connexion au flux vocal...';
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-2xl animate-in fade-in duration-200 cursor-pointer"
      role="dialog"
      aria-modal="true"
      onClick={handleClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-xl h-[86vh] max-h-[680px] rounded-3xl bg-gradient-to-b from-slate-900 via-[#070716] to-[#030308] border border-white/10 shadow-[0_0_90px_rgba(6,182,212,0.2)] flex flex-col justify-between items-center p-6 sm:p-8 overflow-hidden cursor-default text-slate-100"
      >
        {/* Lueur d'ambiance cosmique réactive en arrière-plan */}
        <div
          className={`absolute inset-0 pointer-events-none transition-all duration-700 blur-3xl opacity-35 ${
            state === 'listening'
              ? 'bg-gradient-to-b from-cyan-500/25 via-teal-500/10 to-transparent'
              : state === 'thinking'
              ? 'bg-gradient-to-b from-indigo-600/30 via-purple-600/15 to-transparent'
              : 'bg-gradient-to-b from-purple-500/30 via-pink-500/15 to-transparent'
          }`}
        />

        {/* Header */}
        <header className="w-full flex items-center justify-between z-10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/25">
              <Sparkles size={17} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-white">{agentName} Voice Live</h3>
                <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-cyan-500/20 text-cyan-300 font-mono font-bold border border-cyan-500/30">
                  LIVE
                </span>
              </div>
              <p className="text-[11px] text-cyan-400 font-mono flex items-center gap-1.5 mt-0.5">
                <Radio size={11} className="animate-pulse text-cyan-400" />
                <span>Audio bidirectionnel temps réel</span>
              </p>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Quitter le mode vocal (Échap)"
          >
            <X size={18} />
          </button>
        </header>

        {/* Centre : Orbe Cosmique Animé Interactif */}
        <div
          className="relative flex flex-col items-center justify-center my-auto cursor-pointer group py-4 select-none"
          onClick={() => {
            if (state === 'speaking') interrupt();
          }}
          title={state === 'speaking' ? "Cliquer pour interrompre la parole" : undefined}
        >
          {/* Ondes concentriques extérieures de propagation sonore */}
          <div
            className={`absolute w-64 h-64 sm:w-72 sm:h-72 rounded-full transition-all duration-700 pointer-events-none ${
              state === 'listening'
                ? 'border-2 border-cyan-500/30 animate-ping opacity-30'
                : state === 'speaking'
                ? 'border-2 border-purple-500/40 animate-pulse opacity-40'
                : 'opacity-0'
            }`}
          />
          <div
            className={`absolute w-52 h-52 sm:w-60 sm:h-60 rounded-full transition-all duration-500 pointer-events-none ${
              state === 'listening'
                ? 'bg-cyan-500/15 blur-2xl animate-pulse'
                : state === 'speaking'
                ? 'bg-purple-500/25 blur-2xl animate-pulse'
                : 'bg-indigo-500/15 blur-2xl'
            }`}
          />

          {/* Sphère Centrale Cosmique */}
          <div
            className={`relative w-36 h-36 sm:w-40 sm:h-40 rounded-full flex items-center justify-center shadow-2xl transition-all duration-500 transform ${
              state === 'listening'
                ? 'scale-105 bg-gradient-to-tr from-cyan-500 via-teal-400 to-indigo-600 shadow-[0_0_60px_rgba(6,182,212,0.6)]'
                : state === 'thinking'
                ? 'scale-100 bg-gradient-to-tr from-indigo-600 via-purple-600 to-cyan-500 shadow-[0_0_50px_rgba(99,102,241,0.6)]'
                : state === 'speaking'
                ? 'scale-110 bg-gradient-to-tr from-purple-500 via-pink-500 to-cyan-400 shadow-[0_0_70px_rgba(168,85,247,0.7)] animate-pulse'
                : 'scale-95 bg-slate-800'
            }`}
          >
            {/* Anneau intérieur */}
            <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-center text-white border border-white/10 group-hover:scale-105 transition-transform">
              {state === 'speaking' ? (
                <>
                  <Volume2 size={34} className="text-purple-300 animate-bounce" />
                  {/* Égaliseur visuel miniature */}
                  <div className="flex items-center gap-1 mt-1.5 h-3">
                    <span className="w-1 bg-purple-400 rounded-full animate-pulse h-2" />
                    <span className="w-1 bg-pink-400 rounded-full animate-pulse h-3" />
                    <span className="w-1 bg-cyan-400 rounded-full animate-pulse h-1.5" />
                  </div>
                </>
              ) : state === 'listening' ? (
                <>
                  <Mic size={34} className="text-cyan-300 animate-pulse" />
                  {/* Égaliseur d'écoute */}
                  <div className="flex items-center gap-1 mt-1.5 h-3">
                    <span className="w-1 bg-cyan-400 rounded-full animate-pulse h-3" />
                    <span className="w-1 bg-teal-300 rounded-full animate-pulse h-2" />
                    <span className="w-1 bg-indigo-400 rounded-full animate-pulse h-2.5" />
                  </div>
                </>
              ) : (
                <Sparkles size={34} className="text-indigo-300 animate-pulse" />
              )}
            </div>
          </div>

          {/* État Texte */}
          <div className="mt-7 text-center space-y-1.5 z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-slate-200 tracking-wide">
              <span
                className={`w-2 h-2 rounded-full ${
                  state === 'listening'
                    ? 'bg-cyan-400 animate-pulse'
                    : state === 'thinking'
                    ? 'bg-indigo-400 animate-ping'
                    : 'bg-purple-400 animate-pulse'
                }`}
              />
              <span>{getStatusText(state)}</span>
            </div>
            {error && <p className="text-[11px] text-red-400">{error}</p>}
          </div>
        </div>

        {/* Transcriptions en direct avec bulles distinctes */}
        <div className="w-full max-h-40 overflow-y-auto space-y-2.5 px-4 py-3 rounded-2xl bg-slate-950/70 border border-white/10 text-xs z-10 scrollbar-thin">
          {transcript && (
            <div className="flex items-start gap-2.5 p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-slate-200">
              <span className="px-1.5 py-0.5 rounded text-[10px] bg-cyan-500/20 text-cyan-300 font-bold font-mono shrink-0">
                Vous
              </span>
              <p className="italic text-cyan-100/90 leading-relaxed">« {transcript} »</p>
            </div>
          )}
          {lastAiResponse && (
            <div className="flex items-start gap-2.5 p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-slate-200">
              <span className="px-1.5 py-0.5 rounded text-[10px] bg-purple-500/20 text-purple-300 font-bold font-mono shrink-0">
                {agentName}
              </span>
              <p className="line-clamp-4 leading-relaxed text-purple-100/90">{lastAiResponse}</p>
            </div>
          )}
          {!transcript && !lastAiResponse && (
            <div className="text-center text-slate-400 text-xs py-2 flex flex-col items-center gap-1">
              <span>Posez votre question à voix haute : architecture, bogue, optimisation ou code.</span>
              <span className="text-[11px] text-slate-500 font-mono">
                Ex: « Crée un composant de carte avec bouton d'achat »
              </span>
            </div>
          )}
        </div>

        {/* Barre de Contrôles */}
        <footer className="w-full flex items-center justify-between pt-4 border-t border-white/10 z-10 shrink-0">
          <div className="text-[11px] text-slate-500 font-mono hidden sm:block">
            Raccourci : <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-slate-300">Échap</kbd>
          </div>

          <div className="flex items-center gap-4 mx-auto sm:mx-0">
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
              className="p-4 rounded-full bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/40 transition-all cursor-pointer hover:scale-105"
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
              title="Relancer / Interrompre la parole"
            >
              <RotateCcw size={20} />
            </button>
          </div>

          <div className="text-[11px] text-slate-400 font-mono hidden sm:block">
            {state === 'speaking' ? 'Interrompre : Clic sur orbe' : 'Prêt à parler'}
          </div>
        </footer>
      </div>
    </div>
  );
}
