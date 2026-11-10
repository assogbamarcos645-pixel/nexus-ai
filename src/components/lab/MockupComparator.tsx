/**
 * src/components/lab/MockupComparator.tsx
 *
 * Curseur Comparatif Avant / Après (« Inspect & Tweak ») pour NEXUS LAB.
 * Fournit une superposition interactive haute fidélité entre :
 * - AVANT : La capture d'écran d'origine soumise à Gemini 2.5
 * - APRÈS : Le code généré et compilé en direct dans le runtime in-browser
 *
 * Trois modes d'affichage :
 * 1. Curseur Glissière (Split Slider) avec poignée de glissement interactive
 * 2. Fondu de Superposition (Opacity Fade) pour l'alignement au pixel près
 * 3. Côte à Côte (Side-by-Side)
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  SlidersHorizontal,
  Columns2,
  Eye,
  Upload,
  Image as ImageIcon,
  Sparkles,
  RotateCcw,
  Maximize2,
} from 'lucide-react';
import type { MockupComparisonMode } from '@/types/lab';
import { ModalCloseButton } from '@/components/ui/ModalCloseButton';

interface MockupComparatorProps {
  mockupImage?: string;
  onUpdateMockupImage: (image: string | undefined) => void;
  deviceMode: 'desktop' | 'tablet' | 'mobile';
  onClose: () => void;
  children: React.ReactNode;
}

// Exemple de maquette SVG Haute Définition intégrée pour permettre de tester immédiatement
const DEMO_MOCKUP_IMAGE = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800" fill="%23070714">
  <rect width="1200" height="800" fill="%23070714"/>
  <rect x="0" y="0" width="1200" height="70" fill="%230f172a" stroke="%231e293b"/>
  <circle cx="45" cy="35" r="16" fill="%237c3aed"/>
  <text x="75" y="42" fill="%23ffffff" font-family="sans-serif" font-size="20" font-weight="bold">NEXUS CyberPulse</text>
  <rect x="980" y="18" width="180" height="36" rx="10" fill="%2306b6d4"/>
  <text x="1015" y="41" fill="%23ffffff" font-family="sans-serif" font-size="14" font-weight="bold">Connexion API</text>
  <rect x="60" y="110" width="340" height="180" rx="16" fill="%230f172a" stroke="%23334155"/>
  <text x="90" y="150" fill="%2394a3b8" font-family="sans-serif" font-size="14">Vitesse d’Exécution</text>
  <text x="90" y="210" fill="%2338bdf8" font-family="sans-serif" font-size="38" font-weight="bold">sub-seconde</text>
  <rect x="430" y="110" width="340" height="180" rx="16" fill="%230f172a" stroke="%23334155"/>
  <text x="460" y="150" fill="%2394a3b8" font-family="sans-serif" font-size="14">Précision Multimodale</text>
  <text x="460" y="210" fill="%23a855f7" font-family="sans-serif" font-size="38" font-weight="bold">99.8%</text>
  <rect x="800" y="110" width="340" height="180" rx="16" fill="%230f172a" stroke="%23334155"/>
  <text x="830" y="150" fill="%2394a3b8" font-family="sans-serif" font-size="14">Runtime Live</text>
  <text x="830" y="210" fill="%2334d399" font-family="sans-serif" font-size="38" font-weight="bold">Actif • Vite</text>
  <rect x="60" y="320" width="1080" height="420" rx="20" fill="%230f172a" stroke="%231e293b"/>
  <text x="100" y="380" fill="%23ffffff" font-family="sans-serif" font-size="22" font-weight="bold">Aperçu Visuel de Référence (Maquette d’origine)</text>
  <text x="100" y="420" fill="%2394a3b8" font-family="sans-serif" font-size="16">Faites glisser le curseur pour comparer chaque composant au pixel près.</text>
</svg>`;

export function MockupComparator({
  mockupImage,
  onUpdateMockupImage,
  deviceMode,
  onClose,
  children,
}: MockupComparatorProps) {
  const [mode, setMode] = useState<MockupComparisonMode>('split');
  const [sliderPos, setSliderPos] = useState(50); // Pourcentage 0% à 100%
  const [fadeOpacity, setFadeOpacity] = useState(50); // Pourcentage d'opacité
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Gestion du glissement de la poignée de comparaison
  const updateSliderFromEvent = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    if (rect.width === 0) return;
    const offsetX = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (offsetX / rect.width) * 100));
    setSliderPos(Math.round(percentage));
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    updateSliderFromEvent(e.clientX);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      e.preventDefault();
      updateSliderFromEvent(e.clientX);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, updateSliderFromEvent]);

  // Importation de fichier image local
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onUpdateMockupImage(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="w-full h-full flex flex-col bg-slate-900/90 select-none overflow-hidden relative">
      {/* 1. Barre d'outils supérieure du comparateur */}
      <div className="h-11 px-2.5 sm:px-3 bg-slate-950/90 border-b border-white/10 flex items-center justify-between gap-2 shrink-0 z-30 overflow-hidden">
        <div className="flex items-center gap-1.5 min-w-0 shrink">
          <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-nexus-600/20 border border-nexus-500/30 text-nexus-300 text-xs font-semibold shrink-0">
            <SlidersHorizontal size={12} className="text-nexus-400" />
            <span className="hidden xl:inline">Comparatif</span>
          </span>

          {/* Sélecteur de mode (Split / Fondu / Côte-à-côte) */}
          <div className="flex items-center bg-white/5 p-0.5 rounded-lg border border-white/10 text-[11px] shrink-0">
            <button
              type="button"
              onClick={() => setMode('split')}
              className={`flex items-center gap-1 px-2 py-0.5 rounded transition-all cursor-pointer ${
                mode === 'split' ? 'bg-nexus-600 text-white font-medium shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
              title="Glissière séparatrice Avant / Après"
            >
              <Columns2 size={11} />
              <span className="hidden 2xl:inline">Glissière</span>
            </button>
            <button
              type="button"
              onClick={() => setMode('fade')}
              className={`flex items-center gap-1 px-2 py-0.5 rounded transition-all cursor-pointer ${
                mode === 'fade' ? 'bg-nexus-600 text-white font-medium shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
              title="Fondu de superposition (Transparence)"
            >
              <Eye size={11} />
              <span className="hidden 2xl:inline">Fondu</span>
            </button>
            <button
              type="button"
              onClick={() => setMode('side-by-side')}
              className={`flex items-center gap-1 px-2 py-0.5 rounded transition-all cursor-pointer ${
                mode === 'side-by-side' ? 'bg-nexus-600 text-white font-medium shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
              title="Affichage côte à côte"
            >
              <Maximize2 size={11} />
              <span className="hidden 2xl:inline">Côte à côte</span>
            </button>
          </div>
        </div>

        {/* Contrôles du curseur (Pourcentage ou Opacité) */}
        <div className="flex items-center gap-2 shrink-0">
          {mode === 'split' && (
            <div className="flex items-center gap-1.5 text-xs shrink-0">
              <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
                {sliderPos}% Code
              </span>
              <input
                type="range"
                min="0"
                max="100"
                value={sliderPos}
                onChange={(e) => setSliderPos(Number(e.target.value))}
                className="w-16 sm:w-24 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-nexus-500"
                aria-label="Position du curseur comparatif"
              />
              <div className="hidden lg:flex items-center gap-1">
                {[25, 50, 75].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => setSliderPos(pct)}
                    className={`px-1 py-0.5 rounded text-[10px] font-mono cursor-pointer transition-colors ${
                      sliderPos === pct ? 'bg-nexus-500/30 text-cyan-300 font-bold' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {pct}%
                  </button>
                ))}
              </div>
            </div>
          )}

          {mode === 'fade' && (
            <div className="flex items-center gap-1.5 text-xs shrink-0">
              <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
                Opacité {fadeOpacity}%
              </span>
              <input
                type="range"
                min="0"
                max="100"
                value={fadeOpacity}
                onChange={(e) => setFadeOpacity(Number(e.target.value))}
                className="w-20 sm:w-28 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-nexus-500"
                aria-label="Opacité de la maquette"
              />
            </div>
          )}

          {/* Bouton Importation ou Remplacement de la maquette */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white text-xs transition-colors cursor-pointer shrink-0"
            title="Importer une capture d'écran"
          >
            <Upload size={12} />
            <span className="hidden xl:inline">Changer l'image</span>
          </button>

          {mockupImage && (
            <button
              type="button"
              onClick={() => onUpdateMockupImage(undefined)}
              className="p-1 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer shrink-0"
              title="Retirer la maquette de référence"
            >
              <RotateCcw size={13} />
            </button>
          )}

          <ModalCloseButton
            onClick={onClose}
            label="Fermer"
            title="Fermer le comparatif (Échap)"
            compact
          />
        </div>
      </div>

      {/* 2. Zone interactive de comparaison */}
      {!mockupImage ? (
        /* État vide si aucune maquette n'est encore attachée au projet */
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-slate-300">
          <div className="w-14 h-14 rounded-2xl bg-nexus-600/20 border border-nexus-500/30 flex items-center justify-center mb-4 text-nexus-400 shadow-[0_0_30px_rgba(124,13,244,0.3)]">
            <ImageIcon size={26} />
          </div>
          <h3 className="text-base font-bold text-white mb-2">
            Superposition Comparative Avant / Après
          </h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto mb-6 leading-relaxed">
            Pour vérifier au pixel près la conformité visuelle entre votre maquette initiale et le code généré par Gemini 2.5, importez la capture d'écran d'origine ou testez avec notre maquette d'exemple.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-nexus-600 hover:bg-nexus-500 text-white text-xs font-semibold shadow-[0_0_20px_rgba(124,13,244,0.4)] transition-all cursor-pointer"
            >
              <Upload size={14} />
              <span>Importer votre capture d'écran</span>
            </button>
            <button
              type="button"
              onClick={() => onUpdateMockupImage(DEMO_MOCKUP_IMAGE)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-cyan-300 text-xs font-semibold transition-all cursor-pointer"
            >
              <Sparkles size={14} className="text-cyan-400" />
              <span>Charger une maquette d'exemple</span>
            </button>
          </div>
        </div>
      ) : (
        /* Conteneur principal de la vue comparative */
        <div className="flex-1 relative overflow-hidden flex items-center justify-center p-2 sm:p-4 bg-black/60">
          <div
            ref={containerRef}
            className={`relative w-full h-full bg-[#070712] overflow-hidden shadow-2xl transition-all duration-300 ${
              deviceMode === 'tablet'
                ? 'max-w-[768px] max-h-[1024px] rounded-2xl border-2 border-slate-800'
                : deviceMode === 'mobile'
                ? 'max-w-[375px] max-h-[667px] rounded-3xl border-4 border-slate-800'
                : 'max-w-full rounded-none'
            }`}
          >
            {/* Mode 1 : Curseur Glissière (Split Slider) */}
            {mode === 'split' && (
              <div className="relative w-full h-full overflow-hidden select-none">
                {/* Couche Arrière : Maquette d'origine (AVANT) */}
                <div className="absolute inset-0 w-full h-full overflow-hidden bg-slate-950 flex items-start justify-center">
                  <img
                    src={mockupImage}
                    alt="Maquette de référence Avant"
                    className="w-full h-full object-contain pointer-events-none"
                  />
                  {/* Badge Flottant Gauche */}
                  <div className="absolute bottom-3 left-3 z-20 flex items-center gap-1 px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-md border border-purple-500/40 text-[9px] font-semibold text-purple-300 shadow-md pointer-events-none">
                    <span>AVANT</span>
                  </div>
                </div>

                {/* Couche Avant : Code Généré en direct (APRÈS), découpé selon le pourcentage */}
                <div
                  className="absolute inset-0 w-full h-full overflow-hidden bg-white dark:bg-[#070712]"
                  style={{
                    clipPath: `polygon(${sliderPos}% 0%, 100% 0%, 100% 100%, ${sliderPos}% 100%)`,
                  }}
                >
                  {children}
                  {/* Badge Flottant Droit */}
                  <div className="absolute bottom-3 right-3 z-20 flex items-center gap-1 px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-md border border-cyan-500/40 text-[9px] font-semibold text-cyan-300 shadow-md pointer-events-none">
                    <span>APRÈS</span>
                  </div>
                </div>

                {/* Poignée séparatrice verticale déplaçable */}
                <div
                  className="absolute top-0 bottom-0 z-30 flex items-center justify-center cursor-ew-resize group"
                  style={{ left: `${sliderPos}%`, transform: 'translateX(-50%)' }}
                  onMouseDown={handleMouseDown}
                >
                  {/* Ligne verticale */}
                  <div className="w-0.5 h-full bg-gradient-to-b from-cyan-400 via-white to-purple-500 shadow-[0_0_12px_rgba(255,255,255,0.8)]" />

                  {/* Poignée centrale */}
                  <div className="absolute w-8 h-8 rounded-full bg-[#090918] border-2 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.8)] flex items-center justify-center text-white text-[11px] font-bold group-hover:scale-110 transition-transform">
                    <span className="text-[10px] tracking-tighter">◀▶</span>
                  </div>

                  {/* Bulle indicateur du pourcentage */}
                  <div className="absolute -bottom-1 whitespace-nowrap px-2 py-0.5 rounded bg-black/80 border border-white/20 text-[9px] font-mono text-cyan-300">
                    {sliderPos}%
                  </div>
                </div>
              </div>
            )}

            {/* Mode 2 : Fondu de Transparence (Opacity Fade Overlay) */}
            {mode === 'fade' && (
              <div className="relative w-full h-full overflow-hidden">
                {/* Couche inférieure : Code généré (100% interactif) */}
                <div className="absolute inset-0 w-full h-full">
                  {children}
                </div>

                {/* Couche supérieure : Maquette d'origine en superposition transparente */}
                <div
                  className="absolute inset-0 w-full h-full pointer-events-none flex items-start justify-center transition-opacity duration-150"
                  style={{ opacity: fadeOpacity / 100 }}
                >
                  <img
                    src={mockupImage}
                    alt="Maquette de référence en superposition"
                    className="w-full h-full object-contain"
                  />
                </div>

                {/* Badges d'état */}
                <div className="absolute bottom-3 left-3 z-20 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/80 backdrop-blur-md border border-white/15 text-[11px] text-white">
                  <span className="text-slate-400">Superposition :</span>
                  <span className="font-mono text-cyan-300 font-bold">{fadeOpacity}%</span>
                  <span className="text-slate-500 text-[10px]">(0% = Code seul • 100% = Maquette seule)</span>
                </div>
              </div>
            )}

            {/* Mode 3 : Côte à Côte (Side-by-Side) */}
            {mode === 'side-by-side' && (
              <div className="w-full h-full flex flex-col md:flex-row overflow-hidden">
                {/* Volet Gauche : Maquette d'origine */}
                <div className="flex-1 h-1/2 md:h-full relative border-b md:border-b-0 md:border-r border-white/10 bg-slate-950 flex flex-col">
                  <div className="p-2 bg-slate-950/80 border-b border-white/10 text-[11px] font-semibold text-purple-300 flex items-center justify-between">
                    <span>AVANT (Maquette d'origine)</span>
                    <span className="text-[10px] text-slate-500">Référence</span>
                  </div>
                  <div className="flex-1 flex items-center justify-center p-2 overflow-auto">
                    <img
                      src={mockupImage}
                      alt="Maquette d'origine"
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                </div>

                {/* Volet Droit : Code interactif */}
                <div className="flex-1 h-1/2 md:h-full relative flex flex-col bg-white dark:bg-[#070712]">
                  <div className="p-2 bg-slate-950/80 border-b border-white/10 text-[11px] font-semibold text-cyan-300 flex items-center justify-between">
                    <span>APRÈS (Code Live)</span>
                    <span className="text-[10px] text-emerald-400 font-medium">Interactif</span>
                  </div>
                  <div className="flex-1 relative overflow-hidden">
                    {children}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
