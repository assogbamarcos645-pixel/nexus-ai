"""
scripts/generate_neural_core.py

Générateur du nouveau logo monogramme de NEXUS AI :
« The Nexus Quantum Wafer » (Die de Silicium & Processeur Photonique Réaliste).
Matière tangible : verre saphir poli, titane brossé usiné CNC,
piliers en platine satiné et guide d'onde laser supraconducteur.
"""

def generate_wafer_svg():
    return """<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- Dégradé du Boîtier Squircle : Verre Saphir Fumé & Titane Noir -->
    <linearGradient id="wafer-body" x1="10" y1="10" x2="90" y2="90" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#111827" />
      <stop offset="45%" stop-color="#0b0f19" />
      <stop offset="100%" stop-color="#020408" />
    </linearGradient>

    <!-- Biseau d'Arête CNC Usiné à 45° (Réflexion Métallique Zénithale) -->
    <linearGradient id="wafer-bevel" x1="4" y1="4" x2="96" y2="96" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.35" />
      <stop offset="25%" stop-color="#38bdf8" stop-opacity="0.25" />
      <stop offset="60%" stop-color="#ffffff" stop-opacity="0.05" />
      <stop offset="100%" stop-color="#020617" stop-opacity="0.8" />
    </linearGradient>

    <!-- Piliers Platine Satiné (Matériau Réaliste Conducteur) -->
    <linearGradient id="pillar-metal" x1="0" y1="0" x2="0" y2="1" gradientUnits="objectBoundingBox">
      <stop offset="0%" stop-color="#f8fafc" />
      <stop offset="15%" stop-color="#e2e8f0" />
      <stop offset="65%" stop-color="#94a3b8" />
      <stop offset="100%" stop-color="#334155" />
    </linearGradient>

    <!-- Biseau Métallique des Piliers -->
    <linearGradient id="pillar-edge" x1="0" y1="0" x2="1" y2="0" gradientUnits="objectBoundingBox">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.9" />
      <stop offset="20%" stop-color="#ffffff" stop-opacity="0.3" />
      <stop offset="80%" stop-color="#38bdf8" stop-opacity="0.1" />
      <stop offset="100%" stop-color="#020617" stop-opacity="0.6" />
    </linearGradient>

    <!-- Guide d'Onde Photonique (Faisceau Laser Cohérent) -->
    <linearGradient id="laser-stream" x1="28" y1="20" x2="72" y2="80" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#00f0ff" />
      <stop offset="35%" stop-color="#38bdf8" />
      <stop offset="70%" stop-color="#6366f1" />
      <stop offset="100%" stop-color="#8b5cf6" />
    </linearGradient>

    <!-- Occlusion Ambiante / Ombre de Contact Physique -->
    <filter id="ao-shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="2.5" stdDeviation="3" flood-color="#000000" flood-opacity="0.85" />
    </filter>

    <!-- Lueur Laser Cohérente Sub-nanométrique -->
    <filter id="laser-glow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="2.2" result="blur1" />
      <feGaussianBlur stdDeviation="4.5" result="blur2" />
      <feMerge>
        <feMergeNode in="blur2" />
        <feMergeNode in="blur1" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>

    <!-- Ombre Globale du Boîtier -->
    <filter id="chassis-shadow" x="-15%" y="-15%" width="130%" height="130%">
      <feDropShadow dx="0" dy="5" stdDeviation="6" flood-color="#000000" flood-opacity="0.65" />
    </filter>
  </defs>

  <!-- 1. Le Boîtier Squircle en Silicium & Verre Saphir Fumé -->
  <g filter="url(#chassis-shadow)">
    <!-- Base de silicium poli -->
    <rect
      x="5"
      y="5"
      width="90"
      height="90"
      rx="22"
      fill="url(#wafer-body)"
    />
    <!-- Chanfrein périmétrique usiné CNC à 45° -->
    <rect
      x="5"
      y="5"
      width="90"
      height="90"
      rx="22"
      stroke="url(#wafer-bevel)"
      stroke-width="1.4"
    />
    <!-- Réticule de gravure sous-jacente (micro-grille lithographique) -->
    <line x1="16" y1="5" x2="16" y2="95" stroke="#38bdf8" stroke-width="0.5" stroke-opacity="0.08" />
    <line x1="84" y1="5" x2="84" y2="95" stroke="#38bdf8" stroke-width="0.5" stroke-opacity="0.08" />
    <line x1="5" y1="16" x2="95" y2="16" stroke="#38bdf8" stroke-width="0.5" stroke-opacity="0.08" />
    <line x1="5" y1="84" x2="95" y2="84" stroke="#38bdf8" stroke-width="0.5" stroke-opacity="0.08" />
  </g>

  <!-- 2. Monogramme « N » Architecturé : Gravure & Piliers en Platine -->
  
  <!-- Pilier Gauche (Électrode de puissance Alpha) -->
  <g filter="url(#ao-shadow)">
    <!-- Cavité d'encastrement sombre -->
    <rect x="23" y="19" width="14" height="62" rx="4" fill="#030712" />
    <!-- Barreau de platine satiné biseauté -->
    <rect x="23.5" y="19.5" width="13" height="61" rx="3.5" fill="url(#pillar-metal)" />
    <!-- Biseau spéculaire zénithal -->
    <rect x="23.5" y="19.5" width="13" height="61" rx="3.5" stroke="url(#pillar-edge)" stroke-width="0.8" />
    <!-- Évent de contact doré nanométrique au sommet -->
    <line x1="26" y1="23" x2="34" y2="23" stroke="#38bdf8" stroke-width="1.2" stroke-linecap="round" stroke-opacity="0.75" />
  </g>

  <!-- Pilier Droit (Électrode de puissance Oméga) -->
  <g filter="url(#ao-shadow)">
    <!-- Cavité d'encastrement sombre -->
    <rect x="63" y="19" width="14" height="62" rx="4" fill="#030712" />
    <!-- Barreau de platine satiné biseauté -->
    <rect x="63.5" y="19.5" width="13" height="61" rx="3.5" fill="url(#pillar-metal)" />
    <!-- Biseau spéculaire zénithal -->
    <rect x="63.5" y="19.5" width="13" height="61" rx="3.5" stroke="url(#pillar-edge)" stroke-width="0.8" />
    <!-- Évent de contact au pied -->
    <line x1="66" y1="77" x2="74" y2="77" stroke="#818cf8" stroke-width="1.2" stroke-linecap="round" stroke-opacity="0.75" />
  </g>

  <!-- 3. Diagonale Monolithique : Le Guide d'Onde Supraconducteur (Pont Nexus) -->
  <g filter="url(#ao-shadow)">
    <!-- Tranchée diagonale gravée dans le silicium -->
    <path
      d="M 27 20 L 37 20 L 73 80 L 63 80 Z"
      fill="#030712"
    />
    <!-- Arête réfléchissante supérieure -->
    <line x1="27" y1="20" x2="73" y2="80" stroke="#ffffff" stroke-width="0.7" stroke-opacity="0.6" />
    <!-- Faisceau laser cohérent supraconducteur émetteur -->
    <line
      x1="32"
      y1="20"
      x2="68"
      y2="80"
      stroke="url(#laser-stream)"
      stroke-width="2.6"
      stroke-linecap="round"
      filter="url(#laser-glow)"
    />
    <!-- Cœur photonique interne blanc pur (fibre centrale) -->
    <line
      x1="32"
      y1="20"
      x2="68"
      y2="80"
      stroke="#ffffff"
      stroke-width="1"
      stroke-linecap="round"
      stroke-opacity="0.95"
    />
  </g>

  <!-- 4. Nexus Optic Die : L'Aperture Photonique Centrale (50, 50) -->
  <g filter="url(#laser-glow)">
    <!-- Anneau de collimation optique usiné -->
    <circle cx="50" cy="50" r="7.5" fill="#030712" stroke="#ffffff" stroke-width="0.9" stroke-opacity="0.85" />
    <circle cx="50" cy="50" r="5" fill="url(#laser-stream)" />
    <!-- Point laser de singularité cohérente -->
    <circle cx="50" cy="50" r="2.2" fill="#ffffff" />
    <circle cx="50" cy="50" r="1" fill="#00f0ff" />
  </g>

  <!-- 5. Repères de Lithographie Optique de Précision (ASML Crosshairs) -->
  <g stroke="#38bdf8" stroke-width="0.8" stroke-linecap="round" stroke-opacity="0.45">
    <!-- Repère Haut-Gauche -->
    <line x1="12" y1="14" x2="16" y2="14" />
    <line x1="14" y1="12" x2="14" y2="16" />
    <!-- Repère Haut-Droit -->
    <line x1="84" y1="14" x2="88" y2="14" />
    <line x1="86" y1="12" x2="86" y2="16" />
    <!-- Repère Bas-Gauche -->
    <line x1="12" y1="86" x2="16" y2="86" />
    <line x1="14" y1="84" x2="14" y2="88" />
    <!-- Repère Bas-Droit -->
    <line x1="84" y1="86" x2="88" y2="86" />
    <line x1="86" y1="84" x2="86" y2="88" />
  </g>

  <!-- Micro-inscription de gravure sub-micronique -->
  <text x="50" y="91.5" text-anchor="middle" font-family="monospace" font-size="3.2" font-weight="700" fill="#38bdf8" fill-opacity="0.4" letter-spacing="0.8">
    NEXUS-DIE // Q-CORE
  </text>
</svg>"""

if __name__ == "__main__":
    svg = generate_wafer_svg()
    with open("scripts/monogram_preview.svg", "w", encoding="utf-8") as f:
        f.write(svg)
    print("Nouveau Monogramme 'The Nexus Quantum Wafer' généré avec succès !")
