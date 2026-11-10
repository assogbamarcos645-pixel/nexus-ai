"""
scripts/generate_monogram.py

Générateur de nouvelle conception pour le logo monogramme de NEXUS AI.
Concept : « The Hexa-Nexus Prism » (Prisme Isométrique Quantique).
Une géométrie impossible 3D où un ruban de lumière pure forme la lettre « N »
sculptée dans un volume isométrique à facettes de réfraction diamant.
"""

def generate_prism_monogram():
    # Définition des facettes isométriques à tolérance micrométrique
    # Vue isométrique avec source lumineuse zénithale à 45°
    
    svg = """<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- Dégradé Facette A : Cyan Pur vers Bleu Électrique -->
    <linearGradient id="facet-cyan" x1="18" y1="20" x2="42" y2="80" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#38bdf8" />
      <stop offset="50%" stop-color="#0284c7" />
      <stop offset="100%" stop-color="#1e3a8a" />
    </linearGradient>

    <!-- Dégradé Facette B : Diagonale Traversante (Cobalt -> Violet Intense) -->
    <linearGradient id="facet-quantum" x1="26" y1="20" x2="74" y2="80" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#00f5ff" />
      <stop offset="30%" stop-color="#3b82f6" />
      <stop offset="70%" stop-color="#6366f1" />
      <stop offset="100%" stop-color="#a855f7" />
    </linearGradient>

    <!-- Dégradé Facette C : Pilier Droit (Violet Royal -> Saphir) -->
    <linearGradient id="facet-violet" x1="62" y1="20" x2="84" y2="80" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#c084fc" />
      <stop offset="45%" stop-color="#7c3aed" />
      <stop offset="100%" stop-color="#0369a1" />
    </linearGradient>

    <!-- Dégradé Biseau Supérieur (Reflet Spéculaire Céramique) -->
    <linearGradient id="facet-specular" x1="20" y1="15" x2="80" y2="45" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.95" />
      <stop offset="40%" stop-color="#bae6fd" stop-opacity="0.6" />
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0.85" />
    </linearGradient>

    <!-- Dégradé Ombre Isométrique Intérieure (Profondeur d'arête) -->
    <linearGradient id="facet-shadow" x1="50" y1="35" x2="50" y2="65" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#020617" stop-opacity="0.8" />
      <stop offset="100%" stop-color="#020617" stop-opacity="0.1" />
    </linearGradient>

    <!-- Lueur Photonique Sub-pixel -->
    <filter id="prism-glow" x="-25%" y="-25%" width="150%" height="150%">
      <feGaussianBlur stdDeviation="3" result="blur1" />
      <feGaussianBlur stdDeviation="6" result="blur2" />
      <feMerge>
        <feMergeNode in="blur2" />
        <feMergeNode in="blur1" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>

    <filter id="prism-drop-shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="4" stdDeviation="4.5" flood-color="#020617" flood-opacity="0.55" />
    </filter>
  </defs>

  <!-- 0. Hexagone de confinement ambiant (halo de résonance) -->
  <polygon
    points="50,10 84.6,30 84.6,70 50,90 15.4,70 15.4,30"
    fill="none"
    stroke="#38bdf8"
    stroke-width="0.8"
    stroke-dasharray="3 7"
    stroke-opacity="0.3"
  />

  <!-- 1. Pilier Gauche Isométrique (Alpha) -->
  <g filter="url(#prism-drop-shadow)">
    <!-- Face frontale verticale gauche -->
    <polygon
      points="20,33 34,25 34,75 20,83"
      fill="url(#facet-cyan)"
    />
    <!-- Face supérieure biseautée -->
    <polygon
      points="20,33 34,25 41,29 27,37"
      fill="url(#facet-specular)"
    />
    <!-- Arête néon fine -->
    <line x1="20" y1="33" x2="20" y2="83" stroke="#7dd3fc" stroke-width="1" stroke-linecap="round" stroke-opacity="0.7" />
  </g>

  <!-- 2. Pilier Droit Isométrique (Oméga) -->
  <g filter="url(#prism-drop-shadow)">
    <!-- Face frontale verticale droite -->
    <polygon
      points="66,25 80,17 80,67 66,75"
      fill="url(#facet-violet)"
    />
    <!-- Face supérieure biseautée droite -->
    <polygon
      points="66,25 80,17 73,13 59,21"
      fill="url(#facet-specular)"
    />
    <!-- Arête saphir -->
    <line x1="80" y1="17" x2="80" y2="67" stroke="#c084fc" stroke-width="1" stroke-linecap="round" stroke-opacity="0.8" />
  </g>

  <!-- 3. Diagonale Majeure (Pont Hyper-Espace en lévitation) -->
  <g filter="url(#prism-glow)">
    <!-- Face principale du ruban traversant de part en part -->
    <polygon
      points="26,24 43,24 74,76 57,76"
      fill="url(#facet-quantum)"
    />
    <!-- Biseau d'arête réfléchissant la lumière -->
    <line x1="26" y1="24" x2="74" y2="76" stroke="url(#facet-specular)" stroke-width="1.8" stroke-linecap="round" />
    
    <!-- Trait d'énergie photonique central -->
    <line x1="34.5" y1="24" x2="65.5" y2="76" stroke="#ffffff" stroke-width="1" stroke-dasharray="6 5" stroke-opacity="0.85" />
  </g>

  <!-- 4. Le Nœud « Nexus Node » au centre géométrique (50, 50) -->
  <g filter="url(#prism-glow)">
    <!-- Cœur losange diamant taillé -->
    <polygon
      points="50,38 58,50 50,62 42,50"
      fill="#ffffff"
      fill-opacity="0.95"
    />
    <polygon
      points="50,42 55,50 50,58 45,50"
      fill="#00f5ff"
    />
    <!-- Faisceaux de polarisation orthogonaux -->
    <line x1="50" y1="34" x2="50" y2="66" stroke="#ffffff" stroke-width="0.8" stroke-opacity="0.6" />
    <line x1="38" y1="50" x2="62" y2="50" stroke="#ffffff" stroke-width="0.8" stroke-opacity="0.6" />
    <circle cx="50" cy="50" r="2" fill="#ffffff" />
  </g>

  <!-- 5. Micro-repères de calibre technologique -->
  <circle cx="50" cy="10" r="1.5" fill="#38bdf8" />
  <circle cx="50" cy="90" r="1.5" fill="#a855f7" />
  <circle cx="15.4" cy="50" r="1.2" fill="#38bdf8" opacity="0.6" />
  <circle cx="84.6" cy="50" r="1.2" fill="#c084fc" opacity="0.6" />
</svg>"""
    return svg

if __name__ == "__main__":
    svg = generate_prism_monogram()
    with open("scripts/monogram_preview.svg", "w", encoding="utf-8") as f:
        f.write(svg)
    print("Nouvelle conception 'The Hexa-Nexus Prism' générée avec succès !")
