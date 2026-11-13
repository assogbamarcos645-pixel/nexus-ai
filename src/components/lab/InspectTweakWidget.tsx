/**
 * src/components/lab/InspectTweakWidget.tsx
 *
 * Widget flottant d'itération directe « Inspect & Tweak » (Mode Clic-to-Edit).
 * Permet de sélectionner n'importe quel bouton ou composant sur l'aperçu généré
 * par Gemini 2.5 et de lui demander une retouche ciblée instantanée.
 */

import { useState } from 'react';
import {
  Sparkles,
  Wand2,
  Sliders,
  Check,
  Code,
  Layers,
  Palette,
  Maximize2,
  CircleDot,
} from 'lucide-react';
import type { InspectedElementInfo } from '@/types/lab';
import { Spinner } from '@/components/ui/Spinner';
import { ModalCloseButton } from '@/components/ui/ModalCloseButton';

interface InspectTweakWidgetProps {
  element: InspectedElementInfo;
  onClose: () => void;
  onSubmitTweak: (prompt: string) => Promise<void>;
  onApplyInlineStyle?: (styles: Record<string, string>) => void;
  isLoading: boolean;
}

const QUICK_TWEAKS = [
  { label: 'Dégradé Néon Violet', prompt: 'Transformer ce composant avec un dégradé violet néon et une lueur dynamique' },
  { label: 'Bords Ronds (Pill)', prompt: 'Arrondir complètement les angles en format pilule avec un padding équilibré' },
  { label: 'Glassmorphism', prompt: 'Appliquer un style glassmorphism translucide avec flou d’arrière-plan et bordure fine' },
  { label: 'Agrandir & Espacer', prompt: 'Agrandir la taille du bouton et ajouter des marges internes confortables' },
  { label: 'Micro-interaction Hover', prompt: 'Ajouter une transition fluide et un effet de scale subtil au survol' },
];

const COLOR_PRESETS = [
  { name: 'Cosmic Violet', bg: 'linear-gradient(135deg, #7c3aed, #4f46e5)', text: '#ffffff' },
  { name: 'Cyber Cyan', bg: 'linear-gradient(135deg, #06b6d4, #3b82f6)', text: '#ffffff' },
  { name: 'Emerald Neon', bg: 'linear-gradient(135deg, #10b981, #059669)', text: '#ffffff' },
  { name: 'Rose Neon', bg: 'linear-gradient(135deg, #f43f5e, #e11d48)', text: '#ffffff' },
  { name: 'Glass Sombre', bg: 'rgba(15, 23, 42, 0.75)', text: '#38bdf8' },
];

export function InspectTweakWidget({
  element,
  onClose,
  onSubmitTweak,
  onApplyInlineStyle,
  isLoading,
}: InspectTweakWidgetProps) {
  const [prompt, setPrompt] = useState('');
  const [activeTab, setActiveTab] = useState<'ai' | 'direct'>('ai');
  const [appliedQuickSuccess, setAppliedQuickSuccess] = useState(false);

  const tagLower = element.tagName.toLowerCase();
  const displayClass = element.className
    ? element.className.trim().split(/\s+/).slice(0, 3).join(' ')
    : '';

  const handleSend = async (customPrompt?: string) => {
    const textToSend = (customPrompt || prompt).trim();
    if (!textToSend || isLoading) return;
    await onSubmitTweak(textToSend);
    setPrompt('');
    setAppliedQuickSuccess(true);
    setTimeout(() => setAppliedQuickSuccess(false), 2000);
  };

  const handleApplyColorPreset = (preset: typeof COLOR_PRESETS[0]) => {
    if (onApplyInlineStyle) {
      onApplyInlineStyle({
        background: preset.bg,
        color: preset.text,
        borderColor: 'rgba(255, 255, 255, 0.2)',
      });
    }
    // Alimenter également le prompt pour ancrer la modification dans le code source
    setPrompt(`Changer le style de couleur vers un thème ${preset.name} (${preset.bg})`);
  };

  const handleApplyBorderRadius = (radius: string) => {
    if (onApplyInlineStyle) {
      onApplyInlineStyle({ borderRadius: radius });
    }
    setPrompt(`Ajuster le rayon de bordure (border-radius) à ${radius}`);
  };

  const handleApplyPadding = (padding: string) => {
    if (onApplyInlineStyle) {
      onApplyInlineStyle({ padding });
    }
    setPrompt(`Modifier le padding interne à ${padding}`);
  };

  return (
    <div
      id="nexus-inspect-tweak-widget"
      className="absolute bottom-2 left-2 right-2 sm:left-4 sm:right-4 md:left-6 md:right-6 max-w-2xl mx-auto z-40 bg-[#090918]/95 backdrop-blur-xl border border-purple-500/30 rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.7)] text-white overflow-hidden animate-in fade-in slide-in-from-bottom-3 duration-200"
    >
      {/* Barre supérieure du composant sélectionné */}
      <div className="px-3 py-2 bg-purple-950/40 border-b border-purple-500/20 flex items-center justify-between gap-2 overflow-hidden">
        <div className="flex items-center gap-1.5 min-w-0 shrink">
          <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-purple-500/20 border border-purple-400/40 text-[11px] font-mono font-bold text-purple-300 shrink-0">
            <CircleDot size={9} className="text-purple-400 animate-pulse" />
            &lt;{tagLower}&gt;
          </span>

          {element.id && (
            <span className="text-[11px] font-mono text-cyan-400 shrink-0 truncate max-w-[80px]">
              #{element.id}
            </span>
          )}

          {displayClass && (
            <span className="text-[10px] font-mono text-slate-400 truncate max-w-[120px] hidden md:inline" title={element.className}>
              .{displayClass}
            </span>
          )}

          {element.textContent && (
            <span className="text-[10px] text-slate-300 italic truncate max-w-[100px] sm:max-w-[160px] hidden sm:inline">
              « {element.textContent} »
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {/* Bascule Onglet IA / Direct */}
          <div className="flex items-center bg-black/40 p-0.5 rounded-lg border border-white/10 text-[10px] shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab('ai')}
              className={`flex items-center gap-1 px-2 py-0.5 rounded transition-all cursor-pointer ${
                activeTab === 'ai'
                  ? 'bg-purple-600 text-white font-medium shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sparkles size={10} />
              <span>Gemini 2.5</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('direct')}
              className={`flex items-center gap-1 px-2 py-0.5 rounded transition-all cursor-pointer ${
                activeTab === 'direct'
                  ? 'bg-purple-600 text-white font-medium shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sliders size={10} />
              <span className="hidden sm:inline">Direct</span>
            </button>
          </div>

          <ModalCloseButton
            onClick={onClose}
            label="Fermer"
            title="Désélectionner et fermer (Échap)"
            compact
          />
        </div>
      </div>

      {/* Corps du widget */}
      <div className="p-3 sm:p-4 space-y-3">
        {activeTab === 'ai' ? (
          <>
            {/* Suggestions rapides de retouche */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[11px]">
              <span className="text-[10px] text-purple-300 font-semibold uppercase tracking-wider shrink-0 flex items-center gap-1">
                <Wand2 size={11} /> Suggestions :
              </span>
              {QUICK_TWEAKS.map((qt) => (
                <button
                  key={qt.label}
                  type="button"
                  onClick={() => handleSend(qt.prompt)}
                  disabled={isLoading}
                  className="px-2.5 py-1 rounded-full bg-white/5 hover:bg-purple-500/20 border border-white/10 hover:border-purple-400/40 text-slate-300 hover:text-purple-200 transition-all shrink-0 cursor-pointer disabled:opacity-50 text-[11px]"
                >
                  {qt.label}
                </button>
              ))}
            </div>

            {/* Formulaire de prompt ciblé */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder={`Décrivez la retouche pour cet élément <${tagLower}> (ex: bouton violet dégradé avec ombre portée)...`}
                  disabled={isLoading}
                  className="w-full pl-3 pr-20 py-2 rounded-xl bg-black/60 border border-white/10 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 text-[16px] sm:text-xs text-white placeholder-slate-500 transition-all"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-500 hidden sm:inline">
                  Entrée ↵
                </span>
              </div>

              <button
                type="button"
                onClick={() => handleSend()}
                disabled={!prompt.trim() || isLoading}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-[0_0_15px_rgba(168,85,247,0.4)] disabled:opacity-40 transition-all cursor-pointer shrink-0"
              >
                {isLoading ? (
                  <>
                    <Spinner size="sm" />
                    <span className="hidden sm:inline">Retouche...</span>
                  </>
                ) : appliedQuickSuccess ? (
                  <>
                    <Check size={13} className="text-emerald-300" />
                    <span>Appliqué !</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={13} />
                    <span>Retoucher avec l'IA</span>
                  </>
                )}
              </button>
            </div>
          </>
        ) : (
          /* Onglet Direct Tweak : micro-ajustements visuels instantanés */
          <div className="space-y-2.5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              {/* Nuancier rapide */}
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                  <Palette size={11} /> Thème de couleur :
                </span>
                <div className="flex items-center gap-1.5">
                  {COLOR_PRESETS.map((cp) => (
                    <button
                      key={cp.name}
                      type="button"
                      onClick={() => handleApplyColorPreset(cp)}
                      style={{ background: cp.bg }}
                      className="w-6 h-6 rounded-lg border border-white/20 hover:scale-110 transition-transform cursor-pointer shadow-xs"
                      title={cp.name}
                      aria-label={cp.name}
                    />
                  ))}
                </div>
              </div>

              {/* Arrondi des coins */}
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                  <Maximize2 size={11} /> Arrondi des angles :
                </span>
                <div className="flex items-center gap-1 text-[10px]">
                  <button
                    type="button"
                    onClick={() => handleApplyBorderRadius('4px')}
                    className="px-2 py-1 rounded bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 cursor-pointer"
                  >
                    Léger (4px)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyBorderRadius('12px')}
                    className="px-2 py-1 rounded bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 cursor-pointer"
                  >
                    Moyen (12px)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyBorderRadius('9999px')}
                    className="px-2 py-1 rounded-full bg-purple-500/20 hover:bg-purple-500/30 border border-purple-400/30 text-purple-200 cursor-pointer"
                  >
                    Pill (Rond)
                  </button>
                </div>
              </div>

              {/* Espacements & Padding */}
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                  <Layers size={11} /> Padding interne :
                </span>
                <div className="flex items-center gap-1 text-[10px]">
                  <button
                    type="button"
                    onClick={() => handleApplyPadding('6px 12px')}
                    className="px-2 py-1 rounded bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 cursor-pointer"
                  >
                    Compact
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPadding('12px 24px')}
                    className="px-2 py-1 rounded bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 cursor-pointer"
                  >
                    Normal
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPadding('18px 36px')}
                    className="px-2 py-1 rounded bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 cursor-pointer"
                  >
                    Aéré
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={() => handleSend()}
                disabled={!prompt.trim() || isLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-[11px] font-semibold transition-all cursor-pointer disabled:opacity-40"
              >
                <Code size={12} />
                <span>Enregistrer ces styles dans le code source</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
