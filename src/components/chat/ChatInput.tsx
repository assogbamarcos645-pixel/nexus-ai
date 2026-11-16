import {
  Send,
  Square,
  AlertCircle,
  Paperclip,
  Image as ImageIcon,
  ChevronDown,
  Check,
  X,
  Sparkles,
  UploadCloud,
  FileText,
  Code2,
  Bug,
  Zap,
  Loader2,
  Mic,
  MicOff,
} from 'lucide-react';
import { useRef, useEffect, useState, type KeyboardEvent, type ChangeEvent, type ClipboardEvent, type DragEvent } from 'react';
import { cn } from '@/utils/cn';
import { useTranslation } from '@/hooks/useTranslation';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { AGENTS } from '@/config/agents';
import type { Agent } from '@/types';
import type { AttachedDocument } from '@/types/documents';
import { parseDocumentFile } from '@/services/documents/documentParserService';
import { AttachedDocumentsList } from './AttachedDocumentsList';
import { VoicePermissionModal } from './VoicePermissionModal';

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onStop?: () => void;
  isLoading: boolean;
  error: string | null;
  placeholder?: string;
  agents?: Agent[];
  selectedAgentId?: string;
  onSelectAgent?: (id: string) => void;
  centered?: boolean;
  attachedImages?: string[];
  onAddImage?: (dataUrl: string) => void;
  onRemoveImage?: (index: number) => void;
  attachedDocuments?: AttachedDocument[];
  onAddDocument?: (doc: AttachedDocument) => void;
  onRemoveDocument?: (id: string) => void;
}

export function ChatInput({
  value,
  onChange,
  onSend,
  onStop,
  isLoading,
  error,
  placeholder,
  agents = AGENTS,
  selectedAgentId = 'general',
  onSelectAgent,
  centered = false,
  attachedImages,
  onAddImage,
  onRemoveImage,
  attachedDocuments,
  onAddDocument,
  onRemoveDocument,
}: ChatInputProps) {
  const { t, language } = useTranslation();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isAgentMenuOpen, setIsAgentMenuOpen] = useState(false);
  const [localImages, setLocalImages] = useState<string[]>([]);
  const [localDocuments, setLocalDocuments] = useState<AttachedDocument[]>([]);
  const [isParsingDoc, setIsParsingDoc] = useState(false);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const baseTextBeforeSpeechRef = useRef('');
  const [voiceFeedbackError, setVoiceFeedbackError] = useState<string | null>(null);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);

  const {
    isListening,
    startListening,
    stopListening,
    error: speechError,
    clearError: clearSpeechError,
  } = useSpeechRecognition({
    language,
    onTranscript: (newTranscript) => {
      const base = baseTextBeforeSpeechRef.current;
      const combined = base ? `${base.trim()} ${newTranscript}` : newTranscript;
      onChange(combined);
    },
    onError: (errMsg) => {
      setVoiceFeedbackError(errMsg);
    },
    onPermissionBlocked: () => {
      setIsVoiceModalOpen(true);
    },
  });

  const handleToggleVoice = () => {
    if (voiceFeedbackError) setVoiceFeedbackError(null);
    clearSpeechError();

    if (isListening) {
      stopListening();
      return;
    }

    baseTextBeforeSpeechRef.current = value;
    startListening();
  };

  const handleModalRetryPermission = async () => {
    setIsVoiceModalOpen(false);
    baseTextBeforeSpeechRef.current = value;
    startListening();
  };

  const handleSendMessage = () => {
    if (isListening) {
      stopListening();
    }
    onSend();
  };

  const effectiveImages = attachedImages ?? localImages;
  const effectiveDocuments = attachedDocuments ?? localDocuments;

  const defaultPlaceholder =
    language === 'fr'
      ? effectiveDocuments.length > 0
        ? 'Posez vos questions sur le document joint...'
        : effectiveImages.length > 0
          ? 'Décrivez la maquette...'
          : 'Message à NEXUS AI...'
      : effectiveDocuments.length > 0
        ? 'Ask questions about attached doc...'
        : effectiveImages.length > 0
          ? 'Describe mockup...'
          : 'Message NEXUS AI...';

  const activePlaceholder = placeholder || defaultPlaceholder;
  const currentAgent = agents.find((a) => a.id === selectedAgentId) ?? agents[0];

  const addImageToState = (dataUrl: string) => {
    if (onAddImage) {
      onAddImage(dataUrl);
    } else {
      setLocalImages((prev) => [...prev, dataUrl]);
    }
  };

  const removeImageFromState = (index: number) => {
    if (onRemoveImage) {
      onRemoveImage(index);
    } else {
      setLocalImages((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const addDocumentToState = (doc: AttachedDocument) => {
    if (onAddDocument) {
      onAddDocument(doc);
    } else {
      setLocalDocuments((prev) => [...prev, doc]);
    }
  };

  const removeDocumentFromState = (id: string) => {
    if (onRemoveDocument) {
      onRemoveDocument(id);
    } else {
      setLocalDocuments((prev) => prev.filter((d) => d.id !== id));
    }
  };

  const processDocumentFile = async (file: File) => {
    setIsParsingDoc(true);
    try {
      const result = await parseDocumentFile(file);
      if (result.success && result.document) {
        addDocumentToState(result.document);
        textareaRef.current?.focus({ preventScroll: true });
      } else {
        alert(result.error || (language === 'fr' ? 'Échec de la lecture du document.' : 'Failed to read document.'));
      }
    } catch (err: any) {
      alert(`Erreur document: ${err?.message || 'Format non pris en charge'}`);
    } finally {
      setIsParsingDoc(false);
    }
  };

  const processImageFile = (file: File) => {
    if (file.size > 8 * 1024 * 1024) {
      alert(
        language === 'fr'
          ? "L'image dépasse la limite maximale de 8 Mo."
          : 'Image exceeds maximum size of 8 MB.',
      );
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        addImageToState(reader.result);
        textareaRef.current?.focus({ preventScroll: true });
      }
    };
    reader.readAsDataURL(file);
  };

  // Auto-resize fluide et précis
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    const computedHeight = Math.min(Math.max(el.scrollHeight, 38), 140);
    el.style.height = `${computedHeight}px`;
  }, [value]);

  // Focus automatique garanti sans scroll parasite
  useEffect(() => {
    if (isLoading) return;

    const focusTextarea = () => {
      const el = textareaRef.current;
      if (el) {
        el.focus({ preventScroll: true });
        const len = el.value.length;
        el.setSelectionRange(len, len);
      }
    };

    focusTextarea();
    const t1 = setTimeout(focusTextarea, 50);
    const t2 = setTimeout(focusTextarea, 180);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [isLoading, selectedAgentId]);

  // Fermeture du menu d'agents au clic extérieur
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsAgentMenuOpen(false);
      }
    };
    if (isAgentMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isAgentMenuOpen]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() || effectiveImages.length > 0 || effectiveDocuments.length > 0) {
        if (isListening) stopListening();
        onSend();
      }
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) {
          processImageFile(file);
        }
      }
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);

    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.type.startsWith('image/')) {
          processImageFile(file);
        } else {
          processDocumentFile(file);
        }
      }
    }
  };

  const handleFileAttach = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type.startsWith('image/')) {
      processImageFile(file);
    } else {
      processDocumentFile(file);
    }
    e.target.value = '';
  };

  const handleImageAction = () => {
    imageInputRef.current?.click();
  };

  const hasContentToSend = Boolean(value.trim() || effectiveImages.length > 0 || effectiveDocuments.length > 0);

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        'w-full mx-auto shrink-0 transition-all duration-200 relative',
        centered ? 'max-w-2xl px-2 sm:px-0' : 'max-w-2xl px-2 sm:px-4 pb-0.5 sm:pb-1',
      )}
    >
      {/* Suggestions rapides : visibles quand la boîte de saisie est vide pour éviter tout encombrement */}
      {!centered && !value && !isLoading && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-none px-0.5 select-none text-[11px] sm:text-[11.5px] -webkit-overflow-scrolling-touch">
          <button
            type="button"
            onClick={() => {
              const prompt = language === 'fr'
                ? 'Analyse ce code en détail : identifie les bugs potentiels, la complexité algorithmique et propose une refactorisation Clean Code :'
                : 'Analyze this code in detail: find potential bugs, evaluate algorithmic complexity and provide clean code refactoring:';
              onChange(prompt);
              textareaRef.current?.focus({ preventScroll: true });
            }}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/70 hover:bg-slate-100 dark:bg-slate-900/70 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-white/10 shrink-0 transition-colors cursor-pointer shadow-2xs"
          >
            <Code2 size={12} className="text-cyan-500" />
            <span>{language === 'fr' ? 'Analyser le code' : 'Analyze code'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              const prompt = language === 'fr'
                ? "Voici l'erreur rencontrée dans mon application. Explique la cause racine (Root Cause) et donne la solution exacte corrigée pas à pas :"
                : "Here is the error encountered in my app. Explain the root cause and provide the exact step-by-step fix:";
              onChange(prompt);
              textareaRef.current?.focus({ preventScroll: true });
            }}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/70 hover:bg-slate-100 dark:bg-slate-900/70 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-white/10 shrink-0 transition-colors cursor-pointer shadow-2xs"
          >
            <Bug size={12} className="text-rose-500" />
            <span>{language === 'fr' ? 'Expliquer erreur' : 'Explain error'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              const prompt = language === 'fr'
                ? 'Fais une synthèse exhaustive et structurée de ce document (points clés, architecture, décisions et recommandations) :'
                : 'Provide a structured summary of this document (key points, architecture, decisions and recommendations):';
              onChange(prompt);
              textareaRef.current?.focus({ preventScroll: true });
            }}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/70 hover:bg-slate-100 dark:bg-slate-900/70 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-white/10 shrink-0 transition-colors cursor-pointer shadow-2xs"
          >
            <FileText size={12} className="text-emerald-500" />
            <span>{language === 'fr' ? 'Résumer document' : 'Summarize doc'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              const prompt = language === 'fr'
                ? 'Optimise les performances de ce traitement (réduction de la complexité temporelle/mémoire, parallélisme, index ou cache) :'
                : 'Optimize the performance of this logic (reduce time/space complexity, concurrency, caching or indexing):';
              onChange(prompt);
              textareaRef.current?.focus({ preventScroll: true });
            }}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/70 hover:bg-slate-100 dark:bg-slate-900/70 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-white/10 shrink-0 transition-colors cursor-pointer shadow-2xs"
          >
            <Zap size={12} className="text-amber-500" />
            <span>{language === 'fr' ? 'Optimiser' : 'Optimize'}</span>
          </button>
        </div>
      )}

      {/* Liste des documents complets attachés */}
      <AttachedDocumentsList
        documents={effectiveDocuments}
        onRemove={removeDocumentFromState}
      />

      {/* Indicateur de lecture de document en cours */}
      {isParsingDoc && (
        <div className="flex items-center gap-2 mb-2 px-3 py-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs shadow-xs animate-pulse">
          <Loader2 size={14} className="animate-spin text-cyan-400" />
          <span>
            {language === 'fr'
              ? 'Extraction et analyse du document en cours...'
              : 'Extracting and parsing document...'}
          </span>
        </div>
      )}

      {/* Indicateur d'écoute vocale en temps réel */}
      {isListening && (
        <div className="flex items-center justify-between mb-2 px-3 py-2 rounded-xl bg-rose-500/10 dark:bg-rose-950/30 border border-rose-500/30 text-rose-600 dark:text-rose-300 text-xs shadow-sm animate-in fade-in slide-in-from-bottom-1">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
            </span>
            <span className="font-semibold">
              {language === 'fr' ? 'À votre écoute...' : 'Listening...'}
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:inline">
              {language === 'fr'
                ? 'Parlez naturellement, la dictée est retranscrite en direct'
                : 'Speak naturally, dictation is transcribed live'}
            </span>
          </div>
          <button
            type="button"
            onClick={stopListening}
            className="text-[11.5px] font-semibold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer ml-2"
          >
            {language === 'fr' ? 'Arrêter' : 'Stop'}
          </button>
        </div>
      )}

      {/* Zone de prévisualisation des maquettes / captures attachées */}
      {effectiveImages.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 mb-2 p-2.5 rounded-2xl bg-slate-900/90 dark:bg-black/75 border border-cyan-500/40 backdrop-blur-xl shadow-[0_4px_25px_rgba(6,182,212,0.2)] animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-[11px] font-semibold">
            <Sparkles size={13} className="text-cyan-400 animate-pulse" />
            <span>Vision Multimodale</span>
          </div>

          {effectiveImages.map((img, idx) => (
            <div
              key={idx}
              className="relative group rounded-xl overflow-hidden border border-cyan-500/40 shadow-sm transition-transform hover:scale-102"
            >
              <img
                src={img}
                alt={`Maquette #${idx + 1}`}
                className="h-14 w-auto object-cover max-w-[140px] rounded-xl"
              />
              <button
                type="button"
                onClick={() => removeImageFromState(idx)}
                className="absolute top-1 right-1 p-1 rounded-full bg-black/80 text-white hover:bg-rose-600 transition-colors cursor-pointer shadow-sm"
                title={language === 'fr' ? 'Retirer cette capture' : 'Remove image'}
                aria-label="Retirer cette capture"
              >
                <X size={11} />
              </button>
            </div>
          ))}

          <span className="text-[11px] text-white/60 font-sans italic ml-1">
            {language === 'fr'
              ? 'Capture prête • Envoyez pour générer le projet LAB'
              : 'Screenshot ready • Send to generate project in LAB'}
          </span>
        </div>
      )}

      {(error || voiceFeedbackError || speechError) && (
        <div className="flex items-center justify-between gap-2 mb-2 px-3 py-1.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2 min-w-0">
            <AlertCircle size={14} className="shrink-0" />
            <span className="truncate">{error || voiceFeedbackError || speechError}</span>
          </div>
          {(voiceFeedbackError || speechError) && (
            <button
              type="button"
              onClick={() => {
                setVoiceFeedbackError(null);
                clearSpeechError();
              }}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer p-0.5"
              aria-label="Fermer"
            >
              <X size={12} />
            </button>
          )}
        </div>
      )}

      {/* Input fichier caché pour le trombone */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.docx,.txt,.md,.json,.csv,.tsv,.xml,.yaml,.yml,.js,.jsx,.ts,.tsx,.py,.html,.css,.sql,.zip,.sh,.c,.cpp,.h"
        onChange={handleFileAttach}
        className="hidden"
        aria-hidden="true"
      />

      {/* Input image caché pour le bouton Image */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/svg+xml"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) processImageFile(file);
          e.target.value = '';
        }}
        className="hidden"
        aria-hidden="true"
      />

      {/* Overlay Drag & Drop */}
      {isDraggingOver && (
        <div className="absolute inset-0 z-30 flex items-center justify-center rounded-2xl bg-slate-950/85 border-2 border-dashed border-cyan-400 backdrop-blur-md animate-in fade-in duration-150">
          <div className="flex items-center gap-2 text-cyan-300 font-semibold text-sm">
            <UploadCloud size={20} className="text-cyan-400 animate-bounce" />
            <span>
              {language === 'fr'
                ? 'Déposez votre capture ou document'
                : 'Drop your screenshot or document'}
            </span>
          </div>
        </div>
      )}

      {/* Card principale ergonomique : Pleine largeur pour le texte + barre d'outils tactile */}
      <div
        onClick={() => textareaRef.current?.focus({ preventScroll: true })}
        className={cn(
          'relative flex flex-col rounded-2xl sm:rounded-3xl transition-all duration-200 cursor-text p-2 sm:p-2.5',
          'liquid-glass shadow-[0_4px_24px_rgba(0,0,0,0.06)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.45)]',
          effectiveImages.length > 0 && 'border-cyan-500/40 ring-1 ring-cyan-500/20',
          'border border-slate-200/80 dark:border-white/10 hover:border-slate-300 dark:hover:border-sky-400/30',
          'focus-within:border-blue-500/80 dark:focus-within:border-sky-400 focus-within:ring-2 focus-within:ring-blue-500/20',
        )}
      >
        {/* Ligne 1 : Textarea pleine largeur, 16px sur mobile (évite tout zoom Safari iOS) */}
        <textarea
          id="chat-input"
          ref={textareaRef}
          rows={1}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          placeholder={activePlaceholder}
          disabled={isLoading}
          aria-label={activePlaceholder}
          className={cn(
            'w-full resize-none bg-transparent text-[16px] sm:text-[14.5px] text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500',
            'outline-none scrollbar-thin leading-relaxed px-1 sm:px-1.5 py-1',
            'min-h-[38px] max-h-[140px]',
            'disabled:opacity-50',
          )}
        />

        {/* Ligne 2 : Barre d'actions inférieure (Style Claude & ChatGPT) */}
        <div
          className="flex items-center justify-between pt-1 mt-0.5 border-t border-slate-100/60 dark:border-white/[0.04]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Groupe gauche : Fichiers, Photos, Sélecteur d'agent */}
          <div className="flex items-center gap-1 sm:gap-1.5">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              title={language === 'fr' ? 'Joindre un fichier texte ou code' : 'Attach a text or code file'}
              aria-label={language === 'fr' ? 'Joindre un fichier' : 'Attach file'}
              className="btn-tactile p-2 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800/70 transition-colors cursor-pointer"
            >
              <Paperclip size={16} />
            </button>

            <button
              type="button"
              onClick={handleImageAction}
              title={language === 'fr' ? 'Joindre une capture ou maquette' : 'Attach an image or mockup'}
              aria-label={language === 'fr' ? 'Joindre une image' : 'Attach image'}
              className="btn-tactile p-2 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800/70 transition-colors cursor-pointer"
            >
              <ImageIcon size={16} />
            </button>

            {/* Sélecteur d'agent moderne */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setIsAgentMenuOpen(!isAgentMenuOpen)}
                title={language === 'fr' ? `Agent actif : ${currentAgent.name}` : `Active agent: ${currentAgent.name}`}
                aria-haspopup="true"
                aria-expanded={isAgentMenuOpen}
                className="btn-tactile flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100/90 hover:bg-slate-200/90 dark:bg-slate-800/70 dark:hover:bg-slate-700/70 text-slate-700 dark:text-slate-300 transition-all text-xs cursor-pointer border border-slate-200/60 dark:border-white/5"
              >
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: currentAgent.color }} />
                <span className="truncate max-w-[75px] sm:max-w-[120px] font-medium">{currentAgent.name}</span>
                <ChevronDown size={11} className={cn('text-slate-400 transition-transform duration-200 shrink-0', isAgentMenuOpen && 'rotate-180')} />
              </button>

              {/* Menu déroulant vers le haut pour éviter le masquage par le clavier */}
              {isAgentMenuOpen && (
                <div
                  role="menu"
                  className="absolute left-0 bottom-full mb-2 w-64 max-w-[calc(100vw-2rem)] rounded-2xl p-1.5 z-50 bg-white/95 dark:bg-[#12121f]/95 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 shadow-[0_20px_50px_rgba(15,23,42,0.15)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.6)] animate-nexus-pop"
                >
                  <div className="px-3 py-2 text-[11px] font-semibold text-slate-400 dark:text-white/40 uppercase tracking-wider border-b border-slate-100 dark:border-white/[0.06] mb-1">
                    {language === 'fr' ? 'Agents Spécialisés' : 'Specialized Agents'}
                  </div>
                  {agents.map((ag) => {
                    const isSelected = ag.id === selectedAgentId;
                    return (
                      <button
                        key={ag.id}
                        type="button"
                        onClick={() => {
                          onSelectAgent?.(ag.id);
                          setIsAgentMenuOpen(false);
                          textareaRef.current?.focus({ preventScroll: true });
                        }}
                        className={cn(
                          'btn-tactile w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs cursor-pointer mb-0.5',
                          isSelected
                            ? 'bg-blue-50/90 text-blue-950 font-semibold dark:bg-slate-800 dark:text-white'
                            : 'text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800/50',
                        )}
                      >
                        <div className="flex items-start gap-2.5 min-w-0 pr-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full mt-1 shrink-0"
                            style={{ backgroundColor: ag.color }}
                          />
                          <div className="flex flex-col min-w-0">
                            <span className="truncate font-medium">{ag.name}</span>
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 truncate">{ag.description}</span>
                          </div>
                        </div>
                        {isSelected && <Check size={14} className="text-blue-600 dark:text-sky-400 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Groupe droit : Dictée vocale + Bouton d'envoi/stop */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              id="btn-voice-input"
              onClick={handleToggleVoice}
              disabled={isLoading}
              title={
                isListening
                  ? (language === 'fr' ? 'Arrêter la dictée' : 'Stop voice dictation')
                  : (language === 'fr' ? 'Dicter au microphone' : 'Dictate with microphone')
              }
              aria-label={isListening ? 'Arrêter la dictée vocale' : 'Activer le microphone'}
              className={cn(
                'btn-tactile relative flex items-center justify-center w-9 h-9 rounded-full transition-all duration-200 cursor-pointer shrink-0',
                isListening
                  ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-[0_0_12px_rgba(244,63,94,0.5)] ring-2 ring-rose-400/50'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800/70',
                isLoading && 'opacity-40 cursor-not-allowed',
              )}
            >
              {isListening ? (
                <MicOff size={16} className="animate-pulse" />
              ) : (
                <Mic size={16} />
              )}
            </button>

            {isLoading ? (
              <button
                type="button"
                id="btn-stop"
                onClick={onStop}
                aria-label={t('chat.stop')}
                className="btn-tactile flex items-center justify-center w-9 h-9 rounded-full bg-red-500 hover:bg-red-600 text-white shadow-xs cursor-pointer shrink-0"
              >
                <Square size={13} fill="currentColor" />
              </button>
            ) : (
              <button
                type="button"
                id="btn-send"
                onClick={handleSendMessage}
                disabled={!hasContentToSend}
                aria-label={t('chat.send')}
                className={cn(
                  'btn-tactile flex items-center justify-center w-9 h-9 rounded-full text-white shrink-0 cursor-pointer transition-all duration-150',
                  hasContentToSend
                    ? 'bg-blue-600 hover:bg-blue-500 active:bg-blue-700 shadow-[0_2px_12px_rgba(37,99,235,0.35)] active:scale-95'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 opacity-40 cursor-not-allowed shadow-none',
                )}
              >
                <Send size={15} className="-ml-0.5 translate-x-0.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Boîte de dialogue permission microphone */}
      <VoicePermissionModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        onRequestPermission={handleModalRetryPermission}
        status="blocked"
      />
    </div>
  );
}
