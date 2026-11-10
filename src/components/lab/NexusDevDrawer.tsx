/**
 * src/components/lab/NexusDevDrawer.tsx
 *
 * Volet interactif pour l'assistance par NEXUS DEV.
 * Permet de formuler des questions sur le fichier actif, de recevoir des
 * explications et des propositions de code, et d'ouvrir la comparaison
 * avant confirmation de remplacement.
 */

import { useState, useMemo, useEffect } from 'react';
import { Sparkles, Send, Copy, Check, Eye, HelpCircle, Cpu } from 'lucide-react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import type { LabFile, DevProposal } from '@/types/lab';
import { requestDevAssistance } from '@/services/lab/devService';
import { getAIConfig } from '@/services/ai/aiConfigService';
import { getProviderById, getModelById } from '@/config/aiProviders';
import { Spinner } from '@/components/ui/Spinner';
import { ModalCloseButton } from '@/components/ui/ModalCloseButton';

interface NexusDevDrawerProps {
  isOpen: boolean;
  file: LabFile | null;
  onClose: () => void;
  onRequestDiff: (proposal: DevProposal) => void;
}

const QUICK_PROMPTS = [
  'Expliquer ce code et sa structure',
  'Détecter d’éventuels bugs et vulnérabilités',
  'Optimiser les performances et la fluidité',
  'Ajouter une gestion robuste des erreurs',
];

export function NexusDevDrawer({
  isOpen,
  file,
  onClose,
  onRequestDiff,
}: NexusDevDrawerProps) {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [currentProposal, setCurrentProposal] = useState<DevProposal | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const aiConfig = getAIConfig();
  const activeProvider = getProviderById(aiConfig.activeProviderId);
  const activeModel = getModelById(aiConfig.activeProviderId, aiConfig.activeModelId);

  const explanation = currentProposal?.explanation;
  const formattedExplanation = useMemo(() => {
    if (!explanation) return '';
    try {
      const raw = marked.parse(explanation) as string;
      return DOMPurify.sanitize(raw);
    } catch {
      return explanation;
    }
  }, [explanation]);

  const formattedStreamingText = useMemo(() => {
    if (!streamingText) return '';
    try {
      const raw = marked.parse(streamingText) as string;
      return DOMPurify.sanitize(raw);
    } catch {
      return streamingText;
    }
  }, [streamingText]);

  const hasCodeChanges = Boolean(
    currentProposal &&
      currentProposal.suggestedCode &&
      currentProposal.suggestedCode.trim() !== (file?.content || '').trim(),
  );

  // Écoute de la touche Échap pour fermer immédiatement le volet
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (queryText?: string) => {
    const textToSend = (queryText ?? prompt).trim();
    if (!textToSend || !file || isLoading) return;

    setIsLoading(true);
    setStreamingText('');
    setError(null);

    try {
      const proposal = await requestDevAssistance({
        file,
        prompt: textToSend,
        onChunk: (chunk) => {
          setStreamingText((prev) => prev + chunk);
        },
      });
      setCurrentProposal(proposal);
      setStreamingText('');
      setPrompt('');
    } catch (err) {
      console.error('[NEXUS DEV]', err);
      setError('Impossible de générer l’assistance pour ce fichier.');
    } finally {
      setIsLoading(false);
      setStreamingText('');
    }
  };

  const handleCopy = () => {
    if (!currentProposal) return;
    navigator.clipboard.writeText(currentProposal.suggestedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <>
      {/* Arrière-plan sombre cliquable pour fermer le volet d'un simple clic à l'extérieur */}
      <div
        id="nexus-dev-backdrop"
        className="absolute inset-0 bg-black/60 backdrop-blur-xs z-30 transition-opacity cursor-pointer animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
        title="Cliquer pour fermer l'assistant"
      />

      <aside
        id="nexus-dev-drawer"
        className="absolute inset-y-0 right-0 z-40 w-full sm:w-[480px] liquid-glass border-l border-slate-200/80 dark:border-white/10 shadow-[0_0_60px_rgba(0,0,0,0.3)] dark:shadow-[0_0_60px_rgba(0,0,0,0.85)] flex flex-col animate-in slide-in-from-right duration-200 legacy-theme text-slate-900 dark:text-white"
        role="complementary"
        aria-label="Assistant NEXUS DEV"
      >
        {/* En-tête */}
        <div className="px-5 py-4 border-b border-slate-200/80 dark:border-white/10 liquid-glass flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-nexus-500 to-cyan-500 text-white shadow-[0_0_12px_rgba(124,13,244,0.5)]">
              <Sparkles size={16} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <span>NEXUS DEV</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-500/15 dark:bg-cyan-400/20 text-cyan-700 dark:text-cyan-300 font-mono font-medium">
                  Copilote
                </span>
              </h3>
              <div className="flex items-center gap-1.5 text-[10px] text-cyan-600 dark:text-cyan-300 font-mono mt-0.5">
                <Cpu size={11} className="text-cyan-500 dark:text-cyan-400" />
                <span>{activeProvider?.name || 'Moteur IA'}</span>
                <span className="text-slate-400 dark:text-white/30">•</span>
                <span className="text-slate-500 dark:text-white/60 truncate max-w-[140px]">
                  {activeModel?.name || aiConfig.activeModelId}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-white/50 truncate max-w-[260px] mt-0.5">
                {file ? `Fichier : ${file.name}` : 'Aucun fichier sélectionné'}
              </p>
            </div>
          </div>

          <ModalCloseButton
            id="btn-close-nexus-dev-header"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            label="Fermer"
            title="Fermer l'assistant (Échap)"
          />
        </div>

      {/* Contenu principal défilable */}
      <div className="flex-1 overflow-y-auto scrollbar-thin p-5 space-y-5">
        {/* Chips de suggestions rapides */}
        <div>
          <span className="text-[11px] font-semibold text-slate-500 dark:text-white/50 uppercase tracking-wider block mb-2">
            Demandes rapides
          </span>
          <div className="flex flex-wrap gap-1.5">
            {QUICK_PROMPTS.map((quickText) => (
              <button
                key={quickText}
                type="button"
                onClick={() => handleSubmit(quickText)}
                disabled={isLoading || !file}
                className="px-3 py-1.5 rounded-xl liquid-glass-pill text-left text-xs text-slate-700 dark:text-white/80 hover:text-slate-900 dark:hover:text-white border border-slate-200/80 dark:border-white/10 hover:border-nexus-500/50 transition-all disabled:opacity-40 cursor-pointer shadow-xs"
              >
                {quickText}
              </button>
            ))}
          </div>
        </div>

        {/* Indicateur de chargement initial */}
        {isLoading && !streamingText && (
          <div className="p-6 rounded-2xl liquid-glass border border-nexus-500/20 flex flex-col items-center justify-center gap-3 text-center animate-in fade-in duration-150">
            <Spinner size="md" />
            <p className="text-xs text-nexus-600 dark:text-nexus-200 font-medium">Analyse et formulation par NEXUS DEV...</p>
            <p className="text-[10px] text-slate-500 dark:text-white/40">Examen du code source en cours</p>
          </div>
        )}

        {/* Streaming en direct de la réponse mot à mot */}
        {isLoading && Boolean(streamingText) && (
          <div className="p-4 rounded-2xl liquid-glass liquid-glass-card border border-cyan-500/30 text-xs text-slate-800 dark:text-white/90 leading-relaxed space-y-2 animate-in fade-in duration-150 shadow-[0_0_20px_rgba(6,182,212,0.15)]">
            <div className="flex items-center justify-between border-b border-cyan-500/20 pb-2">
              <span className="text-[11px] font-semibold text-cyan-600 dark:text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles size={13} className="text-cyan-400 animate-pulse" />
                Génération en direct...
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 animate-pulse">
                Streaming actif
              </span>
            </div>
            <div className="markdown-content text-xs text-slate-800 dark:text-white/90 leading-relaxed break-words">
              <div dangerouslySetInnerHTML={{ __html: formattedStreamingText }} />
              <span className="inline-block w-1.5 h-3.5 ml-1 bg-cyan-400 animate-pulse align-middle rounded-xs shadow-[0_0_8px_rgba(6,182,212,0.6)]" />
            </div>
          </div>
        )}

        {/* Message d'erreur */}
        {error && (
          <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-600 dark:text-red-300 text-xs">
            {error}
          </div>
        )}

        {/* Résultat de la proposition */}
        {currentProposal && !isLoading && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Badge démonstration */}
            {currentProposal.isMock && (
              <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-[11px] text-cyan-800 dark:text-cyan-200 flex items-start gap-2">
                <HelpCircle size={15} className="shrink-0 text-cyan-600 dark:text-cyan-400 mt-0.5" />
                <span>
                  <strong>Mode démonstration NEXUS DEV</strong> — connectez votre API LLM (backend proxy) pour activer l'analyse prédictive réelle.
                </span>
              </div>
            )}

            {/* Explication */}
            <div className="p-4 rounded-2xl liquid-glass liquid-glass-card border border-slate-200/80 dark:border-white/10 text-xs text-slate-800 dark:text-white/90 leading-relaxed space-y-2">
              <span className="text-[11px] font-semibold text-nexus-600 dark:text-nexus-300 uppercase tracking-wider block">
                Diagnostic & Analyse
              </span>
              <div
                className="markdown-content text-xs text-slate-800 dark:text-white/90 leading-relaxed break-words"
                dangerouslySetInnerHTML={{ __html: formattedExplanation }}
              />
            </div>

            {hasCodeChanges ? (
              <>
                {/* Extrait de code suggéré */}
                <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-900 dark:bg-[#070712] overflow-hidden">
                  <div className="px-3 py-1.5 bg-slate-800/90 dark:bg-surface-900 border-b border-white/8 flex items-center justify-between text-[11px] font-mono text-slate-300 dark:text-white/60">
                    <span>Code proposé</span>
                    <button
                      type="button"
                      onClick={handleCopy}
                      className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer"
                    >
                      {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                      <span>{copied ? 'Copié' : 'Copier'}</span>
                    </button>
                  </div>
                  <pre className="p-3 text-[11px] font-mono text-emerald-400 dark:text-emerald-300 overflow-x-auto max-h-48 whitespace-pre leading-relaxed">
                    {currentProposal.suggestedCode}
                  </pre>
                </div>

                {/* Bouton d'action pour examiner le diff et appliquer */}
                <button
                  type="button"
                  id="btn-review-diff"
                  onClick={() => onRequestDiff(currentProposal)}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-nexus-600 to-cyan-600 hover:from-nexus-500 hover:to-cyan-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(124,13,244,0.4)] transition-all cursor-pointer"
                >
                  <Eye size={14} />
                  <span>Examiner les modifications & Confirmer</span>
                </button>
              </>
            ) : (
              <div className="p-3 rounded-xl liquid-glass border border-slate-200/80 dark:border-white/8 text-[11px] text-slate-500 dark:text-white/60 text-center">
                Cette réponse est une analyse explicative sans modification requise sur le code.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Formulaire de saisie en bas de volet */}
      <div className="p-4 border-t border-slate-200/80 dark:border-white/10 liquid-glass shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
          className="relative"
        >
          <input
            type="text"
            id="input-nexus-dev-question"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Posez une question sur ce code..."
            disabled={isLoading || !file}
            className="w-full pl-3 pr-10 py-2.5 rounded-xl bg-white/90 dark:bg-black/50 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/30 focus:outline-none focus:border-nexus-500 transition-colors disabled:opacity-40 shadow-xs"
          />
          <button
            type="submit"
            disabled={!prompt.trim() || isLoading || !file}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-gradient-to-r from-nexus-600 to-cyan-600 text-white hover:from-nexus-500 hover:to-cyan-500 disabled:opacity-30 transition-all cursor-pointer shadow-sm"
            title="Envoyer la question"
          >
            <Send size={13} />
          </button>
        </form>
      </div>
    </aside>
  </>
  );
}
