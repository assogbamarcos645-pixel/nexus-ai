import { useState, useMemo, memo } from 'react';
import { Copy, Check, Sparkles, ArrowRight } from 'lucide-react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { cn } from '@/utils/cn';
import type { Message, Agent } from '@/types';
import { hasExtractableProject, createAndOpenProjectFromMockup } from '@/services/lab/mockupConverterService';

marked.setOptions({
  breaks: true,
  gfm: true,
});

interface MessageBubbleProps {
  message: Message;
  agent?: Agent;
}

function MessageBubbleComponent({ message }: MessageBubbleProps) {
  const [copied, setCopied] = useState(false);
  const [isOpeningLab, setIsOpeningLab] = useState(false);
  const isUser = message.role === 'user';
  const canExtractToLab = !isUser && hasExtractableProject(message.content);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const handleOpenInLab = () => {
    setIsOpeningLab(true);
    const originalMockup = message.images && message.images.length > 0 ? message.images[0] : undefined;
    createAndOpenProjectFromMockup(message.content, undefined, originalMockup);
    setTimeout(() => setIsOpeningLab(false), 1500);
  };

  const formattedHtml = useMemo(() => {
    if (!message.content) return '';
    try {
      const raw = marked.parse(message.content) as string;
      return DOMPurify.sanitize(raw);
    } catch {
      return message.content;
    }
  }, [message.content]);

  return (
    <div
      className={cn(
        'max-w-3xl mx-auto w-full px-1.5 sm:px-4 py-1 sm:py-1.5 group transition-all virtual-message animate-message-fade-in flex',
        isUser ? 'justify-end' : 'justify-start',
      )}
    >
      {/* Bulle de message sobre & épurée sans profil */}
      <div
        className={cn(
          'relative px-3.5 sm:px-5 py-2.5 sm:py-3.5 rounded-xl sm:rounded-2xl text-[13.5px] sm:text-[15px] leading-relaxed max-w-[94%] sm:max-w-[84%] md:max-w-[80%] transition-all',
          isUser
            ? 'bg-blue-600 text-white rounded-br-xs shadow-[0_4px_16px_rgba(37,99,235,0.25)] border border-blue-500/40'
            : 'liquid-glass text-slate-800 dark:text-slate-100 rounded-bl-xs',
        )}
      >
        {message.images && message.images.length > 0 && (
          <div
            className={cn(
              'flex flex-wrap gap-2 mb-3',
              message.images.length === 1 ? 'max-w-md' : 'max-w-full'
            )}
          >
            {message.images.map((img, idx) => (
              <div
                key={idx}
                className="relative group/img overflow-hidden rounded-xl border border-white/20 dark:border-slate-700/60 shadow-sm bg-black/5 dark:bg-black/20"
              >
                <img
                  src={img}
                  alt={`Capture ou maquette jointe ${idx + 1}`}
                  className="max-h-60 sm:max-h-72 w-auto object-cover rounded-xl cursor-pointer hover:scale-[1.02] transition-transform"
                  onClick={() => window.open(img, '_blank')}
                />
                <span className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded text-[10px] font-mono bg-black/60 text-white backdrop-blur-xs opacity-0 group-hover/img:opacity-100 transition-opacity pointer-events-none">
                  Agrandir ↗
                </span>
              </div>
            ))}
          </div>
        )}

        {message.content ? (
          <div className="relative">
            <div
              className="markdown-content text-sm sm:text-[15px] leading-relaxed break-words"
              dangerouslySetInnerHTML={{ __html: formattedHtml }}
            />
            {message.isStreaming && (
              <span
                className="inline-block w-2 h-4 ml-1 bg-cyan-500 dark:bg-cyan-400 animate-pulse align-middle rounded-xs shadow-[0_0_8px_rgba(6,182,212,0.6)]"
                title="Génération en cours..."
                aria-label="Génération en direct"
              />
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2.5 py-2 px-1" aria-label="NEXUS réfléchit...">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600 dark:bg-sky-400" />
            </span>
            <span className="text-xs font-semibold text-blue-600 dark:text-sky-400 tracking-wide font-mono">
              NEXUS génère la réponse...
            </span>
            <div className="flex items-center gap-1.5 ml-1">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-sky-400 animate-bounce [animation-delay:-0.3s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-sky-400 animate-bounce [animation-delay:-0.15s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-sky-400 animate-bounce" />
            </div>
          </div>
        )}

        {canExtractToLab && (
          <div className="mt-3 pt-3 border-t border-slate-200/60 dark:border-slate-800/80">
            <button
              type="button"
              onClick={handleOpenInLab}
              disabled={isOpeningLab}
              className="w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 text-white font-medium text-xs sm:text-sm shadow-md hover:shadow-cyan-500/20 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer group"
              title="Créer un nouveau projet NEXUS LAB et tester ce code en direct"
            >
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-yellow-300 animate-pulse shrink-0" />
                <span className="font-semibold tracking-wide">
                  {isOpeningLab ? 'Ouverture de NEXUS LAB...' : 'Ouvrir et tester dans NEXUS LAB'}
                </span>
              </div>
              <div className="flex items-center gap-1 text-[11px] opacity-90 group-hover:translate-x-1 transition-transform shrink-0">
                <span>Lancer le LAB</span>
                <ArrowRight size={14} />
              </div>
            </button>
          </div>
        )}

        {Boolean(message.content) && (
          <div className="flex items-center justify-between gap-4 mt-2 pt-1.5 border-t border-slate-100/50 dark:border-slate-800/50">
            <time
              dateTime={message.timestamp.toISOString()}
              className={cn(
                'block text-[10px] font-mono',
                isUser ? 'text-blue-100/80' : 'text-slate-400 dark:text-slate-500',
              )}
            >
              {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </time>

            {!isUser && (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="btn-tactile flex items-center gap-1 text-slate-400 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-all px-2 py-0.5 rounded-md text-[11px] hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer active:scale-90"
                  title="Copier le message"
                  aria-label="Copier le message"
                >
                  {copied ? (
                    <>
                      <Check size={12} className="text-emerald-500" />
                      <span className="text-emerald-500 font-medium">Copié</span>
                    </>
                  ) : (
                    <>
                      <Copy size={12} />
                      <span>Copier</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export const MessageBubble = memo(MessageBubbleComponent);
