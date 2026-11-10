import { Send, Square, AlertCircle, Paperclip, Image as ImageIcon, ChevronDown, Check, X, Sparkles, UploadCloud } from 'lucide-react';
import { useRef, useEffect, useState, type KeyboardEvent, type ChangeEvent, type ClipboardEvent, type DragEvent } from 'react';
import { cn } from '@/utils/cn';
import { useTranslation } from '@/hooks/useTranslation';
import { AGENTS } from '@/config/agents';
import type { Agent } from '@/types';

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
}: ChatInputProps) {
  const { t, language } = useTranslation();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isAgentMenuOpen, setIsAgentMenuOpen] = useState(false);
  const [localImages, setLocalImages] = useState<string[]>([]);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const effectiveImages = attachedImages ?? localImages;

  const defaultPlaceholder =
    language === 'fr'
      ? effectiveImages.length > 0
        ? 'Décrivez comment convertir cette maquette (ou appuyez sur Entrée)...'
        : 'Décrivez ce que vous voulez créer, apprendre ou explorer (ou collez une image Ctrl+V)...'
      : effectiveImages.length > 0
        ? 'Describe how to convert this mockup (or press Enter)...'
        : 'Describe what you want to create, learn, or explore (or paste an image Ctrl+V)...';

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

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [value]);

  // Focus automatique garanti du curseur sans déplacement intempestif de la page
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
      if (value.trim() || effectiveImages.length > 0) {
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
        }
      }
    }
  };

  // Gestion de l'import d'un fichier texte/code via l'icône trombone
  const handleFileAttach = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 512 * 1024) {
      alert(language === 'fr' ? 'Le fichier dépasse la taille maximale de 512 Ko.' : 'File exceeds maximum size of 512 KB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const textContent = typeof reader.result === 'string' ? reader.result : '';
      const prefix = value ? `${value}\n\n` : '';
      onChange(`${prefix}[Fichier: ${file.name}]\n\`\`\`\n${textContent.slice(0, 4000)}\n\`\`\`\n`);
      textareaRef.current?.focus({ preventScroll: true });
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleImageAction = () => {
    imageInputRef.current?.click();
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        'w-full mx-auto shrink-0 transition-all duration-200 relative',
        centered ? 'max-w-3xl px-2 sm:px-0' : 'max-w-3xl px-3 sm:px-4 pb-2 sm:pb-3',
      )}
    >
      {/* Zone de prévisualisation des maquettes / captures d'écran attachées */}
      {effectiveImages.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 mb-2 p-2.5 rounded-2xl bg-slate-900/90 dark:bg-black/75 border border-cyan-500/40 backdrop-blur-xl shadow-[0_4px_25px_rgba(6,182,212,0.2)] animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-[11px] font-semibold">
            <Sparkles size={13} className="text-cyan-400 animate-pulse" />
            <span>Vision Multimodale (Gemini 2.5)</span>
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
              ? 'Capture prête • Appuyez sur Entrée pour générer le projet LAB'
              : 'Screenshot ready • Press Enter to generate project in LAB'}
          </span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 mb-2 px-3.5 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs shadow-xs">
          <AlertCircle size={14} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Input fichier caché pour le trombone */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".txt,.md,.json,.js,.ts,.tsx,.py,.html,.css,.csv"
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

      {/* Overlay Drag & Drop avec lueur Cyber */}
      {isDraggingOver && (
        <div className="absolute inset-0 z-30 flex items-center justify-center rounded-2xl bg-slate-950/85 border-2 border-dashed border-cyan-400 backdrop-blur-md animate-in fade-in duration-150">
          <div className="flex items-center gap-2 text-cyan-300 font-semibold text-sm">
            <UploadCloud size={20} className="text-cyan-400 animate-bounce" />
            <span>
              {language === 'fr'
                ? 'Déposez votre capture ou maquette pour la convertir en code'
                : 'Drop your UI screenshot or mockup to convert into code'}
            </span>
          </div>
        </div>
      )}

      {/* Conteneur principal moderne Liquid Glass (Style Moderne ChatGPT / Claude) */}
      <div
        onClick={() => textareaRef.current?.focus({ preventScroll: true })}
        className={cn(
          'relative flex flex-col rounded-2xl sm:rounded-3xl transition-all duration-300 cursor-text',
          'liquid-glass shadow-[0_4px_24px_rgba(0,0,0,0.04)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.45)]',
          effectiveImages.length > 0 && 'border-cyan-500/40 ring-1 ring-cyan-500/20',
          'border border-slate-200/80 dark:border-white/10 hover:border-slate-300 dark:hover:border-sky-400/30',
          'focus-within:border-blue-500/80 dark:focus-within:border-sky-400 focus-within:ring-2 focus-within:ring-blue-500/20',
        )}
      >
        {/* Zone supérieure : Champ de saisie multi-lignes étendu sur toute la largeur */}
        <div className="px-3.5 pt-3 sm:px-4 sm:pt-3.5 pb-1">
          <textarea
            id="chat-input"
            ref={textareaRef}
            rows={1}
            autoFocus
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder={activePlaceholder}
            disabled={isLoading}
            aria-label={activePlaceholder}
            className={cn(
              'w-full resize-none bg-transparent text-sm sm:text-[15px] text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500',
              'outline-none scrollbar-thin leading-relaxed',
              'min-h-[44px] max-h-[160px]',
              'disabled:opacity-50',
            )}
          />
        </div>

        {/* Zone inférieure : Barre d'actions & outils dédiée */}
        <div
          className="flex items-center justify-between gap-2 px-2.5 sm:px-3.5 pb-2.5 pt-1 select-none"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Outils à gauche : Pièce jointe & Image */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              title={language === 'fr' ? 'Joindre un fichier texte ou code' : 'Attach a text or code file'}
              aria-label={language === 'fr' ? 'Joindre un fichier' : 'Attach file'}
              className="btn-tactile p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
            >
              <Paperclip size={17} />
            </button>

            <button
              type="button"
              onClick={handleImageAction}
              title={language === 'fr' ? 'Créer ou décrire une image' : 'Create or describe an image'}
              aria-label={language === 'fr' ? 'Outil image' : 'Image tool'}
              className="btn-tactile p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
            >
              <ImageIcon size={17} />
            </button>
          </div>

          {/* Contrôles à droite : Sélecteur d'agent + Bouton d'envoi / arrêt */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Menu sélecteur d'agent NEXUS */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                id="btn-agent-selector-pill"
                onClick={() => setIsAgentMenuOpen((prev) => !prev)}
                className={cn(
                  'btn-tactile flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-semibold cursor-pointer select-none transition-all',
                  'bg-slate-100 hover:bg-slate-200/80 text-slate-700 border border-slate-200/80',
                  'dark:bg-slate-800/80 dark:hover:bg-slate-700/80 dark:text-slate-200 dark:border-slate-700/80',
                )}
                title={language === 'fr' ? 'Choisir l’agent spécialisé' : 'Choose specialized agent'}
              >
                <span
                  className="w-2 h-2 rounded-full shadow-xs shrink-0"
                  style={{ backgroundColor: currentAgent.color }}
                />
                <span className="tracking-tight font-medium text-[11.5px] max-w-[130px] truncate">
                  {currentAgent.id === 'general' ? 'NEXUS Architect' : currentAgent.name}
                </span>
                <ChevronDown
                  size={12}
                  className={cn(
                    'text-slate-400 dark:text-slate-400 transition-transform duration-200 shrink-0',
                    isAgentMenuOpen && 'rotate-180',
                  )}
                />
              </button>

              {/* Menu déroulant des agents vers le haut */}
              {isAgentMenuOpen && (
                <div className="absolute right-0 bottom-full mb-2 w-72 sm:w-80 max-w-[calc(100vw-2rem)] rounded-2xl bg-white/98 dark:bg-[#0f1526]/98 backdrop-blur-xl border border-slate-200/90 dark:border-slate-800 shadow-[0_16px_40px_rgba(15,23,42,0.16)] dark:shadow-[0_16px_40px_rgba(0,0,0,0.8)] p-1.5 z-50 animate-nexus-pop">
                  <div className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800/80 mb-1">
                    {language === 'fr' ? 'Agents Spécialisés — Génie Logiciel' : 'Specialized Agents — Software Engineering'}
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
                          'btn-tactile w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left text-xs cursor-pointer mb-0.5',
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
                            <span className="text-[10px] text-slate-400 dark:text-slate-400 truncate">{ag.description}</span>
                          </div>
                        </div>
                        {isSelected && <Check size={14} className="text-blue-600 dark:text-sky-400 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Bouton Stop ou Envoyer */}
            {isLoading ? (
              <button
                type="button"
                id="btn-stop"
                onClick={onStop}
                aria-label={t('chat.stop')}
                className="btn-tactile flex items-center justify-center w-8.5 h-8.5 sm:w-9 sm:h-9 rounded-full bg-red-500 hover:bg-red-600 text-white shadow-xs cursor-pointer shrink-0"
              >
                <Square size={13} fill="currentColor" />
              </button>
            ) : (
              <button
                type="button"
                id="btn-send"
                onClick={onSend}
                disabled={!value.trim()}
                aria-label={t('chat.send')}
                className={cn(
                  'btn-tactile flex items-center justify-center w-8.5 h-8.5 sm:w-9 sm:h-9 rounded-full text-white shrink-0 cursor-pointer transition-all duration-150',
                  value.trim()
                    ? 'bg-blue-600 hover:bg-blue-500 active:bg-blue-700 shadow-md shadow-blue-500/25 active:scale-95'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 opacity-40 cursor-not-allowed shadow-none',
                )}
              >
                <Send size={14} className="-ml-0.5 translate-x-0.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
