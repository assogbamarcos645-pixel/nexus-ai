import { useState, useMemo, memo } from 'react';
import { Copy, Check, Sparkles, ArrowRight, FileText, Volume2, VolumeX } from 'lucide-react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { cn } from '@/utils/cn';
import type { Message, Agent } from '@/types';
import { hasExtractableProject, createAndOpenProjectFromMockup } from '@/services/lab/mockupConverterService';
import { formatFileSize } from '@/services/documents/documentParserService';

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

marked.setOptions({
  breaks: true,
  gfm: true,
});

marked.use({
  renderer: {
    code({ text, lang }: { text: string; lang?: string }) {
      const cleanLang = (lang || 'code').trim().toLowerCase();
      const encoded = encodeURIComponent(text);
      const escaped = escapeHtml(text);
      return `<div class="code-block-card my-3 rounded-xl overflow-hidden border border-slate-700/60 bg-[#0c101d] shadow-lg">
        <div class="code-block-header flex items-center justify-between px-3.5 py-1.5 bg-slate-900/90 border-b border-slate-800 text-[11px] font-mono text-slate-400 select-none">
          <span class="font-semibold text-sky-400 uppercase tracking-wider">${cleanLang}</span>
          <button type="button" class="nexus-copy-code-btn flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors cursor-pointer py-1 px-2.5 rounded-md active:scale-95 bg-slate-800/80 hover:bg-slate-700/80 text-[11px]" data-code="${encoded}">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
            <span>Copier</span>
          </button>
        </div>
        <pre class="p-3 sm:p-4 overflow-x-auto text-[12px] sm:text-[13px] leading-relaxed font-mono text-slate-100 scrollbar-thin"><code>${escaped}</code></pre>
      </div>`;
    },
  },
});

interface MessageBubbleProps {
  message: Message;
  agent?: Agent;
}

function MessageBubbleComponent({ message }: MessageBubbleProps) {
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
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

  const handleToggleSpeak = () => {
    if (!('speechSynthesis' in window)) return;
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }
    window.speechSynthesis.cancel();
    const cleanText = message.content
      .replace(/```[\s\S]*?```/g, '')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/[#*_~>]/g, '')
      .trim();
    if (!cleanText) return;
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'fr-FR';
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const handleOpenInLab = () => {
    setIsOpeningLab(true);
    const originalMockup = message.images && message.images.length > 0 ? message.images[0] : undefined;
    createAndOpenProjectFromMockup(message.content, undefined, originalMockup);
    setTimeout(() => setIsOpeningLab(false), 1500);
  };

  const handleBubbleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const btn = (e.target as HTMLElement).closest('.nexus-copy-code-btn') as HTMLButtonElement | null;
    if (!btn) return;
    e.preventDefault();
    e.stopPropagation();
    const rawCode = decodeURIComponent(btn.getAttribute('data-code') || '');
    if (!rawCode) return;
    navigator.clipboard.writeText(rawCode).then(() => {
      const span = btn.querySelector('span');
      if (span) {
        const orig = span.textContent;
        span.textContent = 'Copié !';
        btn.classList.add('text-emerald-400');
        setTimeout(() => {
          span.textContent = orig;
          btn.classList.remove('text-emerald-400');
        }, 2000);
      }
    });
  };

  const formattedHtml = useMemo(() => {
    if (!message.content) return '';
    try {
      const raw = marked.parse(message.content) as string;
      return DOMPurify.sanitize(raw, {
        ADD_TAGS: ['button', 'svg', 'path'],
        ADD_ATTR: [
          'data-code',
          'viewBox',
          'fill',
          'stroke',
          'stroke-width',
          'stroke-linecap',
          'stroke-linejoin',
          'd',
        ],
      });
    } catch {
      return message.content;
    }
  }, [message.content]);

  return (
    <div
      className={cn(
        'max-w-3xl mx-auto w-full px-2 sm:px-4 py-1.5 sm:py-2 group transition-all virtual-message animate-message-fade-in flex',
        isUser ? 'justify-end' : 'justify-start',
      )}
    >
      {/* Bulle de message : Style ultra-pro & mobile first */}
      <div
        onClick={handleBubbleClick}
        className={cn(
          'relative px-4 sm:px-5 py-3 sm:py-4 rounded-2xl text-[14px] sm:text-[15px] leading-relaxed max-w-[92%] sm:max-w-[85%] md:max-w-[80%] transition-all',
          isUser
            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-br-xs shadow-[0_4px_20px_rgba(37,99,235,0.25)] border border-blue-500/30'
            : 'liquid-glass text-slate-800 dark:text-slate-100 rounded-bl-xs',
        )}
      >
        {message.images && message.images.length > 0 && (
          <div
            className={cn(
              'flex flex-wrap gap-2 mb-3',
              message.images.length === 1 ? 'max-w-md' : 'max-w-full',
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

        {message.documents && message.documents.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {message.documents.map((doc) => (
              <div
                key={doc.id}
                className={cn(
                  'flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs font-medium border shadow-xs backdrop-blur-md',
                  isUser
                    ? 'bg-blue-700/60 border-blue-400/40 text-blue-50'
                    : 'bg-slate-800/80 border-slate-700/60 text-slate-200',
                )}
              >
                <FileText size={14} className={isUser ? 'text-blue-200' : 'text-cyan-400'} />
                <span className="truncate max-w-[180px] font-mono">{doc.name}</span>
                <span className="text-[10px] opacity-75 font-mono">({formatFileSize(doc.size)})</span>
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
          <div className="flex items-center justify-between gap-3 mt-2.5 pt-2 border-t border-slate-100/50 dark:border-slate-800/50">
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
              <div className="flex items-center gap-1 sm:gap-1.5">
                {/* Bouton Synthèse vocale / Lecture à voix haute */}
                <button
                  type="button"
                  onClick={handleToggleSpeak}
                  className="btn-tactile flex items-center gap-1 text-slate-400 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white transition-all px-2 py-1 rounded-lg text-[11px] hover:bg-slate-100/80 dark:hover:bg-slate-800/80 cursor-pointer active:scale-95"
                  title={isSpeaking ? 'Arrêter la lecture vocale' : 'Écouter la réponse'}
                  aria-label={isSpeaking ? 'Arrêter la lecture vocale' : 'Écouter la réponse'}
                >
                  {isSpeaking ? (
                    <>
                      <VolumeX size={13} className="text-rose-500 animate-pulse" />
                      <span className="text-rose-500 font-medium text-[10.5px]">Stop</span>
                    </>
                  ) : (
                    <>
                      <Volume2 size={13} />
                      <span className="hidden sm:inline text-[10.5px]">Écouter</span>
                    </>
                  )}
                </button>

                {/* Bouton Copier le message entier */}
                <button
                  type="button"
                  onClick={handleCopy}
                  className="btn-tactile flex items-center gap-1 text-slate-400 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white transition-all px-2 py-1 rounded-lg text-[11px] hover:bg-slate-100/80 dark:hover:bg-slate-800/80 cursor-pointer active:scale-95"
                  title="Copier le message"
                  aria-label="Copier le message"
                >
                  {copied ? (
                    <>
                      <Check size={13} className="text-emerald-500" />
                      <span className="text-emerald-500 font-medium text-[10.5px]">Copié</span>
                    </>
                  ) : (
                    <>
                      <Copy size={13} />
                      <span className="hidden sm:inline text-[10.5px]">Copier</span>
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
