/**
 * src/components/ui/NexusMark.tsx
 *
 * Monogramme Officiel de NEXUS AI — « The Quantum X » (Édition Pure Lumière — Zéro Noir).
 * - Conception 100% lumineuse : AUCUNE COULEUR NOIRE NI SOMBRE.
 * - Le « X » de NE[X]US : L'intersection ultime de la donnée, du code et de l'intelligence.
 * - Parfaite adéquation avec la charte graphique de NEXUS AI :
 *   • Bleu Cobalt NEXUS Lumineux (#2563eb / #1d4ed8 / #3b82f6)
 *   • Cyan Électrique & Laser Photonique (#38bdf8 / #00f0ff)
 *   • Chrome & Platine Pur Spéculaire (#ffffff / #f0f9ff / #bae6fd)
 *   • Boîtier en Verre Liquide (Liquid Glass) teinté azur et biseauté CNC
 * - Double lame diagonale monolithique avec lit réfléchissant cobalt royal
 * - Aperture centrale de collimation optique & singularité laser (50, 50)
 * - 4 plots de contact électro-optique & repères de lithographie ASML en cyan pur
 * - Lisibilité absolue et éclat rétina de 16px à 1024px sur fonds clairs et sombres
 */

import { useId, memo } from 'react';
import { cn } from '@/utils/cn';

export interface NexusMarkProps {
  className?: string;
  /** Accentuation / pulsation active (ex. génération ou inférence IA en cours) */
  pulse?: boolean;
  /** Afficher le boîtier squircle en verre liquide lumineux (défaut: true) */
  badge?: boolean;
}

function NexusMarkComponent({ className, pulse = false, badge = true }: NexusMarkProps) {
  const uid = useId().replace(/:/g, '');

  const idWaferBody = `nx-body-${uid}`;
  const idWaferBevel = `nx-bev-${uid}`;
  const idPlatinumBlade = `nx-blade-${uid}`;
  const idBladeEdge = `nx-edge-${uid}`;
  const idBedCobalt = `nx-bed-${uid}`;
  const idLaserNwSe = `nx-las1-${uid}`;
  const idLaserNeSw = `nx-las2-${uid}`;
  const idSingularityGlow = `nx-sing-${uid}`;
  const idQuantumGlow = `nx-glow-${uid}`;
  const idPhotonGlow = `nx-phot-${uid}`;
  const idChassisGlow = `nx-drop-${uid}`;

  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('shrink-0 select-none overflow-visible', pulse && 'animate-nexus-pulse', className)}
      role="img"
      aria-label="Logo Monogramme NEXUS AI — The Quantum X (Pure Lumière)"
    >
      <defs>
        <style>{`
          @keyframes nx-laser-pulse-${uid} {
            0%, 100% {
              opacity: 0.94;
              filter: drop-shadow(0 0 4px #00f0ff);
            }
            50% {
              opacity: 1;
              filter: drop-shadow(0 0 10px #38bdf8);
            }
          }
          @keyframes nx-core-sparkle-${uid} {
            0%, 100% {
              transform: scale(0.96);
              opacity: 0.95;
            }
            50% {
              transform: scale(1.15);
              opacity: 1;
            }
          }
          .nx-laser-stream-${uid} {
            animation: nx-laser-pulse-${uid} 3.2s ease-in-out infinite;
          }
          .nx-sparkle-${uid} {
            transform-origin: 50px 50px;
            animation: nx-core-sparkle-${uid} 2.6s ease-in-out infinite;
          }
        `}</style>

        {/* 1. Dégradé Boîtier Liquid Glass Lumineux (Zéro Noir : Azur / Cobalt Translucide) */}
        <linearGradient id={idWaferBody} x1="10" y1="10" x2="90" y2="90" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.16" />
          <stop offset="45%" stopColor="#2563eb" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#1d4ed8" stopOpacity="0.22" />
        </linearGradient>

        {/* 2. Biseau CNC Usiné à 45° : Reflet Chrome Spéculaire & Cyan NEXUS */}
        <linearGradient id={idWaferBevel} x1="5" y1="5" x2="95" y2="95" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
          <stop offset="35%" stopColor="#38bdf8" stopOpacity="0.75" />
          <stop offset="70%" stopColor="#2563eb" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#60a5fa" stopOpacity="0.3" />
        </linearGradient>

        {/* 3. Lames en Chrome & Platine Pur Spéculaire (Zéro Ombre Sombre) */}
        <linearGradient id={idPlatinumBlade} x1="0" y1="0" x2="1" y2="1" gradientUnits="objectBoundingBox">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="25%" stopColor="#f0f9ff" />
          <stop offset="60%" stopColor="#bae6fd" />
          <stop offset="100%" stopColor="#60a5fa" />
        </linearGradient>

        {/* 4. Biseau Métallique Spéculaire Haute Définition */}
        <linearGradient id={idBladeEdge} x1="0" y1="0" x2="1" y2="0" gradientUnits="objectBoundingBox">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="40%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#2563eb" />
        </linearGradient>

        {/* 5. Lit Réfléchissant sous les Lames (Bleu Cobalt Royal au lieu de noir) */}
        <linearGradient id={idBedCobalt} x1="0" y1="0" x2="0" y2="1" gradientUnits="objectBoundingBox">
          <stop offset="0%" stopColor="#1d4ed8" stopOpacity="0.65" />
          <stop offset="100%" stopColor="#1e40af" stopOpacity="0.85" />
        </linearGradient>

        {/* 6. Guides d'Onde Laser (Charte NEXUS : Cyan #00f0ff vers Cobalt #2563eb) */}
        <linearGradient id={idLaserNwSe} x1="24" y1="22" x2="76" y2="78" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#00f0ff" />
          <stop offset="30%" stopColor="#38bdf8" />
          <stop offset="70%" stopColor="#2563eb" />
          <stop offset="100%" stopColor="#1d4ed8" />
        </linearGradient>

        <linearGradient id={idLaserNeSw} x1="76" y1="22" x2="24" y2="78" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="35%" stopColor="#00f0ff" />
          <stop offset="70%" stopColor="#2563eb" />
          <stop offset="100%" stopColor="#3b82f6" />
        </linearGradient>

        {/* 7. Cœur Photonique de Singularité Radiale (Centre 50, 50) */}
        <radialGradient id={idSingularityGlow} cx="50" cy="50" r="16" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="25%" stopColor="#00f0ff" stopOpacity="0.95" />
          <stop offset="55%" stopColor="#38bdf8" stopOpacity="0.75" />
          <stop offset="80%" stopColor="#2563eb" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#1d4ed8" stopOpacity="0" />
        </radialGradient>

        {/* 8. Filtre Lueur Photonique Cobalt/Cyan (Zéro Noir) */}
        <filter id={idPhotonGlow} x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="2" stdDeviation="3.5" floodColor="#2563eb" floodOpacity="0.45" />
        </filter>

        {/* 9. Filtre Lueur Laser Cohérente Hyper-Lumineuse */}
        <filter id={idQuantumGlow} x="-45%" y="-45%" width="190%" height="190%">
          <feGaussianBlur stdDeviation="2.2" result="blur1" />
          <feGaussianBlur stdDeviation="6" result="blur2" />
          <feMerge>
            <feMergeNode in="blur2" />
            <feMergeNode in="blur1" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* 10. Aura de Lévitation Lumineuse (Zéro Noir : Glow Cobalt) */}
        <filter id={idChassisGlow} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#2563eb" floodOpacity="0.35" />
        </filter>
      </defs>

      {/* 1. Châssis Squircle en Verre Liquide Lumineux (Liquid Glass) */}
      {badge && (
        <g filter={`url(#${idChassisGlow})`}>
          {/* Base translucide brillante */}
          <rect
            x="5"
            y="5"
            width="90"
            height="90"
            rx="22"
            fill={`url(#${idWaferBody})`}
          />
          {/* Chanfrein périmétrique chromé biseauté à 45° */}
          <rect
            x="5"
            y="5"
            width="90"
            height="90"
            rx="22"
            stroke={`url(#${idWaferBevel})`}
            strokeWidth="1.6"
          />
          {/* Réticule optique interne en Cyan Lumineux (#38bdf8) */}
          <line x1="16" y1="5" x2="16" y2="95" stroke="#38bdf8" strokeWidth="0.6" strokeOpacity="0.25" />
          <line x1="84" y1="5" x2="84" y2="95" stroke="#38bdf8" strokeWidth="0.6" strokeOpacity="0.25" />
          <line x1="5" y1="16" x2="95" y2="16" stroke="#38bdf8" strokeWidth="0.6" strokeOpacity="0.25" />
          <line x1="5" y1="84" x2="95" y2="84" stroke="#38bdf8" strokeWidth="0.6" strokeOpacity="0.25" />
        </g>
      )}

      {/* 2. Les Deux Lames Diagonales du « X » en Chrome Spéculaire & Cobalt */}
      <g filter={`url(#${idPhotonGlow})`}>
        {/* Lit réfléchissant Diagonale 1 (NW -> SE) */}
        <polygon
          points="23,20 32,20 77,80 68,80"
          fill={`url(#${idBedCobalt})`}
        />
        {/* Lame en Chrome & Platine Pur 1 */}
        <polygon
          points="23.5,20.5 31.5,20.5 76.5,79.5 68.5,79.5"
          fill={`url(#${idPlatinumBlade})`}
          stroke={`url(#${idBladeEdge})`}
          strokeWidth="0.8"
        />

        {/* Lit réfléchissant Diagonale 2 (NE -> SW) */}
        <polygon
          points="77,20 68,20 23,80 32,80"
          fill={`url(#${idBedCobalt})`}
        />
        {/* Lame en Chrome & Platine Pur 2 */}
        <polygon
          points="76.5,20.5 68.5,20.5 23.5,79.5 31.5,79.5"
          fill={`url(#${idPlatinumBlade})`}
          stroke={`url(#${idBladeEdge})`}
          strokeWidth="0.8"
        />
      </g>

      {/* 3. Guides d'Onde Laser Photoniques (Faisceaux Lumineux Purs) */}
      <g filter={`url(#${idQuantumGlow})`} className={`nx-laser-stream-${uid}`}>
        {/* Faisceau laser Diagonale 1 (NW -> SE) */}
        <line
          x1="27.5"
          y1="20"
          x2="72.5"
          y2="80"
          stroke={`url(#${idLaserNwSe})`}
          strokeWidth="2.8"
          strokeLinecap="round"
        />
        {/* Cœur photonique blanc pur incandescent */}
        <line
          x1="27.5"
          y1="20"
          x2="72.5"
          y2="80"
          stroke="#ffffff"
          strokeWidth="1.1"
          strokeLinecap="round"
          strokeOpacity="1"
        />

        {/* Faisceau laser Diagonale 2 (NE -> SW) */}
        <line
          x1="72.5"
          y1="20"
          x2="27.5"
          y2="80"
          stroke={`url(#${idLaserNeSw})`}
          strokeWidth="2.8"
          strokeLinecap="round"
        />
        {/* Cœur photonique blanc pur incandescent */}
        <line
          x1="72.5"
          y1="20"
          x2="27.5"
          y2="80"
          stroke="#ffffff"
          strokeWidth="1.1"
          strokeLinecap="round"
          strokeOpacity="1"
        />
      </g>

      {/* 4. L'Aperture de Singularité Centrale : L'Intersection du Nexus (50, 50) */}
      <g filter={`url(#${idQuantumGlow})`} className={`nx-sparkle-${uid}`}>
        {/* Halo radial d'énergie quantique pure */}
        <circle cx="50" cy="50" r="16" fill={`url(#${idSingularityGlow})`} />

        {/* Bague de collimation optique en chrome poli */}
        <circle cx="50" cy="50" r="7.5" fill="#1d4ed8" stroke="#ffffff" strokeWidth="1.2" />
        <circle cx="50" cy="50" r="5" fill={`url(#${idLaserNwSe})`} />

        {/* Point laser focal de singularité quantique blanche */}
        <circle cx="50" cy="50" r="2.5" fill="#ffffff" />
        <circle cx="50" cy="50" r="1.2" fill="#00f0ff" />
      </g>

      {/* 5. Plots de Contact Électro-optique aux 4 Extrémités du X */}
      <g strokeLinecap="round" strokeWidth="1.4">
        {/* Nord-Ouest */}
        <line x1="25" y1="23" x2="30" y2="23" stroke="#00f0ff" />
        {/* Nord-Est */}
        <line x1="70" y1="23" x2="75" y2="23" stroke="#38bdf8" />
        {/* Sud-Ouest */}
        <line x1="25" y1="77" x2="30" y2="77" stroke="#38bdf8" />
        {/* Sud-Est */}
        <line x1="70" y1="77" x2="75" y2="77" stroke="#2563eb" />
      </g>

      {/* 6. Repères Lithographiques ASML en Cyan Vif (#00f0ff & #38bdf8) */}
      <g stroke="#00f0ff" strokeWidth="0.9" strokeLinecap="round" strokeOpacity="0.8">
        {/* Coin Haut-Gauche */}
        <line x1="12" y1="14" x2="16" y2="14" />
        <line x1="14" y1="12" x2="14" y2="16" />
        {/* Coin Haut-Droit */}
        <line x1="84" y1="14" x2="88" y2="14" />
        <line x1="86" y1="12" x2="86" y2="16" />
        {/* Coin Bas-Gauche */}
        <line x1="12" y1="86" x2="16" y2="86" />
        <line x1="14" y1="84" x2="14" y2="88" />
        {/* Coin Bas-Droit */}
        <line x1="84" y1="86" x2="88" y2="86" />
        <line x1="86" y1="84" x2="86" y2="88" />
      </g>

      {/* Micro-inscription industrielle lumineuse */}
      <text
        x="50"
        y="91.5"
        textAnchor="middle"
        fontFamily="monospace"
        fontSize="3.2"
        fontWeight="700"
        fill="#38bdf8"
        letterSpacing="0.8"
      >
        NEXUS-X // QUANTUM-CORE
      </text>
    </svg>
  );
}

export const NexusMark = memo(NexusMarkComponent);
export const NexusMonogram = memo(NexusMarkComponent);
